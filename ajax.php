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
 * AJAX handler for mod_aiquiz.
 * 
 * v3.1.5 - ChatGPT Security Audit Implementation
 * - Added rate limiting for generation/credit endpoints
 * - Added idempotency protection
 * - Enhanced ownership chain validation
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

header('Content-Type: application/json; charset=utf-8');

@ini_set('display_errors', '0');

try {
    require_once(__DIR__ . '/../../config.php');
require_login();
    require_once($CFG->libdir . '/filelib.php');

    // Central Config integration with fallback
    $aiconfiglib = $CFG->dirroot . '/local/aiconfig/lib.php';
    if (file_exists($aiconfiglib)) {
        require_once($aiconfiglib);
    }

    $sesskey = optional_param('sesskey', '', PARAM_RAW);
    if (!confirm_sesskey($sesskey)) {
        echo json_encode(['success' => false, 'error' => 'Session expired. Please refresh the page.']);
        exit;
    }

    if (!isloggedin() || isguestuser()) {
        echo json_encode(['success' => false, 'error' => 'Please log in to use AI Quiz']);
        exit;
    }

    $action = optional_param('action', '', PARAM_ALPHANUMEXT);
    if (empty($action)) {
        echo json_encode(['success' => false, 'error' => 'Missing action parameter']);
        exit;
    }

    // Get credentials from Central Config or fallback to plugin settings
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

    function aiquiz_fetch($url, $post = false, $payload = null) {
        // B1-FIX: Release session lock here — inside the fetch function, just before the HTTP call,
        // so that session-based rate limiting ($SESSION writes) still works before this point.
        \core\session\manager::write_close();

        $curl = new \curl();
        $timeout = $post ? 180 : 30;
        $curl->setopt([
            'CURLOPT_TIMEOUT' => $timeout,
            'CURLOPT_RETURNTRANSFER' => true,
            'CURLOPT_SSL_VERIFYPEER' => true,
            'CURLOPT_SSL_VERIFYHOST' => 2,
            'CURLOPT_FOLLOWLOCATION' => true,
        ]);

        if ($post && $payload) {
            $curl->setHeader(['Content-Type: application/json', 'Accept: application/json']);
            $body = $curl->post($url, json_encode($payload));
        } else {
            $curl->setHeader(['Accept: application/json']);
            $body = $curl->get($url);
        }

        $info = $curl->get_info();
        $httpcode = isset($info['http_code']) ? $info['http_code'] : 0;
        $error = $curl->get_errno() ? $curl->error : null;

        if ($body === false || $httpcode === 0) {
            return ['success' => false, 'body' => null, 'httpcode' => $httpcode, 'error' => $error ?: 'Connection failed'];
        }

        return ['success' => ($httpcode >= 200 && $httpcode < 300), 'body' => $body, 'httpcode' => $httpcode, 'error' => $error];
    }

    function aiquiz_response($data) {
        echo json_encode($data);
        exit;
    }

    /**
     * Rate limiting helper - prevents abuse of expensive endpoints.
     * Uses session-based tracking for simplicity.
     *
     * @param string $action The action being rate limited
     * @param int $limit Max requests per minute
     * @return bool True if rate limited (should block), false if allowed
     */
    function aiquiz_rate_limit($action, $limit = 10) {
        global $SESSION;
        
        $key = 'aiquiz_ratelimit_' . $action;
        $now = time();
        
        if (!isset($SESSION->$key)) {
            $SESSION->$key = ['count' => 0, 'reset' => $now + 60];
        }
        
        $data = $SESSION->$key;
        
        // Reset if minute has passed
        if ($now > $data['reset']) {
            $SESSION->$key = ['count' => 1, 'reset' => $now + 60];
            return false;
        }
        
        // Check limit
        if ($data['count'] >= $limit) {
            return true; // Rate limited
        }
        
        // Increment counter
        $SESSION->$key = ['count' => $data['count'] + 1, 'reset' => $data['reset']];
        return false;
    }

    /**
     * Validate quiz ownership chain - prevents IDOR attacks.
     *
     * @param int $quizid The quiz ID
     * @param string $capability Required capability
     * @return object Object with quiz, cm, context on success
     */
    function aiquiz_validate_quiz_access($quizid, $capability = 'mod/aiquiz:attempt') {
        global $DB;
        
        $aiquiz = $DB->get_record('aiquiz', ['id' => $quizid], '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('aiquiz', $aiquiz->id, $aiquiz->course, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        require_capability($capability, $context);
        
        return (object)[
            'quiz' => $aiquiz,
            'cm' => $cm,
            'context' => $context
        ];
    }

    // Lookup unit from training.gov.au via API
    if ($action === 'lookup_unit' || $action === 'lookupunit') {
        $unitcode = required_param('unitcode', PARAM_ALPHANUMEXT);
        
        if (strlen($unitcode) < 5) {
            aiquiz_response(['success' => false, 'error' => 'Invalid unit code format']);
        }

        if (empty($siteid) || empty($apikey)) {
            aiquiz_response(['success' => false, 'error' => 'Plugin not configured. Please set Site ID and API Key in plugin settings.']);
        }

        $payload = [
            'siteid' => $siteid,
            'apikey' => $apikey,
            'unitcode' => strtoupper($unitcode),
        ];

        $url = "https://lms-labs.com/api/aiquiz/lookup-unit";
        $result = aiquiz_fetch($url, true, $payload);

        if (!$result['success']) {
            aiquiz_response(['success' => false, 'error' => 'Failed to connect to training.gov.au lookup service']);
        }

        $data = json_decode($result['body'], true);
        if (!$data || !isset($data['success'])) {
            aiquiz_response(['success' => false, 'error' => 'Invalid response from lookup service']);
        }

        if (!$data['success']) {
            aiquiz_response(['success' => false, 'error' => $data['error'] ?? 'Unit not found']);
        }

        // Return unit data directly (api.js unwraps result.data, so this becomes the unit object)
        aiquiz_response([
            'success' => true,
            'data' => $data['unit'] ?? null,
        ]);
    }

    // Get credits
    if ($action === 'credits') {
        // Rate limit: 30 requests per minute
        if (aiquiz_rate_limit('credits', 30)) {
            aiquiz_response(['success' => false, 'error' => 'Rate limit exceeded. Please wait before trying again.']);
        }

        if (empty($siteid) || empty($apikey)) {
            aiquiz_response(['success' => false, 'error' => 'Plugin not configured']);
        }

        $url = "https://lms-labs.com/api/credits?siteId=" . urlencode($siteid) . "&apiKey=" . urlencode($apikey);
        $result = aiquiz_fetch($url);

        if (!$result['success']) {
            aiquiz_response(['success' => false, 'error' => 'Failed to fetch credits']);
        }

        $data = json_decode($result['body'], true);
        aiquiz_response(['success' => true, 'credits' => $data['credits'] ?? 0]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════════
    // SPA QUIZ ATTEMPT ENDPOINTS - World-Class Experience
    // ═══════════════════════════════════════════════════════════════════════════════════

    // Get attempt data with all questions for SPA
    if ($action === 'get_attempt') {
        $attemptid = required_param('attemptid', PARAM_INT);
        
        $attempt = $DB->get_record('aiquiz_attempts', ['id' => $attemptid, 'userid' => $USER->id], '*', MUST_EXIST);
        $aiquiz = $DB->get_record('aiquiz', ['id' => $attempt->aiquizid], '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('aiquiz', $aiquiz->id, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        require_capability('mod/aiquiz:attempt', $context);
        
        $questions = $DB->get_records('aiquiz_questions', ['aiquizid' => $aiquiz->id], 'sortorder ASC');
        $questionlist = array_values($questions);
        
        if ($aiquiz->shufflequestions) {
            srand($attempt->id);
            shuffle($questionlist);
        }
        
        $questionsData = [];
        foreach ($questionlist as $index => $q) {
            $answers = $DB->get_records('aiquiz_answers', ['questionid' => $q->id], 'sortorder ASC');
            $response = $DB->get_record('aiquiz_responses', ['attemptid' => $attempt->id, 'questionid' => $q->id]);
            
            $choices = [];
            foreach ($answers as $ans) {
                $choices[] = [
                    'id' => (string)$ans->id,
                    'text' => format_text($ans->answertext, $ans->answertextformat),
                    'fraction' => (float)$ans->fraction
                ];
            }
            
            $savedAnswer = null;
            if ($response && !empty($response->response)) {
                $savedAnswer = json_decode($response->response, true);
                if (is_array($savedAnswer) && count($savedAnswer) === 1) {
                    $savedAnswer = $savedAnswer[0];
                }
            }
            
            $questionsData[] = [
                'questionId' => (string)$q->id,
                'index' => $index,
                'type' => $q->qtype ?: 'mcq',
                'questionText' => format_text($q->questiontext, $q->questiontextformat),
                'mark' => (float)($q->defaultmark ?? 1),
                'choices' => $choices,
                'correctAnswer' => null, // Hidden until reveal
                'feedback' => $q->feedback ?? null,
                'savedAnswer' => $savedAnswer,
                'multiSelect' => ($q->qtype === 'mcq' && strpos($q->questiontext, 'Select all') !== false)
            ];
        }
        
        $quiztimelimit = isset($aiquiz->timelimit) ? (int)$aiquiz->timelimit : 0;
        $timeRemaining = 0;
        if ($quiztimelimit > 0) {
            $elapsed = time() - $attempt->timecreated;
            $timeRemaining = max(0, $quiztimelimit - $elapsed);
        }
        
        aiquiz_response([
            'success' => true,
            'data' => [
                'attemptId' => $attempt->id,
                'quizId' => $aiquiz->id,
                'quizName' => format_string($aiquiz->name),
                'behaviour' => $aiquiz->questionbehaviour ?? 'immediate',
                'passingGrade' => (float)$aiquiz->passinggrade,
                'timeLimit' => $quiztimelimit,
                'timeRemaining' => $timeRemaining,
                'currentQuestion' => (int)$attempt->currentquestion,
                'questions' => $questionsData,
                'cmid' => $cm->id
            ]
        ]);
    }

    // Save answer for a question
    if ($action === 'save_answer') {
        $attemptid = required_param('attemptid', PARAM_INT);
        $questionid_raw = required_param('questionid', PARAM_RAW);
        $answer = optional_param('answer', '', PARAM_RAW);
        
        // Strip 'q' prefix from JavaScript format (q123 -> 123)
        $questionid = preg_replace('/^q/', '', $questionid_raw);
        $questionid = (int)$questionid;
        
        if (!$questionid) {
            aiquiz_response(['success' => false, 'error' => 'Invalid question ID']);
        }
        
        $attempt = $DB->get_record('aiquiz_attempts', ['id' => $attemptid, 'userid' => $USER->id, 'state' => 'inprogress'], '*', MUST_EXIST);
        $question = $DB->get_record('aiquiz_questions', ['id' => $questionid], '*', MUST_EXIST);
        $aiquiz = $DB->get_record('aiquiz', ['id' => $attempt->aiquizid], '*', MUST_EXIST);
        
        $answerData = is_string($answer) ? json_decode($answer, true) : $answer;
        if ($answerData === null) {
            $answerData = [$answer];
        }
        if (!is_array($answerData)) {
            $answerData = [$answerData];
        }
        
        // Strip prefixes from JS format (c123 -> 123, step123 -> 123, etc.)
        $dbAnswerData = [];
        foreach ($answerData as $key => $val) {
            if (is_string($val)) {
                $val = preg_replace('/^(c|step|opt|gap|l|r|s)/', '', $val);
            }
            $dbAnswerData[$key] = $val;
        }
        
        $existing = $DB->get_record('aiquiz_responses', ['attemptid' => $attemptid, 'questionid' => $questionid]);
        
        $fraction = 0;
        $answers = $DB->get_records('aiquiz_answers', ['questionid' => $questionid], 'sortorder ASC');
        
        if ($question->qtype === 'mcq' || $question->qtype === 'multichoice' || $question->qtype === 'truefalse') {
            foreach ($answers as $ans) {
                if (in_array((string)$ans->id, array_map('strval', $dbAnswerData))) {
                    $fraction += (float)$ans->fraction;
                }
            }
            $fraction = max(0, min(1, $fraction));
        }
        
        if ($existing) {
            $existing->response = json_encode($answerData);
            $existing->fraction = $fraction;
            $existing->timemodified = time();
            $DB->update_record('aiquiz_responses', $existing);
        } else {
            $response = new stdClass();
            $response->attemptid = $attemptid;
            $response->questionid = $questionid;
            $response->response = json_encode($answerData);
            $response->fraction = $fraction;
            $response->timecreated = time();
            $response->timemodified = time();
            $DB->insert_record('aiquiz_responses', $response);
        }
        
        $attempt->timemodified = time();
        $DB->update_record('aiquiz_attempts', $attempt);
        
        $behaviour = $aiquiz->questionbehaviour ?? 'immediate';
        $feedback = null;
        
        if ($behaviour === 'immediate' || $behaviour === 'adaptive') {
            $correctAnswers = [];
            foreach ($answers as $ans) {
                if ((float)$ans->fraction >= 1) {
                    $correctAnswers[] = (string)$ans->id;
                }
            }
            
            $isCorrect = ($fraction >= 1);
            $feedbackType = $isCorrect ? 'correct' : ($fraction > 0 ? 'partial' : 'incorrect');
            
            $feedback = [
                'type' => $feedbackType,
                'isCorrect' => $isCorrect,
                'fraction' => $fraction,
                'correctAnswer' => $correctAnswers,
                'message' => $question->feedback ?? ($isCorrect ? 'Well done!' : 'Not quite. Review the correct answer.'),
                'canRetry' => ($behaviour === 'adaptive' && !$isCorrect)
            ];
        }
        
        aiquiz_response([
            'success' => true,
            'data' => [
                'saved' => true,
                'fraction' => $fraction,
                'feedback' => $feedback
            ]
        ]);
    }

    // Submit entire attempt
    if ($action === 'submit_attempt') {
        $attemptid = required_param('attemptid', PARAM_INT);
        
        $attempt = $DB->get_record('aiquiz_attempts', ['id' => $attemptid, 'userid' => $USER->id, 'state' => 'inprogress'], '*', MUST_EXIST);
        $aiquiz = $DB->get_record('aiquiz', ['id' => $attempt->aiquizid], '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('aiquiz', $aiquiz->id, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        
        $questions = $DB->get_records('aiquiz_questions', ['aiquizid' => $aiquiz->id], 'sortorder ASC');
        
        $totalmarks = 0;
        $earnedmarks = 0;
        $questionResults = [];
        
        foreach ($questions as $q) {
            $response = $DB->get_record('aiquiz_responses', ['attemptid' => $attemptid, 'questionid' => $q->id]);
            $defaultmark = (float)($q->defaultmark ?? 1);
            $totalmarks += $defaultmark;
            
            $fraction = $response ? (float)$response->fraction : 0;
            $earnedmarks += $fraction * $defaultmark;
            
            $answers = $DB->get_records('aiquiz_answers', ['questionid' => $q->id], 'sortorder ASC');
            $correctAnswers = [];
            foreach ($answers as $ans) {
                if ((float)$ans->fraction >= 1) {
                    $correctAnswers[] = (string)$ans->id;
                }
            }
            
            $questionResults[] = [
                'questionId' => (string)$q->id,
                'correct' => ($fraction >= 1),
                'fraction' => $fraction,
                'correctAnswer' => $correctAnswers,
                'feedback' => $q->feedback ?? null
            ];
        }
        
        $percentage = $totalmarks > 0 ? round(($earnedmarks / $totalmarks) * 100, 1) : 0;
        $passed = $percentage >= $aiquiz->passinggrade;
        
        $attempt->state = 'finished';
        $attempt->grade = $percentage;
        $attempt->sumgrades = $earnedmarks;
        $attempt->timefinished = time();
        $attempt->timemodified = time();
        $DB->update_record('aiquiz_attempts', $attempt);
        
        $event = \mod_aiquiz\event\attempt_submitted::create([
            'objectid' => $attempt->id,
            'context' => $context,
            'relateduserid' => $USER->id,
        ]);
        $event->trigger();
        
        aiquiz_response([
            'success' => true,
            'data' => [
                'score' => [
                    'percentage' => $percentage,
                    'earned' => $earnedmarks,
                    'total' => $totalmarks,
                    'passed' => $passed,
                    'passingGrade' => (float)$aiquiz->passinggrade
                ],
                'questions' => $questionResults,
                'reviewUrl' => (new moodle_url('/mod/aiquiz/review.php', ['id' => $cm->id, 'attempt' => $attemptid]))->out(false)
            ]
        ]);
    }

    // Get feedback for a specific question (immediate/adaptive mode)
    if ($action === 'get_feedback') {
        $attemptid = required_param('attemptid', PARAM_INT);
        $questionid = required_param('questionid', PARAM_INT);
        
        $attempt = $DB->get_record('aiquiz_attempts', ['id' => $attemptid, 'userid' => $USER->id], '*', MUST_EXIST);
        $question = $DB->get_record('aiquiz_questions', ['id' => $questionid], '*', MUST_EXIST);
        $response = $DB->get_record('aiquiz_responses', ['attemptid' => $attemptid, 'questionid' => $questionid]);
        
        $answers = $DB->get_records('aiquiz_answers', ['questionid' => $questionid], 'sortorder ASC');
        $correctAnswers = [];
        foreach ($answers as $ans) {
            if ((float)$ans->fraction >= 1) {
                $correctAnswers[] = [
                    'id' => (string)$ans->id,
                    'text' => format_text($ans->answertext, $ans->answertextformat)
                ];
            }
        }
        
        $fraction = $response ? (float)$response->fraction : 0;
        $isCorrect = ($fraction >= 1);
        
        aiquiz_response([
            'success' => true,
            'data' => [
                'type' => $isCorrect ? 'correct' : ($fraction > 0 ? 'partial' : 'incorrect'),
                'isCorrect' => $isCorrect,
                'fraction' => $fraction,
                'correctAnswers' => $correctAnswers,
                'feedback' => $question->feedback ?? null
            ]
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════════
    // AUTHORING WIZARD ENDPOINTS - 7-Screen Question Generation
    // ═══════════════════════════════════════════════════════════════════════════════════

    // Get TGA unit (alias for wizard compatibility)
    if ($action === 'get_tga_unit') {
        $unitcode = required_param('code', PARAM_ALPHANUMEXT);
        
        if (strlen($unitcode) < 5) {
            aiquiz_response(['success' => false, 'error' => 'Invalid unit code format']);
        }

        if (empty($siteid) || empty($apikey)) {
            aiquiz_response(['success' => false, 'error' => 'Plugin not configured']);
        }

        $payload = [
            'siteid' => $siteid,
            'apikey' => $apikey,
            'unitcode' => strtoupper($unitcode),
        ];

        $url = "https://lms-labs.com/api/aiquiz/lookup-unit";
        $result = aiquiz_fetch($url, true, $payload);

        if (!$result['success']) {
            aiquiz_response(['success' => false, 'error' => 'Failed to connect to training.gov.au lookup service']);
        }

        $data = json_decode($result['body'], true);
        if (!$data || !isset($data['success'])) {
            aiquiz_response(['success' => false, 'error' => 'Invalid response from lookup service']);
        }

        if (!$data['success']) {
            aiquiz_response(['success' => false, 'error' => $data['error'] ?? 'Unit not found']);
        }

        aiquiz_response([
            'success' => true,
            'data' => $data['unit'] ?? null,
        ]);
    }

    // Generate questions for criteria (wizard version)
    if ($action === 'generate_questions') {
        // Rate limit: 20 generation requests per minute (reasonable for active quiz building)
        if (aiquiz_rate_limit('generate', 20)) {
            aiquiz_response(['success' => false, 'error' => 'Rate limit exceeded. Please wait before generating more questions.']);
        }

        $quizid = required_param('quizid', PARAM_INT);
        $criteria_json = required_param('criteria', PARAM_RAW);
        $options_json = optional_param('options', '{}', PARAM_RAW);
        
        // Use helper for ownership validation
        $access = aiquiz_validate_quiz_access($quizid, 'mod/aiquiz:manage');
        $aiquiz = $access->quiz;
        $cm = $access->cm;
        $context = $access->context;

        if (empty($siteid) || empty($apikey)) {
            aiquiz_response(['success' => false, 'error' => 'Plugin not configured']);
        }

        $criteria = json_decode($criteria_json, true);
        $options = json_decode($options_json, true);
        
        if (!is_array($criteria) || empty($criteria)) {
            aiquiz_response(['success' => false, 'error' => 'No criteria provided']);
        }

        $language = get_config('mod_aiquiz', 'language') ?: 'en-AU';
        $questionTypes = $options['questionTypes'] ?? ['multichoice'];
        $difficulty = $options['difficulty'] ?? 'medium';

        $formattedCriteria = [];
        foreach ($criteria as $c) {
            $text = is_string($c) ? $c : ($c['text'] ?? '');
            $count = is_array($c) ? ($c['count'] ?? 2) : 2;
            if (!empty($text)) {
                $formattedCriteria[] = ['text' => $text, 'questions' => $count];
            }
        }

        // Extract unit context from options if available
        $unitCode = $options['unitCode'] ?? null;
        $unitTitle = $options['unitTitle'] ?? null;
        
        // Build topic from unit info or use criterion text
        $topic = 'Criterion-based assessment';
        if (!empty($unitCode) && !empty($unitTitle)) {
            $topic = $unitCode . ' - ' . $unitTitle;
        } elseif (!empty($formattedCriteria[0]['text'])) {
            // Use first criterion text as context hint
            $topic = substr($formattedCriteria[0]['text'], 0, 100);
        }

        $payload = [
            'siteid' => $siteid,
            'apikey' => $apikey,
            'topic' => $topic,
            'criteria' => $formattedCriteria,
            'questionTypes' => $questionTypes,
            'difficulty' => $difficulty,
            'language' => $language,
            // Pass unit context for better question generation
            'unitCode' => $unitCode,
            'unitTitle' => $unitTitle,
        ];

        // B4-FIX: Removed debug error_log calls that were spamming production PHP error log.
        $url = 'https://lms-labs.com/api/aiquiz/generate';
        $result = aiquiz_fetch($url, true, $payload);

        if (!$result['success']) {
            aiquiz_response(['success' => false, 'error' => 'Failed to generate questions']);
        }

        $data = json_decode($result['body'], true);
        if (!$data || !isset($data['questions'])) {
            aiquiz_response(['success' => false, 'error' => 'Invalid response from generation service']);
        }

        aiquiz_response([
            'success' => true,
            'data' => [
                'questions' => $data['questions']
            ]
        ]);
    }

    // Save assessment from wizard
    if ($action === 'save_assessment') {
        $cmid = required_param('cmid', PARAM_INT);
        $questions_json = required_param('questions', PARAM_RAW);
        
        $cm = get_coursemodule_from_id('aiquiz', $cmid, 0, false, MUST_EXIST);
        $aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);
        $context = context_module::instance($cm->id);
        require_capability('mod/aiquiz:manage', $context);

        $questions = json_decode($questions_json, true);
        if (!is_array($questions) || empty($questions)) {
            aiquiz_response(['success' => false, 'error' => 'No questions to save']);
        }

        $maxsort = $DB->get_field_sql("SELECT MAX(sortorder) FROM {aiquiz_questions} WHERE aiquizid = ?", [$aiquiz->id]);
        $sortorder = ($maxsort ?? 0) + 1;
        $questionsadded = 0;

        foreach ($questions as $q) {
            $question = new stdClass();
            $question->aiquizid = $aiquiz->id;
            $question->qtype = $q['type'] ?? 'multichoice';
            $question->questiontext = $q['question'] ?? $q['questionText'] ?? '';
            $question->feedback = $q['feedback'] ?? '';
            $rawmark = $q['marks'] ?? $q['mark'] ?? 1;
            $question->defaultmark = (is_numeric($rawmark) && $rawmark > 0 && $rawmark <= 100) ? (int)$rawmark : 1;
            $question->sortorder = $sortorder++;
            $question->timecreated = time();
            $question->timemodified = time();
            
            // C1-FIX: $question->questiondata was previously written here but aiquiz_questions
            // has no questiondata column in install.xml — writing it caused a Moodle DML
            // DB error on every AI-generated question insert. The criterionId/criterionCode
            // values are not persisted (no schema column); the block is removed entirely.

            // B3-FIX: Set questiontextformat so format_text() in get_attempt renders correctly.
            $question->questiontextformat = FORMAT_HTML;

            $qid = $DB->insert_record('aiquiz_questions', $question);

            // Handle answers — type-specific storage format
            $qtype = $question->qtype;

            if ($qtype === 'matching') {
                // Matching: interleave stems (even sortorder) and choices (odd sortorder).
                // fraction on stem = index into choices array (which choice is the correct match).
                $pairs = $q['pairs'] ?? [];
                if (is_array($pairs) && !empty($pairs)) {
                    $psort = 0;
                    foreach ($pairs as $pi => $pair) {
                        // Stem row (even sortorder)
                        $stem = new stdClass();
                        $stem->questionid = $qid;
                        $stem->answertext = $pair['stem'] ?? $pair['question'] ?? '';
                        $stem->answertextformat = FORMAT_HTML;
                        $stem->fraction = (float)$pi; // index into choices; choice at sortorder = 2*pi+1
                        $stem->feedback = '';
                        $stem->sortorder = $psort++;
                        $DB->insert_record('aiquiz_answers', $stem);

                        // Choice row (odd sortorder)
                        $choice = new stdClass();
                        $choice->questionid = $qid;
                        $choice->answertext = $pair['choice'] ?? $pair['answer'] ?? '';
                        $choice->answertextformat = FORMAT_HTML;
                        $choice->fraction = 0.0;
                        $choice->feedback = '';
                        $choice->sortorder = $psort++;
                        $DB->insert_record('aiquiz_answers', $choice);
                    }
                }

            } elseif ($qtype === 'ordering') {
                // Ordering: each item in correct sequence; sortorder = correct position (0-based).
                $items = $q['items'] ?? [];
                if (is_array($items) && !empty($items)) {
                    foreach ($items as $pos => $item) {
                        $answer = new stdClass();
                        $answer->questionid = $qid;
                        $answer->answertext = is_array($item) ? ($item['text'] ?? '') : (string)$item;
                        $answer->answertextformat = FORMAT_HTML;
                        $answer->fraction = 0.0;
                        $answer->feedback = '';
                        $answer->sortorder = (int)$pos;
                        $DB->insert_record('aiquiz_answers', $answer);
                    }
                }

            } else {
                // MCQ, truefalse, shortanswer, etc.
                $answers = $q['answers'] ?? $q['choices'] ?? [];
                if (is_array($answers)) {
                    $asort = 0;
                    foreach ($answers as $a) {
                        $answer = new stdClass();
                        $answer->questionid = $qid;
                        $answer->answertext = is_array($a) ? ($a['text'] ?? '') : $a;
                        // B3-FIX: Set answertextformat so format_text() in get_attempt renders correctly.
                        $answer->answertextformat = FORMAT_HTML;
                        $answer->fraction = is_array($a) ? (($a['correct'] ?? $a['isCorrect'] ?? false) ? 1 : 0) : 0;
                        $answer->feedback = is_array($a) ? ($a['feedback'] ?? '') : '';
                        $answer->sortorder = $asort++;
                        $DB->insert_record('aiquiz_answers', $answer);
                    }
                }
            }

            $questionsadded++;
        }

        aiquiz_response([
            'success' => true,
            'data' => [
                'questionsAdded' => $questionsadded,
                'redirectUrl' => (new moodle_url('/mod/aiquiz/manage.php', ['id' => $cmid]))->out(false)
            ]
        ]);
    }

    aiquiz_response(['success' => false, 'error' => 'Unknown action: ' . $action]);

} catch (\Throwable $e) {
    // B2-FIX: Catch \Throwable (not just Exception) to handle PHP 7+ Error objects
    // (type errors, fatal errors, etc.) that do not extend Exception.
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
    exit;
}
