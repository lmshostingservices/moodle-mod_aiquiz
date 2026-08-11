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
 * Upgrade script for AI Quiz.
 * 
 * v3.1.5 - Added upgrade scaffolding for future schema changes
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Upgrade the mod_aiquiz plugin.
 *
 * @param int $oldversion The old version of the plugin.
 * @return bool Always returns true.
 */
function xmldb_aiquiz_upgrade($oldversion) {
    global $DB;
    
    $dbman = $DB->get_manager();

    // v3.1.5 upgrade - no schema changes, just scaffolding
    if ($oldversion < 2026011205) {
        // Future schema changes will go here.
        // Example:
        // $table = new xmldb_table('aiquiz_attempts');
        // $field = new xmldb_field('newfield', XMLDB_TYPE_INTEGER, '10', null, null, null, '0', 'existingfield');
        // if (!$dbman->field_exists($table, $field)) {
        //     $dbman->add_field($table, $field);
        // }
        
        upgrade_mod_savepoint(true, 2026011205, 'aiquiz');
    }

    // v3.1.18: FIX-AIQUIZ-NEXT-BUTTON — Deferred-mode "Next" button changed from type="submit"
    //   to type="button" with an explicit onclick that calls document.getElementById(
    //   'aiquiz-answer-form').submit(). The form was also given id="aiquiz-answer-form".
    //   Root cause: a type="submit" button inside the form causes Moodle's built-in
    //   form-submit interceptor to strip the button's name/value from the POST payload
    //   in some browsers. next=1 was therefore not transmitted, so the attempt handler
    //   did not advance to the next question and reloaded the same question instead.
    //   No DB schema changes. PHP-only fix: attempt.php. version.php → 2026040300902.
    if ($oldversion < 2026040300902) {
        upgrade_mod_savepoint(true, 2026040300902, 'aiquiz');
    }
    // v3.1.19: AMD ENCODING FIX: All non-ASCII characters (em dashes, arrows, box-drawing chars, ellipsis, bullets, emoji, accented Latin) scrubbed from all AMD JS files (amd/src, amd/build, amd/build/*.min.js). Root cause of Moodle primary/secondary navigation menus disappearing site-wide: non-ASCII bytes in any installed plugin's AMD file cause a SyntaxError inside RequireJS's first.js bundle, throwing "No define call for core/first" and aborting the entire AMD module chain. No PHP, DB schema, or functional changes in this release.
    if ($oldversion < 2026042200019) {
        upgrade_mod_savepoint(true, 2026042200019, 'aiquiz');
    }

    // v3.1.20: FIX-WC-LASTQ-LOCK — In immediate-feedback mode, answering the last question
    //   showed a full-screen feedback overlay with only a "Finish Quiz" button (action=finish).
    //   This permanently locked the attempt before the student could review or change previous
    //   answers. The overlay covered the progress bar, making navigation impossible.
    //   Fix: The "Finish Quiz" button is replaced with two options:
    //     1. "Review Previous Answers" - dismisses the overlay (navigates back to the attempt
    //        page without action=finish), restoring progress-bar navigation.
    //     2. "Finish and Start Review" - the explicit final submission that locks the attempt.
    //   The read-only review period now only begins when the student explicitly clicks
    //   "Finish and Start Review". No DB schema changes.
    //   Files changed: attempt.php, lang/en/aiquiz.php. version.php -> 2026061000001.
    if ($oldversion < 2026061000001) {
        upgrade_mod_savepoint(true, 2026061000001, 'aiquiz');
    }

    if ($oldversion < 2026072300223) {
        // FIX-API-DOMAIN: Updated all API endpoint URLs from lms-labs.com to lms-labs.com.
        // lms-labs.com has no DNS resolution from Moodle server side; lms-labs.com is the
        // correct working domain. All ajax.php, api_client, unlock_verifier, lib.php calls updated.
        if (function_exists('opcache_invalidate')) {
            $_pluginDir = realpath(__DIR__ . '/..');
            foreach (['version.php', 'db/upgrade.php'] as $_f) {
                $_full = $_pluginDir . '/' . $_f;
                if (file_exists($_full)) {
                    opcache_invalidate($_full, true);
                }
            }
        } elseif (function_exists('opcache_reset')) {
            opcache_reset();
        }
        upgrade_mod_savepoint(true, 2026072300223, 'aiquiz');
    }

    if ($oldversion < 2026072300224) {
        // FIX-API-DOMAIN: Reverted API endpoint to lms-labs.com (correct domain).
        // lms-labs.com was the original single-plugin domain; lms-labs.com is correct.
        if (function_exists('opcache_invalidate')) {
            $_pluginDir = realpath(__DIR__ . '/..');
            foreach (['version.php', 'db/upgrade.php'] as $_f) {
                $_full = $_pluginDir . '/' . $_f;
                if (file_exists($_full)) { opcache_invalidate($_full, true); }
            }
        } elseif (function_exists('opcache_reset')) { opcache_reset(); }
        upgrade_mod_savepoint(true, 2026072300224, 'aiquiz');
    }

    if ($oldversion < 2026072300225) {
        // FIX-DOMAIN: CSS/template references updated from old brand to lms-labs.com.
        if (function_exists('opcache_invalidate')) {
            $_pluginDir = realpath(__DIR__ . '/..');
            foreach (['version.php', 'db/upgrade.php'] as $_f) {
                $_full = $_pluginDir . '/' . $_f;
                if (file_exists($_full)) { opcache_invalidate($_full, true); }
            }
        } elseif (function_exists('opcache_reset')) { opcache_reset(); }
        upgrade_mod_savepoint(true, 2026072300225, 'aiquiz');
    }

    if ($oldversion < 2026072300226) {
        // Domain update: lms-labs.com → lms-labs.com
        if (function_exists('opcache_invalidate')) {
            $_pluginDir = realpath(__DIR__ . '/..');
            foreach (['version.php', 'lib.php', 'db/upgrade.php'] as $_f) {
                $_full = $_pluginDir . '/' . $_f;
                if (file_exists($_full)) { opcache_invalidate($_full, true); }
            }
        } elseif (function_exists('opcache_reset')) { opcache_reset(); }
        upgrade_mod_savepoint(true, 2026072300226, 'aiquiz');
    }

    if ($oldversion < 2026072300227) {
        // CSS/template domain update: lms-labs.com → lms-labs.com
        if (function_exists('opcache_invalidate')) {
            $_pluginDir = realpath(__DIR__ . '/..');
            foreach (['version.php', 'db/upgrade.php'] as $_f) {
                if (file_exists($_pluginDir . '/' . $_f)) opcache_invalidate($_pluginDir . '/' . $_f, true);
            }
        } elseif (function_exists('opcache_reset')) { opcache_reset(); }
        upgrade_mod_savepoint(true, 2026072300227, 'aiquiz');
    }

    return true;
}