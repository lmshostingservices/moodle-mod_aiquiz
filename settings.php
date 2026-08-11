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
 * Admin settings for mod_aiquiz.
 * 
 * Note: Site ID and API Key are managed via AI Grader Central Config (local_aiconfig).
 * These fallback settings are only used if Central Config is not installed.
 * This plugin has additional language and default quiz settings.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    // Check if central config is available
    $centralconfigurl = new moodle_url('/admin/settings.php', ['section' => 'local_aiconfig']);
    $centralconfiginstalled = file_exists($CFG->dirroot . '/local/aiconfig/version.php');
    
    if ($centralconfiginstalled) {
        $settings->add(new admin_setting_heading(
            'mod_aiquiz/centralconfig_notice',
            '',
            '<div style="padding: 12px; background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; margin-bottom: 16px;">' .
            '<strong style="color: #047857;">AI Grader Central Config is installed.</strong><br>' .
            'Site ID and API Key are managed centrally. ' .
            '<a href="' . $centralconfigurl->out() . '">Configure Central Settings</a>' .
            '</div>'
        ));
    } else {
        $settings->add(new admin_setting_heading(
            'mod_aiquiz/centralconfig_notice',
            '',
            '<div style="padding: 12px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; margin-bottom: 16px;">' .
            '<strong style="color: #b45309;">Recommended: Install AI Grader Central Config</strong><br>' .
            'Configure Site ID and API Key once for all AI Grader plugins.' .
            '</div>'
        ));
    }

    $settings->add(new admin_setting_configtext(
        'mod_aiquiz/siteid',
        get_string('siteid', 'mod_aiquiz'),
        get_string('siteid_desc', 'mod_aiquiz') . ($centralconfiginstalled ? ' (Fallback - Central Config takes priority)' : ''),
        ''
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'mod_aiquiz/apikey',
        get_string('apikey', 'mod_aiquiz'),
        get_string('apikey_desc', 'mod_aiquiz') . ($centralconfiginstalled ? ' (Fallback - Central Config takes priority)' : ''),
        ''
    ));

    // Language selector with all 51 languages including English variations
    $languages = [
        'en-AU' => 'English (Australian)',
        'en-GB' => 'English (British)',
        'en-IN' => 'English (Indian)',
        'en-US' => 'English (American)',
        'ar-XA' => 'Arabic',
        'bn-IN' => 'Bengali (India)',
        'bg-BG' => 'Bulgarian',
        'yue-HK' => 'Cantonese (Hong Kong)',
        'ca-ES' => 'Catalan (Spain)',
        'cs-CZ' => 'Czech',
        'da-DK' => 'Danish',
        'nl-BE' => 'Dutch (Belgium)',
        'nl-NL' => 'Dutch (Netherlands)',
        'fil-PH' => 'Filipino (Philippines)',
        'fi-FI' => 'Finnish',
        'fr-CA' => 'French (Canadian)',
        'fr-FR' => 'French (France)',
        'de-DE' => 'German',
        'el-GR' => 'Greek',
        'gu-IN' => 'Gujarati (India)',
        'he-IL' => 'Hebrew',
        'hi-IN' => 'Hindi (India)',
        'hu-HU' => 'Hungarian',
        'id-ID' => 'Indonesian',
        'it-IT' => 'Italian',
        'ja-JP' => 'Japanese',
        'kn-IN' => 'Kannada (India)',
        'ko-KR' => 'Korean',
        'lv-LV' => 'Latvian',
        'lt-LT' => 'Lithuanian',
        'ms-MY' => 'Malay (Malaysia)',
        'ml-IN' => 'Malayalam (India)',
        'cmn-CN' => 'Mandarin Chinese (China)',
        'cmn-TW' => 'Mandarin Chinese (Taiwan)',
        'mr-IN' => 'Marathi (India)',
        'nb-NO' => 'Norwegian',
        'pl-PL' => 'Polish',
        'pt-BR' => 'Portuguese (Brazil)',
        'pt-PT' => 'Portuguese (Portugal)',
        'pa-IN' => 'Punjabi (India)',
        'ro-RO' => 'Romanian',
        'ru-RU' => 'Russian',
        'sr-RS' => 'Serbian',
        'sk-SK' => 'Slovak',
        'es-ES' => 'Spanish (Spain)',
        'es-US' => 'Spanish (US)',
        'sv-SE' => 'Swedish',
        'ta-IN' => 'Tamil (India)',
        'te-IN' => 'Telugu (India)',
        'th-TH' => 'Thai',
        'tr-TR' => 'Turkish',
        'uk-UA' => 'Ukrainian',
        'vi-VN' => 'Vietnamese',
    ];

    $settings->add(new admin_setting_configselect(
        'mod_aiquiz/language',
        get_string('language', 'mod_aiquiz'),
        get_string('language_desc', 'mod_aiquiz'),
        'en-AU',
        $languages
    ));

    $settings->add(new admin_setting_heading(
        'mod_aiquiz/defaults',
        get_string('defaultsettings', 'mod_aiquiz'),
        get_string('defaultsettings_desc', 'mod_aiquiz')
    ));

    $settings->add(new admin_setting_configselect(
        'mod_aiquiz/defaultquestionbehaviour',
        get_string('defaultquestionbehaviour', 'mod_aiquiz'),
        get_string('defaultquestionbehaviour_desc', 'mod_aiquiz'),
        'immediate',
        [
            'adaptive' => get_string('behaviour_adaptive', 'mod_aiquiz'),
            'immediate' => get_string('behaviour_immediate', 'mod_aiquiz'),
            'deferred' => get_string('behaviour_deferred', 'mod_aiquiz'),
        ]
    ));

    $settings->add(new admin_setting_configtext(
        'mod_aiquiz/defaulttimelimit',
        get_string('defaulttimelimit', 'mod_aiquiz'),
        get_string('defaulttimelimit_desc', 'mod_aiquiz'),
        '0',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'mod_aiquiz/defaultpassinggrade',
        get_string('defaultpassinggrade', 'mod_aiquiz'),
        get_string('defaultpassinggrade_desc', 'mod_aiquiz'),
        '100',
        PARAM_INT
    ));
}
