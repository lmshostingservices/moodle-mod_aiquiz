/**
 * AI Quiz Maker  -  Attempt Orchestrator
 * Main controller for quiz attempts with all question types
 * 
 * @module     mod_aiquiz/attempt
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/attempt', [
    'mod_aiquiz/core/state',
    'mod_aiquiz/core/api',
    'mod_aiquiz/core/animations',
    'mod_aiquiz/ui/ProgressBar',
    'mod_aiquiz/ui/Button',
    'mod_aiquiz/ui/Feedback',
    'mod_aiquiz/questions/mcq_cards',
    'mod_aiquiz/questions/tf_block',
    'mod_aiquiz/questions/matching',
    'mod_aiquiz/questions/sorting',
    'mod_aiquiz/questions/ordering',
    'mod_aiquiz/questions/short_answer',
    'mod_aiquiz/questions/numeric',
    'mod_aiquiz/questions/drag_table',
    'mod_aiquiz/questions/gap_dropdown',
    'mod_aiquiz/questions/gap_drag',
    'mod_aiquiz/questions/category_sort'
], function(
    State,
    Api,
    Animations,
    ProgressBar,
    Button,
    Feedback,
    MCQCards,
    TFBlock,
    Matching,
    Sorting,
    Ordering,
    ShortAnswer,
    Numeric,
    DragTable,
    GapDropdown,
    GapDrag,
    CategorySort
) {
    'use strict';

    var QuestionTypes = {
        'mcq': MCQCards,
        'mcq_cards': MCQCards,
        'multichoice': MCQCards,
        'truefalse': TFBlock,
        'tf_block': TFBlock,
        'matching': Matching,
        'sorting': Sorting,
        'ordering': Ordering,
        'shortanswer': ShortAnswer,
        'short_answer': ShortAnswer,
        'numerical': Numeric,
        'numeric': Numeric,
        'dragtable': DragTable,
        'drag_table': DragTable,
        'gapselect': GapDropdown,
        'gap_dropdown': GapDropdown,
        'ddwtos': GapDrag,
        'gap_drag': GapDrag,
        'category_sort': CategorySort,
        'categorysort': CategorySort
    };

    function Attempt(options) {
        this.container = null;
        this.progressBar = null;
        this.questionInstances = [];
        this.currentQuestionEl = null;
        this.navButtons = {};

        this.options = Object.assign({
            containerId: 'aiq-attempt-container',
            quizId: null,
            attemptId: null,
            questions: [],
            savedAnswers: {},
            showProgress: true,
            allowNavigation: true,
            autoSave: true
        }, options);
    }

    Attempt.prototype.init = function() {
        var self = this;

        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error('Attempt container not found:', this.options.containerId);
            return;
        }

        State.init({
            quizId: this.options.quizId,
            attemptId: this.options.attemptId,
            questions: this.options.questions,
            answers: this.options.savedAnswers
        });

        State.on('answerChange', function(data) {
            if (self.options.autoSave) {
                self.saveAnswer(data.questionId, data.answer);
            }
            self.updateProgressBar();
        });

        State.on('progressChange', function(data) {
            self.updateProgressBar();
        });

        this.render();
        this.showQuestion(0);

        State.startQuestionTimer();

        return this;
    };

    Attempt.prototype.render = function() {
        this.container.innerHTML = '';
        this.container.className = 'aiquiz-container aiq-container';

        var main = document.createElement('div');
        main.className = 'aiq-main';

        if (this.options.showProgress) {
            var progressWrapper = document.createElement('div');
            progressWrapper.className = 'aiq-progress-wrapper';

            this.progressBar = new ProgressBar({
                total: this.options.questions.length,
                current: 0,
                answered: [],
                showLabels: true
            });

            var self = this;
            this.progressBar.onSegmentClick = function(index) {
                if (self.options.allowNavigation) {
                    self.goToQuestion(index);
                }
            };

            progressWrapper.appendChild(this.progressBar.render());
            main.appendChild(progressWrapper);
        }

        var questionArea = document.createElement('div');
        questionArea.className = 'aiq-question-area';
        questionArea.id = 'aiq-question-area';
        main.appendChild(questionArea);

        var navArea = document.createElement('div');
        navArea.className = 'aiq-nav-area';

        if (this.options.allowNavigation) {
            this.navButtons.prev = new Button({
                id: 'nav-prev',
                text: 'Previous',
                variant: 'secondary',
                icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10 12L6 8l4-4"/></svg>',
                iconPosition: 'left'
            });
            this.navButtons.prev.onClick = this.prev.bind(this);
            navArea.appendChild(this.navButtons.prev.render());
        }

        var spacer = document.createElement('div');
        spacer.style.flex = '1';
        navArea.appendChild(spacer);

        this.navButtons.next = new Button({
            id: 'nav-next',
            text: 'Next',
            variant: 'default',
            icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 4l4 4-4 4"/></svg>',
            iconPosition: 'right'
        });
        this.navButtons.next.onClick = this.next.bind(this);
        navArea.appendChild(this.navButtons.next.render());

        main.appendChild(navArea);

        this.container.appendChild(main);
    };

    Attempt.prototype.createQuestionInstance = function(questionData) {
        var TypeClass = QuestionTypes[questionData.type] || QuestionTypes['mcq'];

        var instance = new TypeClass(questionData);

        var qId = questionData.questionId || questionData.id;
        var savedAnswer = State.getAnswer(qId);
        if (savedAnswer) {
            if (instance.setAnswer) {
                setTimeout(function() {
                    instance.setAnswer(savedAnswer);
                }, 0);
            }
        }

        return instance;
    };

    Attempt.prototype.showQuestion = function(index) {
        var self = this;
        var questionArea = document.getElementById('aiq-question-area');

        if (this.currentQuestionEl) {
            Animations.fadeOutDown(this.currentQuestionEl).then(function() {
                questionArea.innerHTML = '';
                self.renderQuestion(index, questionArea);
            });
        } else {
            this.renderQuestion(index, questionArea);
        }
    };

    Attempt.prototype.renderQuestion = function(index, questionArea) {
        var questionData = this.options.questions[index];
        if (!questionData) return;

        var instance = this.createQuestionInstance(questionData);
        var element = instance.render();

        this.questionInstances[index] = instance;
        this.currentQuestionEl = element;

        questionArea.appendChild(element);
        Animations.fadeInUp(element);

        this.updateNavButtons();

        if (this.progressBar) {
            this.progressBar.goTo(index);
        }
    };

    Attempt.prototype.goToQuestion = function(index) {
        if (index >= 0 && index < this.options.questions.length) {
            State.goToQuestion(index);
            this.showQuestion(index);
        }
    };

    Attempt.prototype.next = function() {
        var state = State.getState();
        var nextIndex = state.currentIndex + 1;

        if (nextIndex >= this.options.questions.length) {
            this.showSubmitConfirm();
        } else {
            this.goToQuestion(nextIndex);
        }
    };

    Attempt.prototype.prev = function() {
        var state = State.getState();
        var prevIndex = state.currentIndex - 1;

        if (prevIndex >= 0) {
            this.goToQuestion(prevIndex);
        }
    };

    Attempt.prototype.updateNavButtons = function() {
        var state = State.getState();
        var isFirst = state.currentIndex === 0;
        var isLast = state.currentIndex === this.options.questions.length - 1;

        if (this.navButtons.prev) {
            if (isFirst) {
                this.navButtons.prev.disable();
            } else {
                this.navButtons.prev.enable();
            }
        }

        if (this.navButtons.next) {
            if (isLast) {
                this.navButtons.next.setText('Submit');
            } else {
                this.navButtons.next.setText('Next');
            }
        }
    };

    Attempt.prototype.updateProgressBar = function() {
        if (!this.progressBar) return;

        var state = State.getState();
        var answeredIndices = [];

        this.options.questions.forEach(function(q, index) {
            var qId = q.questionId || q.id;
            if (qId && state.answers[qId] !== undefined) {
                answeredIndices.push(index);
            }
        });

        this.progressBar.update(state.currentIndex, answeredIndices);
    };

    Attempt.prototype.saveAnswer = function(questionId, answer) {
        var state = State.getState();

        Api.saveAnswer(state.attemptId, questionId, answer).catch(function(error) {
            console.warn('Failed to save answer:', error);
        });
    };

    Attempt.prototype.showSubmitConfirm = function() {
        var state = State.getState();
        var answered = Object.keys(state.answers).length;
        var total = this.options.questions.length;

        if (answered < total) {
            var confirm = window.confirm(
                'You have answered ' + answered + ' of ' + total + ' questions.\n\n' +
                'Are you sure you want to submit?'
            );

            if (!confirm) return;
        }

        this.submit();
    };

    Attempt.prototype.submit = function() {
        var self = this;

        this.navButtons.next.setLoading(true);
        if (this.navButtons.prev) {
            this.navButtons.prev.disable();
        }

        var state = State.getState();

        Api.submitAttempt(state.attemptId, state.answers, state.questionTimes)
            .then(function(result) {
                State.submit();
                self.showResults(result);
            })
            .catch(function(error) {
                self.navButtons.next.setLoading(false);
                if (self.navButtons.prev) {
                    self.navButtons.prev.enable();
                }
                alert('Failed to submit. Please try again.');
            });
    };

    Attempt.prototype.showResults = function(results) {
        var self = this;

        this.questionInstances.forEach(function(instance, index) {
            if (instance && instance.reveal) {
                instance.reveal(true);
            }
        });

        if (this.progressBar) {
            results.questions.forEach(function(q, index) {
                if (q.correct) {
                    self.progressBar.markCorrect(index);
                } else {
                    self.progressBar.markIncorrect(index);
                }
            });
        }

        this.navButtons.next.setText('Review Complete');
        this.navButtons.next.disable();

        if (results.score && results.score.percentage === 100) {
            Feedback.showCelebration(this.container, {
                score: 100,
                message: 'Perfect Score!'
            });
        }
    };

    Attempt.prototype.destroy = function() {
        this.questionInstances.forEach(function(instance) {
            if (instance && instance.destroy) {
                instance.destroy();
            }
        });

        if (this.progressBar) {
            this.progressBar.destroy();
        }

        Object.values(this.navButtons).forEach(function(btn) {
            if (btn && btn.destroy) {
                btn.destroy();
            }
        });

        if (this.container) {
            this.container.innerHTML = '';
        }
    };

    return {
        init: function(options) {
            var attempt = new Attempt(options);
            return attempt.init();
        },
        Attempt: Attempt
    };
});
