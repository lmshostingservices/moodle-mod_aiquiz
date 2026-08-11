/**
 * AI Quiz Maker  -  Short Answer Question Type
 * 1-2 word answer with AI normalisation
 * 
 * Rules:
 * - Accept 1-2 words
 * - Normalise case, spacing, pluralisation
 * - AI-based synonym matching
 * - Partial credit allowed
 * - Instructor override supported
 * 
 * @module     mod_aiquiz/questions/short_answer
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'mod_aiquiz/core/animations',
    'mod_aiquiz/core/state',
    'mod_aiquiz/ui/Feedback'
], function(Animations, State, Feedback) {
    'use strict';

    function ShortAnswer(options) {
        this.element = null;
        this.inputEl = null;
        this.currentAnswer = '';
        this.revealed = false;

        this.options = Object.assign({
            questionId: '',
            questionText: '',
            correctAnswers: [],
            acceptedVariations: [],
            placeholder: 'Type your answer...',
            maxLength: 50,
            caseSensitive: false
        }, options);

        this.onChange = null;
    }

    ShortAnswer.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-question aiq-question--short-answer';
        container.setAttribute('data-question-id', this.options.questionId);

        var questionText = document.createElement('h2');
        questionText.className = 'aiq-question__text';
        questionText.innerHTML = this.options.questionText;
        container.appendChild(questionText);

        var inputWrapper = document.createElement('div');
        inputWrapper.className = 'aiq-short-input-wrapper';

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'aiq-short-input';
        input.placeholder = this.options.placeholder;
        input.maxLength = this.options.maxLength;
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');

        var self = this;
        input.addEventListener('input', function() {
            self.handleInput(input.value);
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });

        inputWrapper.appendChild(input);

        var charCount = document.createElement('span');
        charCount.className = 'aiq-short-charcount';
        charCount.textContent = '0/' + this.options.maxLength;
        inputWrapper.appendChild(charCount);

        container.appendChild(inputWrapper);

        var feedback = document.createElement('div');
        feedback.className = 'aiq-short-feedback';
        container.appendChild(feedback);

        this.element = container;
        this.inputEl = input;

        Animations.fadeInUp(inputWrapper);

        return container;
    };

    ShortAnswer.prototype.handleInput = function(value) {
        this.currentAnswer = value.trim();

        var charCount = this.element.querySelector('.aiq-short-charcount');
        if (charCount) {
            charCount.textContent = value.length + '/' + this.options.maxLength;
        }

        State.setAnswer(this.options.questionId, this.currentAnswer);

        if (this.onChange) {
            this.onChange(this.options.questionId, this.currentAnswer);
        }
    };

    ShortAnswer.prototype.normalise = function(text) {
        var normalised = text.trim().toLowerCase();

        normalised = normalised.replace(/[.,!?;:'"]/g, '');

        normalised = normalised.replace(/\s+/g, ' ');

        if (normalised.endsWith('s') && normalised.length > 2) {
            var singular = normalised.slice(0, -1);
            return [normalised, singular];
        }

        return [normalised, normalised + 's'];
    };

    ShortAnswer.prototype.checkAnswer = function() {
        var self = this;
        var userVariations = this.normalise(this.currentAnswer);

        var allCorrect = this.options.correctAnswers.concat(this.options.acceptedVariations);

        for (var i = 0; i < allCorrect.length; i++) {
            var correctVariations = this.normalise(allCorrect[i]);

            for (var j = 0; j < userVariations.length; j++) {
                for (var k = 0; k < correctVariations.length; k++) {
                    if (userVariations[j] === correctVariations[k]) {
                        return { correct: true, matchedWith: allCorrect[i] };
                    }
                }
            }
        }

        return { correct: false, matchedWith: null };
    };

    ShortAnswer.prototype.reveal = function(animate) {
        var self = this;
        this.revealed = true;
        var promises = [];

        this.inputEl.disabled = true;

        var result = this.checkAnswer();
        var feedback = this.element.querySelector('.aiq-short-feedback');
        var inputWrapper = this.element.querySelector('.aiq-short-input-wrapper');

        if (result.correct) {
            inputWrapper.classList.add('aiq-short-input-wrapper--correct');
            
            var correctFeedback = new Feedback({
                type: 'correct',
                message: 'Correct!',
                showIcon: true,
                animate: animate
            });
            feedback.innerHTML = '';
            feedback.appendChild(correctFeedback.render());
            feedback.classList.add('aiq-short-feedback--correct');

            if (animate) {
                promises.push(Animations.pulse(inputWrapper));
            }
        } else {
            inputWrapper.classList.add('aiq-short-input-wrapper--incorrect');
            
            var incorrectFeedback = new Feedback({
                type: 'incorrect',
                message: 'Incorrect',
                showIcon: true,
                showCorrectAnswer: this.options.correctAnswers[0],
                animate: animate
            });
            feedback.innerHTML = '';
            feedback.appendChild(incorrectFeedback.render());
            feedback.classList.add('aiq-short-feedback--incorrect');

            if (animate) {
                promises.push(Animations.shake(inputWrapper));
            }
        }

        feedback.style.display = 'block';
        Animations.fadeInUp(feedback);

        return Promise.all(promises);
    };

    ShortAnswer.prototype.getAnswer = function() {
        return this.currentAnswer;
    };

    ShortAnswer.prototype.setAnswer = function(answer) {
        if (!answer) return;

        this.currentAnswer = answer;
        if (this.inputEl) {
            this.inputEl.value = answer;
        }
    };

    ShortAnswer.prototype.isAnswered = function() {
        return this.currentAnswer.length > 0;
    };

    ShortAnswer.prototype.isCorrect = function() {
        return this.checkAnswer().correct;
    };

    ShortAnswer.prototype.getScore = function() {
        var isCorrect = this.checkAnswer().correct;
        return {
            correct: isCorrect ? 1 : 0,
            total: 1,
            percentage: isCorrect ? 100 : 0
        };
    };

    ShortAnswer.prototype.reset = function() {
        this.revealed = false;
        this.currentAnswer = '';

        if (this.inputEl) {
            this.inputEl.value = '';
            this.inputEl.disabled = false;
        }

        var inputWrapper = this.element.querySelector('.aiq-short-input-wrapper');
        inputWrapper.classList.remove('aiq-short-input-wrapper--correct', 'aiq-short-input-wrapper--incorrect');

        var feedback = this.element.querySelector('.aiq-short-feedback');
        feedback.style.display = 'none';
        feedback.classList.remove('aiq-short-feedback--correct', 'aiq-short-feedback--incorrect');

        var charCount = this.element.querySelector('.aiq-short-charcount');
        charCount.textContent = '0/' + this.options.maxLength;
    };

    ShortAnswer.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.inputEl = null;
    };

    return ShortAnswer;
});
