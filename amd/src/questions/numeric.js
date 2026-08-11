/**
 * AI Quiz Maker  -  Numerical Question Type
 * Number input with tolerance and unit validation
 * 
 * Rules:
 * - Accept numerical input
 * - Optional unit validation
 * - Tolerance range supported
 * - Partial scoring for close answers
 * - Inline unit label
 * 
 * @module     mod_aiquiz/questions/numeric
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'mod_aiquiz/core/animations',
    'mod_aiquiz/core/state',
    'mod_aiquiz/ui/Feedback'
], function(Animations, State, Feedback) {
    'use strict';

    function Numeric(options) {
        this.element = null;
        this.inputEl = null;
        this.currentAnswer = null;
        this.revealed = false;

        this.options = Object.assign({
            questionId: '',
            questionText: '',
            correctValue: 0,
            tolerance: 0,
            toleranceType: 'absolute',
            unit: '',
            requireUnit: false,
            decimalPlaces: -1,
            placeholder: 'Enter a number...'
        }, options);

        this.onChange = null;
    }

    Numeric.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-question aiq-question--numeric';
        container.setAttribute('data-question-id', this.options.questionId);

        var questionText = document.createElement('h2');
        questionText.className = 'aiq-question__text';
        questionText.innerHTML = this.options.questionText;
        container.appendChild(questionText);

        var inputWrapper = document.createElement('div');
        inputWrapper.className = 'aiq-numeric-wrapper';

        var input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'decimal';
        input.className = 'aiq-numeric-input';
        input.placeholder = this.options.placeholder;
        input.setAttribute('autocomplete', 'off');

        var self = this;
        input.addEventListener('input', function(e) {
            var value = e.target.value.replace(/[^0-9.\-]/g, '');
            e.target.value = value;
            self.handleInput(value);
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });

        inputWrapper.appendChild(input);

        if (this.options.unit) {
            var unit = document.createElement('span');
            unit.className = 'aiq-numeric-unit';
            unit.textContent = this.options.unit;
            inputWrapper.appendChild(unit);
        }

        container.appendChild(inputWrapper);

        if (this.options.tolerance > 0) {
            var hint = document.createElement('div');
            hint.className = 'aiq-numeric-hint';
            hint.textContent = 'Answers within ' + this.formatTolerance() + ' are accepted';
            container.appendChild(hint);
        }

        var feedback = document.createElement('div');
        feedback.className = 'aiq-numeric-feedback';
        container.appendChild(feedback);

        this.element = container;
        this.inputEl = input;

        Animations.fadeInUp(inputWrapper);

        return container;
    };

    Numeric.prototype.formatTolerance = function() {
        if (this.options.toleranceType === 'percentage') {
            return this.options.tolerance + '%';
        }
        return '+/-' + this.options.tolerance + (this.options.unit ? ' ' + this.options.unit : '');
    };

    Numeric.prototype.handleInput = function(value) {
        if (value === '' || value === '-' || value === '.') {
            this.currentAnswer = null;
        } else {
            this.currentAnswer = parseFloat(value);
            if (isNaN(this.currentAnswer)) {
                this.currentAnswer = null;
            }
        }

        State.setAnswer(this.options.questionId, this.currentAnswer);

        if (this.onChange) {
            this.onChange(this.options.questionId, this.currentAnswer);
        }
    };

    Numeric.prototype.checkAnswer = function() {
        if (this.currentAnswer === null) {
            return { correct: false, partial: false, difference: null };
        }

        var correct = this.options.correctValue;
        var user = this.currentAnswer;
        var difference = Math.abs(correct - user);
        var tolerance = this.options.tolerance;

        if (this.options.toleranceType === 'percentage') {
            tolerance = Math.abs(correct * (this.options.tolerance / 100));
        }

        if (difference === 0) {
            return { correct: true, partial: false, difference: 0 };
        }

        if (difference <= tolerance) {
            return { correct: true, partial: true, difference: difference };
        }

        return { correct: false, partial: false, difference: difference };
    };

    Numeric.prototype.reveal = function(animate) {
        var self = this;
        this.revealed = true;
        var promises = [];

        this.inputEl.disabled = true;

        var result = this.checkAnswer();
        var feedback = this.element.querySelector('.aiq-numeric-feedback');
        var inputWrapper = this.element.querySelector('.aiq-numeric-wrapper');

        if (result.correct && !result.partial) {
            inputWrapper.classList.add('aiq-numeric-wrapper--correct');
            
            var correctFeedback = new Feedback({
                type: 'correct',
                message: 'Exactly correct!',
                showIcon: true,
                animate: animate
            });
            feedback.innerHTML = '';
            feedback.appendChild(correctFeedback.render());
            feedback.classList.add('aiq-numeric-feedback--correct');

            if (animate) {
                promises.push(Animations.pulse(inputWrapper));
            }
        } else if (result.correct && result.partial) {
            inputWrapper.classList.add('aiq-numeric-wrapper--partial');
            
            var partialFeedback = new Feedback({
                type: 'partial',
                message: 'Close!',
                showIcon: true,
                showCorrectAnswer: this.formatNumber(this.options.correctValue),
                animate: animate
            });
            feedback.innerHTML = '';
            feedback.appendChild(partialFeedback.render());
            feedback.classList.add('aiq-numeric-feedback--partial');

            if (animate) {
                promises.push(Animations.pulse(inputWrapper));
            }
        } else {
            inputWrapper.classList.add('aiq-numeric-wrapper--incorrect');
            
            var incorrectFeedback = new Feedback({
                type: 'incorrect',
                message: 'Incorrect',
                showIcon: true,
                showCorrectAnswer: this.formatNumber(this.options.correctValue) +
                                   (this.options.unit ? ' ' + this.options.unit : ''),
                animate: animate
            });
            feedback.innerHTML = '';
            feedback.appendChild(incorrectFeedback.render());
            feedback.classList.add('aiq-numeric-feedback--incorrect');

            if (animate) {
                promises.push(Animations.shake(inputWrapper));
            }
        }

        feedback.style.display = 'block';
        Animations.fadeInUp(feedback);

        return Promise.all(promises);
    };

    Numeric.prototype.formatNumber = function(num) {
        if (this.options.decimalPlaces >= 0) {
            return num.toFixed(this.options.decimalPlaces);
        }
        return num.toString();
    };

    Numeric.prototype.getAnswer = function() {
        return this.currentAnswer;
    };

    Numeric.prototype.setAnswer = function(answer) {
        if (answer === null || answer === undefined) return;

        this.currentAnswer = parseFloat(answer);
        if (this.inputEl) {
            this.inputEl.value = this.currentAnswer;
        }
    };

    Numeric.prototype.isAnswered = function() {
        return this.currentAnswer !== null;
    };

    Numeric.prototype.isCorrect = function() {
        return this.checkAnswer().correct;
    };

    Numeric.prototype.getScore = function() {
        var result = this.checkAnswer();

        if (result.correct && !result.partial) {
            return { correct: 1, total: 1, percentage: 100 };
        } else if (result.correct && result.partial) {
            return { correct: 0.8, total: 1, percentage: 80 };
        }

        return { correct: 0, total: 1, percentage: 0 };
    };

    Numeric.prototype.reset = function() {
        this.revealed = false;
        this.currentAnswer = null;

        if (this.inputEl) {
            this.inputEl.value = '';
            this.inputEl.disabled = false;
        }

        var inputWrapper = this.element.querySelector('.aiq-numeric-wrapper');
        inputWrapper.classList.remove(
            'aiq-numeric-wrapper--correct',
            'aiq-numeric-wrapper--partial',
            'aiq-numeric-wrapper--incorrect'
        );

        var feedback = this.element.querySelector('.aiq-numeric-feedback');
        feedback.style.display = 'none';
        feedback.classList.remove(
            'aiq-numeric-feedback--correct',
            'aiq-numeric-feedback--partial',
            'aiq-numeric-feedback--incorrect'
        );
    };

    Numeric.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.inputEl = null;
    };

    return Numeric;
});
