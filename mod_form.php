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
 * Module form for mod_aiquiz.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/moodleform_mod.php');

class mod_aiquiz_mod_form extends moodleform_mod {
    public function definition() {
        global $CFG, $COURSE;

        $mform = $this->_form;

        $mform->addElement('header', 'general', get_string('general', 'form'));

        $mform->addElement('text', 'name', get_string('name'), ['size' => '64']);
        $mform->setType('name', PARAM_TEXT);
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        $this->standard_intro_elements();

        $mform->addElement('header', 'timing', get_string('timing', 'mod_aiquiz'));

        $mform->addElement('duration', 'timelimit', get_string('timelimit', 'mod_aiquiz'), ['optional' => true]);
        $mform->addHelpButton('timelimit', 'timelimit', 'mod_aiquiz');
        $mform->setDefault('timelimit', 0);

        $questiontimeoptions = [0 => get_string('notimed', 'mod_aiquiz')];
        for ($i = 15; $i <= 60; $i += 15) {
            $questiontimeoptions[$i] = $i . ' ' . get_string('seconds', 'mod_aiquiz');
        }
        for ($i = 90; $i <= 300; $i += 30) {
            $questiontimeoptions[$i] = ($i / 60) . ' ' . get_string('minutes', 'mod_aiquiz');
        }
        $mform->addElement('select', 'questiontimelimit', get_string('questiontimelimit', 'mod_aiquiz'), $questiontimeoptions);
        $mform->addHelpButton('questiontimelimit', 'questiontimelimit', 'mod_aiquiz');
        $mform->setDefault('questiontimelimit', 0);

        $mform->addElement('date_time_selector', 'timeopen', get_string('quizopen', 'mod_aiquiz'), ['optional' => true]);
        $mform->addHelpButton('timeopen', 'quizopen', 'mod_aiquiz');

        $mform->addElement('date_time_selector', 'timeclose', get_string('quizclose', 'mod_aiquiz'), ['optional' => true]);
        $mform->addHelpButton('timeclose', 'quizclose', 'mod_aiquiz');

        $mform->addElement('header', 'attemptshdr', get_string('attemptsheader', 'mod_aiquiz'));

        $attemptoptions = [0 => get_string('unlimited')];
        for ($i = 1; $i <= 10; $i++) {
            $attemptoptions[$i] = $i;
        }
        $mform->addElement('select', 'attempts', get_string('attemptsallowed', 'mod_aiquiz'), $attemptoptions);
        $mform->setDefault('attempts', 0);
        $mform->addHelpButton('attempts', 'attemptsallowed', 'mod_aiquiz');

        // Grading method is always 'highest' - no user option needed
        $mform->addElement('hidden', 'grademethod', 'highest');
        $mform->setType('grademethod', PARAM_ALPHA);

        $mform->addElement('header', 'display', get_string('display', 'mod_aiquiz'));

        $mform->addElement('advcheckbox', 'shufflequestions', get_string('shufflequestions', 'mod_aiquiz'));
        $mform->setDefault('shufflequestions', 1);
        $mform->addHelpButton('shufflequestions', 'shufflequestions', 'mod_aiquiz');

        $mform->addElement('advcheckbox', 'shuffleanswers', get_string('shuffleanswers', 'mod_aiquiz'));
        $mform->setDefault('shuffleanswers', 1);
        $mform->addHelpButton('shuffleanswers', 'shuffleanswers', 'mod_aiquiz');

        $layoutoptions = [
            'onepage' => get_string('layout_onepage', 'mod_aiquiz'),
            'sequential' => get_string('layout_sequential', 'mod_aiquiz'),
        ];
        $mform->addElement('select', 'questionsperpage', get_string('questionsperpage', 'mod_aiquiz'), $layoutoptions);
        $mform->setDefault('questionsperpage', 'sequential');
        $mform->addHelpButton('questionsperpage', 'questionsperpage', 'mod_aiquiz');

        $mform->addElement('advcheckbox', 'shownumbering', get_string('shownumbering', 'mod_aiquiz'));
        $mform->setDefault('shownumbering', 1);
        $mform->addHelpButton('shownumbering', 'shownumbering', 'mod_aiquiz');

        $mform->addElement('header', 'questionbehaviourheader', get_string('questionbehaviourheader', 'mod_aiquiz'));

        $behaviours = [
            'adaptive' => get_string('behaviour_adaptive', 'mod_aiquiz'),
            'immediate' => get_string('behaviour_immediate', 'mod_aiquiz'),
            'deferred' => get_string('behaviour_deferred', 'mod_aiquiz'),
        ];
        $mform->addElement('select', 'questionbehaviour', get_string('questionbehaviour', 'mod_aiquiz'), $behaviours);
        $mform->setDefault('questionbehaviour', 'immediate');
        $mform->addHelpButton('questionbehaviour', 'questionbehaviour', 'mod_aiquiz');

        $mform->addElement('header', 'feedback', get_string('feedbackheader', 'mod_aiquiz'));

        $mform->addElement('advcheckbox', 'showfeedback', get_string('showfeedback', 'mod_aiquiz'));
        $mform->setDefault('showfeedback', 1);
        $mform->addHelpButton('showfeedback', 'showfeedback', 'mod_aiquiz');

        $mform->addElement('advcheckbox', 'showresults', get_string('showresults', 'mod_aiquiz'));
        $mform->setDefault('showresults', 1);
        $mform->addHelpButton('showresults', 'showresults', 'mod_aiquiz');

        $mform->addElement('advcheckbox', 'showcorrectanswers', get_string('showcorrectanswers', 'mod_aiquiz'));
        $mform->setDefault('showcorrectanswers', 1);
        $mform->addHelpButton('showcorrectanswers', 'showcorrectanswers', 'mod_aiquiz');

        // Review is always allowed immediately after attempt with no time restrictions
        $mform->addElement('hidden', 'reviewattempt', 'immediately');
        $mform->setType('reviewattempt', PARAM_ALPHA);

        // Standard Moodle grading - adds Maximum grade and Grade to pass fields
        // This integrates properly with activity completion "Require passing grade"
        $this->standard_grading_coursemodule_elements();

        $mform->addElement('header', 'security', get_string('securityheader', 'mod_aiquiz'));

        $browsersoptions = [
            0 => get_string('browsersecurity_none', 'mod_aiquiz'),
            1 => get_string('browsersecurity_popup', 'mod_aiquiz'),
            2 => get_string('browsersecurity_seb', 'mod_aiquiz'),
        ];
        $mform->addElement('select', 'browsersecurity', get_string('browsersecurity', 'mod_aiquiz'), $browsersoptions);
        $mform->setDefault('browsersecurity', 0);
        $mform->addHelpButton('browsersecurity', 'browsersecurity', 'mod_aiquiz');

        $mform->addElement('advcheckbox', 'blockrightclick', get_string('blockrightclick', 'mod_aiquiz'));
        $mform->setDefault('blockrightclick', 0);
        $mform->addHelpButton('blockrightclick', 'blockrightclick', 'mod_aiquiz');

        $mform->addElement('advcheckbox', 'blockcopycut', get_string('blockcopycut', 'mod_aiquiz'));
        $mform->setDefault('blockcopycut', 0);
        $mform->addHelpButton('blockcopycut', 'blockcopycut', 'mod_aiquiz');

        $mform->addElement('advcheckbox', 'blockdevtools', get_string('blockdevtools', 'mod_aiquiz'));
        $mform->setDefault('blockdevtools', 0);
        $mform->addHelpButton('blockdevtools', 'blockdevtools', 'mod_aiquiz');

        $mform->addElement('advcheckbox', 'requirewebcam', get_string('requirewebcam', 'mod_aiquiz'));
        $mform->setDefault('requirewebcam', 0);
        $mform->addHelpButton('requirewebcam', 'requirewebcam', 'mod_aiquiz');

        $mform->addElement('header', 'webcamproctorheader', get_string('webcamproctorheader', 'mod_aiquiz'));

        $mform->addElement('advcheckbox', 'webcamproctoring', get_string('webcamproctoring', 'mod_aiquiz'));
        $mform->setDefault('webcamproctoring', 0);
        $mform->addHelpButton('webcamproctoring', 'webcamproctoring', 'mod_aiquiz');

        $intervaloptions = [
            30 => '30 ' . get_string('seconds', 'mod_aiquiz'),
            60 => '1 ' . get_string('minute', 'mod_aiquiz'),
            120 => '2 ' . get_string('minutes', 'mod_aiquiz'),
            180 => '3 ' . get_string('minutes', 'mod_aiquiz'),
            300 => '5 ' . get_string('minutes', 'mod_aiquiz'),
        ];
        $mform->addElement('select', 'proctorinterval', get_string('proctorinterval', 'mod_aiquiz'), $intervaloptions);
        $mform->setDefault('proctorinterval', 60);
        $mform->addHelpButton('proctorinterval', 'proctorinterval', 'mod_aiquiz');
        $mform->hideIf('proctorinterval', 'webcamproctoring', 'eq', 0);

        $mform->addElement('advcheckbox', 'proctorbaselinephoto', get_string('proctorbaselinephoto', 'mod_aiquiz'));
        $mform->setDefault('proctorbaselinephoto', 1);
        $mform->addHelpButton('proctorbaselinephoto', 'proctorbaselinephoto', 'mod_aiquiz');
        $mform->hideIf('proctorbaselinephoto', 'webcamproctoring', 'eq', 0);

        $mform->addElement('advcheckbox', 'proctorfacedetection', get_string('proctorfacedetection', 'mod_aiquiz'));
        $mform->setDefault('proctorfacedetection', 1);
        $mform->addHelpButton('proctorfacedetection', 'proctorfacedetection', 'mod_aiquiz');
        $mform->hideIf('proctorfacedetection', 'webcamproctoring', 'eq', 0);

        $mform->addElement('advcheckbox', 'proctornotifyteacher', get_string('proctornotifyteacher', 'mod_aiquiz'));
        $mform->setDefault('proctornotifyteacher', 1);
        $mform->addHelpButton('proctornotifyteacher', 'proctornotifyteacher', 'mod_aiquiz');
        $mform->hideIf('proctornotifyteacher', 'webcamproctoring', 'eq', 0);

        $sensitivityoptions = [];
        for ($i = 50; $i <= 95; $i += 5) {
            $sensitivityoptions[$i] = $i . '%';
        }
        $mform->addElement('select', 'proctorsensitivity', get_string('proctorsensitivity', 'mod_aiquiz'), $sensitivityoptions);
        $mform->setDefault('proctorsensitivity', 70);
        $mform->addHelpButton('proctorsensitivity', 'proctorsensitivity', 'mod_aiquiz');
        $mform->hideIf('proctorsensitivity', 'webcamproctoring', 'eq', 0);

        $mform->addElement('header', 'overridesheader', get_string('overridesheader', 'mod_aiquiz'));

        $mform->addElement('static', 'overrides_info', '', 
            '<div class="alert alert-info">' . 
            '<i class="fa fa-info-circle"></i> ' .
            get_string('overrides_info', 'mod_aiquiz') .
            '</div>');

        $mform->addElement('advcheckbox', 'allowuseroverrides', get_string('allowuseroverrides', 'mod_aiquiz'));
        $mform->setDefault('allowuseroverrides', 1);
        $mform->addHelpButton('allowuseroverrides', 'allowuseroverrides', 'mod_aiquiz');

        $mform->addElement('advcheckbox', 'allowgroupoverrides', get_string('allowgroupoverrides', 'mod_aiquiz'));
        $mform->setDefault('allowgroupoverrides', 1);
        $mform->addHelpButton('allowgroupoverrides', 'allowgroupoverrides', 'mod_aiquiz');

        // CRITICAL: Add standard course module elements (includes 'update' hidden field,
        // completion settings, access restrictions, groups, etc.)
        $this->standard_coursemodule_elements();

        $this->add_action_buttons();
    }

    public function definition_after_data() {
        $mform = $this->_form;
        
        // Call parent first - this is safe now that standard_coursemodule_elements() is called
        parent::definition_after_data();
        
        // Remove Tags section - not needed for AI Quiz
        if ($mform->elementExists('tags')) {
            $mform->removeElement('tags');
        }
        if ($mform->elementExists('tagshdr')) {
            $mform->removeElement('tagshdr');
        }
    }

    public function data_preprocessing(&$defaultvalues) {
        parent::data_preprocessing($defaultvalues);
    }

    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        if (!empty($data['timeopen']) && !empty($data['timeclose'])) {
            if ($data['timeclose'] < $data['timeopen']) {
                $errors['timeclose'] = get_string('closebeforeopen', 'mod_aiquiz');
            }
        }

        return $errors;
    }

    public function add_completion_rules() {
        $mform = $this->_form;

        $mform->addElement('advcheckbox', 'completionpass', get_string('completionpass', 'mod_aiquiz'),
            get_string('completionpass_help', 'mod_aiquiz'));

        return ['completionpass'];
    }

    public function completion_rule_enabled($data) {
        return !empty($data['completionpass']);
    }
}
