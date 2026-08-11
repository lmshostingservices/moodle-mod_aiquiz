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

class restore_aiquiz_activity_structure_step extends restore_activity_structure_step {
    protected function define_structure() {
        $paths = [];
        $userinfo = $this->get_setting_value('userinfo');

        $paths[] = new restore_path_element('aiquiz', '/activity/aiquiz');
        $paths[] = new restore_path_element('aiquiz_question', '/activity/aiquiz/questions/question');
        $paths[] = new restore_path_element('aiquiz_answer', '/activity/aiquiz/questions/question/answers/answer');

        if ($userinfo) {
            $paths[] = new restore_path_element('aiquiz_attempt', '/activity/aiquiz/attempts/attempt');
            $paths[] = new restore_path_element('aiquiz_response', '/activity/aiquiz/attempts/attempt/responses/response');
            $paths[] = new restore_path_element('aiquiz_override', '/activity/aiquiz/overrides/override');
        }

        return $this->prepare_activity_structure($paths);
    }

    protected function process_aiquiz($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;
        $data->course = $this->get_courseid();

        $data->timeopen = $this->apply_date_offset($data->timeopen);
        $data->timeclose = $this->apply_date_offset($data->timeclose);
        $data->timecreated = $this->apply_date_offset($data->timecreated);
        $data->timemodified = time();

        $newitemid = $DB->insert_record('aiquiz', $data);
        $this->apply_activity_instance($newitemid);
    }

    protected function process_aiquiz_question($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        $data->aiquizid = $this->get_new_parentid('aiquiz');
        $data->timecreated = $this->apply_date_offset($data->timecreated);
        $data->timemodified = time();

        $newitemid = $DB->insert_record('aiquiz_questions', $data);
        $this->set_mapping('aiquiz_question', $oldid, $newitemid);
    }

    protected function process_aiquiz_answer($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        $data->questionid = $this->get_new_parentid('aiquiz_question');

        $newitemid = $DB->insert_record('aiquiz_answers', $data);
        $this->set_mapping('aiquiz_answer', $oldid, $newitemid);
    }

    protected function process_aiquiz_attempt($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        $data->aiquizid = $this->get_new_parentid('aiquiz');
        $data->userid = $this->get_mappingid('user', $data->userid);
        $data->timecreated = $this->apply_date_offset($data->timecreated);
        $data->timefinished = $this->apply_date_offset($data->timefinished);
        $data->timemodified = time();

        $newitemid = $DB->insert_record('aiquiz_attempts', $data);
        $this->set_mapping('aiquiz_attempt', $oldid, $newitemid);
    }

    protected function process_aiquiz_response($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        $data->attemptid = $this->get_new_parentid('aiquiz_attempt');
        $data->questionid = $this->get_mappingid('aiquiz_question', $data->questionid);
        $data->timecreated = $this->apply_date_offset($data->timecreated);
        $data->timemodified = time();

        $newitemid = $DB->insert_record('aiquiz_responses', $data);
    }

    protected function process_aiquiz_override($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        $data->aiquizid = $this->get_new_parentid('aiquiz');

        if (!empty($data->userid)) {
            $data->userid = $this->get_mappingid('user', $data->userid);
        }
        if (!empty($data->groupid)) {
            $data->groupid = $this->get_mappingid('group', $data->groupid);
        }

        $data->timeopen = $this->apply_date_offset($data->timeopen);
        $data->timeclose = $this->apply_date_offset($data->timeclose);
        $data->timecreated = $this->apply_date_offset($data->timecreated);
        $data->timemodified = time();

        $newitemid = $DB->insert_record('aiquiz_overrides', $data);
    }

    protected function after_execute() {
        $this->add_related_files('mod_aiquiz', 'intro', null);
    }
}
