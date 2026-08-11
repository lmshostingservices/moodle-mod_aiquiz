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

namespace mod_aiquiz\completion;

use core_completion\activity_custom_completion;

/**
 * Activity custom completion subclass for mod_aiquiz.
 *
 * @package   mod_aiquiz
 * @copyright 2025 Essay Grader AI
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class custom_completion extends activity_custom_completion {
    /**
     * Fetches the completion state for a given completion rule.
     *
     * @param string $rule The completion rule.
     * @return int The completion state.
     */
    public function get_state(string $rule): int {
        global $DB;

        $this->validate_rule($rule);

        $userid = $this->userid;
        $aiquiz = $DB->get_record('aiquiz', ['id' => $this->cm->instance], '*', MUST_EXIST);

        $attempts = $DB->get_records('aiquiz_attempts', [
            'aiquizid' => $aiquiz->id,
            'userid' => $userid,
            'state' => 'finished',
        ], 'timecreated ASC');

        $attemptcount = count($attempts);

        switch ($rule) {
            case 'completionminattempts':
                if (empty($aiquiz->completionminattempts) || $aiquiz->completionminattempts <= 0) {
                    return COMPLETION_COMPLETE;
                }
                return ($attemptcount >= $aiquiz->completionminattempts) 
                    ? COMPLETION_COMPLETE 
                    : COMPLETION_INCOMPLETE;

            case 'completionpass':
                if (empty($aiquiz->completionpass)) {
                    return COMPLETION_COMPLETE;
                }
                $grade = $this->get_user_grade($aiquiz, $userid);
                if ($grade === null) {
                    return COMPLETION_INCOMPLETE;
                }
                return ($grade >= $aiquiz->passinggrade) 
                    ? COMPLETION_COMPLETE 
                    : COMPLETION_INCOMPLETE;

            default:
                return COMPLETION_INCOMPLETE;
        }
    }

    /**
     * Get the user's grade for this quiz.
     *
     * @param \stdClass $aiquiz The quiz instance.
     * @param int $userid The user ID.
     * @return float|null The grade or null if no grade.
     */
    private function get_user_grade($aiquiz, $userid): ?float {
        global $DB;

        switch ($aiquiz->grademethod ?? 'highest') {
            case 'highest':
                $sql = "SELECT MAX(grade) as grade FROM {aiquiz_attempts}
                        WHERE aiquizid = ? AND userid = ? AND state = 'finished'";
                break;
            case 'average':
                $sql = "SELECT AVG(grade) as grade FROM {aiquiz_attempts}
                        WHERE aiquizid = ? AND userid = ? AND state = 'finished'";
                break;
            case 'first':
                $sql = "SELECT grade FROM {aiquiz_attempts}
                        WHERE aiquizid = ? AND userid = ? AND state = 'finished'
                        ORDER BY timecreated ASC LIMIT 1";
                break;
            case 'last':
                $sql = "SELECT grade FROM {aiquiz_attempts}
                        WHERE aiquizid = ? AND userid = ? AND state = 'finished'
                        ORDER BY timecreated DESC LIMIT 1";
                break;
            default:
                $sql = "SELECT MAX(grade) as grade FROM {aiquiz_attempts}
                        WHERE aiquizid = ? AND userid = ? AND state = 'finished'";
        }

        $result = $DB->get_record_sql($sql, [$aiquiz->id, $userid]);

        return $result && $result->grade !== null ? (float)$result->grade : null;
    }

    /**
     * Fetch the list of custom completion rules that this module defines.
     *
     * @return array
     */
    public static function get_defined_custom_rules(): array {
        return [
            'completionpass',
            'completionminattempts',
        ];
    }

    /**
     * Returns an associative array of the descriptions of custom completion rules.
     *
     * @return array
     */
    public function get_custom_rule_descriptions(): array {
        global $DB;

        $aiquiz = $DB->get_record('aiquiz', ['id' => $this->cm->instance], '*', MUST_EXIST);

        $descriptions = [];

        if (!empty($aiquiz->completionpass)) {
            $descriptions['completionpass'] = get_string('completionpass_desc', 'mod_aiquiz', $aiquiz->passinggrade);
        }

        if (!empty($aiquiz->completionminattempts) && $aiquiz->completionminattempts > 0) {
            $descriptions['completionminattempts'] = get_string('completionminattempts_desc', 'mod_aiquiz', $aiquiz->completionminattempts);
        }

        return $descriptions;
    }

    /**
     * Returns an array of all completion rules, in the order they should be displayed to users.
     *
     * @return array
     */
    public function get_sort_order(): array {
        return [
            'completionview',
            'completionpass',
            'completionminattempts',
        ];
    }
}
