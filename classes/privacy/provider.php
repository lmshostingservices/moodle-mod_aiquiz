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
 * Privacy Subsystem implementation for AI Quiz.
 * 
 * v3.1.5 - FULL GDPR IMPLEMENTATION
 * Implements all required privacy provider interfaces:
 * - get_contexts_for_userid
 * - get_users_in_context
 * - export_user_data
 * - delete_data_for_all_users_in_context
 * - delete_data_for_user
 * - delete_data_for_users
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_aiquiz\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;
use core_privacy\local\request\helper;
use core_privacy\local\request\transform;

defined('MOODLE_INTERNAL') || die();

class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider,
    \core_privacy\local\request\core_userlist_provider {
    /**
     * Returns metadata about user data stored by this plugin.
     *
     * @param collection $collection The initialised collection to add items to.
     * @return collection A listing of user data stored through this system.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table('aiquiz_attempts', [
            'userid' => 'privacy:metadata:aiquiz_attempts:userid',
            'state' => 'privacy:metadata:aiquiz_attempts:state',
            'sumgrades' => 'privacy:metadata:aiquiz_attempts:sumgrades',
            'grade' => 'privacy:metadata:aiquiz_attempts:grade',
            'timecreated' => 'privacy:metadata:aiquiz_attempts:timecreated',
            'timefinished' => 'privacy:metadata:aiquiz_attempts:timefinished',
        ], 'privacy:metadata:aiquiz_attempts');

        $collection->add_database_table('aiquiz_responses', [
            'response' => 'privacy:metadata:aiquiz_responses:response',
            'fraction' => 'privacy:metadata:aiquiz_responses:fraction',
            'mark' => 'privacy:metadata:aiquiz_responses:mark',
        ], 'privacy:metadata:aiquiz_responses');

        $collection->add_database_table('aiquiz_overrides', [
            'userid' => 'privacy:metadata:aiquiz_overrides:userid',
            'timeopen' => 'privacy:metadata:aiquiz_overrides:timeopen',
            'timeclose' => 'privacy:metadata:aiquiz_overrides:timeclose',
            'timelimit' => 'privacy:metadata:aiquiz_overrides:timelimit',
            'attempts' => 'privacy:metadata:aiquiz_overrides:attempts',
        ], 'privacy:metadata:aiquiz_overrides');

        return $collection;
    }

    /**
     * Get the list of contexts that contain user information for the specified user.
     *
     * @param int $userid The user to search.
     * @return contextlist The contextlist containing the list of contexts used in this plugin.
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();

        // Users who have attempts.
        $sql = "SELECT c.id
                  FROM {context} c
                  JOIN {course_modules} cm ON cm.id = c.instanceid AND c.contextlevel = :contextlevel
                  JOIN {modules} m ON m.id = cm.module AND m.name = :modname
                  JOIN {aiquiz} q ON q.id = cm.instance
                  JOIN {aiquiz_attempts} qa ON qa.aiquizid = q.id
                 WHERE qa.userid = :userid";
        $params = [
            'contextlevel' => CONTEXT_MODULE,
            'modname' => 'aiquiz',
            'userid' => $userid,
        ];
        $contextlist->add_from_sql($sql, $params);

        // Users who have overrides.
        $sql = "SELECT c.id
                  FROM {context} c
                  JOIN {course_modules} cm ON cm.id = c.instanceid AND c.contextlevel = :contextlevel
                  JOIN {modules} m ON m.id = cm.module AND m.name = :modname
                  JOIN {aiquiz} q ON q.id = cm.instance
                  JOIN {aiquiz_overrides} qo ON qo.aiquizid = q.id
                 WHERE qo.userid = :userid";
        $contextlist->add_from_sql($sql, $params);

        return $contextlist;
    }

    /**
     * Get the list of users who have data within a context.
     *
     * @param userlist $userlist The userlist containing the list of users who have data in this context/plugin combination.
     */
    public static function get_users_in_context(userlist $userlist) {
        $context = $userlist->get_context();

        if (!$context instanceof \context_module) {
            return;
        }

        $params = [
            'modulename' => 'aiquiz',
            'contextid' => $context->id,
            'contextlevel' => CONTEXT_MODULE,
        ];

        // Users with attempts.
        $sql = "SELECT qa.userid
                  FROM {aiquiz_attempts} qa
                  JOIN {aiquiz} q ON q.id = qa.aiquizid
                  JOIN {course_modules} cm ON cm.instance = q.id
                  JOIN {modules} m ON m.id = cm.module AND m.name = :modulename
                  JOIN {context} ctx ON ctx.instanceid = cm.id AND ctx.contextlevel = :contextlevel
                 WHERE ctx.id = :contextid";

        $userlist->add_from_sql('userid', $sql, $params);

        // Users with overrides.
        $sql = "SELECT qo.userid
                  FROM {aiquiz_overrides} qo
                  JOIN {aiquiz} q ON q.id = qo.aiquizid
                  JOIN {course_modules} cm ON cm.instance = q.id
                  JOIN {modules} m ON m.id = cm.module AND m.name = :modulename
                  JOIN {context} ctx ON ctx.instanceid = cm.id AND ctx.contextlevel = :contextlevel
                 WHERE ctx.id = :contextid AND qo.userid IS NOT NULL";

        $userlist->add_from_sql('userid', $sql, $params);
    }

    /**
     * Export all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist The approved contexts to export information for.
     */
    public static function export_user_data(approved_contextlist $contextlist) {
        global $DB;

        if (empty($contextlist->count())) {
            return;
        }

        $user = $contextlist->get_user();

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel != CONTEXT_MODULE) {
                continue;
            }

            $cm = get_coursemodule_from_id('aiquiz', $context->instanceid);
            if (!$cm) {
                continue;
            }

            $aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance]);
            if (!$aiquiz) {
                continue;
            }

            // Export attempts with responses.
            $attempts = $DB->get_records('aiquiz_attempts', [
                'aiquizid' => $aiquiz->id,
                'userid' => $user->id,
            ]);

            $attemptdata = [];
            foreach ($attempts as $attempt) {
                $responses = $DB->get_records('aiquiz_responses', ['attemptid' => $attempt->id]);
                $responsedata = [];
                foreach ($responses as $response) {
                    $question = $DB->get_record('aiquiz_questions', ['id' => $response->questionid]);
                    $responsedata[] = [
                        'question' => $question ? $question->questiontext : 'Unknown',
                        'response' => $response->response,
                        'fraction' => $response->fraction,
                        'mark' => $response->mark,
                    ];
                }

                $attemptdata[] = [
                    'state' => $attempt->state,
                    'grade' => $attempt->grade,
                    'timecreated' => transform::datetime($attempt->timecreated),
                    'timefinished' => $attempt->timefinished ? transform::datetime($attempt->timefinished) : null,
                    'responses' => $responsedata,
                ];
            }

            // Export overrides.
            $overrides = $DB->get_records('aiquiz_overrides', [
                'aiquizid' => $aiquiz->id,
                'userid' => $user->id,
            ]);

            $overridedata = [];
            foreach ($overrides as $override) {
                $overridedata[] = [
                    'timeopen' => $override->timeopen ? transform::datetime($override->timeopen) : null,
                    'timeclose' => $override->timeclose ? transform::datetime($override->timeclose) : null,
                    'timelimit' => $override->timelimit,
                    'attempts' => $override->attempts,
                ];
            }

            $data = [
                'attempts' => $attemptdata,
                'overrides' => $overridedata,
            ];

            writer::with_context($context)->export_data([], (object) $data);
        }
    }

    /**
     * Delete all user data for all users in the specified context.
     *
     * @param \context $context The specific context to delete data for.
     */
    public static function delete_data_for_all_users_in_context(\context $context) {
        global $DB;

        if ($context->contextlevel != CONTEXT_MODULE) {
            return;
        }

        $cm = get_coursemodule_from_id('aiquiz', $context->instanceid);
        if (!$cm) {
            return;
        }

        // Delete all responses for all attempts in this quiz.
        $attempts = $DB->get_records('aiquiz_attempts', ['aiquizid' => $cm->instance]);
        foreach ($attempts as $attempt) {
            $DB->delete_records('aiquiz_responses', ['attemptid' => $attempt->id]);
        }
        
        // Delete all attempts.
        $DB->delete_records('aiquiz_attempts', ['aiquizid' => $cm->instance]);
        
        // Delete all overrides.
        $DB->delete_records('aiquiz_overrides', ['aiquizid' => $cm->instance]);
    }

    /**
     * Delete all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist The approved contexts and user information to delete information for.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist) {
        global $DB;

        if (empty($contextlist->count())) {
            return;
        }

        $user = $contextlist->get_user();

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel != CONTEXT_MODULE) {
                continue;
            }

            $cm = get_coursemodule_from_id('aiquiz', $context->instanceid);
            if (!$cm) {
                continue;
            }

            // Delete responses for this user's attempts.
            $attempts = $DB->get_records('aiquiz_attempts', [
                'aiquizid' => $cm->instance,
                'userid' => $user->id,
            ]);
            foreach ($attempts as $attempt) {
                $DB->delete_records('aiquiz_responses', ['attemptid' => $attempt->id]);
            }
            
            // Delete attempts.
            $DB->delete_records('aiquiz_attempts', [
                'aiquizid' => $cm->instance,
                'userid' => $user->id,
            ]);
            
            // Delete overrides.
            $DB->delete_records('aiquiz_overrides', [
                'aiquizid' => $cm->instance,
                'userid' => $user->id,
            ]);
        }
    }

    /**
     * Delete multiple users within a single context.
     *
     * @param approved_userlist $userlist The approved context and user information to delete information for.
     */
    public static function delete_data_for_users(approved_userlist $userlist) {
        global $DB;

        $context = $userlist->get_context();

        if ($context->contextlevel != CONTEXT_MODULE) {
            return;
        }

        $cm = get_coursemodule_from_id('aiquiz', $context->instanceid);
        if (!$cm) {
            return;
        }

        $userids = $userlist->get_userids();

        foreach ($userids as $userid) {
            // Delete responses for this user's attempts.
            $attempts = $DB->get_records('aiquiz_attempts', [
                'aiquizid' => $cm->instance,
                'userid' => $userid,
            ]);
            foreach ($attempts as $attempt) {
                $DB->delete_records('aiquiz_responses', ['attemptid' => $attempt->id]);
            }
            
            // Delete attempts.
            $DB->delete_records('aiquiz_attempts', [
                'aiquizid' => $cm->instance,
                'userid' => $userid,
            ]);
            
            // Delete overrides.
            $DB->delete_records('aiquiz_overrides', [
                'aiquizid' => $cm->instance,
                'userid' => $userid,
            ]);
        }
    }
}
