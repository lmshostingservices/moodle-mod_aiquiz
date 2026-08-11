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
 * Unified view page for mod_aiquiz with integrated tabs.
 * All functionality in one page - no extra navigation.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Load central config if available (optional dependency for API key fallback).
$aiconfiglib = $CFG->dirroot . '/local/aiconfig/lib.php';
if (file_exists($aiconfiglib)) {
    require_once($aiconfiglib);
}

$id = required_param('id', PARAM_INT);
$tab = optional_param('tab', 'quiz', PARAM_ALPHA);

$cm = get_coursemodule_from_id('aiquiz', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

$event = \mod_aiquiz\event\course_module_viewed::create([
    'objectid' => $aiquiz->id,
    'context' => $context,
]);
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('aiquiz', $aiquiz);
$event->trigger();

$PAGE->set_url('/mod/aiquiz/view.php', ['id' => $cm->id, 'tab' => $tab]);
$PAGE->set_title(format_string($aiquiz->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

$PAGE->requires->css('/mod/aiquiz/styles/tokens.css');
$PAGE->requires->css('/mod/aiquiz/styles/bridge.css');
$PAGE->requires->css('/mod/aiquiz/styles/authoring.css');

$canmanage = has_capability('mod/aiquiz:manage', $context);
$canattempt = has_capability('mod/aiquiz:attempt', $context);

$questioncount = $DB->count_records('aiquiz_questions', ['aiquizid' => $aiquiz->id]);

// If no questions and user can manage, default to generate tab
if ($questioncount == 0 && $canmanage && $tab === 'quiz') {
    $tab = 'generate';
}

// Get API configuration for wizard (uses central config with fallback)
$siteid = local_aiconfig_get_siteid('mod_aiquiz');
$apikey = local_aiconfig_get_apikey('mod_aiquiz');
$language = get_config('mod_aiquiz', 'language') ?: 'en-AU';
$hasApiConfig = !empty($siteid) && !empty($apikey);

echo $OUTPUT->header();

// Build tabs
$baseurl = new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]);

echo '<div class="aiquiz-unified-container">';

// Tab navigation
echo '<ul class="nav nav-tabs aiquiz-tabs" role="tablist">';

echo '<li class="nav-item">';
echo '<a class="nav-link ' . ($tab === 'quiz' ? 'active' : '') . '" href="' . $baseurl->out(true, ['tab' => 'quiz']) . '" role="tab">';
echo '<i class="fa fa-bolt"></i> AI Quiz</a></li>';

if ($canmanage) {
    echo '<li class="nav-item">';
    echo '<a class="nav-link ' . ($tab === 'generate' ? 'active' : '') . '" href="' . $baseurl->out(true, ['tab' => 'generate']) . '" role="tab">';
    echo '<i class="fa fa-magic"></i> Generate Questions</a></li>';
    
    echo '<li class="nav-item">';
    echo '<a class="nav-link ' . ($tab === 'manage' ? 'active' : '') . '" href="' . $baseurl->out(true, ['tab' => 'manage']) . '" role="tab">';
    echo '<i class="fa fa-list"></i> Manage Questions</a></li>';
    
    echo '<li class="nav-item">';
    echo '<a class="nav-link ' . ($tab === 'attempts' ? 'active' : '') . '" href="' . $baseurl->out(true, ['tab' => 'attempts']) . '" role="tab">';
    echo '<i class="fa fa-users"></i> View Attempts</a></li>';
    
    echo '<li class="nav-item">';
    echo '<a class="nav-link ' . ($tab === 'stats' ? 'active' : '') . '" href="' . $baseurl->out(true, ['tab' => 'stats']) . '" role="tab">';
    echo '<i class="fa fa-chart-bar"></i> Statistics</a></li>';
}

echo '</ul>';

// Tab content
echo '<div class="tab-content aiquiz-tab-content">';

// === QUIZ TAB (Student view / overview) ===
if ($tab === 'quiz') {
    $userattempts = $DB->get_records('aiquiz_attempts', [
        'aiquizid' => $aiquiz->id,
        'userid' => $USER->id,
    ], 'timecreated DESC');
    
    $attemptsremaining = null;
    if ($aiquiz->attempts > 0) {
        $finishedattempts = 0;
        foreach ($userattempts as $attempt) {
            if ($attempt->state === 'finished') {
                $finishedattempts++;
            }
        }
        $attemptsremaining = $aiquiz->attempts - $finishedattempts;
    }
    
    $inprogress = null;
    foreach ($userattempts as $attempt) {
        if ($attempt->state === 'inprogress') {
            $inprogress = $attempt;
            break;
        }
    }
    
    $bestgrade = null;
    foreach ($userattempts as $attempt) {
        if ($attempt->state === 'finished') {
            if ($bestgrade === null || $attempt->grade > $bestgrade) {
                $bestgrade = $attempt->grade;
            }
        }
    }
    
    $now = time();
    $quizopen = empty($aiquiz->timeopen) || $now >= $aiquiz->timeopen;
    $quizclosed = !empty($aiquiz->timeclose) && $now > $aiquiz->timeclose;
    
    echo '<div class="aiquiz-overview">';
    
    // Header with title
    echo '<div class="aiquiz-header mb-4">';
    echo '<h2>' . format_string($aiquiz->name) . '</h2>';
    if (!empty($aiquiz->intro)) {
        echo '<div class="aiquiz-intro text-muted">' . format_module_intro('aiquiz', $aiquiz, $cm->id) . '</div>';
    }
    echo '</div>';
    
    // Info cards
    echo '<div class="aiquiz-info-cards d-flex gap-3 mb-4 flex-wrap">';
    
    echo '<div class="aiquiz-card p-3 border rounded">';
    echo '<div class="small text-muted">Questions</div>';
    echo '<div class="h4 mb-0">' . $questioncount . '</div>';
    echo '</div>';
    
    if ($aiquiz->timelimit > 0) {
        echo '<div class="aiquiz-card p-3 border rounded">';
        echo '<div class="small text-muted">Time Limit</div>';
        echo '<div class="h4 mb-0">' . format_time($aiquiz->timelimit) . '</div>';
        echo '</div>';
    }
    
    echo '<div class="aiquiz-card p-3 border rounded">';
    echo '<div class="small text-muted">Passing Grade</div>';
    echo '<div class="h4 mb-0">' . $aiquiz->passinggrade . '%</div>';
    echo '</div>';
    
    if ($aiquiz->attempts > 0) {
        echo '<div class="aiquiz-card p-3 border rounded">';
        echo '<div class="small text-muted">Attempts Allowed</div>';
        echo '<div class="h4 mb-0">' . $aiquiz->attempts . '</div>';
        echo '</div>';
    }
    
    echo '</div>';
    
    // Best grade
    if ($bestgrade !== null) {
        $passed = $bestgrade >= $aiquiz->passinggrade;
        echo '<div class="alert ' . ($passed ? 'alert-success' : 'alert-warning') . ' mb-4">';
        echo '<strong>Your best grade:</strong> ' . round($bestgrade, 1) . '% ';
        echo $passed ? '(Passed)' : '(Not yet passed)';
        echo '</div>';
    }
    
    // Previous attempts table
    if (!empty($userattempts)) {
        echo '<div class="mb-4">';
        echo '<h4>Your Attempts</h4>';
        echo '<table class="table table-striped">';
        echo '<thead><tr><th>#</th><th>State</th><th>Grade</th><th>Date</th><th>Actions</th></tr></thead>';
        echo '<tbody>';
        $num = count($userattempts);
        foreach ($userattempts as $attempt) {
            echo '<tr>';
            echo '<td>' . $num . '</td>';
            echo '<td>' . ($attempt->state === 'inprogress' ? 'In Progress' : 'Finished') . '</td>';
            echo '<td>' . ($attempt->state === 'finished' ? round($attempt->grade, 1) . '%' : '-') . '</td>';
            echo '<td>' . userdate($attempt->timecreated) . '</td>';
            echo '<td>';
            if ($attempt->state === 'inprogress') {
                echo '<a href="' . new moodle_url('/mod/aiquiz/attempt_js.php', ['id' => $cm->id, 'attempt' => $attempt->id]) . '" class="btn btn-sm btn-primary">Continue</a>';
            } else if ($aiquiz->showresults) {
                echo '<a href="' . new moodle_url('/mod/aiquiz/review.php', ['id' => $cm->id, 'attempt' => $attempt->id]) . '" class="btn btn-sm btn-secondary">Review</a>';
            }
            echo '</td></tr>';
            $num--;
        }
        echo '</tbody></table>';
        echo '</div>';
    }
    
    // Start/Continue button
    if ($canattempt && $questioncount > 0) {
        if ($quizclosed) {
            echo '<div class="alert alert-warning">This quiz is now closed.</div>';
        } else if (!$quizopen) {
            echo '<div class="alert alert-info">This quiz opens on ' . userdate($aiquiz->timeopen) . '</div>';
        } else if ($attemptsremaining !== null && $attemptsremaining <= 0) {
            echo '<div class="alert alert-warning">No more attempts allowed.</div>';
        } else {
            if ($inprogress) {
                echo '<a href="' . new moodle_url('/mod/aiquiz/attempt_js.php', ['id' => $cm->id, 'attempt' => $inprogress->id]) . '" class="btn btn-primary btn-lg">';
                echo '<i class="fa fa-play mr-2"></i> Continue Attempt</a>';
            } else {
                echo '<a href="' . new moodle_url('/mod/aiquiz/attempt_js.php', ['id' => $cm->id]) . '" class="btn btn-primary btn-lg">';
                echo '<i class="fa fa-play mr-2"></i> Start Attempt</a>';
            }
            if ($attemptsremaining !== null) {
                echo '<p class="text-muted mt-2">' . $attemptsremaining . ' attempts remaining</p>';
            }
        }
    } else if ($questioncount === 0) {
        echo '<div class="alert alert-info">No questions have been added yet.</div>';
    }
    
    echo '</div>';
}

// === GENERATE TAB (7-Screen Wizard) ===
if ($tab === 'generate' && $canmanage) {
    echo '<div id="aiq-authoring-container" class="aiq-authoring-container" data-testid="authoring-wizard-container">';
    
    if (!$hasApiConfig) {
        echo '<div class="aiq-config-warning p-5 text-center">';
        echo '<div class="mb-3"><i class="fa fa-exclamation-triangle fa-3x text-warning"></i></div>';
        echo '<h3>Configuration Required</h3>';
        echo '<p class="text-muted">Please configure your Site ID and API Key in the plugin settings.</p>';
        echo '<a href="' . new moodle_url('/admin/settings.php', ['section' => 'modsettingaiquiz']) . '" class="btn btn-primary">Configure Settings</a>';
        echo '</div>';
    } else {
        echo '<div class="aiq-loading-container text-center p-5" id="aiq-loading-container">';
        echo '<div class="spinner-border text-primary mb-3" role="status"><span class="sr-only">Loading...</span></div>';
        echo '<p class="text-muted">Loading AI Quiz Maker...</p>';
        echo '</div>';
    }
    
    echo '</div>';
    
    if ($hasApiConfig) {
        $PAGE->requires->js_call_amd('mod_aiquiz/authoring/wizard', 'init', [[
            'containerId' => 'aiq-authoring-container',
            'quizId' => $aiquiz->id,
            'cmid' => $cm->id,
            'quizName' => format_string($aiquiz->name),
            'siteid' => $siteid,
            'language' => $language,
            'manageUrl' => $baseurl->out(true, ['tab' => 'manage']),
            'questionTypes' => [
                'multichoice' => ['name' => 'Multiple Choice', 'icon' => 'list-check', 'desc' => 'Select one correct answer from 4 options'],
                'truefalse' => ['name' => 'True/False', 'icon' => 'toggle', 'desc' => 'Statement-based true or false'],
                'matching' => ['name' => 'Matching', 'icon' => 'arrows', 'desc' => 'Match items from two columns'],
                'shortanswer' => ['name' => 'Short Answer', 'icon' => 'text', 'desc' => 'Type a word or phrase'],
                'numerical' => ['name' => 'Numerical', 'icon' => 'calculator', 'desc' => 'Number with tolerance'],
                'ordering' => ['name' => 'Ordering', 'icon' => 'sort', 'desc' => 'Arrange in sequence'],
                'dragdrop' => ['name' => 'Category Sort', 'icon' => 'grid', 'desc' => 'Sort items into categories'],
                'fillgap' => ['name' => 'Fill the Gap', 'icon' => 'text-slash', 'desc' => 'Select missing words'],
            ],
        ]]);
    }
}

// === MANAGE TAB (Question list) ===
if ($tab === 'manage' && $canmanage) {
    $questions = $DB->get_records('aiquiz_questions', ['aiquizid' => $aiquiz->id], 'sortorder ASC');
    
    echo '<div class="aiquiz-manage">';
    echo '<div class="d-flex justify-content-between align-items-center mb-4">';
    echo '<h3>Manage Questions (' . count($questions) . ')</h3>';
    echo '<a href="' . $baseurl->out(true, ['tab' => 'generate']) . '" class="btn btn-primary"><i class="fa fa-magic mr-2"></i> Generate More</a>';
    echo '</div>';
    
    if (empty($questions)) {
        echo '<div class="alert alert-info">No questions yet. Use the Generate Questions tab to create questions with AI.</div>';
    } else {
        echo '<div class="list-group">';
        $num = 1;
        foreach ($questions as $q) {
            $qdata = json_decode($q->questiondata, true);
            echo '<div class="list-group-item">';
            echo '<div class="d-flex justify-content-between">';
            echo '<div><strong>Q' . $num . ':</strong> ' . htmlspecialchars(substr($qdata['text'] ?? $q->questiontext ?? 'Question', 0, 100)) . '</div>';
            echo '<span class="badge badge-secondary">' . ($q->questiontype ?? 'MCQ') . '</span>';
            echo '</div>';
            echo '</div>';
            $num++;
        }
        echo '</div>';
    }
    echo '</div>';
}

// === ATTEMPTS TAB ===
if ($tab === 'attempts' && $canmanage) {
    $allattempts = $DB->get_records_sql(
        "SELECT a.*, u.firstname, u.lastname, u.email 
         FROM {aiquiz_attempts} a 
         JOIN {user} u ON u.id = a.userid 
         WHERE a.aiquizid = ? 
         ORDER BY a.timecreated DESC",
        [$aiquiz->id]
    );
    
    echo '<div class="aiquiz-attempts">';
    echo '<h3>All Student Attempts (' . count($allattempts) . ')</h3>';
    
    if (empty($allattempts)) {
        echo '<div class="alert alert-info">No attempts yet.</div>';
    } else {
        echo '<table class="table table-striped">';
        echo '<thead><tr><th>Student</th><th>State</th><th>Grade</th><th>Started</th><th>Actions</th></tr></thead>';
        echo '<tbody>';
        foreach ($allattempts as $attempt) {
            echo '<tr>';
            echo '<td>' . htmlspecialchars($attempt->firstname . ' ' . $attempt->lastname) . '</td>';
            echo '<td>' . $attempt->state . '</td>';
            echo '<td>' . ($attempt->state === 'finished' ? round($attempt->grade, 1) . '%' : '-') . '</td>';
            echo '<td>' . userdate($attempt->timecreated) . '</td>';
            echo '<td>';
            if ($attempt->state === 'finished') {
                echo '<a href="' . new moodle_url('/mod/aiquiz/review.php', ['id' => $cm->id, 'attempt' => $attempt->id]) . '" class="btn btn-sm btn-secondary">Review</a>';
            }
            echo '</td></tr>';
        }
        echo '</tbody></table>';
    }
    echo '</div>';
}

// === STATISTICS TAB ===
if ($tab === 'stats' && $canmanage) {
    $totalattempts = $DB->count_records('aiquiz_attempts', ['aiquizid' => $aiquiz->id, 'state' => 'finished']);
    $avggrade = $DB->get_field_sql(
        "SELECT AVG(grade) FROM {aiquiz_attempts} WHERE aiquizid = ? AND state = 'finished'",
        [$aiquiz->id]
    );
    $passcount = $DB->count_records_sql(
        "SELECT COUNT(*) FROM {aiquiz_attempts} WHERE aiquizid = ? AND state = 'finished' AND grade >= ?",
        [$aiquiz->id, $aiquiz->passinggrade]
    );
    
    echo '<div class="aiquiz-stats">';
    echo '<h3>Quiz Statistics</h3>';
    
    echo '<div class="row mt-4">';
    
    echo '<div class="col-md-4">';
    echo '<div class="card text-center p-4">';
    echo '<div class="h1 text-primary">' . $totalattempts . '</div>';
    echo '<div class="text-muted">Total Attempts</div>';
    echo '</div></div>';
    
    echo '<div class="col-md-4">';
    echo '<div class="card text-center p-4">';
    echo '<div class="h1 text-success">' . ($avggrade ? round($avggrade, 1) . '%' : 'N/A') . '</div>';
    echo '<div class="text-muted">Average Grade</div>';
    echo '</div></div>';
    
    echo '<div class="col-md-4">';
    echo '<div class="card text-center p-4">';
    echo '<div class="h1 text-info">' . ($totalattempts > 0 ? round(($passcount / $totalattempts) * 100) . '%' : 'N/A') . '</div>';
    echo '<div class="text-muted">Pass Rate</div>';
    echo '</div></div>';
    
    echo '</div>';
    echo '</div>';
}

echo '</div>'; // tab-content
echo '</div>'; // unified-container

echo $OUTPUT->footer();
