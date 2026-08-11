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

$string['modulename'] = 'AI Quiz';
$string['modulenameplural'] = 'AI Quizzes';
$string['modulename_help'] = 'AI Quiz builds self-marking assessments using 11 question types, a 7-screen authoring wizard, and optional RTO/TGA integration for VET providers.

The authoring wizard guides teachers through: selecting the topic or pasting source content, choosing question types (Multiple Choice, True/False, Matching, Ordering, Fill in the Blanks, Drag and Drop, Short Answer, Essay, Hotspot, Sequencing, and Scenario-based), setting Bloom\'s Taxonomy level (Level 1 Remember through Level 6 Create), specifying the number of questions, and previewing before publishing. Questions are automatically graded with instant feedback.

For VET providers, the RTO Integration screen looks up any unit code on training.gov.au to retrieve Knowledge Evidence, Performance Evidence, and Performance Criteria. Teachers select which criteria to generate questions for and control how many questions are generated per criterion. Criteria are displayed per element with checkboxes for granular selection.

Teachers configure attempt limits, overall and per-question time limits, shuffle options, passing grades, and three question-behaviour modes: Adaptive (retry until correct), Immediate Feedback (result shown after each question), and Deferred Feedback (review all before submitting).

Question Analytics provides item difficulty scores, discrimination index values, distractor effectiveness breakdowns, A/B variant testing, response pattern heatmaps, and time-on-question data. The AI can flag underperforming questions and suggest targeted improvements. Student reports include per-question grade breakdowns and learning curve tracking. WCAG 2.1 AA accessibility is supported throughout.';
$string['pluginname'] = 'AI Quiz';
$string['pluginadministration'] = 'AI Quiz administration';

$string['aiquiz:addinstance'] = 'Add a new AI Quiz';
$string['aiquiz:view'] = 'View AI Quiz';
$string['aiquiz:attempt'] = 'Attempt AI Quiz';
$string['aiquiz:manage'] = 'Manage AI Quiz questions';
$string['aiquiz:viewreports'] = 'View AI Quiz reports';
$string['aiquiz:deleteattempts'] = 'Delete AI Quiz attempts';
$string['aiquiz:manageoverrides'] = 'Manage AI Quiz overrides';
$string['aiquiz:ignoretimelimit'] = 'Ignore time limit';

$string['timing'] = 'Timing';
$string['timelimit'] = 'Time limit';
$string['timelimit_help'] = 'If enabled, the time limit is shown on the quiz page and a countdown timer is displayed during the attempt.';
$string['questiontimelimit'] = 'Time per question';
$string['questiontimelimit_help'] = 'If set, each question will have a countdown timer. When time runs out, the question is automatically submitted and the student moves to the next question.';
$string['notimed'] = 'No time limit';
$string['seconds'] = 'seconds';
$string['minutes'] = 'minutes';
$string['timeleft'] = 'Time remaining';
$string['questiontimeleft'] = 'Time for this question';
$string['timeexpired'] = 'Time expired';
$string['quizopen'] = 'Opens';
$string['quizopen_help'] = 'Students can only start the quiz after this time.';
$string['quizclose'] = 'Closes';
$string['quizclose_help'] = 'Students cannot start a new attempt after this time. In-progress attempts will be auto-submitted.';
$string['closebeforeopen'] = 'Close date cannot be before open date.';
$string['progresslabel'] = 'Progress';
$string['questionsremaining'] = '{$a} questions remaining';
$string['questionof'] = 'Question {$a->current} of {$a->total}';

$string['attemptsheader'] = 'Attempts';
$string['attemptsallowed'] = 'Attempts allowed';
$string['attemptsallowed_help'] = 'The number of attempts students are allowed. 0 means unlimited.';
$string['attemptsremaining'] = 'You have {$a} attempt(s) remaining.';
$string['nomoreattempts'] = 'You have no more attempts remaining.';

$string['display'] = 'Display';
$string['shufflequestions'] = 'Shuffle questions';
$string['shufflequestions_help'] = 'If enabled, questions will appear in a different order for each attempt.';
$string['shuffleanswers'] = 'Shuffle answers';
$string['shuffleanswers_help'] = 'If enabled, answer options will appear in a different order for each question.';

$string['feedbackheader'] = 'Feedback';
$string['showfeedback'] = 'Show feedback';
$string['showfeedback_help'] = 'If enabled, students will see feedback after answering each question.';
$string['showresults'] = 'Allow review';
$string['showresults_help'] = 'If enabled, students can review their completed attempts.';

$string['grading'] = 'Grading';
$string['passinggrade'] = 'Passing grade (%)';
$string['passinggrade_help'] = 'The minimum percentage required to pass the quiz.';
$string['passinggradeerror'] = 'Passing grade cannot be higher than maximum grade.';
$string['yourbestgrade'] = 'Your best grade';
$string['passed'] = 'Passed';
$string['notpassed'] = 'Not yet passed';

$string['questionbehaviourheader'] = 'Question Behaviour';
$string['questionbehaviour'] = 'Question behaviour';
$string['questionbehaviour_help'] = 'Choose how students interact with questions: Adaptive (retry until correct), Immediate feedback (see result after each question), or Deferred feedback (review all at end before submitting).';
$string['behaviour_adaptive'] = 'Adaptive mode - Retry until correct';
$string['behaviour_immediate'] = 'Immediate feedback - See result, no retry';
$string['behaviour_deferred'] = 'Deferred feedback - Review all before submit';
$string['tryagain'] = 'Try Again';
$string['correctanswer_feedback'] = 'Correct! Well done.';
$string['incorrectanswer_feedback'] = 'Incorrect. The correct answer is shown above.';
$string['tryagain_feedback'] = 'Not quite right. Try again!';
$string['reviewbeforesubmit'] = 'Review Your Answers';
$string['reviewbeforesubmit_desc'] = 'You have answered {$a->answered} of {$a->total} questions. Review your answers below before submitting.';
$string['submitquiz'] = 'Submit Quiz';
$string['changeanswer'] = 'Change Answer';

$string['securityheader'] = 'Browser Security';
$string['browsersecurity'] = 'Enable browser lockdown';
$string['browsersecurity_help'] = 'If enabled, prevents students from switching tabs, copying text, or right-clicking during the quiz.';

$string['completionpass'] = 'Require passing grade';
$string['completionpass_help'] = 'Student must achieve the passing grade to complete the activity.';

$string['questions'] = 'Questions';
$string['question'] = 'Question';
$string['managequestions'] = 'Manage Questions';
$string['addquestion'] = 'Add Question';
$string['editquestion'] = 'Edit Question';
$string['deletequestion'] = 'Delete Question';
$string['noquestions'] = 'No questions have been added yet.';
$string['questiontext'] = 'Question text';
$string['questiontype'] = 'Question type';
$string['defaultmark'] = 'Default mark';
$string['feedback'] = 'Feedback';
$string['generalfeedback'] = 'General feedback';

$string['mcq'] = 'Multiple Choice';
$string['mcq_single'] = 'Multiple Choice (Single Answer)';
$string['mcq_multi'] = 'Multiple Choice (Multiple Answers)';
$string['truefalse'] = 'True/False';
$string['matching'] = 'Matching';
$string['ordering'] = 'Ordering';
$string['fillinblank'] = 'Fill in the Blank';
$string['dragdrop'] = 'Drag & Drop';
$string['hotspot'] = 'Hotspot';
$string['shortanswer'] = 'Short Answer';
$string['numerical'] = 'Numerical';

$string['answer'] = 'Answer';
$string['answers'] = 'Answers';
$string['addanswer'] = 'Add Answer';
$string['correctanswer'] = 'Correct answer';
$string['youranswer'] = 'Your answer';
$string['notanswered'] = 'Not answered';
$string['correct'] = 'Correct';
$string['incorrect'] = 'Incorrect';
$string['partiallycorrect'] = 'Partially correct';

$string['attempts'] = 'Attempts';
$string['attempt'] = 'Attempt';
$string['viewattempts'] = 'View Attempts';
$string['yourattempts'] = 'Your Attempts';
$string['startattempt'] = 'Start Quiz';
$string['continueattempt'] = 'Continue Quiz';
$string['continue'] = 'Continue';
$string['review'] = 'Review';
$string['submit'] = 'Submit';
$string['finish'] = 'Finish Quiz';
$string['finishandreview'] = 'Finish and Start Review';
$string['reviewpreviousquestions'] = 'Review Previous Answers';
$string['next'] = 'Next';
$string['previous'] = 'Previous';
$string['saveanswer'] = 'Save answer';

$string['state'] = 'State';
$string['inprogress'] = 'In progress';
$string['finished'] = 'Finished';
$string['abandoned'] = 'Abandoned';
$string['timecreated'] = 'Started';
$string['timefinished'] = 'Completed';
$string['timetaken'] = 'Time taken';
$string['actions'] = 'Actions';

$string['grade'] = 'Grade';
$string['score'] = 'Score';
$string['outof'] = '{$a->score} out of {$a->max}';
$string['percentage'] = '{$a}%';

$string['statistics'] = 'Statistics';
$string['questionstats'] = 'Question Statistics';
$string['facilityindex'] = 'Facility index';
$string['discriminationindex'] = 'Discrimination index';

$string['quizisclosed'] = 'This quiz is closed.';
$string['quiznotopen'] = 'This quiz opens on {$a}.';
$string['noaiquizzes'] = 'There are no AI Quizzes in this course.';
$string['attemptsdeleted'] = 'AI Quiz attempts deleted';
$string['deleteallattempts'] = 'Delete all AI Quiz attempts';

$string['confirmsubmit'] = 'Are you sure you want to submit this quiz? You will not be able to change your answers.';
$string['confirmfinish'] = 'Are you sure you want to finish this quiz? You answered {$a->answered} out of {$a->total} questions.';

$string['timeremaining'] = 'Time remaining';
$string['timelimitexceeded'] = 'Time limit exceeded. Your quiz has been submitted automatically.';

$string['privacy:metadata:aiquiz_attempts'] = 'Information about quiz attempts.';
$string['privacy:metadata:aiquiz_attempts:userid'] = 'The user who made the attempt.';
$string['privacy:metadata:aiquiz_attempts:grade'] = 'The grade achieved.';
$string['privacy:metadata:aiquiz_responses'] = 'Information about individual question responses.';
$string['privacy:metadata:aiquiz_responses:response'] = 'The response given by the user.';

$string['yourgrade'] = 'Your Grade';
$string['attemptby'] = 'Attempt by {$a}';
$string['reviewnotallowed'] = 'Review is not allowed for this quiz.';
$string['questionsaved'] = 'Question saved successfully.';
$string['questiondeleted'] = 'Question deleted successfully.';
$string['attemptdeleted'] = 'Attempt deleted successfully.';
$string['answerfeedback'] = 'Answer feedback';
$string['answerfeedback_help'] = 'Add specific feedback for each answer choice. Explain why correct answers are right and why incorrect answers are wrong.';
$string['feedbackforanswer'] = 'Feedback for this answer (explain why it is correct/incorrect)';
$string['answertext'] = 'Answer text';
$string['addanswer'] = 'Add another answer';
$string['whycorrect'] = 'Why this is correct';
$string['whyincorrect'] = 'Why this is incorrect';
$string['correctanswerwas'] = 'The correct answer is';
$string['nextquestion'] = 'Next Question';
$string['popup_correct_title'] = 'Excellent!';
$string['popup_correct_message'] = 'You got it right! Great job understanding this concept.';
$string['popup_incorrect_title'] = 'Not Quite Right';
$string['popup_incorrect_message'] = 'That wasn\'t the correct answer. Review the feedback below to understand why.';
$string['popup_tryagain_title'] = 'Try Again!';
$string['popup_tryagain_message'] = 'That\'s not quite right, but don\'t worry - you can try again!';

$string['event:attempt_started'] = 'Quiz attempt started';
$string['event:attempt_submitted'] = 'Quiz attempt submitted';
$string['event:question_answered'] = 'Question answered';

$string['siteid'] = 'Site ID';
$string['siteid_desc'] = 'Your unique site identifier from lms-labs.com';
$string['apikey'] = 'API Key';
$string['apikey_desc'] = 'Your API key from lms-labs.com';

$string['defaultsettings'] = 'Default Settings';
$string['defaultsettings_desc'] = 'Default values for new AI Quiz activities.';
$string['defaultquestionbehaviour'] = 'Default question behaviour';
$string['defaultquestionbehaviour_desc'] = 'The default question behaviour for new quizzes.';
$string['defaulttimelimit'] = 'Default time limit (seconds)';
$string['defaulttimelimit_desc'] = 'The default time limit for new quizzes. 0 means no limit.';
$string['defaultpassinggrade'] = 'Default passing grade (%)';
$string['defaultpassinggrade_desc'] = 'The default passing grade percentage for new quizzes.';

$string['privacy:metadata:aiquiz_attempts:state'] = 'The current state of the attempt (in progress, finished, etc).';
$string['privacy:metadata:aiquiz_attempts:sumgrades'] = 'The sum of marks achieved.';
$string['privacy:metadata:aiquiz_attempts:timecreated'] = 'When the attempt was started.';
$string['privacy:metadata:aiquiz_attempts:timefinished'] = 'When the attempt was completed.';
$string['privacy:metadata:aiquiz_responses:fraction'] = 'The fraction of marks achieved for this response.';
$string['privacy:metadata:aiquiz_responses:mark'] = 'The marks awarded for this response.';
$string['privacy:metadata:aiquiz_overrides'] = 'Information about user-specific quiz setting overrides.';
$string['privacy:metadata:aiquiz_overrides:userid'] = 'The user who has the override.';
$string['privacy:metadata:aiquiz_overrides:timeopen'] = 'The overridden open time.';
$string['privacy:metadata:aiquiz_overrides:timeclose'] = 'The overridden close time.';
$string['privacy:metadata:aiquiz_overrides:timelimit'] = 'The overridden time limit.';
$string['privacy:metadata:aiquiz_overrides:attempts'] = 'The overridden number of attempts allowed.';

$string['grademethod'] = 'Grading method';
$string['grademethod_help'] = 'When multiple attempts are allowed, choose how the final grade is calculated.';
$string['grademethod_highest'] = 'Highest grade';
$string['grademethod_average'] = 'Average grade';
$string['grademethod_first'] = 'First attempt';
$string['grademethod_last'] = 'Last attempt';

$string['questionsperpage'] = 'Quiz layout';
$string['questionsperpage_help'] = 'Display all questions on one page or show one question at a time.';
$string['layout_onepage'] = 'All questions on one page';
$string['layout_sequential'] = 'One question per page';

$string['shownumbering'] = 'Show question numbering';
$string['shownumbering_help'] = 'Display question numbers (1, 2, 3...) next to each question.';

$string['showcorrectanswers'] = 'Show correct answers';
$string['showcorrectanswers_help'] = 'When reviewing, show which answers were correct.';

$string['reviewattempt'] = 'When to allow review';
$string['reviewattempt_help'] = 'Control when students can review their finished attempts.';
$string['review_immediately'] = 'Immediately after attempt';
$string['review_open'] = 'While quiz is open';
$string['review_closed'] = 'After quiz closes';
$string['review_never'] = 'Never';

$string['browsersecurity_none'] = 'None - Full browser access';
$string['browsersecurity_popup'] = 'Popup window - Limited browser access';
$string['browsersecurity_seb'] = 'Require Safe Exam Browser';

$string['blockrightclick'] = 'Block right-click';
$string['blockrightclick_help'] = 'Prevent students from right-clicking during the quiz.';

$string['blockcopycut'] = 'Block copy/paste';
$string['blockcopycut_help'] = 'Prevent students from copying or pasting text during the quiz.';

$string['blockdevtools'] = 'Block developer tools';
$string['blockdevtools_help'] = 'Prevent students from opening browser developer tools during the quiz.';

$string['requirewebcam'] = 'Require webcam';
$string['requirewebcam_help'] = 'Students must enable their webcam before starting the quiz.';

$string['webcamproctorheader'] = 'Webcam Proctoring';
$string['webcamproctoring'] = 'Enable webcam proctoring';
$string['webcamproctoring_help'] = 'Capture periodic webcam photos during the quiz for proctoring verification. Requires the quizaccess_webcamproctor plugin.';

$string['proctorinterval'] = 'Photo capture interval';
$string['proctorinterval_help'] = 'How often to capture webcam photos during the attempt.';
$string['minute'] = 'minute';

$string['proctorbaselinephoto'] = 'Require baseline photo';
$string['proctorbaselinephoto_help'] = 'Capture a reference photo before the quiz starts for face comparison.';

$string['proctorfacedetection'] = 'Enable face detection';
$string['proctorfacedetection_help'] = 'Use AI to detect if the student\'s face is visible in captured photos.';

$string['proctornotifyteacher'] = 'Notify teacher of issues';
$string['proctornotifyteacher_help'] = 'Send notification to teacher when suspicious activity is detected.';

$string['proctorsensitivity'] = 'Face match sensitivity';
$string['proctorsensitivity_help'] = 'How strictly to compare captured photos with the baseline. Higher values require closer matches.';

$string['groupsheader'] = 'Groups';
$string['groupmode'] = 'Group mode';
$string['groupmode_help'] = 'Control how students are separated into groups for this quiz.';

$string['overridesheader'] = 'User & Group Overrides';
$string['overrides_info'] = 'After saving this quiz, you can create overrides for specific users or groups. Overrides allow different timing, attempt limits, or accessibility settings for individual students or groups.';
$string['allowuseroverrides'] = 'Allow user overrides';
$string['allowuseroverrides_help'] = 'Permit teachers to create individual student overrides for timing and attempts.';
$string['allowgroupoverrides'] = 'Allow group overrides';
$string['allowgroupoverrides_help'] = 'Permit teachers to create group-based overrides for timing and attempts.';

$string['completionminattempts'] = 'Minimum attempts required';
$string['completionminattempts_help'] = 'Student must make at least this many attempts to complete the activity. 0 means no minimum.';

$string['searchstudent'] = 'Search students...';
$string['filter'] = 'Filter';
$string['all'] = 'All';
$string['sortby'] = 'Sort by';
$string['sortorder'] = 'Order';
$string['ascending'] = 'Ascending';
$string['descending'] = 'Descending';
$string['exportcsv'] = 'Export CSV';
$string['exportexcel'] = 'Export Excel';

$string['student'] = 'Student';
$string['email'] = 'Email';
$string['status'] = 'Status';
$string['started'] = 'Started';
$string['completed'] = 'Completed';
$string['duration'] = 'Duration';

$string['filterbystate'] = 'Filter by status';
$string['filterbygroup'] = 'Filter by group';
$string['allstates'] = 'All statuses';
$string['allgroups'] = 'All groups';

$string['noattempts'] = 'No attempts found.';
$string['showingresults'] = 'Showing {$a->showing} of {$a->total} attempts';

$string['overrides'] = 'Overrides';
$string['useroverrides'] = 'User Overrides';
$string['groupoverrides'] = 'Group Overrides';
$string['addoverride'] = 'Add Override';
$string['editoverride'] = 'Edit Override';
$string['deleteoverride'] = 'Delete Override';
$string['overridedeleted'] = 'Override deleted successfully.';
$string['overridesaved'] = 'Override saved successfully.';
$string['selectusergroup'] = 'Select user or group';
$string['nooverridesfound'] = 'No overrides have been created.';
$string['overridefor'] = 'Override for {$a}';

$string['report'] = 'Report';
$string['reports'] = 'Reports';
$string['attemptreport'] = 'Attempts Report';
$string['gradereport'] = 'Grade Report';
$string['questionreport'] = 'Question Analysis';

$string['downloadattempts'] = 'Download attempts';
$string['downloadformat'] = 'Download format';

$string['proctorreport'] = 'Proctoring Report';
$string['viewproctordata'] = 'View proctoring data';
$string['proctordatafor'] = 'Proctoring data for {$a}';
$string['noproctordata'] = 'No proctoring data available for this attempt.';
$string['suspiciousactivity'] = 'Suspicious activity detected';
$string['nosuspiciousactivity'] = 'No suspicious activity detected';
$string['facematchscore'] = 'Face match score';

$string['manageoverrides'] = 'Manage Overrides';
$string['deleteoverrides'] = 'Delete all overrides';
$string['overridesdeleted'] = 'AI Quiz overrides deleted';
$string['completionpassgroup'] = 'Require passing grade';
$string['completionpassgroup_help'] = 'If enabled, the activity is considered complete when the student achieves the passing grade.';

// Question type specific strings
$string['matchinginstructions'] = 'Match each item on the left with the correct item on the right.';
$string['chooseanswer'] = 'Choose...';
$string['orderinginstructions'] = 'Drag and drop items to arrange them in the correct order.';
$string['dropanswer'] = 'Drop answer here';
$string['dragitems'] = 'Drag these items';
$string['typeyouranswer'] = 'Type your answer...';
$string['enternumber'] = 'Enter a number...';
$string['selectmissingwords'] = 'Select Missing Words';
$string['gapselect'] = 'Gap Select';
$string['ddwtos'] = 'Drag and Drop into Text';

// Completion condition descriptions (Moodle 4.3+ custom completion API)
$string['completionpass_desc'] = 'Student must achieve a passing grade of {$a}%';
$string['completionminattempts'] = 'Require minimum attempts';
$string['completionminattempts_help'] = 'Student must make at least this many attempts to complete the activity.';
$string['completionminattempts_desc'] = 'Student must make at least {$a} attempt(s)';

// AI Question Generation
$string['generatequestions'] = 'Generate Questions with AI';
$string['generatequestions_desc'] = 'Let AI create high-quality quiz questions based on your topic. Select question types and customize the output.';
$string['generatebutton'] = 'Generate Questions';
$string['topic'] = 'Topic';
$string['topic_placeholder'] = 'e.g., Workplace Health and Safety, Australian Consumer Law, Nutrition Fundamentals...';
$string['topic_hint'] = 'Enter the subject or learning area you want questions about. Be specific for better results.';
$string['context_optional'] = 'Additional Context (Optional)';
$string['context_placeholder'] = 'Paste learning content, textbook excerpts, or specific requirements to help AI generate more relevant questions...';
$string['context_hint'] = 'Providing context improves question relevance and accuracy. You can paste study materials, key concepts, or specific details.';
$string['selectquestiontypes'] = 'Question Types to Generate';
$string['numquestions'] = 'Number of Questions';
$string['difficulty'] = 'Difficulty Level';
$string['difficulty_easy'] = 'Easy - Basic recall and understanding';
$string['difficulty_medium'] = 'Medium - Application and analysis';
$string['difficulty_hard'] = 'Hard - Evaluation and synthesis';
$string['creditinfo'] = 'AI generation uses credits from your account. Approximately 1 credit per 2 questions.';
$string['questionsgenerated'] = '{$a} questions have been generated and added to your quiz.';
$string['noapikey'] = 'API key not configured. Please contact your administrator.';
$string['noapikey_info'] = 'AI generation requires an API key. Go to Site Administration → Plugins → Activity modules → AI Quiz to configure your API key.';
$string['apierror'] = 'Failed to connect to AI service. Please try again later.';
$string['invalidresponse'] = 'Invalid response from AI service. Please try again.';

// Question type names and descriptions for generate UI
$string['qtype_multichoice'] = 'Multiple Choice';
$string['qtype_multichoice_desc'] = 'Single correct answer from options';
$string['qtype_truefalse'] = 'True/False';
$string['qtype_truefalse_desc'] = 'Binary choice questions';
$string['qtype_matching'] = 'Matching';
$string['qtype_matching_desc'] = 'Connect related pairs';
$string['qtype_gapfill'] = 'Fill in Blanks';
$string['qtype_gapfill_desc'] = 'Select missing words';
$string['qtype_dragdrop'] = 'Drag & Drop';
$string['qtype_dragdrop_desc'] = 'Drag items into text';
$string['qtype_ordering'] = 'Ordering';
$string['qtype_ordering_desc'] = 'Arrange in sequence';
$string['qtype_shortanswer'] = 'Short Answer';
$string['qtype_shortanswer_desc'] = 'Type brief response';
$string['qtype_numerical'] = 'Numerical';
$string['qtype_numerical_desc'] = 'Calculate and enter number';

// Additional strings
$string['mark'] = 'mark';
$string['marks'] = 'marks';
$string['remaining'] = 'remaining';
$string['unanswered'] = 'Unanswered';
$string['answered'] = 'Answered';
$string['current'] = 'Current';
$string['complete'] = 'Complete';

// Language settings
$string['language'] = 'Question language';
$string['language_desc'] = 'Select the language and spelling convention for AI-generated questions. This affects terminology, spelling (e.g., "colour" vs "color"), and language style.';

// Criteria-based generation
$string['criteria'] = 'Assessment Criteria';
$string['criteria_placeholder'] = 'Enter one criterion per line. Questions will be generated for each criterion.';
$string['knowledgeevidence'] = 'Knowledge Evidence';
$string['performanceevidence'] = 'Performance Evidence';
$string['performancecriteria'] = 'Performance Criteria';
$string['questionspercriterion'] = 'Questions per criterion';
$string['unitofcompetency'] = 'Unit of Competency';
$string['fetchfromtga'] = 'Fetch from TGA';
$string['generatequestionsfor'] = 'Generate questions for';
$string['nocriteriaselected'] = 'Please select at least one evidence type to generate questions for.';

// Analytics & Question Evolution
$string['analytics'] = 'Analytics';
$string['questionanalytics'] = 'Question Analytics';
$string['itemdifficulty'] = 'Item Difficulty';
$string['itemdifficulty_help'] = 'The proportion of students who answered this question correctly. Values range from 0 (no one correct) to 1 (everyone correct). Optimal difficulty is 0.3-0.7.';
$string['discrimination'] = 'Discrimination Index';
$string['discrimination_help'] = 'How well this question differentiates between high and low performers. Higher values (>0.3) indicate better discrimination.';
$string['distractoranalysis'] = 'Distractor Analysis';
$string['distractoreffectiveness'] = 'Distractor Effectiveness';
$string['qualityscore'] = 'Quality Score';
$string['questionevolution'] = 'Question Evolution';
$string['improvequestion'] = 'Improve Question';
$string['aisuggestions'] = 'AI Suggestions';
$string['questionissues'] = 'Detected Issues';
$string['tooeasy'] = 'Too easy';
$string['toohard'] = 'Too difficult';
$string['poordiscrimination'] = 'Poor discrimination';
$string['negativediscrimination'] = 'Negative discrimination';
$string['ineffectivedistractors'] = 'Ineffective distractors';
$string['abtesting'] = 'A/B Testing';
$string['createvariant'] = 'Create Variant';
$string['compareversions'] = 'Compare Versions';
$string['learningcurve'] = 'Learning Curve';
$string['responsepatterns'] = 'Response Patterns';
$string['timeonquestion'] = 'Time on Question';
$string['insufficientdata'] = 'Insufficient data for reliable analysis (need at least 20 attempts).';

// RTO Competency Integration
$string['rtointegration'] = 'RTO Integration';
$string['competencypicker'] = 'Competency Picker';
$string['lookupunit'] = 'Lookup Unit';
$string['unitcode'] = 'Unit Code';
$string['unitnotfound'] = 'Unit not found in training.gov.au';
$string['elements'] = 'Elements';
$string['selectcriteria'] = 'Select Criteria';
$string['generatefromcriteria'] = 'Generate from Criteria';
$string['tgaintegration'] = 'training.gov.au Integration';
$string['assessmentconditions'] = 'Assessment Conditions';
