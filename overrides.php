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
 * User and group overrides page for mod_aiquiz.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT);
$action = optional_param('action', '', PARAM_ALPHA);
$overrideid = optional_param('overrideid', 0, PARAM_INT);
$userid = optional_param('userid', 0, PARAM_INT);
$groupid = optional_param('groupid', 0, PARAM_INT);
$type = optional_param('type', 'user', PARAM_ALPHA);

$cm = get_coursemodule_from_id('aiquiz', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/aiquiz:manageoverrides', $context);

$PAGE->set_url('/mod/aiquiz/overrides.php', ['id' => $cm->id, 'type' => $type]);
$PAGE->set_title(format_string($aiquiz->name) . ' - ' . get_string('overrides', 'mod_aiquiz'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

$PAGE->requires->css('/mod/aiquiz/styles/tokens.css');
$PAGE->requires->css('/mod/aiquiz/styles/bridge.css');

if ($action === 'delete' && confirm_sesskey()) {
    if ($overrideid) {
        $DB->delete_records('aiquiz_overrides', ['id' => $overrideid, 'aiquizid' => $aiquiz->id]);
        redirect(new moodle_url('/mod/aiquiz/overrides.php', ['id' => $cm->id, 'type' => $type]),
            get_string('overridedeleted', 'mod_aiquiz'), null, \core\output\notification::NOTIFY_SUCCESS);
    }
}

if ($action === 'save' && confirm_sesskey()) {
    $override = new stdClass();
    $override->aiquizid = $aiquiz->id;
    
    if ($type === 'group') {
        $override->groupid = required_param('groupid', PARAM_INT);
        $override->userid = null;
    } else {
        $override->userid = required_param('userid', PARAM_INT);
        $override->groupid = null;
    }
    
    $timeopen = optional_param_array('timeopen', null, PARAM_INT);
    $timeclose = optional_param_array('timeclose', null, PARAM_INT);
    
    if ($timeopen && !empty($timeopen['enabled'])) {
        $override->timeopen = make_timestamp(
            $timeopen['year'], $timeopen['month'], $timeopen['day'],
            $timeopen['hour'], $timeopen['minute']
        );
    } else {
        $override->timeopen = null;
    }
    
    if ($timeclose && !empty($timeclose['enabled'])) {
        $override->timeclose = make_timestamp(
            $timeclose['year'], $timeclose['month'], $timeclose['day'],
            $timeclose['hour'], $timeclose['minute']
        );
    } else {
        $override->timeclose = null;
    }
    
    $timelimit = optional_param('timelimit', null, PARAM_INT);
    $override->timelimit = ($timelimit !== null && $timelimit >= 0) ? $timelimit : null;
    
    $attempts = optional_param('attempts', null, PARAM_INT);
    $override->attempts = ($attempts !== null && $attempts >= 0) ? $attempts : null;
    
    if ($overrideid) {
        $override->id = $overrideid;
        $DB->update_record('aiquiz_overrides', $override);
    } else {
        $existing = $DB->get_record('aiquiz_overrides', [
            'aiquizid' => $aiquiz->id,
            'userid' => $override->userid,
            'groupid' => $override->groupid,
        ]);
        
        if ($existing) {
            $override->id = $existing->id;
            $DB->update_record('aiquiz_overrides', $override);
        } else {
            $DB->insert_record('aiquiz_overrides', $override);
        }
    }
    
    redirect(new moodle_url('/mod/aiquiz/overrides.php', ['id' => $cm->id, 'type' => $type]),
        get_string('overridesaved', 'mod_aiquiz'), null, \core\output\notification::NOTIFY_SUCCESS);
}

echo $OUTPUT->header();

echo '<div class="aiquiz-container">';

echo '<div class="aiquiz-header">';
echo '<h2 class="aiquiz-title">' . get_string('overrides', 'mod_aiquiz') . '</h2>';
echo '<p><a href="' . new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]) . '">&larr; ' . get_string('back') . '</a></p>';
echo '</div>';

echo '<div class="aiquiz-tabs">';
echo '<a href="' . new moodle_url('/mod/aiquiz/overrides.php', ['id' => $cm->id, 'type' => 'user']) . '" class="aiquiz-tab' . ($type === 'user' ? ' active' : '') . '">';
echo '<i class="fa fa-user"></i> ' . get_string('useroverrides', 'mod_aiquiz');
echo '</a>';
echo '<a href="' . new moodle_url('/mod/aiquiz/overrides.php', ['id' => $cm->id, 'type' => 'group']) . '" class="aiquiz-tab' . ($type === 'group' ? ' active' : '') . '">';
echo '<i class="fa fa-users"></i> ' . get_string('groupoverrides', 'mod_aiquiz');
echo '</a>';
echo '</div>';

if ($action === 'edit' || $action === 'add') {
    $editoverride = null;
    if ($overrideid) {
        $editoverride = $DB->get_record('aiquiz_overrides', ['id' => $overrideid, 'aiquizid' => $aiquiz->id]);
    }
    
    echo '<div class="aiquiz-question-container">';
    echo '<div class="aiquiz-question-body">';
    echo '<h3 style="margin-bottom: 24px; font-size: 18px; font-weight: 600;">' . ($editoverride ? get_string('editoverride', 'mod_aiquiz') : get_string('addoverride', 'mod_aiquiz')) . '</h3>';
    
    echo '<form method="post" action="' . new moodle_url('/mod/aiquiz/overrides.php', ['id' => $cm->id, 'action' => 'save', 'type' => $type]) . '">';
    echo '<input type="hidden" name="sesskey" value="' . sesskey() . '">';
    if ($editoverride) {
        echo '<input type="hidden" name="overrideid" value="' . $editoverride->id . '">';
    }
    
    if ($type === 'group') {
        $groups = groups_get_all_groups($course->id);
        echo '<div class="aiquiz-form-group">';
        echo '<label class="aiquiz-form-label">' . get_string('group', 'core') . '</label>';
        echo '<select name="groupid" class="aiquiz-matching-select" style="max-width: 400px;">';
        echo '<option value="">' . get_string('chooseanswer', 'mod_aiquiz') . '</option>';
        foreach ($groups as $group) {
            $selected = ($editoverride && $editoverride->groupid == $group->id) ? ' selected' : '';
            echo '<option value="' . $group->id . '"' . $selected . '>' . format_string($group->name) . '</option>';
        }
        echo '</select>';
        echo '</div>';
    } else {
        $enrolledusers = get_enrolled_users($context, '', 0, 'u.*', 'u.lastname, u.firstname');
        echo '<div class="aiquiz-form-group">';
        echo '<label class="aiquiz-form-label">' . get_string('student', 'mod_aiquiz') . '</label>';
        echo '<select name="userid" class="aiquiz-matching-select" style="max-width: 400px;">';
        echo '<option value="">' . get_string('chooseanswer', 'mod_aiquiz') . '</option>';
        foreach ($enrolledusers as $user) {
            $selected = ($editoverride && $editoverride->userid == $user->id) ? ' selected' : '';
            echo '<option value="' . $user->id . '"' . $selected . '>' . fullname($user) . ' (' . $user->email . ')</option>';
        }
        echo '</select>';
        echo '</div>';
    }
    
    echo '<div class="aiquiz-form-group">';
    echo '<label class="aiquiz-form-label">' . get_string('quizopen', 'mod_aiquiz') . '</label>';
    $opents = $editoverride && $editoverride->timeopen ? $editoverride->timeopen : 0;
    echo '<div style="display: flex; align-items: center; gap: 12px;">';
    echo '<input type="checkbox" name="timeopen[enabled]" value="1"' . ($opents ? ' checked' : '') . '>';
    echo '<input type="date" name="timeopen_date" value="' . ($opents ? date('Y-m-d', $opents) : '') . '" class="aiquiz-shortanswer-input" style="max-width: 180px;">';
    echo '<input type="time" name="timeopen_time" value="' . ($opents ? date('H:i', $opents) : '00:00') . '" class="aiquiz-shortanswer-input" style="max-width: 120px;">';
    echo '<input type="hidden" name="timeopen[year]" value="' . ($opents ? date('Y', $opents) : date('Y')) . '">';
    echo '<input type="hidden" name="timeopen[month]" value="' . ($opents ? date('n', $opents) : date('n')) . '">';
    echo '<input type="hidden" name="timeopen[day]" value="' . ($opents ? date('j', $opents) : date('j')) . '">';
    echo '<input type="hidden" name="timeopen[hour]" value="' . ($opents ? date('G', $opents) : 0) . '">';
    echo '<input type="hidden" name="timeopen[minute]" value="' . ($opents ? date('i', $opents) : 0) . '">';
    echo '</div>';
    echo '</div>';
    
    echo '<div class="aiquiz-form-group">';
    echo '<label class="aiquiz-form-label">' . get_string('quizclose', 'mod_aiquiz') . '</label>';
    $closets = $editoverride && $editoverride->timeclose ? $editoverride->timeclose : 0;
    echo '<div style="display: flex; align-items: center; gap: 12px;">';
    echo '<input type="checkbox" name="timeclose[enabled]" value="1"' . ($closets ? ' checked' : '') . '>';
    echo '<input type="date" name="timeclose_date" value="' . ($closets ? date('Y-m-d', $closets) : '') . '" class="aiquiz-shortanswer-input" style="max-width: 180px;">';
    echo '<input type="time" name="timeclose_time" value="' . ($closets ? date('H:i', $closets) : '23:59') . '" class="aiquiz-shortanswer-input" style="max-width: 120px;">';
    echo '<input type="hidden" name="timeclose[year]" value="' . ($closets ? date('Y', $closets) : date('Y')) . '">';
    echo '<input type="hidden" name="timeclose[month]" value="' . ($closets ? date('n', $closets) : date('n')) . '">';
    echo '<input type="hidden" name="timeclose[day]" value="' . ($closets ? date('j', $closets) : date('j')) . '">';
    echo '<input type="hidden" name="timeclose[hour]" value="' . ($closets ? date('G', $closets) : 23) . '">';
    echo '<input type="hidden" name="timeclose[minute]" value="' . ($closets ? date('i', $closets) : 59) . '">';
    echo '</div>';
    echo '</div>';
    
    echo '<div class="aiquiz-form-group">';
    echo '<label class="aiquiz-form-label">' . get_string('timelimit', 'mod_aiquiz') . ' (' . get_string('seconds', 'mod_aiquiz') . ')</label>';
    $timelimit = $editoverride && $editoverride->timelimit !== null ? $editoverride->timelimit : '';
    echo '<input type="number" name="timelimit" value="' . $timelimit . '" min="0" class="aiquiz-numerical-input" placeholder="Leave blank to use default">';
    echo '<p style="margin-top: 8px; font-size: 13px; color: #64748b;">Default: ' . ($aiquiz->timelimit ? $aiquiz->timelimit . ' seconds' : 'No limit') . '</p>';
    echo '</div>';
    
    echo '<div class="aiquiz-form-group">';
    echo '<label class="aiquiz-form-label">' . get_string('attemptsallowed', 'mod_aiquiz') . '</label>';
    $attempts = $editoverride && $editoverride->attempts !== null ? $editoverride->attempts : '';
    echo '<input type="number" name="attempts" value="' . $attempts . '" min="0" class="aiquiz-numerical-input" placeholder="Leave blank to use default">';
    echo '<p style="margin-top: 8px; font-size: 13px; color: #64748b;">Default: ' . ($aiquiz->attemptsallowed ? $aiquiz->attemptsallowed : 'Unlimited') . ' (0 = unlimited)</p>';
    echo '</div>';
    
    echo '<div class="aiquiz-actions" style="margin-top: 32px;">';
    echo '<button type="submit" class="btn aiquiz-btn-primary"><i class="fa fa-check"></i> ' . get_string('savechanges') . '</button>';
    echo '<a href="' . new moodle_url('/mod/aiquiz/overrides.php', ['id' => $cm->id, 'type' => $type]) . '" class="btn aiquiz-btn-secondary">' . get_string('cancel') . '</a>';
    echo '</div>';
    
    echo '</form>';
    echo '</div>';
    echo '</div>';
    
} else {
    echo '<div style="margin: 24px 0;">';
    echo '<a href="' . new moodle_url('/mod/aiquiz/overrides.php', ['id' => $cm->id, 'type' => $type, 'action' => 'add']) . '" class="btn aiquiz-btn-primary">';
    echo '<i class="fa fa-plus"></i> ' . get_string('addoverride', 'mod_aiquiz');
    echo '</a>';
    echo '</div>';
    
    if ($type === 'group') {
        $overrides = $DB->get_records('aiquiz_overrides', ['aiquizid' => $aiquiz->id, 'userid' => null], 'id ASC');
    } else {
        $overrides = $DB->get_records_sql(
            "SELECT o.* FROM {aiquiz_overrides} o WHERE o.aiquizid = ? AND o.groupid IS NULL ORDER BY o.id ASC",
            [$aiquiz->id]
        );
    }
    
    if (empty($overrides)) {
        echo '<div class="aiquiz-empty-state">';
        echo '<div class="aiquiz-empty-state-icon"><i class="fa fa-sliders"></i></div>';
        echo '<h3 class="aiquiz-empty-state-title">' . get_string('nooverridesfound', 'mod_aiquiz') . '</h3>';
        echo '<p class="aiquiz-empty-state-text">Create overrides to customize quiz settings for specific ' . ($type === 'group' ? 'groups' : 'students') . '.</p>';
        echo '</div>';
    } else {
        echo '<div class="aiquiz-attempts-section">';
        echo '<table class="aiquiz-attempts-table">';
        echo '<thead><tr>';
        echo '<th>' . ($type === 'group' ? get_string('group', 'core') : get_string('student', 'mod_aiquiz')) . '</th>';
        echo '<th>' . get_string('quizopen', 'mod_aiquiz') . '</th>';
        echo '<th>' . get_string('quizclose', 'mod_aiquiz') . '</th>';
        echo '<th>' . get_string('timelimit', 'mod_aiquiz') . '</th>';
        echo '<th>' . get_string('attemptsallowed', 'mod_aiquiz') . '</th>';
        echo '<th style="width: 120px;">' . get_string('actions', 'mod_aiquiz') . '</th>';
        echo '</tr></thead>';
        echo '<tbody>';
        
        foreach ($overrides as $override) {
            if ($type === 'group') {
                $group = groups_get_group($override->groupid);
                $name = $group ? format_string($group->name) : 'Unknown group';
            } else {
                $user = $DB->get_record('user', ['id' => $override->userid]);
                $name = $user ? fullname($user) : 'Unknown user';
            }
            
            echo '<tr>';
            echo '<td><strong>' . $name . '</strong></td>';
            echo '<td>' . ($override->timeopen ? userdate($override->timeopen, get_string('strftimedatetimeshort', 'langconfig')) : '-') . '</td>';
            echo '<td>' . ($override->timeclose ? userdate($override->timeclose, get_string('strftimedatetimeshort', 'langconfig')) : '-') . '</td>';
            echo '<td>' . ($override->timelimit !== null ? $override->timelimit . 's' : '-') . '</td>';
            echo '<td>' . ($override->attempts !== null ? ($override->attempts == 0 ? 'Unlimited' : $override->attempts) : '-') . '</td>';
            echo '<td>';
            echo '<a href="' . new moodle_url('/mod/aiquiz/overrides.php', ['id' => $cm->id, 'type' => $type, 'action' => 'edit', 'overrideid' => $override->id]) . '" class="btn btn-sm" style="margin-right: 8px;"><i class="fa fa-edit"></i></a>';
            echo '<a href="' . new moodle_url('/mod/aiquiz/overrides.php', ['id' => $cm->id, 'type' => $type, 'action' => 'delete', 'overrideid' => $override->id, 'sesskey' => sesskey()]) . '" class="btn btn-sm" onclick="return confirm(\'Are you sure?\');"><i class="fa fa-trash"></i></a>';
            echo '</td>';
            echo '</tr>';
        }
        
        echo '</tbody>';
        echo '</table>';
        echo '</div>';
    }
}

echo '</div>';

echo $OUTPUT->footer();
