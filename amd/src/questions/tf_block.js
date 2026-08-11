/**
 * AI Quiz Maker  -  True/False Multi-Statement Block
 * Multiple statements with individual True/False toggles
 * 
 * Rules:
 * - One scenario or prompt
 * - 3-6 independent statements
 * - Each statement has its own True/False toggle
 * - Partial scoring supported
 * - Toggles are pill-style, not switches
 * - Statements animate in sequentially
 * 
 * @module     mod_aiquiz/questions/tf_block
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'mod_aiquiz/core/animations',
    'mod_aiquiz/core/state',
    'mod_aiquiz/ui/Feedback'
], function(Animations, State, Feedback) {
    'use strict';

    /**
     * TFBlock Question Type
     * @class
     */
    function TFBlock(options) {
        this.element = null;
        this.statements = [];
        this.answers = {};
        this.revealed = false;

        this.options = Object.assign({
            questionId: '',
            scenario: '',
            statements: [],
            showPartialScore: true
        }, options);

        this.onChange = null;
    }

    /**
     * Render the question
     * @returns {HTMLElement}
     */
    TFBlock.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-question aiq-question--tf-block';
        container.setAttribute('data-question-id', this.options.questionId);

        if (this.options.scenario) {
            var scenario = document.createElement('div');
            scenario.className = 'aiq-tf-scenario';
            scenario.innerHTML = this.options.scenario;
            container.appendChild(scenario);
        }

        var statementsContainer = document.createElement('div');
        statementsContainer.className = 'aiq-tf-statements';

        this.options.statements.forEach(function(stmt, index) {
            var statementEl = this.createStatement(stmt, index);
            this.statements.push(statementEl);
            statementsContainer.appendChild(statementEl);
        }, this);

        container.appendChild(statementsContainer);

        this.element = container;

        Animations.stagger(statementsContainer, '.aiq-tf-statement', Animations.fadeInUp.bind(Animations), 80);

        return container;
    };

    /**
     * Create a statement element
     * @param {Object} stmt
     * @param {number} index
     * @returns {HTMLElement}
     */
    TFBlock.prototype.createStatement = function(stmt, index) {
        var self = this;

        var statement = document.createElement('div');
        statement.className = 'aiq-tf-statement';
        statement.setAttribute('data-statement-id', stmt.id);

        var number = document.createElement('span');
        number.className = 'aiq-tf-statement__number';
        number.textContent = (index + 1) + '.';
        statement.appendChild(number);

        var text = document.createElement('div');
        text.className = 'aiq-tf-statement__text';
        text.innerHTML = stmt.text;
        statement.appendChild(text);

        var toggle = document.createElement('div');
        toggle.className = 'aiq-tf-toggle';
        toggle.setAttribute('role', 'radiogroup');
        toggle.setAttribute('aria-label', 'True or False for statement ' + (index + 1));

        var trueBtn = this.createToggleButton('true', 'True', stmt.id);
        var falseBtn = this.createToggleButton('false', 'False', stmt.id);

        toggle.appendChild(trueBtn);
        toggle.appendChild(falseBtn);
        statement.appendChild(toggle);

        var indicator = document.createElement('div');
        indicator.className = 'aiq-tf-statement__indicator';
        statement.appendChild(indicator);

        return statement;
    };

    /**
     * Create toggle button
     * @param {string} value
     * @param {string} label
     * @param {string} statementId
     * @returns {HTMLElement}
     */
    TFBlock.prototype.createToggleButton = function(value, label, statementId) {
        var self = this;

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'aiq-tf-toggle__btn aiq-tf-toggle__btn--' + value;
        button.textContent = label;
        button.setAttribute('data-value', value);
        button.setAttribute('aria-pressed', 'false');

        button.addEventListener('click', function() {
            if (self.revealed) return;

            var toggle = button.parentElement;
            var sibling = toggle.querySelector('.aiq-tf-toggle__btn--' + (value === 'true' ? 'false' : 'true'));

            toggle.querySelectorAll('.aiq-tf-toggle__btn').forEach(function(btn) {
                btn.classList.remove('aiq-tf-toggle__btn--active');
                btn.setAttribute('aria-pressed', 'false');
            });

            button.classList.add('aiq-tf-toggle__btn--active');
            button.setAttribute('aria-pressed', 'true');

            self.answers[statementId] = value === 'true';
            self.updateState();
        });

        return button;
    };

    /**
     * Update state with current answers
     */
    TFBlock.prototype.updateState = function() {
        State.setAnswer(this.options.questionId, Object.assign({}, this.answers));

        if (this.onChange) {
            this.onChange(this.options.questionId, this.answers);
        }
    };

    /**
     * Reveal correct/incorrect answers
     * @param {boolean} animate
     * @returns {Promise}
     */
    TFBlock.prototype.reveal = function(animate) {
        var self = this;
        this.revealed = true;
        var promises = [];

        this.statements.forEach(function(statementEl) {
            var statementId = statementEl.getAttribute('data-statement-id');
            var stmt = self.options.statements.find(function(s) { return s.id === statementId; });
            var userAnswer = self.answers[statementId];
            var isCorrect = userAnswer === stmt.correct;

            statementEl.querySelectorAll('.aiq-tf-toggle__btn').forEach(function(btn) {
                btn.disabled = true;
            });

            var indicator = statementEl.querySelector('.aiq-tf-statement__indicator');
            
            if (isCorrect) {
                statementEl.classList.add('aiq-tf-statement--correct');
                if (indicator) {
                    var icon = Feedback.createCorrectIcon(animate);
                    indicator.innerHTML = '';
                    indicator.appendChild(icon);
                }
                if (animate) {
                    promises.push(Animations.pulse(statementEl));
                }
            } else if (userAnswer !== undefined) {
                statementEl.classList.add('aiq-tf-statement--incorrect');
                if (indicator) {
                    var icon = Feedback.createIncorrectIcon(animate);
                    indicator.innerHTML = '';
                    indicator.appendChild(icon);
                }
                if (animate) {
                    promises.push(Animations.shake(statementEl));
                }
            }
        });

        return Promise.all(promises);
    };

    /**
     * Get current answers
     * @returns {Object}
     */
    TFBlock.prototype.getAnswer = function() {
        return Object.assign({}, this.answers);
    };

    /**
     * Set answers (for restoring state)
     * @param {Object} answers
     */
    TFBlock.prototype.setAnswer = function(answers) {
        var self = this;
        if (!answers) return;

        Object.keys(answers).forEach(function(statementId) {
            self.answers[statementId] = answers[statementId];

            var statementEl = self.element.querySelector('[data-statement-id="' + statementId + '"]');
            if (statementEl) {
                var value = answers[statementId] ? 'true' : 'false';
                var btn = statementEl.querySelector('[data-value="' + value + '"]');
                if (btn) {
                    btn.classList.add('aiq-tf-toggle__btn--active');
                    btn.setAttribute('aria-pressed', 'true');
                }
            }
        });
    };

    /**
     * Check if fully answered
     * @returns {boolean}
     */
    TFBlock.prototype.isAnswered = function() {
        return Object.keys(this.answers).length === this.options.statements.length;
    };

    /**
     * Check if all statements are correctly answered
     * @returns {boolean}
     */
    TFBlock.prototype.isCorrect = function() {
        var self = this;
        
        if (!this.isAnswered()) {
            return false;
        }
        
        var allCorrect = true;
        this.options.statements.forEach(function(stmt) {
            if (self.answers[stmt.id] !== stmt.correct) {
                allCorrect = false;
            }
        });
        
        return allCorrect;
    };

    /**
     * Get score (partial scoring)
     * @returns {Object}
     */
    TFBlock.prototype.getScore = function() {
        var self = this;
        var correct = 0;
        var total = this.options.statements.length;

        this.options.statements.forEach(function(stmt) {
            if (self.answers[stmt.id] === stmt.correct) {
                correct++;
            }
        });

        return {
            correct: correct,
            total: total,
            percentage: Math.round((correct / total) * 100)
        };
    };

    /**
     * Reset the question
     */
    TFBlock.prototype.reset = function() {
        this.revealed = false;
        this.answers = {};

        this.statements.forEach(function(statementEl) {
            statementEl.classList.remove('aiq-tf-statement--correct', 'aiq-tf-statement--incorrect');
            statementEl.querySelectorAll('.aiq-tf-toggle__btn').forEach(function(btn) {
                btn.disabled = false;
                btn.classList.remove('aiq-tf-toggle__btn--active');
                btn.setAttribute('aria-pressed', 'false');
            });
        });
    };

    /**
     * Destroy the question
     */
    TFBlock.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.statements = [];
    };

    return TFBlock;
});
