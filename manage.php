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
 * Question management page for mod_aiquiz.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT);
$action = optional_param('action', '', PARAM_ALPHA);
$questionid = optional_param('questionid', 0, PARAM_INT);

$cm = get_coursemodule_from_id('aiquiz', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/aiquiz:manage', $context);

$PAGE->set_url('/mod/aiquiz/manage.php', ['id' => $cm->id]);
$PAGE->set_title(format_string($aiquiz->name) . ' - ' . get_string('managequestions', 'mod_aiquiz'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

$PAGE->requires->css('/mod/aiquiz/styles/tokens.css');
$PAGE->requires->css('/mod/aiquiz/styles/bridge.css');

if ($action === 'delete' && $questionid) {
    require_sesskey();

    $DB->delete_records('aiquiz_answers', ['questionid' => $questionid]);
    $DB->delete_records('aiquiz_questions', ['id' => $questionid, 'aiquizid' => $aiquiz->id]);

    redirect(new moodle_url('/mod/aiquiz/manage.php', ['id' => $cm->id]),
        get_string('questiondeleted', 'mod_aiquiz'), null, \core\output\notification::NOTIFY_SUCCESS);
}

if ($action === 'moveup' && $questionid) {
    require_sesskey();

    $question = $DB->get_record('aiquiz_questions', ['id' => $questionid, 'aiquizid' => $aiquiz->id], '*', MUST_EXIST);
    $prevquestion = $DB->get_record_sql(
        "SELECT * FROM {aiquiz_questions} WHERE aiquizid = ? AND sortorder < ? ORDER BY sortorder DESC LIMIT 1",
        [$aiquiz->id, $question->sortorder]
    );

    if ($prevquestion) {
        $tempsort = $question->sortorder;
        $question->sortorder = $prevquestion->sortorder;
        $prevquestion->sortorder = $tempsort;
        $DB->update_record('aiquiz_questions', $question);
        $DB->update_record('aiquiz_questions', $prevquestion);
    }

    redirect(new moodle_url('/mod/aiquiz/manage.php', ['id' => $cm->id]));
}

if ($action === 'movedown' && $questionid) {
    require_sesskey();

    $question = $DB->get_record('aiquiz_questions', ['id' => $questionid, 'aiquizid' => $aiquiz->id], '*', MUST_EXIST);
    $nextquestion = $DB->get_record_sql(
        "SELECT * FROM {aiquiz_questions} WHERE aiquizid = ? AND sortorder > ? ORDER BY sortorder ASC LIMIT 1",
        [$aiquiz->id, $question->sortorder]
    );

    if ($nextquestion) {
        $tempsort = $question->sortorder;
        $question->sortorder = $nextquestion->sortorder;
        $nextquestion->sortorder = $tempsort;
        $DB->update_record('aiquiz_questions', $question);
        $DB->update_record('aiquiz_questions', $nextquestion);
    }

    redirect(new moodle_url('/mod/aiquiz/manage.php', ['id' => $cm->id]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('savequestion', '', PARAM_TEXT) !== '') {
    require_sesskey();

    $qid = optional_param('qid', 0, PARAM_INT);
    $qtype = required_param('qtype', PARAM_ALPHA);
    $questiontext = required_param('questiontext', PARAM_RAW);
    $feedback = optional_param('feedback', '', PARAM_RAW);
    $defaultmark = optional_param('defaultmark', 1, PARAM_FLOAT);

    if ($qid) {
        $question = $DB->get_record('aiquiz_questions', ['id' => $qid, 'aiquizid' => $aiquiz->id], '*', MUST_EXIST);
        $question->qtype = $qtype;
        $question->questiontext = $questiontext;
        $question->feedback = $feedback;
        $question->defaultmark = $defaultmark;
        $question->timemodified = time();
        $DB->update_record('aiquiz_questions', $question);
    } else {
        $maxsort = $DB->get_field_sql("SELECT MAX(sortorder) FROM {aiquiz_questions} WHERE aiquizid = ?", [$aiquiz->id]);

        $question = new stdClass();
        $question->aiquizid = $aiquiz->id;
        $question->qtype = $qtype;
        $question->questiontext = $questiontext;
        $question->feedback = $feedback;
        $question->defaultmark = $defaultmark;
        $question->sortorder = ($maxsort ?? 0) + 1;
        $question->timecreated = time();
        $question->timemodified = time();
        $qid = $DB->insert_record('aiquiz_questions', $question);
    }

    $DB->delete_records('aiquiz_answers', ['questionid' => $qid]);

    $answers = optional_param_array('answers', [], PARAM_TEXT);
    $fractions = optional_param_array('fractions', [], PARAM_FLOAT);
    $answerfeedbacks = optional_param_array('answerfeedback', [], PARAM_TEXT);

    $sortorder = 0;
    foreach ($answers as $i => $answertext) {
        if (trim($answertext) === '') {
            continue;
        }

        $answer = new stdClass();
        $answer->questionid = $qid;
        $answer->answertext = $answertext;
        $answer->fraction = isset($fractions[$i]) ? (float)$fractions[$i] : 0;
        $answer->feedback = isset($answerfeedbacks[$i]) ? $answerfeedbacks[$i] : '';
        $answer->sortorder = $sortorder++;
        $DB->insert_record('aiquiz_answers', $answer);
    }

    redirect(new moodle_url('/mod/aiquiz/manage.php', ['id' => $cm->id]),
        get_string('questionsaved', 'mod_aiquiz'), null, \core\output\notification::NOTIFY_SUCCESS);
}

$questions = $DB->get_records('aiquiz_questions', ['aiquizid' => $aiquiz->id], 'sortorder ASC');

echo $OUTPUT->header();

echo '<div class="aiquiz-container">';

echo '<div class="aiquiz-header">';
echo '<h2 class="aiquiz-title">' . get_string('managequestions', 'mod_aiquiz') . '</h2>';
echo '<p><a href="' . new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]) . '">&larr; ' . get_string('back') . '</a></p>';
echo '</div>';

echo '<div class="aiquiz-actions" style="margin-bottom: 24px; display: flex; gap: 12px; flex-wrap: wrap;">';
echo '<a href="' . new moodle_url('/mod/aiquiz/generate.php', ['id' => $cm->id]) . '" class="btn" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; display: inline-flex; align-items: center; gap: 8px;">';
echo '<i class="fa fa-magic"></i> ' . get_string('generatequestions', 'mod_aiquiz') . '</a>';
echo '<button type="button" class="btn btn-primary" onclick="document.getElementById(\'add-question-form\').style.display = \'block\'; this.style.display = \'none\';">';
echo '<i class="fa fa-plus"></i> ' . get_string('addquestion', 'mod_aiquiz') . '</button>';
echo '</div>';

echo '<div id="add-question-form" style="display: none; margin-bottom: 24px;">';
echo '<div class="aiquiz-question-container">';
echo '<div class="aiquiz-question-header">';
echo '<span class="aiquiz-question-number">' . get_string('addquestion', 'mod_aiquiz') . '</span>';
echo '</div>';
echo '<div class="aiquiz-question-body">';

echo '<form method="post">';
echo '<input type="hidden" name="sesskey" value="' . sesskey() . '">';
echo '<input type="hidden" name="qid" value="0">';

echo '<div style="margin-bottom: 16px;">';
echo '<label style="display: block; margin-bottom: 4px; font-weight: 500;">' . get_string('questiontype', 'mod_aiquiz') . '</label>';
echo '<select name="qtype" class="form-control" style="max-width: 300px;">';
echo '<option value="mcq">' . get_string('mcq', 'mod_aiquiz') . '</option>';
echo '<option value="truefalse">' . get_string('truefalse', 'mod_aiquiz') . '</option>';
echo '</select>';
echo '</div>';

echo '<div style="margin-bottom: 16px;">';
echo '<label style="display: block; margin-bottom: 4px; font-weight: 500;">' . get_string('questiontext', 'mod_aiquiz') . '</label>';
echo '<textarea name="questiontext" class="form-control" rows="3" required></textarea>';
echo '</div>';

echo '<div style="margin-bottom: 16px;">';
echo '<label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 15px;">' . get_string('answers', 'mod_aiquiz') . '</label>';
echo '<p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">' . get_string('answerfeedback_help', 'mod_aiquiz') . '</p>';
echo '<div id="answers-container">';
for ($i = 0; $i < 4; $i++) {
    echo '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px;">';
    echo '<div style="display: flex; gap: 12px; margin-bottom: 10px; align-items: center;">';
    echo '<span style="font-weight: 600; color: #3b82f6; min-width: 24px;">' . chr(65 + $i) . '.</span>';
    echo '<input type="text" name="answers[]" class="form-control" placeholder="' . get_string('answertext', 'mod_aiquiz') . '" style="flex: 1;">';
    echo '<select name="fractions[]" class="form-control" style="width: 130px;">';
    echo '<option value="0">' . get_string('incorrect', 'mod_aiquiz') . '</option>';
    echo '<option value="1"' . ($i === 0 ? ' selected' : '') . '>' . get_string('correct', 'mod_aiquiz') . '</option>';
    echo '</select>';
    echo '</div>';
    echo '<div style="margin-left: 36px;">';
    echo '<input type="text" name="answerfeedback[]" class="form-control" placeholder="' . get_string('feedbackforanswer', 'mod_aiquiz') . '" style="font-size: 13px;">';
    echo '</div>';
    echo '</div>';
}
echo '</div>';
echo '<button type="button" class="btn btn-secondary btn-sm" onclick="addAnswerField()" style="margin-top: 8px;"><i class="fa fa-plus"></i> ' . get_string('addanswer', 'mod_aiquiz') . '</button>';
echo '</div>';

echo '<script>
var answerCount = 4;
function addAnswerField() {
    answerCount++;
    var container = document.getElementById("answers-container");
    var letter = String.fromCharCode(64 + answerCount);
    var div = document.createElement("div");
    div.style = "background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px;";
    div.innerHTML = \'<div style="display: flex; gap: 12px; margin-bottom: 10px; align-items: center;">\' +
        \'<span style="font-weight: 600; color: #3b82f6; min-width: 24px;">\' + letter + \'.</span>\' +
        \'<input type="text" name="answers[]" class="form-control" placeholder="' . get_string('answertext', 'mod_aiquiz') . '" style="flex: 1;">\' +
        \'<select name="fractions[]" class="form-control" style="width: 130px;"><option value="0">' . get_string('incorrect', 'mod_aiquiz') . '</option><option value="1">' . get_string('correct', 'mod_aiquiz') . '</option></select>\' +
        \'</div>\' +
        \'<div style="margin-left: 36px;"><input type="text" name="answerfeedback[]" class="form-control" placeholder="' . get_string('feedbackforanswer', 'mod_aiquiz') . '" style="font-size: 13px;"></div>\';
    container.appendChild(div);
}
</script>';

echo '<div style="margin-bottom: 16px;">';
echo '<label style="display: block; margin-bottom: 4px; font-weight: 500;">' . get_string('feedback', 'mod_aiquiz') . '</label>';
echo '<textarea name="feedback" class="form-control" rows="2"></textarea>';
echo '</div>';

echo '<div style="margin-bottom: 16px;">';
echo '<label style="display: block; margin-bottom: 4px; font-weight: 500;">' . get_string('defaultmark', 'mod_aiquiz') . '</label>';
echo '<input type="number" name="defaultmark" class="form-control" value="1" min="0" step="0.5" style="max-width: 100px;">';
echo '</div>';

echo '<div style="display: flex; gap: 12px;">';
echo '<button type="submit" name="savequestion" value="1" class="btn btn-primary">' . get_string('save') . '</button>';
echo '<button type="button" class="btn btn-secondary" onclick="document.getElementById(\'add-question-form\').style.display = \'none\'; document.querySelector(\'.aiquiz-actions .btn-primary\').style.display = \'inline-block\';">' . get_string('cancel') . '</button>';
echo '</div>';

echo '</form>';

echo '</div>';
echo '</div>';
echo '</div>';

if (empty($questions)) {
    echo '<div class="alert alert-info">' . get_string('noquestions', 'mod_aiquiz') . '</div>';
} else {
    // Question type display names mapping
    $qtypenames = [
        'multichoice' => get_string('qtype_multichoice', 'mod_aiquiz'),
        'truefalse' => get_string('qtype_truefalse', 'mod_aiquiz'),
        'matching' => get_string('qtype_matching', 'mod_aiquiz'),
        'gapfill' => get_string('qtype_gapfill', 'mod_aiquiz'),
        'dragdrop' => get_string('qtype_dragdrop', 'mod_aiquiz'),
        'ordering' => get_string('qtype_ordering', 'mod_aiquiz'),
        'shortanswer' => get_string('qtype_shortanswer', 'mod_aiquiz'),
        'numerical' => get_string('qtype_numerical', 'mod_aiquiz'),
    ];
    
    echo '<div class="aiquiz-attempts-section">';
    echo '<table class="aiquiz-attempts-table">';
    echo '<thead><tr>';
    echo '<th style="width: 40px;"></th>';
    echo '<th style="width: 40px;">#</th>';
    echo '<th>' . get_string('question', 'mod_aiquiz') . '</th>';
    echo '<th style="width: 120px;">' . get_string('questiontype', 'mod_aiquiz') . '</th>';
    echo '<th style="width: 60px;">' . get_string('mark', 'mod_aiquiz') . '</th>';
    echo '<th style="width: 100px;">' . get_string('actions', 'mod_aiquiz') . '</th>';
    echo '</tr></thead>';
    echo '<tbody>';

    $num = 0;
    $questionarray = array_values($questions);
    foreach ($questionarray as $index => $question) {
        $num++;
        $qtypename = $qtypenames[$question->qtype] ?? ucfirst($question->qtype);
        $mark = (int)$question->defaultmark;
        
        echo '<tr>';
        echo '<td style="cursor: grab; text-align: center; color: #9ca3af;"><i class="fa fa-grip-vertical" style="font-size: 14px;"></i></td>';
        echo '<td>' . $num . '</td>';
        echo '<td>' . shorten_text(strip_tags($question->questiontext), 80) . '</td>';
        echo '<td>' . $qtypename . '</td>';
        echo '<td>' . $mark . '</td>';
        echo '<td style="white-space: nowrap;">';

        if ($index > 0) {
            echo '<a href="' . new moodle_url('/mod/aiquiz/manage.php', [
                'id' => $cm->id,
                'action' => 'moveup',
                'questionid' => $question->id,
                'sesskey' => sesskey(),
            ]) . '" title="Move up" style="margin-right: 8px;"><i class="fa fa-arrow-up"></i></a>';
        }

        if ($index < count($questionarray) - 1) {
            echo '<a href="' . new moodle_url('/mod/aiquiz/manage.php', [
                'id' => $cm->id,
                'action' => 'movedown',
                'questionid' => $question->id,
                'sesskey' => sesskey(),
            ]) . '" title="Move down" style="margin-right: 8px;"><i class="fa fa-arrow-down"></i></a>';
        }

        echo '<a href="' . new moodle_url('/mod/aiquiz/manage.php', [
            'id' => $cm->id,
            'action' => 'delete',
            'questionid' => $question->id,
            'sesskey' => sesskey(),
        ]) . '" onclick="return confirm(\'Are you sure you want to delete this question?\');" title="Delete" style="color: #ef4444;"><i class="fa fa-trash"></i></a>';

        echo '</td>';
        echo '</tr>';
    }

    echo '</tbody>';
    echo '</table>';
    echo '</div>';
}

echo '</div>';

echo $OUTPUT->footer();
