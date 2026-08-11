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
 * Quiz attempt page for mod_aiquiz.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT);
$attemptid = optional_param('attempt', 0, PARAM_INT);
$action = optional_param('action', '', PARAM_ALPHA);
$showreview = optional_param('review', 0, PARAM_INT);

$cm = get_coursemodule_from_id('aiquiz', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/aiquiz:attempt', $context);

$PAGE->set_url('/mod/aiquiz/attempt.php', ['id' => $cm->id]);
$PAGE->set_title(format_string($aiquiz->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);
$PAGE->set_pagelayout('popup');

$PAGE->requires->css('/mod/aiquiz/styles/tokens.css');
$PAGE->requires->css('/mod/aiquiz/styles/bridge.css');

$behaviour = isset($aiquiz->questionbehaviour) ? $aiquiz->questionbehaviour : 'immediate';

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

$currentindex = $attempt->currentquestion;
if ($currentindex >= count($questionlist)) {
    $currentindex = count($questionlist) - 1;
}

function grade_response($question, $response, $DB) {
    $answers = $DB->get_records('aiquiz_answers', ['questionid' => $question->id], 'sortorder ASC');
    $fraction = 0;
    $responsedata = [];

    if ($question->qtype === 'mcq') {
        if (is_array($response)) {
            $responsedata = $response;
            foreach ($answers as $answer) {
                if (in_array($answer->id, $response)) {
                    $fraction += $answer->fraction;
                }
            }
            $fraction = max(0, min(1, $fraction));
        } else {
            $responsedata = [$response];
            if (!empty($response)) {
                $selectedanswer = $DB->get_record('aiquiz_answers', ['id' => $response]);
                if ($selectedanswer) {
                    $fraction = $selectedanswer->fraction;
                }
            }
        }
    } elseif ($question->qtype === 'truefalse') {
        $responsedata = [$response];
        if (!empty($response)) {
            $selectedanswer = $DB->get_record('aiquiz_answers', ['id' => $response]);
            if ($selectedanswer) {
                $fraction = $selectedanswer->fraction;
            }
        }
    } elseif ($question->qtype === 'matching') {
        // Matching: response is array of [stem_id => choice_index]
        // Stems have even sortorder, correct choice index stored in fraction field
        $responsedata = is_array($response) ? $response : [];
        $correctcount = 0;
        $totalstems = 0;
        
        foreach ($answers as $answer) {
            // Only process stems (even sortorder)
            if ($answer->sortorder % 2 == 0) {
                $totalstems++;
                $stemid = $answer->id;
                $correctchoiceindex = (int)$answer->fraction; // Correct choice index stored in fraction
                
                if (isset($responsedata[$stemid])) {
                    $selectedindex = (int)$responsedata[$stemid];
                    if ($selectedindex === $correctchoiceindex) {
                        $correctcount++;
                    }
                }
            }
        }
        
        $fraction = $totalstems > 0 ? $correctcount / $totalstems : 0;
        
    } elseif ($question->qtype === 'selectmissingwords' || $question->qtype === 'gapselect') {
        // Select missing words: response is array of [gap_index => selected_word]
        $responsedata = is_array($response) ? $response : [];
        $correctcount = 0;
        $totalgaps = 0;
        
        foreach ($answers as $answer) {
            $totalgaps++;
            $gapindex = $answer->sortorder;
            // Correct answer is the answertext, fraction indicates if it's correct
            if (isset($responsedata[$gapindex])) {
                $selectedword = trim($responsedata[$gapindex]);
                $correctword = trim($answer->answertext);
                if (strcasecmp($selectedword, $correctword) === 0 && $answer->fraction > 0) {
                    $correctcount++;
                }
            }
        }
        
        $fraction = $totalgaps > 0 ? $correctcount / $totalgaps : 0;
        
    } elseif ($question->qtype === 'dragdrop' || $question->qtype === 'ddwtos') {
        // Drag and drop: response is array of [dropzone_id => dragged_item_id]
        $responsedata = is_array($response) ? $response : [];
        $correctcount = 0;
        $totaldropzones = 0;
        
        foreach ($answers as $answer) {
            if ($answer->fraction > 0) {
                $totaldropzones++;
                $dropzoneid = $answer->sortorder;
                // The correct item ID is stored in the answer
                if (isset($responsedata[$dropzoneid]) && $responsedata[$dropzoneid] == $answer->id) {
                    $correctcount++;
                }
            }
        }
        
        $fraction = $totaldropzones > 0 ? $correctcount / $totaldropzones : 0;
        
    } elseif ($question->qtype === 'ordering') {
        // Ordering: response is array of answer IDs in submitted order
        $responsedata = is_array($response) ? $response : [];
        
        // Get correct order based on sortorder
        $correctorder = [];
        foreach ($answers as $answer) {
            $correctorder[$answer->sortorder] = $answer->id;
        }
        ksort($correctorder);
        $correctorder = array_values($correctorder);
        
        // Calculate fraction based on pairs in correct position
        $correctpairs = 0;
        $totalpairs = max(0, count($correctorder) - 1);
        
        for ($i = 0; $i < count($responsedata) - 1; $i++) {
            $currentpos = array_search($responsedata[$i], $correctorder);
            $nextpos = array_search($responsedata[$i + 1], $correctorder);
            if ($currentpos !== false && $nextpos !== false && $nextpos == $currentpos + 1) {
                $correctpairs++;
            }
        }
        
        $fraction = $totalpairs > 0 ? $correctpairs / $totalpairs : 0;
        
    } elseif ($question->qtype === 'shortanswer') {
        // Short answer: compare response text against accepted answers
        $responsedata = ['text' => $response];
        $responsetrimmed = strtolower(trim($response));
        
        foreach ($answers as $answer) {
            $acceptedanswer = strtolower(trim($answer->answertext));
            // Check for exact match or wildcard pattern
            if ($responsetrimmed === $acceptedanswer || 
                (strpos($acceptedanswer, '*') !== false && fnmatch($acceptedanswer, $responsetrimmed))) {
                $fraction = max($fraction, $answer->fraction);
            }
        }
        
    } elseif ($question->qtype === 'numerical') {
        // Numerical: check if response is within tolerance
        $responsedata = ['value' => $response];
        $responsevalue = floatval($response);
        
        foreach ($answers as $answer) {
            $correctvalue = floatval($answer->answertext);
            // Tolerance stored in feedback field as JSON or number
            $tolerance = 0;
            if (!empty($answer->feedback)) {
                $tolerancedata = json_decode($answer->feedback, true);
                $tolerance = is_array($tolerancedata) && isset($tolerancedata['tolerance']) 
                    ? floatval($tolerancedata['tolerance']) 
                    : floatval($answer->feedback);
            }
            
            if (abs($responsevalue - $correctvalue) <= $tolerance) {
                $fraction = max($fraction, $answer->fraction);
            }
        }
    }

    return ['fraction' => $fraction, 'responsedata' => $responsedata, 'mark' => $fraction * $question->defaultmark];
}

if ($action === 'submit') {
    require_sesskey();

    $questionid = required_param('questionid', PARAM_INT);
    $response = optional_param('response', '', PARAM_RAW);

    $question = $DB->get_record('aiquiz_questions', ['id' => $questionid], '*', MUST_EXIST);

    $result = grade_response($question, $response, $DB);
    $fraction = $result['fraction'];
    $responsedata = $result['responsedata'];
    $mark = $result['mark'];

    $existing = $DB->get_record('aiquiz_responses', [
        'attemptid' => $attempt->id,
        'questionid' => $questionid,
    ]);

    if ($existing) {
        $existing->response = json_encode($responsedata);
        $existing->fraction = $fraction;
        $existing->mark = $mark;
        $existing->timemodified = time();
        $DB->update_record('aiquiz_responses', $existing);
    } else {
        $responserecord = new stdClass();
        $responserecord->attemptid = $attempt->id;
        $responserecord->questionid = $questionid;
        $responserecord->response = json_encode($responsedata);
        $responserecord->fraction = $fraction;
        $responserecord->mark = $mark;
        $responserecord->timecreated = time();
        $responserecord->timemodified = time();
        $DB->insert_record('aiquiz_responses', $responserecord);
    }

    if ($behaviour === 'adaptive') {
        if ($fraction >= 1) {
            $nextindex = min($currentindex + 1, count($questionlist) - 1);
            if ($currentindex < count($questionlist) - 1) {
                $attempt->currentquestion = $nextindex;
                $attempt->timemodified = time();
                $DB->update_record('aiquiz_attempts', $attempt);
            }
            redirect(new moodle_url('/mod/aiquiz/attempt.php', [
                'id' => $cm->id,
                'attempt' => $attempt->id,
                'action' => 'showfeedback',
                'qid' => $questionid,
                'correct' => 1,
            ]));
        } else {
            redirect(new moodle_url('/mod/aiquiz/attempt.php', [
                'id' => $cm->id,
                'attempt' => $attempt->id,
                'action' => 'showfeedback',
                'qid' => $questionid,
                'correct' => 0,
            ]));
        }
    } elseif ($behaviour === 'immediate') {
        $nextindex = min($currentindex + 1, count($questionlist) - 1);
        if ($currentindex < count($questionlist) - 1) {
            $attempt->currentquestion = $nextindex;
            $attempt->timemodified = time();
            $DB->update_record('aiquiz_attempts', $attempt);
        }
        redirect(new moodle_url('/mod/aiquiz/attempt.php', [
            'id' => $cm->id,
            'attempt' => $attempt->id,
            'action' => 'showfeedback',
            'qid' => $questionid,
            'correct' => $fraction >= 1 ? 1 : 0,
        ]));
    } else {
        $nextquestion = optional_param('next', 0, PARAM_INT);
        if ($nextquestion && $currentindex < count($questionlist) - 1) {
            $attempt->currentquestion = $currentindex + 1;
            $attempt->timemodified = time();
            $DB->update_record('aiquiz_attempts', $attempt);
        }
        redirect(new moodle_url('/mod/aiquiz/attempt.php', [
            'id' => $cm->id,
            'attempt' => $attempt->id,
        ]));
    }
}

if ($action === 'finish') {
    require_sesskey();

    $responses = $DB->get_records('aiquiz_responses', ['attemptid' => $attempt->id]);

    $sumgrades = 0;
    $maxgrade = 0;
    foreach ($questions as $q) {
        $maxgrade += $q->defaultmark;
    }

    foreach ($responses as $resp) {
        $sumgrades += $resp->mark;
    }

    $percentage = $maxgrade > 0 ? ($sumgrades / $maxgrade) * 100 : 0;

    $attempt->state = 'finished';
    $attempt->sumgrades = $sumgrades;
    $attempt->grade = $percentage;
    $attempt->timefinished = time();
    $attempt->timemodified = time();
    $DB->update_record('aiquiz_attempts', $attempt);

    aiquiz_update_grades($aiquiz, $USER->id);

    $event = \mod_aiquiz\event\attempt_submitted::create([
        'objectid' => $attempt->id,
        'context' => $context,
        'relateduserid' => $USER->id,
    ]);
    $event->trigger();

    redirect(new moodle_url('/mod/aiquiz/review.php', [
        'id' => $cm->id,
        'attempt' => $attempt->id,
    ]));
}

$navigate = optional_param('navigate', -1, PARAM_INT);
if ($navigate >= 0 && $navigate < count($questionlist)) {
    $attempt->currentquestion = $navigate;
    $attempt->timemodified = time();
    $DB->update_record('aiquiz_attempts', $attempt);
    $currentindex = $navigate;
}

$showfeedbackaction = $action === 'showfeedback';
$feedbackqid = optional_param('qid', 0, PARAM_INT);
$feedbackcorrect = optional_param('correct', 0, PARAM_INT);

$currentquestion = $questionlist[$currentindex];
$answers = $DB->get_records('aiquiz_answers', ['questionid' => $currentquestion->id], 'sortorder ASC');

if ($aiquiz->shuffleanswers) {
    srand($attempt->id + $currentquestion->id);
    $answers = array_values($answers);
    shuffle($answers);
}

$existingresponse = $DB->get_record('aiquiz_responses', [
    'attemptid' => $attempt->id,
    'questionid' => $currentquestion->id,
]);
$selectedanswers = [];
if ($existingresponse && !empty($existingresponse->response)) {
    $selectedanswers = json_decode($existingresponse->response, true) ?: [];
}

$answeredcount = $DB->count_records('aiquiz_responses', ['attemptid' => $attempt->id]);
$totalquestions = count($questionlist);

echo $OUTPUT->header();

$timelimit = $aiquiz->timelimit;
$timestarted = $attempt->timecreated;
$timeremaining = 0;

if ($timelimit > 0 && !has_capability('mod/aiquiz:ignoretimelimit', $context)) {
    $timeremaining = $timelimit - (time() - $timestarted);
    if ($timeremaining <= 0) {
        redirect(new moodle_url('/mod/aiquiz/attempt.php', [
            'id' => $cm->id,
            'attempt' => $attempt->id,
            'action' => 'finish',
            'sesskey' => sesskey(),
        ]));
    }
}

echo '<div class="aiquiz-container">';

$modeclass = 'aiquiz-mode-' . $behaviour;
$modelabel = get_string('behaviour_' . $behaviour, 'mod_aiquiz');
echo '<div class="aiquiz-mode-badge ' . $modeclass . '">';
if ($behaviour === 'adaptive') {
    echo '<i class="fa fa-refresh"></i> ';
} elseif ($behaviour === 'immediate') {
    echo '<i class="fa fa-bolt"></i> ';
} else {
    echo '<i class="fa fa-list-alt"></i> ';
}
echo $modelabel;
echo '</div>';

if ($timelimit > 0 && !has_capability('mod/aiquiz:ignoretimelimit', $context)) {
    $timerclass = '';
    if ($timeremaining <= 60) {
        $timerclass = 'aiquiz-timer-danger';
    } elseif ($timeremaining <= 300) {
        $timerclass = 'aiquiz-timer-warning';
    }

    echo '<div class="aiquiz-timer">';
    echo '<div class="aiquiz-timer-label">' . get_string('timeremaining', 'mod_aiquiz') . '</div>';
    echo '<div class="aiquiz-timer-value ' . $timerclass . '" id="timer" data-remaining="' . $timeremaining . '">';
    echo gmdate('H:i:s', $timeremaining);
    echo '</div>';
    echo '</div>';

    $PAGE->requires->js_init_code('
        var remaining = ' . $timeremaining . ';
        var timerEl = document.getElementById("timer");
        setInterval(function () {
            remaining--;
            if (remaining <= 0) {
                window.location.href = "' . (new moodle_url('/mod/aiquiz/attempt.php', [
                    'id' => $cm->id,
                    'attempt' => $attempt->id,
                    'action' => 'finish',
                    'sesskey' => sesskey(),
                ]))->out(false) . '";
            }
            var h = Math.floor(remaining / 3600);
            var m = Math.floor((remaining % 3600) / 60);
            var s = remaining % 60;
            timerEl.textContent = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
            timerEl.className = "aiquiz-timer-value";
            if (remaining <= 60) timerEl.className += " aiquiz-timer-danger";
            else if (remaining <= 300) timerEl.className += " aiquiz-timer-warning";
        }, 1000);
    ');
}

if ($behaviour === 'deferred' && $showreview) {
    echo '<div class="aiquiz-review-banner">';
    echo '<div class="aiquiz-review-banner-text">';
    echo '<strong>' . get_string('reviewbeforesubmit', 'mod_aiquiz') . '</strong>';
    echo get_string('reviewbeforesubmit_desc', 'mod_aiquiz', ['answered' => $answeredcount, 'total' => $totalquestions]);
    echo '</div>';
    echo '<form method="post" action="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id, 'action' => 'finish']) . '">';
    echo '<input type="hidden" name="sesskey" value="' . sesskey() . '">';
    echo '<button type="submit" class="btn">' . get_string('submitquiz', 'mod_aiquiz') . '</button>';
    echo '</form>';
    echo '</div>';

    $qnum = 0;
    foreach ($questionlist as $q) {
        $qnum++;
        $qanswers = $DB->get_records('aiquiz_answers', ['questionid' => $q->id], 'sortorder ASC');
        $qresponse = $DB->get_record('aiquiz_responses', ['attemptid' => $attempt->id, 'questionid' => $q->id]);
        $qselected = [];
        if ($qresponse && !empty($qresponse->response)) {
            $qselected = json_decode($qresponse->response, true) ?: [];
        }

        echo '<div class="aiquiz-question-container">';
        echo '<div class="aiquiz-question-header">';
        echo '<span class="aiquiz-question-number">' . get_string('question', 'mod_aiquiz') . ' ' . $qnum . '</span>';
        if ($qresponse) {
            echo '<span class="aiquiz-state-passed" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #1e40af;"><i class="fa fa-check"></i> Answered</span>';
        } else {
            echo '<span class="aiquiz-state-failed"><i class="fa fa-times"></i> Not answered</span>';
        }
        echo '</div>';
        echo '<div class="aiquiz-question-body">';
        echo '<div class="aiquiz-question-text">' . format_text($q->questiontext, $q->questiontextformat) . '</div>';

        echo '<ul class="aiquiz-answers-list">';
        foreach ($qanswers as $ans) {
            $isSelected = in_array($ans->id, $qselected);
            $labelclass = $isSelected ? 'selected' : '';
            echo '<li class="aiquiz-answer-item">';
            echo '<div class="aiquiz-answer-label ' . $labelclass . '" style="pointer-events: none; cursor: default;">';
            if ($isSelected) {
                echo '<i class="fa fa-check-circle" style="color: #3b82f6;"></i>';
            } else {
                echo '<i class="fa fa-circle-o" style="color: #cbd5e1;"></i>';
            }
            echo '<span class="aiquiz-answer-text">' . format_text($ans->answertext, $ans->answertextformat) . '</span>';
            echo '</div>';
            echo '</li>';
        }
        echo '</ul>';

        echo '<div style="margin-top: 16px;">';
        echo '<a href="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id, 'navigate' => $qnum - 1]) . '" class="btn btn-secondary btn-sm">';
        echo '<i class="fa fa-pencil"></i> ' . get_string('changeanswer', 'mod_aiquiz') . '</a>';
        echo '</div>';

        echo '</div>';
        echo '</div>';
    }

    echo '<div class="aiquiz-actions" style="margin-top: 24px;">';
    echo '<form method="post" action="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id, 'action' => 'finish']) . '">';
    echo '<input type="hidden" name="sesskey" value="' . sesskey() . '">';
    echo '<button type="submit" class="btn btn-primary btn-lg"><i class="fa fa-check"></i> ' . get_string('submitquiz', 'mod_aiquiz') . '</button>';
    echo '</form>';
    echo '</div>';

    echo '</div>';
    echo $OUTPUT->footer();
    exit;
}

$totalquestions = count($questionlist);
$answeredcount = 0;
$correctcount = 0;
$incorrectcount = 0;

foreach ($questionlist as $q) {
    $qresp = $DB->get_record('aiquiz_responses', ['attemptid' => $attempt->id, 'questionid' => $q->id]);
    if ($qresp) {
        $answeredcount++;
        if ($qresp->fraction >= 1) {
            $correctcount++;
        } else {
            $incorrectcount++;
        }
    }
}

$progresspercent = $totalquestions > 0 ? round(($answeredcount / $totalquestions) * 100) : 0;
$questionsremaining = $totalquestions - $answeredcount;

$quiztimelimit = isset($aiquiz->timelimit) ? $aiquiz->timelimit : 0;
$questiontimelimit = isset($aiquiz->questiontimelimit) ? $aiquiz->questiontimelimit : 0;

$quiztimeremaining = 0;
if ($quiztimelimit > 0) {
    $elapsed = time() - $attempt->timecreated;
    $quiztimeremaining = max(0, $quiztimelimit - $elapsed);
}

echo '<div class="aiquiz-progress-header">';
echo '<div class="aiquiz-progress-top">';

echo '<div class="aiquiz-progress-info">';
echo '<div class="aiquiz-progress-label">' . get_string('question', 'mod_aiquiz') . ' ' . ($currentindex + 1) . '/' . $totalquestions . '</div>';
echo '<div class="aiquiz-progress-count">' . $questionsremaining . ' ' . get_string('remaining', 'mod_aiquiz') . '</div>';
echo '</div>';

echo '<div class="aiquiz-progress-bar-container">';
echo '<div class="aiquiz-progress-bar-bg">';
echo '<div class="aiquiz-progress-bar-fill" style="width: ' . $progresspercent . '%;"></div>';
echo '</div>';
echo '<div class="aiquiz-progress-bar-text">' . $progresspercent . '% ' . get_string('complete', 'mod_aiquiz') . '</div>';
echo '</div>';

echo '<div class="aiquiz-timer-section">';

if ($quiztimelimit > 0) {
    $hours = floor($quiztimeremaining / 3600);
    $mins = floor(($quiztimeremaining % 3600) / 60);
    $secs = $quiztimeremaining % 60;
    $timerclass = 'quiz-timer';
    if ($quiztimeremaining < 60) {
        $timerclass .= ' timer-danger';
    } elseif ($quiztimeremaining < 300) {
        $timerclass .= ' timer-warning';
    }

    echo '<div class="aiquiz-timer-box ' . $timerclass . '" id="quizTimer" data-remaining="' . $quiztimeremaining . '">';
    echo '<div class="aiquiz-timer-label">' . get_string('timeleft', 'mod_aiquiz') . '</div>';
    echo '<div class="aiquiz-timer-value" id="quizTimerValue">';
    if ($hours > 0) {
        echo sprintf('%d:%02d:%02d', $hours, $mins, $secs);
    } else {
        echo sprintf('%02d:%02d', $mins, $secs);
    }
    echo '</div>';
    echo '</div>';
}

if ($questiontimelimit > 0) {
    $qmins = floor($questiontimelimit / 60);
    $qsecs = $questiontimelimit % 60;

    echo '<div class="aiquiz-timer-box question-timer" id="questionTimer" data-remaining="' . $questiontimelimit . '">';
    echo '<div class="aiquiz-timer-label">' . get_string('questiontimeleft', 'mod_aiquiz') . '</div>';
    echo '<div class="aiquiz-timer-value" id="questionTimerValue">';
    if ($qmins > 0) {
        echo sprintf('%d:%02d', $qmins, $qsecs);
    } else {
        echo sprintf('0:%02d', $qsecs);
    }
    echo '</div>';
    echo '</div>';
}

echo '</div>';
echo '</div>';

echo '<div class="aiquiz-progress">';
for ($i = 0; $i < count($questionlist); $i++) {
    $q = $questionlist[$i];
    $qresp = $DB->get_record('aiquiz_responses', ['attemptid' => $attempt->id, 'questionid' => $q->id]);

    $itemclass = 'unanswered';
    if ($qresp) {
        if ($behaviour === 'adaptive' || $behaviour === 'immediate') {
            $itemclass = $qresp->fraction >= 1 ? 'correct' : 'incorrect';
        } else {
            $itemclass = 'answered';
        }
    }
    if ($i === $currentindex) {
        $itemclass .= ' current';
    }

    if ($behaviour === 'deferred' || ($behaviour === 'adaptive' && $qresp && $qresp->fraction >= 1) || ($behaviour === 'immediate' && $qresp)) {
        echo '<a href="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id, 'navigate' => $i]) . '" class="aiquiz-progress-item ' . $itemclass . '">';
        if ($itemclass !== 'correct' && $itemclass !== 'incorrect') {
            echo ($i + 1);
        }
        echo '</a>';
    } else {
        echo '<span class="aiquiz-progress-item ' . $itemclass . '">' . ($i + 1) . '</span>';
    }
}
echo '</div>';

if ($behaviour === 'adaptive' || $behaviour === 'immediate') {
    echo '<div class="aiquiz-progress-legend">';
    echo '<div class="aiquiz-legend-item"><div class="aiquiz-legend-dot unanswered"></div>' . get_string('unanswered', 'mod_aiquiz') . '</div>';
    echo '<div class="aiquiz-legend-item"><div class="aiquiz-legend-dot correct"></div>' . get_string('correct', 'mod_aiquiz') . '</div>';
    echo '<div class="aiquiz-legend-item"><div class="aiquiz-legend-dot incorrect"></div>' . get_string('incorrect', 'mod_aiquiz') . '</div>';
    echo '</div>';
} else {
    echo '<div class="aiquiz-progress-legend">';
    echo '<div class="aiquiz-legend-item"><div class="aiquiz-legend-dot unanswered"></div>' . get_string('unanswered', 'mod_aiquiz') . '</div>';
    echo '<div class="aiquiz-legend-item"><div class="aiquiz-legend-dot answered"></div>' . get_string('answered', 'mod_aiquiz') . '</div>';
    echo '</div>';
}

echo '</div>';

if ($quiztimelimit > 0 || $questiontimelimit > 0) {
    echo '<script>
    (function () {
        var quizTimerEl = document.getElementById("quizTimer");
        var quizTimerValueEl = document.getElementById("quizTimerValue");
        var questionTimerEl = document.getElementById("questionTimer");
        var questionTimerValueEl = document.getElementById("questionTimerValue");

        function formatTime(seconds) {
            var h = Math.floor(seconds / 3600);
            var m = Math.floor((seconds % 3600) / 60);
            var s = seconds % 60;
            if (h > 0) {
                return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
            }
            return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
        }

        function updateTimerClass(el, remaining) {
            if (!el) return;
            el.classList.remove("timer-warning", "timer-danger");
            if (remaining < 60) {
                el.classList.add("timer-danger");
            } else if (remaining < 300) {
                el.classList.add("timer-warning");
            }
        }

        // C2-FIX: quiz timer and question timer expiry must redirect to the finish action,
        // not submit document.querySelector("form") which targets the answer-submit form
        // and does not trigger the finish/grade flow. Finish URL is embedded server-side.
        var finishUrl = "' . (new moodle_url('/mod/aiquiz/attempt.php', [
    'id' => $cm->id,
    'attempt' => $attempt->id,
    'action' => 'finish',
    'sesskey' => sesskey(),
]))->out(false) . '";

        if (quizTimerEl && quizTimerValueEl) {
            var quizRemaining = parseInt(quizTimerEl.getAttribute("data-remaining"), 10);
            setInterval(function () {
                quizRemaining--;
                if (quizRemaining <= 0) {
                    quizTimerValueEl.textContent = "00:00";
                    window.location.href = finishUrl;
                    return;
                }
                quizTimerValueEl.textContent = formatTime(quizRemaining);
                updateTimerClass(quizTimerEl, quizRemaining);
            }, 1000);
        }

        if (questionTimerEl && questionTimerValueEl) {
            var qRemaining = parseInt(questionTimerEl.getAttribute("data-remaining"), 10);
            setInterval(function () {
                qRemaining--;
                if (qRemaining <= 0) {
                    questionTimerValueEl.textContent = "0:00";
                    window.location.href = finishUrl;
                    return;
                }
                var m = Math.floor(qRemaining / 60);
                var s = qRemaining % 60;
                questionTimerValueEl.textContent = m + ":" + String(s).padStart(2, "0");
                updateTimerClass(questionTimerEl, qRemaining);
            }, 1000);
        }
    })();
    </script>';
}

if ($showfeedbackaction && $feedbackqid) {
    $feedbackq = $DB->get_record('aiquiz_questions', ['id' => $feedbackqid], '*', MUST_EXIST);
    $feedbackanswers = $DB->get_records('aiquiz_answers', ['questionid' => $feedbackqid], 'sortorder ASC');
    $feedbackresp = $DB->get_record('aiquiz_responses', ['attemptid' => $attempt->id, 'questionid' => $feedbackqid]);
    $feedbackselected = [];
    if ($feedbackresp && !empty($feedbackresp->response)) {
        $feedbackselected = json_decode($feedbackresp->response, true) ?: [];
    }

    $selectedAnswerText = '';
    $selectedAnswerFeedback = '';
    $correctAnswerText = '';
    $correctAnswerFeedback = '';

    foreach ($feedbackanswers as $ans) {
        if (in_array($ans->id, $feedbackselected)) {
            $selectedAnswerText = strip_tags($ans->answertext);
            $selectedAnswerFeedback = $ans->feedback;
        }
        if ($ans->fraction > 0) {
            $correctAnswerText = strip_tags($ans->answertext);
            $correctAnswerFeedback = $ans->feedback;
        }
    }

    $popupclass = $feedbackcorrect ? 'correct' : 'incorrect';
    $isLastQuestion = $currentindex >= count($questionlist) - 1;

    if ($behaviour === 'immediate' || $behaviour === 'adaptive') {
        echo '<div class="aiquiz-feedback-overlay" id="feedbackOverlay">';

        if ($feedbackcorrect) {
            echo '<div id="confettiContainer" class="aiquiz-confetti"></div>';
        }

        echo '<div class="aiquiz-feedback-popup ' . $popupclass . '">';

        echo '<div class="aiquiz-feedback-icon">';
        if ($feedbackcorrect) {
            echo '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else {
            echo '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        }
        echo '</div>';

        if ($feedbackcorrect) {
            echo '<div class="aiquiz-feedback-title">' . get_string('popup_correct_title', 'mod_aiquiz') . '</div>';
            echo '<div class="aiquiz-feedback-message">' . get_string('popup_correct_message', 'mod_aiquiz') . '</div>';

            if (!empty($correctAnswerFeedback)) {
                echo '<div class="aiquiz-feedback-answer-detail">';
                echo '<div class="label">' . get_string('whycorrect', 'mod_aiquiz') . '</div>';
                echo '<div class="content">' . format_text($correctAnswerFeedback, FORMAT_PLAIN) . '</div>';
                echo '</div>';
            }
        } else {
            if ($behaviour === 'adaptive') {
                echo '<div class="aiquiz-feedback-title">' . get_string('popup_tryagain_title', 'mod_aiquiz') . '</div>';
                echo '<div class="aiquiz-feedback-message">' . get_string('popup_tryagain_message', 'mod_aiquiz') . '</div>';
            } else {
                echo '<div class="aiquiz-feedback-title">' . get_string('popup_incorrect_title', 'mod_aiquiz') . '</div>';
                echo '<div class="aiquiz-feedback-message">' . get_string('popup_incorrect_message', 'mod_aiquiz') . '</div>';
            }

            if (!empty($selectedAnswerFeedback)) {
                echo '<div class="aiquiz-feedback-answer-detail">';
                echo '<div class="label">' . get_string('whyincorrect', 'mod_aiquiz') . '</div>';
                echo '<div class="content">' . format_text($selectedAnswerFeedback, FORMAT_PLAIN) . '</div>';
                echo '</div>';
            }

            if ($behaviour === 'immediate' && !empty($correctAnswerText)) {
                echo '<div class="aiquiz-feedback-answer-detail" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #6ee7b7;">';
                echo '<div class="label" style="color: #059669;">' . get_string('correctanswerwas', 'mod_aiquiz') . '</div>';
                echo '<div class="content" style="color: #065f46; font-weight: 500;">' . $correctAnswerText . '</div>';
                if (!empty($correctAnswerFeedback)) {
                    echo '<div class="content" style="margin-top: 8px; font-size: 13px; color: #047857;">' . format_text($correctAnswerFeedback, FORMAT_PLAIN) . '</div>';
                }
                echo '</div>';
            }
        }

        if ($behaviour === 'adaptive' && !$feedbackcorrect) {
            echo '<a href="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id]) . '" class="btn btn-primary">';
            echo '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>';
            echo get_string('tryagain', 'mod_aiquiz') . '</a>';
        } elseif ($isLastQuestion) {
            // FIX-WC-LASTQ-LOCK: Previously, the last question's feedback overlay showed only
            // "Finish Quiz" (action=finish), which permanently locked the attempt. Students had
            // no way to navigate back to review or change previous answers. The overlay covered
            // the progress bar, making navigation impossible.
            //
            // Fix: Replace the single Finish button with two options:
            //   1. "Review Previous Answers" - dismisses the overlay by returning to the attempt
            //      page (no action=finish), making the progress bar accessible again.
            //   2. "Finish and Start Review" - the explicit submission that locks the attempt.
            //
            // The review (read-only) period now only begins when the student clicks
            // "Finish and Start Review".
            echo '<div style="display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; margin-top: 4px;">';
            echo '<a href="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id]) . '" class="btn btn-secondary" style="width: 100%; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">';
            echo '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>';
            echo get_string('reviewpreviousquestions', 'mod_aiquiz');
            echo '</a>';
            echo '<form method="post" action="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id, 'action' => 'finish']) . '" style="width: 100%;">';
            echo '<input type="hidden" name="sesskey" value="' . sesskey() . '">';
            echo '<button type="submit" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">';
            echo '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
            echo get_string('finishandreview', 'mod_aiquiz') . '</button>';
            echo '</form>';
            echo '</div>';
        } else {
            echo '<a href="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id]) . '" class="btn btn-primary">';
            echo get_string('nextquestion', 'mod_aiquiz');
            echo ' <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 8px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></a>';
        }

        echo '</div>';
        echo '</div>';

        echo '<script>
        (function () {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            var audioContext = new AudioContext();

            function playCorrectSound() {
                var oscillator = audioContext.createOscillator();
                var gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            }

            function playIncorrectSound() {
                var oscillator = audioContext.createOscillator();
                var gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
            }

            function createConfetti() {
                var container = document.getElementById("confettiContainer");
                if (!container) return;
                var colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
                for (var i = 0; i < 50; i++) {
                    var confetti = document.createElement("div");
                    confetti.className = "confetti-piece";
                    confetti.style.left = Math.random() * 100 + "%";
                    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.animationDelay = Math.random() * 0.5 + "s";
                    confetti.style.animationDuration = (2 + Math.random() * 2) + "s";
                    container.appendChild(confetti);
                }
            }

            setTimeout(function () {
                ' . ($feedbackcorrect ? 'playCorrectSound(); createConfetti();' : 'playIncorrectSound();') . '
            }, 200);
        })();
        </script>';
    }

    echo '</div>';
    echo $OUTPUT->footer();
    exit;
}

echo '<div class="aiquiz-question-container">';
echo '<div class="aiquiz-question-header">';
echo '<span class="aiquiz-question-number">' . get_string('question', 'mod_aiquiz') . ' ' . ($currentindex + 1) . ' / ' . count($questionlist) . '</span>';
$markvalue = (int)$currentquestion->defaultmark;
echo '<span class="aiquiz-question-mark">' . $markvalue . ' ' . ($markvalue == 1 ? get_string('mark', 'mod_aiquiz') : get_string('marks', 'mod_aiquiz')) . '</span>';
echo '</div>';

echo '<div class="aiquiz-question-body">';
echo '<div class="aiquiz-question-text">' . format_text($currentquestion->questiontext, $currentquestion->questiontextformat) . '</div>';

echo '<form id="aiquiz-answer-form" method="post" action="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id, 'action' => 'submit']) . '">';
echo '<input type="hidden" name="sesskey" value="' . sesskey() . '">';
echo '<input type="hidden" name="questionid" value="' . $currentquestion->id . '">';

if ($currentquestion->qtype === 'mcq' || $currentquestion->qtype === 'truefalse') {
    $ismulti = false;
    $correctcount = 0;
    foreach ($answers as $a) {
        if ($a->fraction > 0) {
            $correctcount++;
        }
    }
    $ismulti = $correctcount > 1;

    echo '<ul class="aiquiz-answers-list">';
    foreach ($answers as $answer) {
        $isselected = in_array($answer->id, $selectedanswers);
        $selectedclass = $isselected ? 'selected' : '';
        $inputtype = $ismulti ? 'checkbox' : 'radio';
        $inputname = $ismulti ? 'response[]' : 'response';

        echo '<li class="aiquiz-answer-item">';
        echo '<label class="aiquiz-answer-label ' . $selectedclass . '">';
        echo '<input type="' . $inputtype . '" name="' . $inputname . '" value="' . $answer->id . '"' . ($isselected ? ' checked' : '') . '>';
        echo '<span class="aiquiz-answer-text">' . format_text($answer->answertext, $answer->answertextformat) . '</span>';
        echo '</label>';
        echo '</li>';
    }
    echo '</ul>';
    
} elseif ($currentquestion->qtype === 'matching') {
    // Matching question: stems on left, dropdown choices on right
    // Answers: even sortorder = stems (with correct index in fraction), odd sortorder = choices
    $stems = [];
    $choices = [];
    
    foreach ($answers as $answer) {
        if ($answer->sortorder % 2 == 0) {
            // Stem record - also check for choices in feedback JSON
            $stems[] = $answer;
            if (empty($choices) && !empty($answer->feedback)) {
                $feedbackdata = json_decode($answer->feedback, true);
                if (is_array($feedbackdata) && isset($feedbackdata['choices'])) {
                    $choices = $feedbackdata['choices'];
                }
            }
        } else {
            // Choice record
            $choices[] = strip_tags($answer->answertext);
        }
    }
    
    // Fallback: try to get choices from questiondata JSON
    if (empty($choices) && !empty($currentquestion->questiondata)) {
        $qdata = json_decode($currentquestion->questiondata, true);
        if (is_array($qdata) && isset($qdata['matchright'])) {
            $choices = array_values(array_unique($qdata['matchright']));
        }
    }
    
    // Final fallback: use stem texts as choices too
    if (empty($choices) && !empty($stems)) {
        foreach ($stems as $s) {
            $choices[] = strip_tags($s->answertext);
        }
    }
    
    // Shuffle choices for display (but keep original order for grading)
    $shuffledchoices = $choices;
    shuffle($shuffledchoices);
    
    echo '<div class="aiquiz-matching-container">';
    echo '<div class="aiquiz-matching-instructions">' . get_string('matchinginstructions', 'mod_aiquiz') . '</div>';
    
    foreach ($stems as $index => $stem) {
        $selectedvalue = isset($selectedanswers[$stem->id]) ? $selectedanswers[$stem->id] : '';
        
        echo '<div class="aiquiz-matching-row">';
        echo '<div class="aiquiz-matching-stem">' . format_text($stem->answertext, FORMAT_HTML) . '</div>';
        echo '<div class="aiquiz-matching-arrow"><i class="fa fa-arrow-right"></i></div>';
        echo '<select name="response[' . $stem->id . ']" class="aiquiz-matching-select" data-testid="select-matching-' . $stem->id . '">';
        echo '<option value="">' . get_string('chooseanswer', 'mod_aiquiz') . '</option>';
        
        foreach ($shuffledchoices as $choiceindex => $choice) {
            // Store the original index for grading
            $originalindex = array_search($choice, $choices);
            $selected = ($selectedvalue !== '' && $selectedvalue == $originalindex) ? ' selected' : '';
            echo '<option value="' . $originalindex . '"' . $selected . '>' . s($choice) . '</option>';
        }
        
        echo '</select>';
        echo '</div>';
    }
    echo '</div>';
    
} elseif ($currentquestion->qtype === 'selectmissingwords' || $currentquestion->qtype === 'gapselect') {
    // Select missing words: text with [[gaps]] replaced by dropdowns
    $questiontext = $currentquestion->questiontext;
    
    // Get word choices grouped by gap
    $gapwords = [];
    foreach ($answers as $answer) {
        $gapindex = $answer->sortorder;
        if (!isset($gapwords[$gapindex])) {
            $gapwords[$gapindex] = [];
        }
        $gapwords[$gapindex][] = strip_tags($answer->answertext);
    }
    
    // Replace [[1]], [[2]], etc. with select dropdowns
    $gapnum = 0;
    $processedtext = preg_replace_callback('/\[\[(\d+)\]\]/', function ($matches) use (&$gapnum, $gapwords, $selectedanswers) {
        $gapindex = intval($matches[1]);
        $gapnum++;
        $selectedvalue = isset($selectedanswers[$gapindex]) ? $selectedanswers[$gapindex] : '';
        
        $html = '<select name="response[' . $gapindex . ']" class="aiquiz-gapselect-dropdown">';
        $html .= '<option value="">---</option>';
        
        // Get words for this gap (or all words if not grouped)
        $words = isset($gapwords[$gapindex]) ? $gapwords[$gapindex] : array_merge(...array_values($gapwords));
        shuffle($words);
        
        foreach ($words as $word) {
            $selected = ($selectedvalue == $word) ? ' selected' : '';
            $html .= '<option value="' . s($word) . '"' . $selected . '>' . s($word) . '</option>';
        }
        
        $html .= '</select>';
        return $html;
    }, $questiontext);
    
    echo '<div class="aiquiz-gapselect-container">';
    echo '<div class="aiquiz-gapselect-text">' . $processedtext . '</div>';
    echo '</div>';
    
} elseif ($currentquestion->qtype === 'dragdrop' || $currentquestion->qtype === 'ddwtos') {
    // Drag and drop into text: similar to gap select but with draggable items
    $questiontext = $currentquestion->questiontext;
    
    // Get draggable items
    $dragitems = [];
    foreach ($answers as $answer) {
        $dragitems[] = [
            'id' => $answer->id,
            'text' => strip_tags($answer->answertext),
            'group' => $answer->sortorder
        ];
    }
    
    // Find drop zones [[1]], [[2]], etc.
    $dropzones = [];
    preg_match_all('/\[\[(\d+)\]\]/', $questiontext, $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        $dropzones[] = intval($match[1]);
    }
    
    // Replace [[1]], [[2]] with drop zones
    $processedtext = preg_replace_callback('/\[\[(\d+)\]\]/', function ($matches) use ($selectedanswers) {
        $dropid = intval($matches[1]);
        $selectedvalue = isset($selectedanswers[$dropid]) ? $selectedanswers[$dropid] : '';
        $html = '<span class="aiquiz-dropzone" data-dropid="' . $dropid . '" data-selected="' . s($selectedvalue) . '">';
        $html .= '<input type="hidden" name="response[' . $dropid . ']" value="' . s($selectedvalue) . '">';
        $html .= '<span class="aiquiz-dropzone-placeholder">' . get_string('dropanswer', 'mod_aiquiz') . '</span>';
        $html .= '</span>';
        return $html;
    }, $questiontext);
    
    echo '<div class="aiquiz-dragdrop-container">';
    echo '<div class="aiquiz-dragdrop-text">' . $processedtext . '</div>';
    echo '<div class="aiquiz-draggables">';
    echo '<div class="aiquiz-draggables-label">' . get_string('dragitems', 'mod_aiquiz') . '</div>';
    echo '<div class="aiquiz-draggables-list">';
    
    shuffle($dragitems);
    foreach ($dragitems as $item) {
        echo '<div class="aiquiz-draggable" data-itemid="' . $item['id'] . '" draggable="true">';
        echo s($item['text']);
        echo '</div>';
    }
    
    echo '</div>';
    echo '</div>';
    echo '</div>';
    
    // Add drag and drop JavaScript
    echo '<script>
    (function () {
        var draggables = document.querySelectorAll(".aiquiz-draggable");
        var dropzones = document.querySelectorAll(".aiquiz-dropzone");
        
        draggables.forEach(function (el) {
            el.addEventListener("dragstart", function (e) {
                e.dataTransfer.setData("text/plain", el.getAttribute("data-itemid"));
                el.classList.add("dragging");
            });
            el.addEventListener("dragend", function () {
                el.classList.remove("dragging");
            });
        });
        
        dropzones.forEach(function (zone) {
            zone.addEventListener("dragover", function (e) {
                e.preventDefault();
                zone.classList.add("dragover");
            });
            zone.addEventListener("dragleave", function () {
                zone.classList.remove("dragover");
            });
            zone.addEventListener("drop", function (e) {
                e.preventDefault();
                zone.classList.remove("dragover");
                var itemid = e.dataTransfer.getData("text/plain");
                var draggedEl = document.querySelector(".aiquiz-draggable[data-itemid=\"" + itemid + "\"]");
                if (draggedEl) {
                    zone.querySelector("input").value = itemid;
                    zone.querySelector(".aiquiz-dropzone-placeholder").textContent = draggedEl.textContent;
                    zone.classList.add("filled");
                    draggedEl.classList.add("used");
                }
            });
        });
    })();
    </script>';
    
} elseif ($currentquestion->qtype === 'ordering') {
    // Ordering question: drag items into correct order
    $items = [];
    foreach ($answers as $answer) {
        $items[] = [
            'id' => $answer->id,
            'text' => strip_tags($answer->answertext)
        ];
    }
    
    // Shuffle for display
    shuffle($items);
    
    // If there's a previous response, use that order
    if (!empty($selectedanswers)) {
        $orderedids = is_array($selectedanswers) ? $selectedanswers : [];
        $orderedItems = [];
        foreach ($orderedids as $id) {
            foreach ($items as $key => $item) {
                if ($item['id'] == $id) {
                    $orderedItems[] = $item;
                    unset($items[$key]);
                    break;
                }
            }
        }
        $items = array_merge($orderedItems, array_values($items));
    }
    
    echo '<div class="aiquiz-ordering-container">';
    echo '<div class="aiquiz-ordering-instructions">' . get_string('orderinginstructions', 'mod_aiquiz') . '</div>';
    echo '<ul class="aiquiz-ordering-list" id="orderingList">';
    
    foreach ($items as $index => $item) {
        echo '<li class="aiquiz-ordering-item" data-itemid="' . $item['id'] . '">';
        echo '<span class="aiquiz-ordering-handle"><i class="fa fa-bars"></i></span>';
        echo '<span class="aiquiz-ordering-text">' . s($item['text']) . '</span>';
        echo '<input type="hidden" name="response[]" value="' . $item['id'] . '">';
        echo '</li>';
    }
    
    echo '</ul>';
    echo '</div>';
    
    // Add sortable JavaScript
    echo '<script>
    (function () {
        var list = document.getElementById("orderingList");
        var draggedItem = null;
        
        list.querySelectorAll(".aiquiz-ordering-item").forEach(function (item) {
            item.setAttribute("draggable", "true");
            
            item.addEventListener("dragstart", function (e) {
                draggedItem = item;
                item.classList.add("dragging");
                e.dataTransfer.effectAllowed = "move";
            });
            
            item.addEventListener("dragend", function () {
                item.classList.remove("dragging");
                draggedItem = null;
                updateOrder();
            });
            
            item.addEventListener("dragover", function (e) {
                e.preventDefault();
                if (draggedItem && draggedItem !== item) {
                    var rect = item.getBoundingClientRect();
                    var midY = rect.top + rect.height / 2;
                    if (e.clientY < midY) {
                        list.insertBefore(draggedItem, item);
                    } else {
                        list.insertBefore(draggedItem, item.nextSibling);
                    }
                }
            });
        });
        
        function updateOrder() {
            list.querySelectorAll(".aiquiz-ordering-item").forEach(function (item, index) {
                item.querySelector("input").name = "response[" + index + "]";
            });
        }
    })();
    </script>';
    
} elseif ($currentquestion->qtype === 'shortanswer') {
    // Short answer: text input
    $savedresponse = isset($selectedanswers['text']) ? $selectedanswers['text'] : '';
    
    echo '<div class="aiquiz-shortanswer-container">';
    echo '<input type="text" name="response" value="' . s($savedresponse) . '" class="aiquiz-shortanswer-input" autocomplete="off" placeholder="' . get_string('typeyouranswer', 'mod_aiquiz') . '">';
    echo '</div>';
    
} elseif ($currentquestion->qtype === 'numerical') {
    // Numerical: number input
    $savedresponse = isset($selectedanswers['value']) ? $selectedanswers['value'] : '';
    
    echo '<div class="aiquiz-numerical-container">';
    echo '<input type="number" name="response" value="' . s($savedresponse) . '" class="aiquiz-numerical-input" step="any" autocomplete="off" placeholder="' . get_string('enternumber', 'mod_aiquiz') . '">';
    echo '</div>';
}

echo '<div class="aiquiz-nav">';
echo '<div>';
if ($currentindex > 0 && $behaviour === 'deferred') {
    echo '<a href="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id, 'navigate' => $currentindex - 1]) . '" class="btn btn-secondary"><i class="fa fa-arrow-left"></i> ' . get_string('previous', 'mod_aiquiz') . '</a>';
}
echo '</div>';

echo '<div style="display: flex; gap: 12px;">';

if ($behaviour === 'deferred') {
    if ($currentindex < count($questionlist) - 1) {
        echo '<input type="hidden" name="next" value="1" id="aiquiz-next-flag">';
        echo '<button type="button" class="btn btn-primary" onclick="document.getElementById(\'aiquiz-answer-form\').submit()">' . get_string('next', 'mod_aiquiz') . ' <i class="fa fa-arrow-right"></i></button>';
    } else {
        echo '<button type="submit" class="btn btn-secondary">' . get_string('saveanswer', 'mod_aiquiz') . '</button>';
        echo '</form>';
        echo '<a href="' . new moodle_url('/mod/aiquiz/attempt.php', ['id' => $cm->id, 'attempt' => $attempt->id, 'review' => 1]) . '" class="btn btn-primary btn-lg"><i class="fa fa-eye"></i> ' . get_string('reviewbeforesubmit', 'mod_aiquiz') . '</a>';
    }
} else {
    echo '<button type="submit" class="btn btn-primary btn-lg">' . get_string('submit', 'mod_aiquiz') . '</button>';
}

echo '</div>';
echo '</div>';

if ($behaviour !== 'deferred') {
    echo '</form>';
}

echo '</div>';
echo '</div>';

echo '</div>';

if ($aiquiz->browsersecurity) {
    $PAGE->requires->js_init_code('
        document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
        document.addEventListener("copy", function (e) { e.preventDefault(); });
        document.addEventListener("cut", function (e) { e.preventDefault(); });
        document.addEventListener("paste", function (e) { e.preventDefault(); });
        document.addEventListener("keydown", function (e) {
            if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")) {
                e.preventDefault();
            }
        });
    ');
}

echo $OUTPUT->footer();
