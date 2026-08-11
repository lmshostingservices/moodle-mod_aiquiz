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
 * Statistics page for mod_aiquiz.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT);

$cm = get_coursemodule_from_id('aiquiz', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/aiquiz:viewreports', $context);

$PAGE->set_url('/mod/aiquiz/stats.php', ['id' => $cm->id]);
$PAGE->set_title(format_string($aiquiz->name) . ' - ' . get_string('statistics', 'mod_aiquiz'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

$PAGE->requires->css('/mod/aiquiz/styles/tokens.css');
$PAGE->requires->css('/mod/aiquiz/styles/bridge.css');

$questions = $DB->get_records('aiquiz_questions', ['aiquizid' => $aiquiz->id], 'sortorder ASC');

$allattempts = $DB->get_records('aiquiz_attempts', ['aiquizid' => $aiquiz->id]);
$finishedattempts = array_filter($allattempts, function ($a) { return $a->state === 'finished'; });
$inprogressattempts = array_filter($allattempts, function ($a) { return $a->state === 'inprogress'; });

$questionstats = [];

foreach ($questions as $question) {
    $stats = [
        'id' => $question->id,
        'text' => shorten_text(strip_tags($question->questiontext), 60),
        'qtype' => $question->qtype,
        'attempts' => 0,
        'correct' => 0,
        'incorrect' => 0,
        'partial' => 0,
        'facility' => 0,
        'avgtime' => 0,
    ];

    $responsetimes = [];
    foreach ($finishedattempts as $attempt) {
        $response = $DB->get_record('aiquiz_responses', [
            'attemptid' => $attempt->id,
            'questionid' => $question->id,
        ]);

        if ($response) {
            $stats['attempts']++;
            if ($response->fraction >= 1) {
                $stats['correct']++;
            } elseif ($response->fraction > 0) {
                $stats['partial']++;
            } else {
                $stats['incorrect']++;
            }
        }
    }

    if ($stats['attempts'] > 0) {
        $stats['facility'] = round(($stats['correct'] / $stats['attempts']) * 100, 1);
    }

    $questionstats[$question->id] = $stats;
}

echo $OUTPUT->header();

echo '<div class="aiquiz-container">';

echo '<div class="aiquiz-header">';
echo '<h2 class="aiquiz-title">' . get_string('statistics', 'mod_aiquiz') . '</h2>';
echo '<p><a href="' . new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]) . '">&larr; ' . get_string('back') . '</a></p>';
echo '</div>';

$totalattempts = count($finishedattempts);
$inprogresscount = count($inprogressattempts);
$passedcount = 0;
$totalgrade = 0;
$uniquestudents = [];
$grades = [];
$durations = [];

foreach ($finishedattempts as $attempt) {
    $totalgrade += $attempt->grade;
    $grades[] = $attempt->grade;
    if ($attempt->grade >= $aiquiz->passinggrade) {
        $passedcount++;
    }
    $uniquestudents[$attempt->userid] = true;
    
    if ($attempt->timefinished && $attempt->timecreated) {
        $durations[] = $attempt->timefinished - $attempt->timecreated;
    }
}

$avggrade = $totalattempts > 0 ? $totalgrade / $totalattempts : 0;
$passrate = $totalattempts > 0 ? ($passedcount / $totalattempts) * 100 : 0;
$avgduration = !empty($durations) ? array_sum($durations) / count($durations) : 0;

$stddev = 0;
if ($totalattempts > 1) {
    $variance = 0;
    foreach ($grades as $g) {
        $variance += pow($g - $avggrade, 2);
    }
    $stddev = sqrt($variance / ($totalattempts - 1));
}

echo '<div class="aiquiz-info-cards" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">';

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);"><i class="fa fa-users"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">Unique Students</div>';
echo '<div class="aiquiz-card-value">' . count($uniquestudents) . '</div>';
echo '</div>';
echo '</div>';

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon" style="background: linear-gradient(135deg, #10b981, #059669);"><i class="fa fa-check-circle"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">Completed</div>';
echo '<div class="aiquiz-card-value">' . $totalattempts . '</div>';
echo '</div>';
echo '</div>';

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);"><i class="fa fa-spinner"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">In Progress</div>';
echo '<div class="aiquiz-card-value">' . $inprogresscount . '</div>';
echo '</div>';
echo '</div>';

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9);"><i class="fa fa-bar-chart"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">Average Grade</div>';
echo '<div class="aiquiz-card-value">' . round($avggrade, 1) . '%</div>';
echo '</div>';
echo '</div>';

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon" style="background: linear-gradient(135deg, #ec4899, #be185d);"><i class="fa fa-trophy"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">Pass Rate</div>';
echo '<div class="aiquiz-card-value">' . round($passrate, 1) . '%</div>';
echo '</div>';
echo '</div>';

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon" style="background: linear-gradient(135deg, #64748b, #475569);"><i class="fa fa-clock-o"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">Avg Duration</div>';
echo '<div class="aiquiz-card-value" style="font-family: var(--aiquiz-font-mono);">' . gmdate('i:s', $avgduration) . '</div>';
echo '</div>';
echo '</div>';

echo '</div>';

if ($totalattempts > 0) {
    echo '<div class="aiquiz-stats-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 32px 0;">';
    
    echo '<div class="aiquiz-question-container">';
    echo '<div class="aiquiz-question-header">';
    echo '<span class="aiquiz-question-number-badge" style="background: var(--aiquiz-primary);">Grade Distribution</span>';
    echo '</div>';
    echo '<div class="aiquiz-question-body" style="padding: 24px;">';
    
    $ranges = ['0-49%' => 0, '50-64%' => 0, '65-74%' => 0, '75-84%' => 0, '85-100%' => 0];
    foreach ($grades as $g) {
        if ($g >= 85) $ranges['85-100%']++;
        elseif ($g >= 75) $ranges['75-84%']++;
        elseif ($g >= 65) $ranges['65-74%']++;
        elseif ($g >= 50) $ranges['50-64%']++;
        else $ranges['0-49%']++;
    }
    
    $maxcount = max($ranges) ?: 1;
    foreach ($ranges as $label => $count) {
        $pct = ($count / $maxcount) * 100;
        $color = $label === '0-49%' ? '#ef4444' : ($label === '50-64%' ? '#f59e0b' : '#10b981');
        echo '<div style="margin-bottom: 12px;">';
        echo '<div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">';
        echo '<span style="color: var(--aiquiz-gray-600); font-weight: 500;">' . $label . '</span>';
        echo '<span style="font-family: var(--aiquiz-font-mono); color: var(--aiquiz-gray-800);">' . $count . '</span>';
        echo '</div>';
        echo '<div style="height: 8px; background: var(--aiquiz-gray-100); border-radius: 4px; overflow: hidden;">';
        echo '<div style="width: ' . $pct . '%; height: 100%; background: ' . $color . '; border-radius: 4px; transition: width 0.5s ease;"></div>';
        echo '</div>';
        echo '</div>';
    }
    echo '</div>';
    echo '</div>';
    
    echo '<div class="aiquiz-question-container">';
    echo '<div class="aiquiz-question-header">';
    echo '<span class="aiquiz-question-number-badge" style="background: var(--aiquiz-success);">RTO Compliance Summary</span>';
    echo '</div>';
    echo '<div class="aiquiz-question-body" style="padding: 24px;">';
    
    echo '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
    
    echo '<div style="padding: 16px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: var(--aiquiz-radius-md); border: 1px solid #86efac;">';
    echo '<div style="font-size: 28px; font-weight: 700; font-family: var(--aiquiz-font-mono); color: #16a34a;">' . $passedcount . '</div>';
    echo '<div style="font-size: 13px; color: #166534; font-weight: 500;">Competent (C)</div>';
    echo '</div>';
    
    $nyccount = $totalattempts - $passedcount;
    echo '<div style="padding: 16px; background: linear-gradient(135deg, #fef2f2, #fee2e2); border-radius: var(--aiquiz-radius-md); border: 1px solid #fca5a5;">';
    echo '<div style="font-size: 28px; font-weight: 700; font-family: var(--aiquiz-font-mono); color: #dc2626;">' . $nyccount . '</div>';
    echo '<div style="font-size: 13px; color: #991b1b; font-weight: 500;">Not Yet Competent (NYC)</div>';
    echo '</div>';
    
    echo '</div>';
    
    echo '<div style="margin-top: 20px; padding: 16px; background: var(--aiquiz-gray-50); border-radius: var(--aiquiz-radius-md);">';
    echo '<div style="font-size: 13px; color: var(--aiquiz-gray-500); margin-bottom: 8px;">Competency Rate</div>';
    echo '<div style="display: flex; align-items: center; gap: 12px;">';
    echo '<div style="flex: 1; height: 12px; background: var(--aiquiz-gray-100); border-radius: 6px; overflow: hidden;">';
    echo '<div style="width: ' . $passrate . '%; height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 6px;"></div>';
    echo '</div>';
    echo '<span style="font-family: var(--aiquiz-font-mono); font-weight: 700; font-size: 16px; color: var(--aiquiz-gray-800);">' . round($passrate, 1) . '%</span>';
    echo '</div>';
    echo '</div>';
    
    echo '<div style="margin-top: 16px; font-size: 12px; color: var(--aiquiz-gray-400);">';
    echo 'Passing grade: ' . $aiquiz->passinggrade . '% | Standard Deviation: ' . round($stddev, 2) . '%';
    echo '</div>';
    
    echo '</div>';
    echo '</div>';
    
    echo '</div>';
}

echo '<h3 style="margin: 32px 0 16px; font-size: 18px; font-weight: 600;">' . get_string('questionstats', 'mod_aiquiz') . '</h3>';

if (empty($questionstats)) {
    echo '<div class="aiquiz-empty-state">';
    echo '<div class="aiquiz-empty-state-icon"><i class="fa fa-bar-chart"></i></div>';
    echo '<h3 class="aiquiz-empty-state-title">No Statistics Yet</h3>';
    echo '<p class="aiquiz-empty-state-text">Question statistics will appear here once students complete attempts.</p>';
    echo '</div>';
} else {
    echo '<div class="aiquiz-attempts-section">';
    echo '<table class="aiquiz-attempts-table">';
    echo '<thead><tr>';
    echo '<th style="width: 50px;">#</th>';
    echo '<th>' . get_string('question', 'mod_aiquiz') . '</th>';
    echo '<th style="width: 80px;">Type</th>';
    echo '<th style="width: 80px;">Attempts</th>';
    echo '<th style="width: 80px;">Correct</th>';
    echo '<th style="width: 80px;">Partial</th>';
    echo '<th style="width: 80px;">Incorrect</th>';
    echo '<th style="width: 100px;">' . get_string('facilityindex', 'mod_aiquiz') . '</th>';
    echo '</tr></thead>';
    echo '<tbody>';

    $num = 0;
    foreach ($questionstats as $stats) {
        $num++;

        $facilityclass = '';
        $facilitybg = '';
        if ($stats['facility'] >= 70) {
            $facilityclass = 'color: #059669;';
            $facilitybg = 'background: #d1fae5;';
        } elseif ($stats['facility'] >= 40) {
            $facilityclass = 'color: #d97706;';
            $facilitybg = 'background: #fef3c7;';
        } else {
            $facilityclass = 'color: #dc2626;';
            $facilitybg = 'background: #fee2e2;';
        }
        
        $qtypelabel = ucfirst(str_replace(['selectmissingwords', 'gapselect', 'ddwtos'], ['Gap Fill', 'Gap Fill', 'Drag & Drop'], $stats['qtype']));

        echo '<tr>';
        echo '<td><span style="font-family: var(--aiquiz-font-mono);">' . $num . '</span></td>';
        echo '<td>' . $stats['text'] . '</td>';
        echo '<td><span style="font-size: 11px; padding: 4px 8px; background: var(--aiquiz-gray-100); border-radius: 4px;">' . $qtypelabel . '</span></td>';
        echo '<td><span style="font-family: var(--aiquiz-font-mono);">' . $stats['attempts'] . '</span></td>';
        echo '<td><span style="color: #059669; font-family: var(--aiquiz-font-mono);">' . $stats['correct'] . '</span></td>';
        echo '<td><span style="color: #d97706; font-family: var(--aiquiz-font-mono);">' . $stats['partial'] . '</span></td>';
        echo '<td><span style="color: #dc2626; font-family: var(--aiquiz-font-mono);">' . $stats['incorrect'] . '</span></td>';
        echo '<td><span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-family: var(--aiquiz-font-mono); ' . $facilityclass . ' ' . $facilitybg . '">' . $stats['facility'] . '%</span></td>';
        echo '</tr>';
    }

    echo '</tbody>';
    echo '</table>';
    echo '</div>';

    echo '<div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: var(--aiquiz-radius-lg); font-size: 13px; color: var(--aiquiz-gray-600);">';
    echo '<div style="font-weight: 600; margin-bottom: 8px; color: var(--aiquiz-gray-700);">Understanding the Facility Index</div>';
    echo '<p style="margin: 0; line-height: 1.6;">';
    echo 'The <strong>Facility Index</strong> indicates question difficulty based on the percentage of correct responses. ';
    echo '<span style="display: inline-flex; align-items: center; gap: 4px; margin: 0 8px;"><span style="width: 12px; height: 12px; background: #d1fae5; border-radius: 3px;"></span> <span style="color: #059669; font-weight: 500;">70%+ Easy</span></span>';
    echo '<span style="display: inline-flex; align-items: center; gap: 4px; margin: 0 8px;"><span style="width: 12px; height: 12px; background: #fef3c7; border-radius: 3px;"></span> <span style="color: #d97706; font-weight: 500;">40-70% Moderate</span></span>';
    echo '<span style="display: inline-flex; align-items: center; gap: 4px; margin: 0 8px;"><span style="width: 12px; height: 12px; background: #fee2e2; border-radius: 3px;"></span> <span style="color: #dc2626; font-weight: 500;">&lt;40% Difficult</span></span>';
    echo '</p>';
    echo '</div>';
}

echo '</div>';

echo $OUTPUT->footer();
