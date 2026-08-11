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

namespace mod_aiquiz\event;

defined('MOODLE_INTERNAL') || die();

class attempt_started extends \core\event\base {
    protected function init() {
        $this->data['objecttable'] = 'aiquiz_attempts';
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    public static function get_name() {
        return get_string('event:attempt_started', 'mod_aiquiz');
    }

    public function get_description() {
        return "The user with id '{$this->userid}' started an attempt with id '{$this->objectid}'.";
    }

    public function get_url() {
        return new \moodle_url('/mod/aiquiz/attempt.php', [
            'id' => $this->contextinstanceid,
            'attempt' => $this->objectid,
        ]);
    }

    public static function get_objectid_mapping() {
        return ['db' => 'aiquiz_attempts', 'restore' => 'aiquiz_attempt'];
    }
}
