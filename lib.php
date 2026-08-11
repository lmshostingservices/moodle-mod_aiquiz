<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Library of functions for mod_aiquiz.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

function aiquiz_supports($feature) {
    switch ($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_GRADE_OUTCOMES:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_COMPLETION_HAS_RULES:
            return true;
        case FEATURE_GROUPS:
            return true;
        case FEATURE_GROUPINGS:
            return true;
        case FEATURE_MOD_PURPOSE:
            return MOD_PURPOSE_ASSESSMENT;
        case FEATURE_USES_QUESTIONS:
            return false;
        case FEATURE_PLAGIARISM:
            return false;
        case FEATURE_CONTROLS_GRADE_VISIBILITY:
            return true;
        default:
            return null;
    }
}

function aiquiz_add_instance($data, ?object $mform = null) {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = time();

    $defaults = [
        'timelimit' => 0,
        'attempts' => 0,
        'shufflequestions' => 1,
        'shuffleanswers' => 1,
        'showfeedback' => 1,
        'showresults' => 1,
        'grade' => 100,
        'passinggrade' => 50,
        'browsersecurity' => 0,
        'questionbehaviour' => 'immediate',
        'questiontimelimit' => 0,
        'grademethod' => 'highest',
        'completionminattempts' => 0,
        'completionpass' => 0,
    ];

    foreach ($defaults as $key => $value) {
        if (!isset($data->$key)) {
            $data->$key = $value;
        }
    }

    // Convert gradepass (from standard_grading_coursemodule_elements) to passinggrade percentage
    // for internal storage and backwards compatibility
    if (isset($data->gradepass) && $data->gradepass > 0 && isset($data->grade) && $data->grade > 0) {
        $data->passinggrade = round(($data->gradepass / $data->grade) * 100);
    }

    $data->id = $DB->insert_record('aiquiz', $data);

    aiquiz_grade_item_update($data);
    aiquiz_update_calendar($data, $data->id);

    return $data->id;
}

function aiquiz_update_instance($data, ?object $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    // Convert gradepass (from standard_grading_coursemodule_elements) to passinggrade percentage
    // for internal storage and backwards compatibility
    if (isset($data->gradepass) && $data->gradepass > 0 && isset($data->grade) && $data->grade > 0) {
        $data->passinggrade = round(($data->gradepass / $data->grade) * 100);
    }

    $DB->update_record('aiquiz', $data);

    aiquiz_grade_item_update($data);
    aiquiz_update_calendar($data, $data->id);

    $completionexpected = !empty($data->completionexpected) ? $data->completionexpected : null;
    \core_completion\api::update_completion_date_event($data->coursemodule, 'aiquiz', $data->id, $completionexpected);

    return true;
}

function aiquiz_delete_instance($id) {
    global $DB;

    if (!$aiquiz = $DB->get_record('aiquiz', ['id' => $id])) {
        return false;
    }

    $attempts = $DB->get_fieldset_select('aiquiz_attempts', 'id', 'aiquizid = ?', [$id]);
    if (!empty($attempts)) {
        list($insql, $params) = $DB->get_in_or_equal($attempts);
        $DB->delete_records_select('aiquiz_responses', "attemptid $insql", $params);
    }

    $questions = $DB->get_fieldset_select('aiquiz_questions', 'id', 'aiquizid = ?', [$id]);
    if (!empty($questions)) {
        list($insql, $params) = $DB->get_in_or_equal($questions);
        $DB->delete_records_select('aiquiz_answers', "questionid $insql", $params);
    }

    $DB->delete_records('aiquiz_attempts', ['aiquizid' => $id]);
    $DB->delete_records('aiquiz_questions', ['aiquizid' => $id]);
    $DB->delete_records('aiquiz_overrides', ['aiquizid' => $id]);
    $DB->delete_records('aiquiz', ['id' => $id]);

    aiquiz_grade_item_delete($aiquiz);

    $events = $DB->get_records('event', ['modulename' => 'aiquiz', 'instance' => $id]);
    foreach ($events as $event) {
        $event = calendar_event::load($event);
        $event->delete();
    }

    return true;
}

function aiquiz_grade_item_update($aiquiz, $grades = null) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $params = [
        'itemname' => $aiquiz->name,
        'idnumber' => isset($aiquiz->cmidnumber) ? $aiquiz->cmidnumber : null,
    ];

    if (isset($aiquiz->grade) && $aiquiz->grade > 0) {
        $params['gradetype'] = GRADE_TYPE_VALUE;
        $params['grademax'] = $aiquiz->grade;
        $params['grademin'] = 0;

        // Support both standard 'gradepass' (from standard_grading_coursemodule_elements)
        // and legacy 'passinggrade' for backwards compatibility
        if (isset($aiquiz->gradepass) && $aiquiz->gradepass > 0) {
            $params['gradepass'] = $aiquiz->gradepass;
        } else if (isset($aiquiz->passinggrade) && $aiquiz->passinggrade > 0) {
            $params['gradepass'] = ($aiquiz->passinggrade / 100) * $aiquiz->grade;
        }
    } else {
        $params['gradetype'] = GRADE_TYPE_NONE;
    }

    if ($grades === 'reset') {
        $params['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/aiquiz', $aiquiz->course, 'mod', 'aiquiz', $aiquiz->id, 0, $grades, $params);
}

function aiquiz_grade_item_delete($aiquiz) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    return grade_update('mod/aiquiz', $aiquiz->course, 'mod', 'aiquiz', $aiquiz->id, 0, null, ['deleted' => 1]);
}

function aiquiz_update_grades($aiquiz, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir . '/gradelib.php');

    if ($userid) {
        $users = [$userid];
    } else {
        $users = $DB->get_fieldset_select('aiquiz_attempts', 'DISTINCT userid', 'aiquizid = ?', [$aiquiz->id]);
    }

    $grades = [];
    foreach ($users as $uid) {
        $grade = aiquiz_get_user_grade($aiquiz, $uid);
        if ($grade !== null || !$nullifnone) {
            $grades[$uid] = new stdClass();
            $grades[$uid]->userid = $uid;
            $grades[$uid]->rawgrade = $grade !== null ? ($grade / 100) * $aiquiz->grade : null;
            $grades[$uid]->dategraded = time();
            $grades[$uid]->datesubmitted = time();
        }
    }

    if (empty($grades) && $nullifnone) {
        aiquiz_grade_item_update($aiquiz);
    } else {
        aiquiz_grade_item_update($aiquiz, $grades);
    }

    if ($userid) {
        aiquiz_update_completion_state($aiquiz, $userid);
    }
}

function aiquiz_get_user_grade($aiquiz, $userid) {
    global $DB;

    $grademethod = isset($aiquiz->grademethod) ? $aiquiz->grademethod : 'highest';

    switch ($grademethod) {
        case 'highest':
            $sql = "SELECT MAX(grade) as grade FROM {aiquiz_attempts}
                    WHERE aiquizid = ? AND userid = ? AND state = 'finished'";
            break;
        case 'average':
            $sql = "SELECT AVG(grade) as grade FROM {aiquiz_attempts}
                    WHERE aiquizid = ? AND userid = ? AND state = 'finished'";
            break;
        case 'first':
            $sql = "SELECT grade FROM {aiquiz_attempts}
                    WHERE aiquizid = ? AND userid = ? AND state = 'finished'
                    ORDER BY timecreated ASC LIMIT 1";
            break;
        case 'last':
            $sql = "SELECT grade FROM {aiquiz_attempts}
                    WHERE aiquizid = ? AND userid = ? AND state = 'finished'
                    ORDER BY timecreated DESC LIMIT 1";
            break;
        default:
            $sql = "SELECT MAX(grade) as grade FROM {aiquiz_attempts}
                    WHERE aiquizid = ? AND userid = ? AND state = 'finished'";
    }

    $result = $DB->get_record_sql($sql, [$aiquiz->id, $userid]);

    return $result && $result->grade !== null ? (float)$result->grade : null;
}

function aiquiz_update_completion_state($aiquiz, $userid) {
    global $DB;

    $cm = get_coursemodule_from_instance('aiquiz', $aiquiz->id, $aiquiz->course, false, MUST_EXIST);
    $course = $DB->get_record('course', ['id' => $aiquiz->course], '*', MUST_EXIST);

    $completion = new completion_info($course);
    if ($completion->is_enabled($cm)) {
        $completion->update_state($cm, COMPLETION_UNKNOWN, $userid);
    }
}

function aiquiz_get_completion_state($course, $cm, $userid, $type) {
    global $DB;

    $aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

    $attempts = $DB->get_records('aiquiz_attempts', [
        'aiquizid' => $aiquiz->id,
        'userid' => $userid,
        'state' => 'finished',
    ], 'timecreated ASC');

    $attemptcount = count($attempts);

    if (isset($aiquiz->completionminattempts) && $aiquiz->completionminattempts > 0) {
        if ($attemptcount < $aiquiz->completionminattempts) {
            return false;
        }
    }

    if (!empty($aiquiz->completionpass)) {
        $grade = aiquiz_get_user_grade($aiquiz, $userid);
        if ($grade === null || $grade < $aiquiz->passinggrade) {
            return false;
        }
        return true;
    }

    return $attemptcount > 0;
}

function aiquiz_get_completion_active_rule_descriptions($cm) {
    global $DB;

    $descriptions = [];
    $aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

    if (!empty($aiquiz->completionpass)) {
        $descriptions[] = get_string('completionpass', 'mod_aiquiz') . ': ' .
            get_string('passinggrade', 'mod_aiquiz') . ' ' . $aiquiz->passinggrade . '%';
    }

    if (isset($aiquiz->completionminattempts) && $aiquiz->completionminattempts > 0) {
        $descriptions[] = get_string('completionminattempts', 'mod_aiquiz') . ': ' .
            $aiquiz->completionminattempts;
    }

    return $descriptions;
}

function aiquiz_extend_settings_navigation($settings, $navref) {
    global $PAGE, $DB;

    $cm = $PAGE->cm;
    if (!$cm) {
        return;
    }

    $context = context_module::instance($cm->id);

    if (has_capability('mod/aiquiz:manage', $context)) {
        $navref->add(
            get_string('managequestions', 'mod_aiquiz'),
            new moodle_url('/mod/aiquiz/manage.php', ['id' => $cm->id]),
            navigation_node::TYPE_SETTING
        );
        $navref->add(
            get_string('viewattempts', 'mod_aiquiz'),
            new moodle_url('/mod/aiquiz/attempts.php', ['id' => $cm->id]),
            navigation_node::TYPE_SETTING
        );
        $navref->add(
            get_string('statistics', 'mod_aiquiz'),
            new moodle_url('/mod/aiquiz/stats.php', ['id' => $cm->id]),
            navigation_node::TYPE_SETTING
        );
    }

    if (has_capability('mod/aiquiz:manageoverrides', $context)) {
        $navref->add(
            get_string('overrides', 'mod_aiquiz'),
            new moodle_url('/mod/aiquiz/overrides.php', ['id' => $cm->id]),
            navigation_node::TYPE_SETTING
        );
    }
}

function aiquiz_reset_userdata($data) {
    global $DB;

    $status = [];
    $componentstr = get_string('modulenameplural', 'mod_aiquiz');

    if (!empty($data->reset_aiquiz_attempts)) {
        $aiquizzes = $DB->get_records('aiquiz', ['course' => $data->courseid]);
        foreach ($aiquizzes as $aiquiz) {
            $attempts = $DB->get_fieldset_select('aiquiz_attempts', 'id', 'aiquizid = ?', [$aiquiz->id]);
            if (!empty($attempts)) {
                list($insql, $params) = $DB->get_in_or_equal($attempts);
                $DB->delete_records_select('aiquiz_responses', "attemptid $insql", $params);
            }
            $DB->delete_records('aiquiz_attempts', ['aiquizid' => $aiquiz->id]);

            aiquiz_grade_item_update($aiquiz, 'reset');
        }

        $status[] = [
            'component' => $componentstr,
            'item' => get_string('attemptsdeleted', 'mod_aiquiz'),
            'error' => false,
        ];
    }

    if (!empty($data->reset_aiquiz_overrides)) {
        $aiquizzes = $DB->get_records('aiquiz', ['course' => $data->courseid]);
        foreach ($aiquizzes as $aiquiz) {
            $DB->delete_records('aiquiz_overrides', ['aiquizid' => $aiquiz->id]);
        }

        $status[] = [
            'component' => $componentstr,
            'item' => get_string('overridesdeleted', 'mod_aiquiz'),
            'error' => false,
        ];
    }

    return $status;
}

function aiquiz_reset_course_form_definition(&$mform) {
    $mform->addElement('header', 'aiquizheader', get_string('modulenameplural', 'mod_aiquiz'));
    $mform->addElement('checkbox', 'reset_aiquiz_attempts', get_string('deleteallattempts', 'mod_aiquiz'));
    $mform->addElement('checkbox', 'reset_aiquiz_overrides', get_string('deleteoverrides', 'mod_aiquiz'));
}

function aiquiz_reset_course_form_defaults($course) {
    return [
        'reset_aiquiz_attempts' => 1,
        'reset_aiquiz_overrides' => 1,
    ];
}

function aiquiz_get_coursemodule_info($cm) {
    global $DB;

    $aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

    $info = new cached_cm_info();
    $info->name = $aiquiz->name;

    if ($cm->showdescription) {
        $info->content = format_module_intro('aiquiz', $aiquiz, $cm->id, false);
    }

    if ($aiquiz->timeopen) {
        $info->customdata['timeopen'] = $aiquiz->timeopen;
    }
    if ($aiquiz->timeclose) {
        $info->customdata['timeclose'] = $aiquiz->timeclose;
    }

    return $info;
}

function aiquiz_cm_info_view(cm_info $cm) {
    global $DB, $USER;

    if (!$cm->uservisible) {
        return;
    }

    $aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance]);
    if (!$aiquiz) {
        return;
    }

    $attempts = $DB->count_records('aiquiz_attempts', [
        'aiquizid' => $aiquiz->id,
        'userid' => $USER->id,
        'state' => 'finished',
    ]);

    $bestgrade = aiquiz_get_user_grade($aiquiz, $USER->id);

    $info = [];

    if ($attempts > 0) {
        $info[] = get_string('attempts', 'mod_aiquiz') . ': ' . $attempts;
        if ($bestgrade !== null) {
            $passed = $bestgrade >= $aiquiz->passinggrade;
            $icon = $passed ? '✓' : '✗';
            $info[] = get_string('yourbestgrade', 'mod_aiquiz') . ': ' . round($bestgrade, 1) . '% ' . $icon;
        }
    }

    if (!empty($info)) {
        $cm->set_after_link('<div class="aiquiz-info">' . implode(' | ', $info) . '</div>');
    }
}

function aiquiz_update_calendar($aiquiz, $cmid) {
    global $DB, $CFG;
    require_once($CFG->dirroot . '/calendar/lib.php');

    $cm = get_coursemodule_from_instance('aiquiz', $aiquiz->id, $aiquiz->course, false, IGNORE_MISSING);
    if (!$cm) {
        return;
    }

    $DB->delete_records('event', ['modulename' => 'aiquiz', 'instance' => $aiquiz->id]);

    if (!empty($aiquiz->timeopen)) {
        $event = new stdClass();
        $event->eventtype = 'open';
        $event->type = CALENDAR_EVENT_TYPE_STANDARD;
        $event->name = get_string('quizopen', 'mod_aiquiz') . ': ' . $aiquiz->name;
        $event->description = format_module_intro('aiquiz', $aiquiz, $cm->id, false);
        $event->format = FORMAT_HTML;
        $event->courseid = $aiquiz->course;
        $event->groupid = 0;
        $event->userid = 0;
        $event->modulename = 'aiquiz';
        $event->instance = $aiquiz->id;
        $event->timestart = $aiquiz->timeopen;
        $event->timeduration = 0;
        $event->timesort = $aiquiz->timeopen;
        $event->visible = $cm->visible;

        calendar_event::create($event, false);
    }

    if (!empty($aiquiz->timeclose)) {
        $event = new stdClass();
        $event->eventtype = 'close';
        $event->type = CALENDAR_EVENT_TYPE_ACTION;
        $event->name = get_string('quizclose', 'mod_aiquiz') . ': ' . $aiquiz->name;
        $event->description = format_module_intro('aiquiz', $aiquiz, $cm->id, false);
        $event->format = FORMAT_HTML;
        $event->courseid = $aiquiz->course;
        $event->groupid = 0;
        $event->userid = 0;
        $event->modulename = 'aiquiz';
        $event->instance = $aiquiz->id;
        $event->timestart = $aiquiz->timeclose;
        $event->timeduration = 0;
        $event->timesort = $aiquiz->timeclose;
        $event->visible = $cm->visible;

        calendar_event::create($event, false);
    }
}

function aiquiz_get_user_grades($aiquiz, $userid = 0) {
    global $DB;

    $params = ['aiquizid' => $aiquiz->id];
    $usersql = '';
    if ($userid) {
        $usersql = ' AND userid = :userid';
        $params['userid'] = $userid;
    }

    $sql = "SELECT userid, MAX(grade) as rawgrade, MAX(timefinished) as dategraded
            FROM {aiquiz_attempts}
            WHERE aiquizid = :aiquizid AND state = 'finished' $usersql
            GROUP BY userid";

    $grades = $DB->get_records_sql($sql, $params);

    foreach ($grades as $grade) {
        $grade->rawgrade = ($grade->rawgrade / 100) * $aiquiz->grade;
    }

    return $grades;
}

function aiquiz_rescale_activity_grades($course, $cm, $oldmin, $oldmax, $newmin, $newmax) {
    global $DB;

    if ($oldmax <= $oldmin) {
        return false;
    }

    $aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);
    $scale = ($newmax - $newmin) / ($oldmax - $oldmin);

    $DB->set_field('aiquiz', 'grade', $newmax, ['id' => $aiquiz->id]);

    $aiquiz->grade = $newmax;
    aiquiz_update_grades($aiquiz);

    return true;
}

function aiquiz_print_recent_activity($course, $viewfullnames, $timestart) {
    global $DB, $OUTPUT;

    $sql = "SELECT a.*, u.firstname, u.lastname, q.name as quizname, cm.id as cmid
            FROM {aiquiz_attempts} a
            JOIN {user} u ON u.id = a.userid
            JOIN {aiquiz} q ON q.id = a.aiquizid
            JOIN {course_modules} cm ON cm.instance = q.id AND cm.course = q.course
            JOIN {modules} m ON m.id = cm.module AND m.name = 'aiquiz'
            WHERE q.course = ? AND a.timefinished > ? AND a.state = 'finished'
            ORDER BY a.timefinished DESC";

    $attempts = $DB->get_records_sql($sql, [$course->id, $timestart], 0, 10);

    if (empty($attempts)) {
        return false;
    }

    echo $OUTPUT->heading(get_string('modulename', 'mod_aiquiz') . ':', 6);

    foreach ($attempts as $attempt) {
        $url = new moodle_url('/mod/aiquiz/view.php', ['id' => $attempt->cmid]);
        $fullname = fullname($attempt);
        $grade = round($attempt->grade, 1) . '%';
        $time = userdate($attempt->timefinished, get_string('strftimedatetime'));

        echo '<div class="recent">';
        echo '<span class="name">' . html_writer::link($url, $attempt->quizname) . '</span>';
        echo ' - <span class="user">' . $fullname . '</span>';
        echo ' - <span class="grade">' . $grade . '</span>';
        echo ' <span class="time">(' . $time . ')</span>';
        echo '</div>';
    }

    return true;
}

function aiquiz_print_overview($courses, &$htmlarray) {
    global $USER, $CFG, $DB;

    if (empty($courses) || !is_array($courses) || count($courses) == 0) {
        return;
    }

    if (!$aiquizzes = get_all_instances_in_courses('aiquiz', $courses)) {
        return;
    }

    $now = time();
    $strduedate = get_string('quizclose', 'mod_aiquiz');

    foreach ($aiquizzes as $aiquiz) {
        if ($aiquiz->timeclose && $aiquiz->timeclose >= $now) {
            $str = '<div class="aiquiz overview">';
            $str .= '<div class="name">' . get_string('modulename', 'mod_aiquiz') . ': ';
            $str .= '<a href="' . $CFG->wwwroot . '/mod/aiquiz/view.php?id=' . $aiquiz->coursemodule . '">';
            $str .= format_string($aiquiz->name) . '</a></div>';
            $str .= '<div class="info">' . $strduedate . ': ';
            $str .= userdate($aiquiz->timeclose) . '</div>';
            $str .= '</div>';

            if (empty($htmlarray[$aiquiz->course]['aiquiz'])) {
                $htmlarray[$aiquiz->course]['aiquiz'] = $str;
            } else {
                $htmlarray[$aiquiz->course]['aiquiz'] .= $str;
            }
        }
    }
}

function aiquiz_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = []) {
    if ($context->contextlevel != CONTEXT_MODULE) {
        return false;
    }

    require_login($course, true, $cm);

    if ($filearea === 'question') {
        $itemid = array_shift($args);
        $filename = array_pop($args);
        $filepath = $args ? '/' . implode('/', $args) . '/' : '/';

        $fs = get_file_storage();
        $file = $fs->get_file($context->id, 'mod_aiquiz', $filearea, $itemid, $filepath, $filename);

        if (!$file || $file->is_directory()) {
            return false;
        }

        send_stored_file($file, 0, 0, $forcedownload, $options);
    }

    return false;
}

function aiquiz_get_extra_capabilities() {
    return [
        'moodle/grade:viewall',
        'moodle/site:accessallgroups',
    ];
}

function aiquiz_view($aiquiz, $course, $cm, $context) {
    $event = \mod_aiquiz\event\course_module_viewed::create([
        'objectid' => $aiquiz->id,
        'context' => $context,
    ]);
    $event->add_record_snapshot('course', $course);
    $event->add_record_snapshot('aiquiz', $aiquiz);
    $event->trigger();

    $completion = new completion_info($course);
    $completion->set_module_viewed($cm);
}

function mod_aiquiz_core_calendar_provide_event_action(
    calendar_event $event,
    \core_calendar\action_factory $factory,
    int $userid = 0
) {
    global $DB, $USER;

    if (!$userid) {
        $userid = $USER->id;
    }

    $cm = get_fast_modinfo($event->courseid, $userid)->instances['aiquiz'][$event->instance];

    if (!$cm->uservisible) {
        return null;
    }

    $aiquiz = $DB->get_record('aiquiz', ['id' => $event->instance]);
    if (!$aiquiz) {
        return null;
    }

    $now = time();
    if ($aiquiz->timeopen && $now < $aiquiz->timeopen) {
        return null;
    }
    if ($aiquiz->timeclose && $now > $aiquiz->timeclose) {
        return null;
    }

    $attemptcount = $DB->count_records('aiquiz_attempts', [
        'aiquizid' => $aiquiz->id,
        'userid' => $userid,
        'state' => 'finished',
    ]);

    if ($aiquiz->attempts > 0 && $attemptcount >= $aiquiz->attempts) {
        return null;
    }

    $name = $attemptcount > 0 ? get_string('continueattempt', 'mod_aiquiz') : get_string('startattempt', 'mod_aiquiz');

    return $factory->create_instance(
        $name,
        new \moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]),
        1,
        true
    );
}

function aiquiz_check_updates_since(cm_info $cm, $from, $filter = []) {
    global $DB, $USER;

    $updates = course_check_module_updates_since($cm, $from, ['content'], $filter);

    $updates->attempts = (object)['updated' => false];
    $updates->grades = (object)['updated' => false];

    $select = 'aiquizid = ? AND userid = ? AND timefinished > ?';
    $params = [$cm->instance, $USER->id, $from];

    if ($DB->record_exists_select('aiquiz_attempts', $select, $params)) {
        $updates->attempts->updated = true;
        $updates->attempts->itemids = $DB->get_fieldset_select('aiquiz_attempts', 'id', $select, $params);
    }

    return $updates;
}
