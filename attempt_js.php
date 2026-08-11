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
 * Quiz attempt page for mod_aiquiz - JavaScript-driven version
 * Uses AMD modules for all question rendering
 *
 * @package    mod_aiquiz
 * @copyright  2025 AI Grader
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_once(__DIR__ . '/classes/question_bridge.php');

use mod_aiquiz\question_bridge;

$id = required_param('id', PARAM_INT);
$attemptid = optional_param('attempt', 0, PARAM_INT);

$cm = get_coursemodule_from_id('aiquiz', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/aiquiz:attempt', $context);

$PAGE->set_url('/mod/aiquiz/attempt_js.php', ['id' => $cm->id]);
$PAGE->set_title(format_string($aiquiz->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);
$PAGE->set_pagelayout('popup');

$PAGE->requires->css('/mod/aiquiz/styles/tokens.css');
$PAGE->requires->css('/mod/aiquiz/styles/bridge.css');

$questions = $DB->get_records('aiquiz_questions', ['aiquizid' => $aiquiz->id], 'sortorder ASC');
if (empty($questions)) {
    redirect(new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]),
        get_string('noquestions', 'mod_aiquiz'), null, \core\output\notification::NOTIFY_ERROR);
}

if ($attemptid) {
    $attempt = $DB->get_record('aiquiz_attempts', [
        'id' => $attemptid,
        'aiquizid' => $aiquiz->id,
        'userid' => $USER->id,
    ], '*', MUST_EXIST);

    if ($attempt->state !== 'inprogress') {
        redirect(new moodle_url('/mod/aiquiz/review.php', ['id' => $cm->id, 'attempt' => $attemptid]));
    }
} else {
    if ($aiquiz->attempts > 0) {
        $finishedcount = $DB->count_records('aiquiz_attempts', [
            'aiquizid' => $aiquiz->id,
            'userid' => $USER->id,
            'state' => 'finished',
        ]);
        if ($finishedcount >= $aiquiz->attempts) {
            redirect(new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]),
                get_string('nomoreattempts', 'mod_aiquiz'), null, \core\output\notification::NOTIFY_WARNING);
        }
    }

    $now = time();
    if (!empty($aiquiz->timeopen) && $now < $aiquiz->timeopen) {
        redirect(new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]),
            get_string('quiznotopen', 'mod_aiquiz', userdate($aiquiz->timeopen)));
    }
    if (!empty($aiquiz->timeclose) && $now > $aiquiz->timeclose) {
        redirect(new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]),
            get_string('quizisclosed', 'mod_aiquiz'));
    }

    $attempt = new stdClass();
    $attempt->aiquizid = $aiquiz->id;
    $attempt->userid = $USER->id;
    $attempt->state = 'inprogress';
    $attempt->currentquestion = 0;
    $attempt->timecreated = time();
    $attempt->timemodified = time();
    $attempt->id = $DB->insert_record('aiquiz_attempts', $attempt);

    $event = \mod_aiquiz\event\attempt_started::create([
        'objectid' => $attempt->id,
        'context' => $context,
        'relateduserid' => $USER->id,
    ]);
    $event->trigger();
}

$questionlist = array_values($questions);
if ($aiquiz->shufflequestions) {
    srand($attempt->id);
    shuffle($questionlist);
}

$bridge = new question_bridge($aiquiz->shuffleanswers ?? true, $attempt->id);
$jsQuestions = $bridge->transformAll($questionlist);
$savedAnswers = $bridge->getSavedAnswers($attempt->id);

$timeremaining = 0;
$timelimit = isset($aiquiz->timelimit) ? (int)$aiquiz->timelimit : 0;
if ($timelimit > 0 && !has_capability('mod/aiquiz:ignoretimelimit', $context)) {
    $timeremaining = $timelimit - (time() - $attempt->timecreated);
    if ($timeremaining <= 0) {
        redirect(new moodle_url('/mod/aiquiz/attempt.php', [
            'id' => $cm->id,
            'attempt' => $attempt->id,
            'action' => 'finish',
            'sesskey' => sesskey(),
        ]));
    }
}

$jsoptions = [
    'containerId' => 'aiq-attempt-container',
    'quizId' => $aiquiz->id,
    'attemptId' => $attempt->id,
    'cmId' => $cm->id,
    'questions' => $jsQuestions,
    'savedAnswers' => !empty($savedAnswers) ? (object)$savedAnswers : new stdClass(),
    'showProgress' => true,
    'allowNavigation' => true,
    'autoSave' => true,
    'behaviour' => $aiquiz->questionbehaviour ?? 'immediate',
    'timelimit' => $timelimit,
    'timeremaining' => $timeremaining,
    'sesskey' => sesskey(),
    'reviewUrl' => (new moodle_url('/mod/aiquiz/review.php', ['id' => $cm->id, 'attempt' => $attempt->id]))->out(false),
];

echo $OUTPUT->header();

echo '<div class="aiquiz-attempt-wrapper">';

if ($timelimit > 0 && $timeremaining > 0) {
    echo '<div class="aiq-timer" id="aiq-timer" data-remaining="' . $timeremaining . '">';
    echo '<div class="aiq-timer__icon">';
    echo '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
    echo '<circle cx="12" cy="12" r="10"/>';
    echo '<polyline points="12 6 12 12 16 14"/>';
    echo '</svg>';
    echo '</div>';
    echo '<div class="aiq-timer__value" id="aiq-timer-value">' . gmdate('H:i:s', $timeremaining) . '</div>';
    echo '</div>';
}

echo '<div id="aiq-attempt-container" class="aiquiz-container aiq-container">';
echo '<div class="aiq-loading">';
echo '<div class="aiq-loading__spinner"></div>';
echo '<div class="aiq-loading__text">Loading quiz...</div>';
echo '</div>';
echo '</div>';
echo '</div>';

$PAGE->requires->js_call_amd('mod_aiquiz/attempt', 'init', [$jsoptions]);

if ($timelimit > 0 && $timeremaining > 0) {
    $submitUrl = (new moodle_url('/mod/aiquiz/attempt.php', [
        'id' => $cm->id,
        'attempt' => $attempt->id,
        'action' => 'finish',
    ]))->out(false);
    
    $PAGE->requires->js_init_code('
        (function () {
            var remaining = ' . $timeremaining . ';
            var timerEl = document.getElementById("aiq-timer-value");
            var timerContainer = document.getElementById("aiq-timer");
            
            if (!timerEl) return;
            
            var interval = setInterval(function () {
                remaining--;
                
                if (remaining <= 0) {
                    clearInterval(interval);
                    var form = document.createElement("form");
                    form.method = "POST";
                    form.action = "' . $submitUrl . '";
                    
                    var sesskey = document.createElement("input");
                    sesskey.type = "hidden";
                    sesskey.name = "sesskey";
                    sesskey.value = "' . sesskey() . '";
                    form.appendChild(sesskey);
                    
                    document.body.appendChild(form);
                    form.submit();
                    return;
                }
                
                var h = Math.floor(remaining / 3600);
                var m = Math.floor((remaining % 3600) / 60);
                var s = remaining % 60;
                timerEl.textContent = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
                
                timerContainer.classList.remove("aiq-timer--warning", "aiq-timer--danger");
                if (remaining <= 60) {
                    timerContainer.classList.add("aiq-timer--danger");
                } else if (remaining <= 300) {
                    timerContainer.classList.add("aiq-timer--warning");
                }
            }, 1000);
        })();
    ');
}

echo $OUTPUT->footer();
