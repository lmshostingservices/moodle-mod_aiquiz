/**
 * AI Quiz Maker  -  AI Question Generator
 * Handles AI generation workflow with progress tracking
 * 
 * @module     mod_aiquiz/ai/generator
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/ai/generator', [
    'mod_aiquiz/ai/prompts',
    'mod_aiquiz/core/api'
], function(Prompts, Api) {
    'use strict';

    function Generator(options) {
        this.options = Object.assign({
            quizId: null,
            onProgress: null,
            onComplete: null,
            onError: null
        }, options);

        this.queue = [];
        this.results = [];
        this.currentIndex = 0;
        this.isRunning = false;
    }

    Generator.prototype.addToQueue = function(criterion, questionType, count) {
        this.queue.push({
            criterion: criterion,
            questionType: questionType,
            count: count || 1
        });
        return this;
    };

    Generator.prototype.clearQueue = function() {
        this.queue = [];
        this.results = [];
        this.currentIndex = 0;
        return this;
    };

    Generator.prototype.start = function() {
        var self = this;

        if (this.isRunning) {
            console.warn('Generator is already running');
            return Promise.reject(new Error('Already running'));
        }

        if (this.queue.length === 0) {
            return Promise.resolve([]);
        }

        this.isRunning = true;
        this.results = [];
        this.currentIndex = 0;

        return new Promise(function(resolve, reject) {
            self._processNext(resolve, reject);
        });
    };

    Generator.prototype._processNext = function(resolve, reject) {
        var self = this;

        if (this.currentIndex >= this.queue.length) {
            this.isRunning = false;
            if (this.options.onComplete) {
                this.options.onComplete(this.results);
            }
            resolve(this.results);
            return;
        }

        var item = this.queue[this.currentIndex];
        var prompt = Prompts.buildPrompt(item.criterion, item.questionType, {
            count: item.count
        });

        var progress = {
            current: this.currentIndex + 1,
            total: this.queue.length,
            percent: Math.round(((this.currentIndex + 1) / this.queue.length) * 100),
            criterion: item.criterion,
            status: 'generating'
        };

        if (this.options.onProgress) {
            this.options.onProgress(progress);
        }

        Api.request('generate_questions', {
            quizid: this.options.quizId,
            criterion: item.criterion,
            question_type: item.questionType,
            count: item.count,
            prompt: prompt
        }).then(function(response) {
            var questions = response.questions || response;
            
            if (Array.isArray(questions)) {
                questions.forEach(function(q) {
                    q.criterion_id = item.criterion.id;
                    q.criterion_code = item.criterion.code;
                    q.question_type = item.questionType;
                });
                self.results = self.results.concat(questions);
            }

            progress.status = 'complete';
            // B5-FIX: questions.length was outside the Array.isArray guard  -  would read .length
            // on a non-array object if the API returned an unexpected shape, producing undefined.
            progress.questionsGenerated = Array.isArray(questions) ? questions.length : 0;
            if (self.options.onProgress) {
                self.options.onProgress(progress);
            }

            self.currentIndex++;
            self._processNext(resolve, reject);

        }).catch(function(error) {
            progress.status = 'error';
            progress.error = error.message;

            if (self.options.onError) {
                self.options.onError(error, item);
            }

            if (self.options.onProgress) {
                self.options.onProgress(progress);
            }

            self.currentIndex++;
            self._processNext(resolve, reject);
        });
    };

    Generator.prototype.regenerateQuestion = function(question, reason) {
        var prompt = Prompts.getRegenerationPrompt(question, reason);

        return Api.request('regenerate_question', {
            quizid: this.options.quizId,
            question: question,
            reason: reason,
            prompt: prompt
        });
    };

    Generator.prototype.refineDistractors = function(question, feedback) {
        var prompt = Prompts.getDistractorRefinementPrompt(question, feedback);

        return Api.request('refine_distractors', {
            quizid: this.options.quizId,
            question: question,
            prompt: prompt
        });
    };

    Generator.prototype.generateExplanations = function(question) {
        var prompt = Prompts.getExplanationPrompt(question);

        return Api.request('generate_explanations', {
            quizid: this.options.quizId,
            question: question,
            prompt: prompt
        });
    };

    Generator.prototype.getResults = function() {
        return this.results;
    };

    Generator.prototype.getProgress = function() {
        return {
            current: this.currentIndex,
            total: this.queue.length,
            percent: this.queue.length > 0 ? Math.round((this.currentIndex / this.queue.length) * 100) : 0,
            isRunning: this.isRunning,
            resultsCount: this.results.length
        };
    };

    return Generator;
});
