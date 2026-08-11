/**
 * AI Quiz Maker  -  API Wrapper
 * Moodle AJAX communication layer
 * 
 * @module     mod_aiquiz/core/api
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['core/ajax', 'core/notification'], function(Ajax, Notification) {
    'use strict';

    /**
     * Base URL for API calls
     */
    var baseUrl = M.cfg.wwwroot + '/mod/aiquiz/ajax.php';

    /**
     * Make API request
     * @param {string} action - API action name
     * @param {Object} data - Request data
     * @param {boolean} showError - Show error notification on failure
     * @returns {Promise}
     */
    function request(action, data, showError) {
        if (typeof showError === 'undefined') {
            showError = true;
        }

        data = data || {};
        data.action = action;
        data.sesskey = M.cfg.sesskey;

        return new Promise(function(resolve, reject) {
            var params = new URLSearchParams();
            Object.keys(data).forEach(function(key) {
                var value = data[key];
                if (typeof value === 'object') {
                    params.append(key, JSON.stringify(value));
                } else {
                    params.append(key, value);
                }
            });

            fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(function(result) {
                if (result.success) {
                    resolve(result.data || result);
                } else {
                    var error = new Error(result.error || 'Unknown error');
                    error.code = result.code || 'UNKNOWN';
                    if (showError) {
                        Notification.addNotification({
                            message: error.message,
                            type: 'error'
                        });
                    }
                    reject(error);
                }
            })
            .catch(function(error) {
                if (showError) {
                    Notification.addNotification({
                        message: 'Connection error. Please try again.',
                        type: 'error'
                    });
                }
                reject(error);
            });
        });
    }

    return {
        /**
         * Get quiz data for attempt
         * @param {number} quizId
         * @param {number} attemptId
         * @returns {Promise}
         */
        getAttempt: function(quizId, attemptId) {
            return request('get_attempt', {
                quizid: quizId,
                attemptid: attemptId
            });
        },

        /**
         * Save answer for a question
         * @param {number} attemptId
         * @param {number} questionId
         * @param {*} answer
         * @returns {Promise}
         */
        saveAnswer: function(attemptId, questionId, answer) {
            return request('save_answer', {
                attemptid: attemptId,
                questionid: questionId,
                answer: answer
            }, false);
        },

        /**
         * Submit attempt for grading
         * @param {number} attemptId
         * @param {Object} answers - All answers
         * @param {Object} times - Time data
         * @returns {Promise}
         */
        submitAttempt: function(attemptId, answers, times) {
            return request('submit_attempt', {
                attemptid: attemptId,
                answers: answers,
                times: times
            });
        },

        /**
         * Get attempt results
         * @param {number} attemptId
         * @returns {Promise}
         */
        getResults: function(attemptId) {
            return request('get_results', {
                attemptid: attemptId
            });
        },

        /**
         * Lookup unit from training.gov.au
         * @param {string} unitCode
         * @returns {Promise}
         */
        lookupTgaUnit: function(unitCode) {
            return request('lookup_unit', {
                unitcode: unitCode
            });
        },

        /**
         * Generate questions for criteria
         * @param {number} quizId
         * @param {Array} criteria
         * @param {Object} options
         * @returns {Promise}
         */
        generateQuestions: function(quizId, criteria, options) {
            return request('generate_questions', {
                quizid: quizId,
                criteria: criteria,
                options: options
            });
        },

        /**
         * Regenerate a single question
         * @param {number} questionId
         * @param {string} reason
         * @returns {Promise}
         */
        regenerateQuestion: function(questionId, reason) {
            return request('regenerate_question', {
                questionid: questionId,
                reason: reason
            });
        },

        /**
         * Save question edits
         * @param {number} questionId
         * @param {Object} updates
         * @returns {Promise}
         */
        updateQuestion: function(questionId, updates) {
            return request('update_question', {
                questionid: questionId,
                updates: updates
            });
        },

        /**
         * Get quiz analytics
         * @param {number} quizId
         * @returns {Promise}
         */
        getAnalytics: function(quizId) {
            return request('get_analytics', {
                quizid: quizId
            });
        },

        /**
         * Low-level request for custom actions
         * @param {string} action
         * @param {Object} data
         * @param {boolean} showError
         * @returns {Promise}
         */
        request: request
    };
});
