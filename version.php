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
 * Version information for AI Quiz activity module.
 * 
 * v3.1.8 - Session Lock Fix
 * - Added \core\session\manager::write_close() after auth checks to prevent blocking concurrent requests during AI generation
 *
 * v3.1.7 - Question Quality Debug + Unit Context
 * - Added console logging to debug question generation flow
 * - Now passes unitCode and unitTitle to API for better context
 * - Topic now uses unit info instead of generic "Criterion-based assessment"
 *
 * v3.1.6 - Relaxed Rate Limits
 * - Generation: 5 → 20 requests/minute (reasonable for active quiz building)
 * - Credits: 10 → 30 requests/minute
 *
 * v3.1.5 - ChatGPT Security Audit Implementation
 * - Fixed GDPR provider (added missing transform import)
 * - Added upgrade scaffolding for future schema changes
 * - Removed unverified Moodle 5.x compatibility claim
 * - Enhanced AJAX security with rate limiting
 * - Added idempotency protection for credit operations
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// v3.1.18: BUG FIX (FIX-AIQUIZ-NEXT-BUTTON): Deferred-mode "Next" button changed from type="submit" to type="button" with an explicit onclick="document.getElementById('aiquiz-answer-form').submit()" trigger. The form was also given id="aiquiz-answer-form". The previous type="submit" inside the form caused Moodle's form interceptor to strip the button name/value pair in some browsers, meaning next=1 was not sent and the attempt reloaded the same question instead of advancing. No DB schema changes. PHP-only fix: attempt.php. version.php → 2026042200019.
// v3.1.17: BUG FIX — Deferred-mode "Next" button now unconditionally POSTs next=1 via hidden input, eliminating the race condition where Moodle's form.submit() interceptor stripped the button's name/value pair and caused the attempt to reload on the same question. version.php → 202604020901.
// v3.1.16: VERSION BUMP — Routine maintenance release. AMD CRC audit passed: all src=build=min. Stale ZIP v3.1.7 removed. version.php → 202603301808.
// v3.1.15: PROMPT + SAVE FIX — Resolved format mismatch for matching and ordering question types. Server AI prompts (VET + non-VET) now instruct the AI to return matching questions as "pairs": [{"stem": "...", "choice": "..."}] and ordering questions as "items": ["step1", "step2", ...] instead of generic "answers" arrays. save_assessment in ajax.php now branches on qtype: matching writes interleaved even-sortorder stems (fraction = pair index) and odd-sortorder choices; ordering writes items with sortorder = correct sequence position. MCQ/TF/shortanswer unchanged. version.php → 202603301807.
// v3.1.14: VERSION BUMP — Routine maintenance release. Full master process audit: AMD CRC all match (30 files, src=build=min), no stale ZIPs, no stale JS files outside AMD dirs, no hardcoded version strings in JS. version.php → 202603301806.
// v3.1.13: BUG FIXES — 2 bugs fixed: (C1) CRITICAL: save_assessment was assigning $question->questiondata for AI-generated questions but aiquiz_questions has no questiondata column in install.xml — every wizard save threw a Moodle DML DB error; block removed entirely; (C2) attempt.php inline timer was calling document.querySelector("form").submit() on expiry (answer-submit form, wrong target) and ran simultaneously with a duplicate js_init_code timer; both expiry paths now use window.location.href to the PHP-generated finish URL. No AMD changes; all build files remain in sync from v3.1.12.
// v3.1.12: BUG FIXES — 5 bugs fixed: (B1) session write_close moved into aiquiz_fetch() so rate limiting via $SESSION now works; (B2) catch(\Throwable) replaces catch(Exception) to handle PHP 7+ Error objects; (B3) questiontextformat/answertextformat now set to FORMAT_HTML in save_assessment; (B4) removed 2x debug error_log calls leaking API payload to PHP log; (B5) generator.js questionsGenerated now safely uses Array.isArray guard.
// v3.1.11: AMD SYNC — 25 AMD files hard-synced (CRC all match), BUILD_INFO corrected from stale v3.1.9→v3.1.11.
// v3.1.10: INDUSTRY UNIFICATION — Wizard context screen Industry SELECT uses same 29-industry list as Content Creator. New Sector SELECT auto-populates sub-sectors. industrySector stored in wizard data. version.php → 202603301802.
// v3.1.9: VERSION BUMP — Maintenance release.

defined('MOODLE_INTERNAL') || die();

$plugin->component = 'mod_aiquiz';
$plugin->version   = 2026072300;
$plugin->requires  = 2022041900;   // Moodle 4.0+ (tested)
$plugin->supported = [400, 405];   // Moodle 4.0 to 4.5 (verified compatible)
$plugin->maturity  = MATURITY_STABLE;
$plugin->release   = '3.1.26';
$plugin->dependencies = ['local_aiconfig' => 2025122301];
