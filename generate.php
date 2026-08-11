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
 * Question generation page for mod_aiquiz.
 * World-class 7-screen authoring wizard experience.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Central Config integration with fallback
$aiconfiglib = $CFG->dirroot . '/local/aiconfig/lib.php';
if (file_exists($aiconfiglib)) {
    require_once($aiconfiglib);
}

$id = required_param('id', PARAM_INT);

$cm = get_coursemodule_from_id('aiquiz', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/aiquiz:manage', $context);

$PAGE->set_url('/mod/aiquiz/generate.php', ['id' => $cm->id]);
$PAGE->set_title(format_string($aiquiz->name) . ' - ' . get_string('generatequestions', 'mod_aiquiz'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Load design system CSS
$PAGE->requires->css('/mod/aiquiz/styles/tokens.css');
$PAGE->requires->css('/mod/aiquiz/styles/bridge.css');
$PAGE->requires->css('/mod/aiquiz/styles/authoring.css');

// Get configuration from Central Config or fallback to plugin settings
if (function_exists('local_aiconfig_get_siteid')) {
    $siteid = local_aiconfig_get_siteid('mod_aiquiz');
} else {
    $siteid = trim(get_config('mod_aiquiz', 'siteid') ?? '');
}
if (function_exists('local_aiconfig_get_apikey')) {
    $apikey = local_aiconfig_get_apikey('mod_aiquiz');
} else {
    $apikey = trim(get_config('mod_aiquiz', 'apikey') ?? '');
}
$language = get_config('mod_aiquiz', 'language') ?: 'en-AU';

// Check API configuration
$hasApiConfig = !empty($siteid) && !empty($apikey);

echo $OUTPUT->header();

// Container for the 7-screen wizard SPA
echo '<div id="aiq-authoring-container" class="aiq-authoring-container" data-testid="authoring-wizard-container">';

// Show configuration warning if API not set
if (!$hasApiConfig) {
    echo '<div class="aiq-config-warning">';
    echo '<div class="aiq-config-warning__icon">';
    echo '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
    echo '<path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>';
    echo '</svg>';
    echo '</div>';
    echo '<h2 class="aiq-config-warning__title">Configuration Required</h2>';
    echo '<p class="aiq-config-warning__text">Please configure your Site ID and API Key in the plugin settings before generating questions.</p>';
    echo '<a href="' . new moodle_url('/admin/settings.php', ['section' => 'modsettingaiquiz']) . '" class="aiq-btn aiq-btn--default">Configure Settings</a>';
    echo '</div>';
} else {
    // Loading state while JavaScript initializes
    echo '<div class="aiq-loading-container" id="aiq-loading-container">';
    echo '<div class="aiq-loading-spinner">';
    echo '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
    echo '<circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>';
    echo '<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">';
    echo '<animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>';
    echo '</path>';
    echo '</svg>';
    echo '</div>';
    echo '<p class="aiq-loading-text">Loading AI Quiz Maker...</p>';
    echo '</div>';
}

echo '</div>';

// Initialize the wizard SPA only if configured
if ($hasApiConfig) {
    $PAGE->requires->js_call_amd('mod_aiquiz/authoring/wizard', 'init', [[
        'containerId' => 'aiq-authoring-container',
        'quizId' => $aiquiz->id,
        'cmid' => $cm->id,
        'quizName' => format_string($aiquiz->name),
        'siteid' => $siteid,
        'language' => $language,
        'manageUrl' => (new moodle_url('/mod/aiquiz/manage.php', ['id' => $cm->id]))->out(false),
        'questionTypes' => [
            'multichoice' => ['name' => get_string('qtype_multichoice', 'mod_aiquiz'), 'icon' => 'list-check', 'desc' => get_string('qtype_multichoice_desc', 'mod_aiquiz')],
            'truefalse' => ['name' => get_string('qtype_truefalse', 'mod_aiquiz'), 'icon' => 'toggle', 'desc' => get_string('qtype_truefalse_desc', 'mod_aiquiz')],
            'matching' => ['name' => get_string('qtype_matching', 'mod_aiquiz'), 'icon' => 'arrows', 'desc' => get_string('qtype_matching_desc', 'mod_aiquiz')],
            'shortanswer' => ['name' => get_string('qtype_shortanswer', 'mod_aiquiz'), 'icon' => 'text', 'desc' => get_string('qtype_shortanswer_desc', 'mod_aiquiz')],
            'numerical' => ['name' => 'Numerical', 'icon' => 'calculator', 'desc' => 'Number-based answers with tolerance'],
            'ordering' => ['name' => 'Ordering', 'icon' => 'sort', 'desc' => 'Arrange items in correct sequence'],
            'dragdrop' => ['name' => 'Drag & Drop', 'icon' => 'grid', 'desc' => 'Drag items into categories'],
            'fillgap' => ['name' => 'Fill the Gap', 'icon' => 'text-slash', 'desc' => 'Select missing words from dropdowns'],
        ],
    ]]);
}

echo $OUTPUT->footer();
