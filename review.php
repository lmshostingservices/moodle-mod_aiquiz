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
 * Attempt review page for mod_aiquiz.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT);
$attemptid = required_param('attempt', PARAM_INT);

$cm = get_coursemodule_from_id('aiquiz', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

$attempt = $DB->get_record('aiquiz_attempts', ['id' => $attemptid], '*', MUST_EXIST);

if ($attempt->userid != $USER->id) {
    require_capability('mod/aiquiz:viewreports', $context);
}

if (!$aiquiz->showresults && !has_capability('mod/aiquiz:viewreports', $context)) {
    redirect(new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]),
        get_string('reviewnotallowed', 'mod_aiquiz'));
}

$PAGE->set_url('/mod/aiquiz/review.php', ['id' => $cm->id, 'attempt' => $attemptid]);
$PAGE->set_title(format_string($aiquiz->name) . ' - ' . get_string('review', 'mod_aiquiz'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

$PAGE->requires->css('/mod/aiquiz/styles/tokens.css');
$PAGE->requires->css('/mod/aiquiz/styles/bridge.css');

$questions = $DB->get_records('aiquiz_questions', ['aiquizid' => $aiquiz->id], 'sortorder ASC');
$responses = $DB->get_records('aiquiz_responses', ['attemptid' => $attemptid], '', 'questionid, response, fraction, mark');

$user = $DB->get_record('user', ['id' => $attempt->userid]);

echo $OUTPUT->header();

echo '<div class="aiquiz-container">';

echo '<div class="aiquiz-header">';
echo '<h2 class="aiquiz-title">' . format_string($aiquiz->name) . ' - ' . get_string('review', 'mod_aiquiz') . '</h2>';
if ($attempt->userid != $USER->id) {
    echo '<p>' . get_string('attemptby', 'mod_aiquiz', fullname($user)) . '</p>';
}
echo '</div>';

$passed = $attempt->grade >= $aiquiz->passinggrade;
$statusclass = $passed ? 'aiquiz-grade-pass' : 'aiquiz-grade-fail';

echo '<div class="aiquiz-grade-summary ' . $statusclass . '">';
echo '<div class="aiquiz-grade-label">' . get_string('yourgrade', 'mod_aiquiz') . '</div>';
echo '<div class="aiquiz-grade-value">' . round($attempt->grade, 1) . '%</div>';
if ($passed) {
    echo '<div class="aiquiz-grade-status"><i class="fa fa-check"></i> ' . get_string('passed', 'mod_aiquiz') . '</div>';
} else {
    echo '<div class="aiquiz-grade-status"><i class="fa fa-times"></i> ' . get_string('notpassed', 'mod_aiquiz') . '</div>';
}
echo '</div>';

echo '<div class="aiquiz-info-cards">';

$timetaken = $attempt->timefinished - $attempt->timecreated;
echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon"><i class="fa fa-clock-o"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">' . get_string('timetaken', 'mod_aiquiz') . '</div>';
echo '<div class="aiquiz-card-value">' . format_time($timetaken) . '</div>';
echo '</div>';
echo '</div>';

$correctcount = 0;
foreach ($responses as $resp) {
    if ($resp->fraction >= 1) {
        $correctcount++;
    }
}

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon"><i class="fa fa-check-circle"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">' . get_string('correct', 'mod_aiquiz') . '</div>';
echo '<div class="aiquiz-card-value">' . $correctcount . ' / ' . count($questions) . '</div>';
echo '</div>';
echo '</div>';

echo '</div>';

$qnum = 0;
foreach ($questions as $question) {
    $qnum++;
    $answers = $DB->get_records('aiquiz_answers', ['questionid' => $question->id], 'sortorder ASC');

    $response = isset($responses[$question->id]) ? $responses[$question->id] : null;
    $selectedanswers = [];
    if ($response && !empty($response->response)) {
        $selectedanswers = json_decode($response->response, true) ?: [];
    }

    $isCorrect = $response && $response->fraction >= 1;
    $isPartial = $response && $response->fraction > 0 && $response->fraction < 1;
    $isIncorrect = !$response || $response->fraction <= 0;

    echo '<div class="aiquiz-question-container">';
    echo '<div class="aiquiz-question-header">';
    echo '<span class="aiquiz-question-number">' . get_string('question', 'mod_aiquiz') . ' ' . $qnum . '</span>';

    if ($isCorrect) {
        echo '<span class="aiquiz-state-passed"><i class="fa fa-check"></i> ' . get_string('correct', 'mod_aiquiz') . '</span>';
    } elseif ($isPartial) {
        echo '<span class="aiquiz-state-inprogress"><i class="fa fa-minus"></i> ' . get_string('partiallycorrect', 'mod_aiquiz') . '</span>';
    } else {
        echo '<span class="aiquiz-state-failed"><i class="fa fa-times"></i> ' . get_string('incorrect', 'mod_aiquiz') . '</span>';
    }

    echo '</div>';

    echo '<div class="aiquiz-question-body">';
    echo '<div class="aiquiz-question-text">' . format_text($question->questiontext, $question->questiontextformat) . '</div>';

    // Handle different question types
    if ($question->qtype === 'matching') {
        // Matching review: show stems with selected and correct matches
        $stems = [];
        $choices = [];
        
        foreach ($answers as $answer) {
            if ($answer->sortorder % 2 == 0) {
                $stems[] = $answer;
                if (empty($choices) && !empty($answer->feedback)) {
                    $feedbackdata = json_decode($answer->feedback, true);
                    if (is_array($feedbackdata) && isset($feedbackdata['choices'])) {
                        $choices = $feedbackdata['choices'];
                    }
                }
            } else {
                $choices[] = strip_tags($answer->answertext);
            }
        }
        
        echo '<div class="aiquiz-matching-container" style="pointer-events: none;">';
        foreach ($stems as $stem) {
            $correctindex = (int)$stem->fraction;
            $correctchoice = isset($choices[$correctindex]) ? $choices[$correctindex] : '';
            $selectedindex = isset($selectedanswers[$stem->id]) ? (int)$selectedanswers[$stem->id] : -1;
            $selectedchoice = ($selectedindex >= 0 && isset($choices[$selectedindex])) ? $choices[$selectedindex] : get_string('notanswered', 'mod_aiquiz');
            $isThisCorrect = ($selectedindex === $correctindex);
            
            $rowclass = $isThisCorrect ? 'aiquiz-matching-row correct' : 'aiquiz-matching-row incorrect';
            echo '<div class="' . $rowclass . '" style="margin-bottom: 12px;">';
            echo '<div class="aiquiz-matching-stem">' . format_text($stem->answertext, FORMAT_HTML) . '</div>';
            echo '<div class="aiquiz-matching-arrow"><i class="fa fa-arrow-right"></i></div>';
            echo '<div style="flex: 1;">';
            
            if ($isThisCorrect) {
                echo '<span style="color: #10b981;"><i class="fa fa-check-circle"></i> ' . s($selectedchoice) . '</span>';
            } else {
                echo '<span style="color: #ef4444; text-decoration: line-through;">' . s($selectedchoice) . '</span>';
                echo '<br><span style="color: #10b981;"><i class="fa fa-check"></i> ' . s($correctchoice) . '</span>';
            }
            
            echo '</div>';
            echo '</div>';
        }
        echo '</div>';
        
    } elseif ($question->qtype === 'ordering') {
        // Ordering review: show submitted order vs correct order
        $correctorder = [];
        foreach ($answers as $answer) {
            $correctorder[$answer->sortorder] = ['id' => $answer->id, 'text' => strip_tags($answer->answertext)];
        }
        ksort($correctorder);
        $correctorder = array_values($correctorder);
        
        $submittedids = is_array($selectedanswers) ? $selectedanswers : [];
        
        echo '<div class="aiquiz-ordering-container" style="pointer-events: none;">';
        echo '<div style="display: flex; gap: 24px;">';
        
        // Show submitted order
        echo '<div style="flex: 1;">';
        echo '<div style="font-weight: 600; margin-bottom: 8px;">' . get_string('youranswer', 'mod_aiquiz') . ':</div>';
        echo '<ol class="aiquiz-ordering-list">';
        $position = 0;
        foreach ($submittedids as $id) {
            $item = null;
            foreach ($correctorder as $co) {
                if ($co['id'] == $id) {
                    $item = $co;
                    break;
                }
            }
            if ($item) {
                $correctpos = array_search($item, $correctorder);
                $isRightPos = ($position === $correctpos);
                $style = $isRightPos ? 'color: #10b981;' : 'color: #ef4444;';
                echo '<li style="' . $style . ' padding: 8px; margin-bottom: 4px;">';
                echo ($isRightPos ? '<i class="fa fa-check"></i> ' : '<i class="fa fa-times"></i> ');
                echo s($item['text']);
                echo '</li>';
            }
            $position++;
        }
        echo '</ol>';
        echo '</div>';
        
        // Show correct order
        echo '<div style="flex: 1;">';
        echo '<div style="font-weight: 600; margin-bottom: 8px;">' . get_string('correctanswer', 'mod_aiquiz') . ':</div>';
        echo '<ol class="aiquiz-ordering-list">';
        foreach ($correctorder as $item) {
            echo '<li style="color: #10b981; padding: 8px; margin-bottom: 4px;">';
            echo s($item['text']);
            echo '</li>';
        }
        echo '</ol>';
        echo '</div>';
        
        echo '</div>';
        echo '</div>';
        
    } else {
        // MCQ, True/False, and other standard types
        echo '<ul class="aiquiz-answers-list">';
        foreach ($answers as $answer) {
            $isSelected = in_array($answer->id, $selectedanswers);
            $isCorrectAnswer = $answer->fraction > 0;
            $hasFeedback = !empty($answer->feedback) && !is_array(json_decode($answer->feedback, true));
            $showAnswerFeedback = ($isSelected || $isCorrectAnswer);

            $labelclass = '';
            if ($isSelected && $isCorrectAnswer) {
                $labelclass = 'correct';
            } elseif ($isSelected && !$isCorrectAnswer) {
                $labelclass = 'incorrect';
            } elseif (!$isSelected && $isCorrectAnswer) {
                $labelclass = 'correct';
            }

            echo '<li class="aiquiz-answer-item">';
            echo '<div class="aiquiz-answer-label ' . $labelclass . '" style="pointer-events: none; flex-direction: column; align-items: stretch;">';
            echo '<div style="display: flex; align-items: flex-start; gap: 16px;">';

            if ($isSelected) {
                if ($isCorrectAnswer) {
                    echo '<i class="fa fa-check-circle" style="color: #10b981; font-size: 20px; margin-top: 2px;"></i>';
                } else {
                    echo '<i class="fa fa-times-circle" style="color: #ef4444; font-size: 20px; margin-top: 2px;"></i>';
                }
            } elseif ($isCorrectAnswer) {
                echo '<i class="fa fa-check-circle" style="color: #10b981; opacity: 0.5; font-size: 20px; margin-top: 2px;"></i>';
            } else {
                echo '<i class="fa fa-circle-o" style="color: #cbd5e1; font-size: 20px; margin-top: 2px;"></i>';
            }

            echo '<span class="aiquiz-answer-text">' . format_text($answer->answertext, $answer->answertextformat) . '</span>';
            echo '</div>';

            if ($aiquiz->showfeedback && $showAnswerFeedback && $hasFeedback) {
                $feedbackClass = $isCorrectAnswer ? 'aiquiz-answer-feedback-correct' : 'aiquiz-answer-feedback-incorrect';
                echo '<div class="aiquiz-answer-feedback ' . $feedbackClass . '">';
                echo '<i class="fa ' . ($isCorrectAnswer ? 'fa-lightbulb-o' : 'fa-info-circle') . '"></i> ';
                echo format_text($answer->feedback, FORMAT_PLAIN);
                echo '</div>';
            }

            echo '</div>';
            echo '</li>';
        }
        echo '</ul>';
    }

    if ($aiquiz->showfeedback && !empty($question->feedback)) {
        $feedbackclass = $isCorrect ? 'aiquiz-feedback-correct' : 'aiquiz-feedback-incorrect';
        echo '<div class="aiquiz-feedback ' . $feedbackclass . '">';
        echo '<strong>' . get_string('feedback', 'mod_aiquiz') . ':</strong> ';
        echo format_text($question->feedback, $question->feedbackformat);
        echo '</div>';
    }

    echo '</div>';
    echo '</div>';
}

echo '<div class="aiquiz-actions" style="margin-top: 24px;">';
echo '<a href="' . new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]) . '" class="btn btn-primary">';
echo '<i class="fa fa-arrow-left"></i> ' . get_string('back') . '</a>';
echo '</div>';

echo '</div>';

echo $OUTPUT->footer();
