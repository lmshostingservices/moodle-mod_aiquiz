/**
 * AI Quiz Maker  -  State Management
 * Attempt state, answers, progress tracking
 * 
 * @module     mod_aiquiz/core/state
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/core/state', [], function() {
    'use strict';

    /**
     * Quiz state object
     */
    var state = {
        quizId: null,
        attemptId: null,
        questions: [],
        currentIndex: 0,
        answers: {},
        startTime: null,
        questionTimes: {},
        submitted: false,
        locked: false
    };

    /**
     * Event listeners
     */
    var listeners = {
        'stateChange': [],
        'answerChange': [],
        'progressChange': [],
        'submit': []
    };

    return {
        /**
         * Initialize state with quiz data
         * @param {Object} data - Quiz initialization data
         */
        init: function(data) {
            state.quizId = data.quizId || null;
            state.attemptId = data.attemptId || null;
            state.questions = data.questions || [];
            state.currentIndex = data.currentIndex || 0;
            state.answers = data.answers || {};
            state.startTime = Date.now();
            state.submitted = false;
            state.locked = false;

            state.questions.forEach(function(q) {
                var qId = q.questionId || q.id;
                state.questionTimes[qId] = {
                    start: null,
                    total: 0,
                    attempts: 0
                };
            });

            this.emit('stateChange', state);
        },

        /**
         * Get current state
         * @returns {Object}
         */
        getState: function() {
            return Object.assign({}, state);
        },

        /**
         * Get current question
         * @returns {Object|null}
         */
        getCurrentQuestion: function() {
            var q = state.questions[state.currentIndex] || null;
            return q;
        },

        /**
         * Get question ID from question object (normalizes id vs questionId)
         * @param {Object} question
         * @returns {string|null}
         */
        getQuestionId: function(question) {
            if (!question) return null;
            return question.questionId || question.id || null;
        },

        /**
         * Navigate to question by index
         * @param {number} index
         */
        goToQuestion: function(index) {
            if (index >= 0 && index < state.questions.length && !state.locked) {
                this.pauseQuestionTimer();
                state.currentIndex = index;
                this.startQuestionTimer();
                this.emit('progressChange', {
                    current: state.currentIndex,
                    total: state.questions.length,
                    answered: Object.keys(state.answers).length
                });
            }
        },

        /**
         * Go to next question
         */
        next: function() {
            this.goToQuestion(state.currentIndex + 1);
        },

        /**
         * Go to previous question
         */
        prev: function() {
            this.goToQuestion(state.currentIndex - 1);
        },

        /**
         * Set answer for a question
         * @param {string} questionId
         * @param {*} answer
         */
        setAnswer: function(questionId, answer) {
            if (state.locked) return;

            var prevAnswer = state.answers[questionId];
            state.answers[questionId] = answer;

            if (state.questionTimes[questionId]) {
                state.questionTimes[questionId].attempts++;
            }

            this.emit('answerChange', {
                questionId: questionId,
                answer: answer,
                prevAnswer: prevAnswer,
                allAnswers: Object.assign({}, state.answers)
            });

            this.emit('progressChange', {
                current: state.currentIndex,
                total: state.questions.length,
                answered: Object.keys(state.answers).length
            });
        },

        /**
         * Get answer for a question
         * @param {string} questionId
         * @returns {*}
         */
        getAnswer: function(questionId) {
            return state.answers[questionId];
        },

        /**
         * Check if all questions answered
         * @returns {boolean}
         */
        isComplete: function() {
            return Object.keys(state.answers).length === state.questions.length;
        },

        /**
         * Get progress percentage
         * @returns {number}
         */
        getProgress: function() {
            if (state.questions.length === 0) return 0;
            return Math.round((Object.keys(state.answers).length / state.questions.length) * 100);
        },

        /**
         * Start timer for current question
         */
        startQuestionTimer: function() {
            var question = this.getCurrentQuestion();
            var qId = this.getQuestionId(question);
            if (question && qId && state.questionTimes[qId]) {
                state.questionTimes[qId].start = Date.now();
            }
        },

        /**
         * Pause timer for current question
         */
        pauseQuestionTimer: function() {
            var question = this.getCurrentQuestion();
            var qId = this.getQuestionId(question);
            if (question && qId && state.questionTimes[qId]) {
                var timer = state.questionTimes[qId];
                if (timer.start) {
                    timer.total += Date.now() - timer.start;
                    timer.start = null;
                }
            }
        },

        /**
         * Get time spent on question (ms)
         * @param {string} questionId
         * @returns {number}
         */
        getQuestionTime: function(questionId) {
            var timer = state.questionTimes[questionId];
            if (!timer) return 0;
            var total = timer.total;
            if (timer.start) {
                total += Date.now() - timer.start;
            }
            return total;
        },

        /**
         * Get total time spent (ms)
         * @returns {number}
         */
        getTotalTime: function() {
            return Date.now() - state.startTime;
        },

        /**
         * Lock state (no more changes)
         */
        lock: function() {
            state.locked = true;
            this.pauseQuestionTimer();
        },

        /**
         * Mark as submitted
         */
        submit: function() {
            this.lock();
            state.submitted = true;
            this.emit('submit', {
                answers: Object.assign({}, state.answers),
                times: Object.assign({}, state.questionTimes),
                totalTime: this.getTotalTime()
            });
        },

        /**
         * Add event listener
         * @param {string} event
         * @param {Function} callback
         */
        on: function(event, callback) {
            if (listeners[event]) {
                listeners[event].push(callback);
            }
        },

        /**
         * Remove event listener
         * @param {string} event
         * @param {Function} callback
         */
        off: function(event, callback) {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter(function(cb) {
                    return cb !== callback;
                });
            }
        },

        /**
         * Emit event to all listeners
         * @param {string} event
         * @param {*} data
         */
        emit: function(event, data) {
            if (listeners[event]) {
                listeners[event].forEach(function(callback) {
                    try {
                        callback(data);
                    } catch (e) {
                        console.error('State event error:', e);
                    }
                });
            }
        }
    };
});
