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
 * mod_aiquiz file.
 *
 * @package    mod_aiquiz
 * @copyright  2026 LMS-Labs
 * @license    http://www.gnu.org/licenses/gpl-3.0.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

class backup_aiquiz_activity_structure_step extends backup_activity_structure_step {
    protected function define_structure() {
        $userinfo = $this->get_setting_value('userinfo');

        $aiquiz = new backup_nested_element('aiquiz', ['id'], [
            'name', 'intro', 'introformat', 'timelimit', 'questiontimelimit',
            'timeopen', 'timeclose', 'attempts', 'shufflequestions', 'shuffleanswers',
            'showfeedback', 'showresults', 'grade', 'passinggrade', 'browsersecurity',
            'questionbehaviour', 'completionpass', 'timecreated', 'timemodified'
        ]);

        $questions = new backup_nested_element('questions');
        $question = new backup_nested_element('question', ['id'], [
            'qtype', 'questiontext', 'questiontextformat', 'feedback', 'feedbackformat',
            'defaultmark', 'sortorder', 'timecreated', 'timemodified'
        ]);

        $answers = new backup_nested_element('answers');
        $answer = new backup_nested_element('answer', ['id'], [
            'answertext', 'answertextformat', 'fraction', 'feedback', 'feedbackformat', 'sortorder'
        ]);

        $attempts = new backup_nested_element('attempts');
        $attempt = new backup_nested_element('attempt', ['id'], [
            'userid', 'state', 'currentquestion', 'sumgrades', 'grade',
            'timecreated', 'timefinished', 'timemodified'
        ]);

        $responses = new backup_nested_element('responses');
        $response = new backup_nested_element('response', ['id'], [
            'questionid', 'response', 'fraction', 'mark', 'timecreated', 'timemodified'
        ]);

        $overrides = new backup_nested_element('overrides');
        $override = new backup_nested_element('override', ['id'], [
            'userid', 'groupid', 'timeopen', 'timeclose', 'timelimit', 'attempts',
            'timecreated', 'timemodified'
        ]);

        $aiquiz->add_child($questions);
        $questions->add_child($question);
        $question->add_child($answers);
        $answers->add_child($answer);

        if ($userinfo) {
            $aiquiz->add_child($attempts);
            $attempts->add_child($attempt);
            $attempt->add_child($responses);
            $responses->add_child($response);

            $aiquiz->add_child($overrides);
            $overrides->add_child($override);
        }

        $aiquiz->set_source_table('aiquiz', ['id' => backup::VAR_ACTIVITYID]);
        $question->set_source_table('aiquiz_questions', ['aiquizid' => backup::VAR_PARENTID], 'id ASC');
        $answer->set_source_table('aiquiz_answers', ['questionid' => backup::VAR_PARENTID], 'id ASC');

        if ($userinfo) {
            $attempt->set_source_table('aiquiz_attempts', ['aiquizid' => backup::VAR_PARENTID], 'id ASC');
            $response->set_source_table('aiquiz_responses', ['attemptid' => backup::VAR_PARENTID], 'id ASC');
            $override->set_source_table('aiquiz_overrides', ['aiquizid' => backup::VAR_PARENTID], 'id ASC');

            $attempt->annotate_ids('user', 'userid');
            $override->annotate_ids('user', 'userid');
            $override->annotate_ids('group', 'groupid');
        }

        $aiquiz->annotate_files('mod_aiquiz', 'intro', null);

        return $this->prepare_activity_structure($aiquiz);
    }
}
