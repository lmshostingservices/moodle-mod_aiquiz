/**
 * AI Quiz Maker  -  MCQ 2x2 Cards Question Type
 * FLAGSHIP QUESTION TYPE - Sets the quality bar
 * 
 * Rules:
 * - No radio buttons visible
 * - Entire card clickable
 * - Hover = lift + shadow
 * - Selected = accent outline + glow
 * - Correct/incorrect shown with icon + motion
 * - Mobile stacks cards vertically
 * 
 * @module     mod_aiquiz/questions/mcq_cards
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/questions/mcq_cards', [
    'mod_aiquiz/ui/Card',
    'mod_aiquiz/core/animations',
    'mod_aiquiz/core/state'
], function(Card, Animations, State) {
    'use strict';

    /**
     * MCQ Cards Question Type
     * @class
     */
    function MCQCards(options) {
        this.element = null;
        this.cards = [];
        this.selectedId = null;
        this.revealed = false;

        this.options = Object.assign({
            questionId: '',
            questionText: '',
            choices: [],
            correctAnswer: null,
            multiSelect: false,
            columns: 2,
            showLetters: true
        }, options);

        this.onChange = null;
    }

    /**
     * Render the question
     * @returns {HTMLElement}
     */
    MCQCards.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-question aiq-question--mcq';
        container.setAttribute('data-question-id', this.options.questionId);

        var questionText = document.createElement('h2');
        questionText.className = 'aiq-question__text';
        questionText.innerHTML = this.options.questionText;
        container.appendChild(questionText);

        var grid = document.createElement('div');
        grid.className = 'aiq-card-grid';
        grid.classList.add('aiq-card-grid--' + this.options.columns + 'col');
        grid.setAttribute('role', 'radiogroup');
        grid.setAttribute('aria-label', 'Answer options');

        this.options.choices.forEach(function(choice, index) {
            var card = this.createCard(choice, index);
            this.cards.push(card);
            grid.appendChild(card.render());
        }, this);

        container.appendChild(grid);

        this.element = container;

        Animations.stagger(grid, '.aiq-card', Animations.fadeInUp.bind(Animations), 60);

        return container;
    };

    /**
     * Create a choice card
     * @param {Object} choice
     * @param {number} index
     * @returns {Card}
     */
    MCQCards.prototype.createCard = function(choice, index) {
        var self = this;
        var letter = String.fromCharCode(65 + index);

        var content = '';
        if (this.options.showLetters) {
            content += '<span class="aiq-card__letter">' + letter + '</span>';
        }
        content += '<span class="aiq-card__text">' + choice.text + '</span>';

        var card = new Card({
            id: choice.id,
            content: content,
            icon: choice.icon || null,
            variant: 'answer',
            selectable: true
        });

        card.onClick = function(cardId, isSelected) {
            self.handleCardClick(cardId, isSelected, card);
        };

        return card;
    };

    /**
     * Handle card click
     * @param {string} cardId
     * @param {boolean} isSelected
     * @param {Card} clickedCard
     */
    MCQCards.prototype.handleCardClick = function(cardId, isSelected, clickedCard) {
        if (this.revealed) return;

        if (!this.options.multiSelect) {
            this.cards.forEach(function(card) {
                if (card !== clickedCard) {
                    card.deselect();
                }
            });
        }

        if (isSelected) {
            this.selectedId = this.options.multiSelect 
                ? this.getSelectedIds()
                : cardId;
        } else {
            this.selectedId = this.options.multiSelect 
                ? this.getSelectedIds()
                : null;
        }

        State.setAnswer(this.options.questionId, this.selectedId);

        if (this.onChange) {
            this.onChange(this.options.questionId, this.selectedId);
        }
    };

    /**
     * Get all selected IDs (for multi-select)
     * @returns {Array}
     */
    MCQCards.prototype.getSelectedIds = function() {
        return this.cards
            .filter(function(card) { return card.isSelected(); })
            .map(function(card) { return card.getId(); });
    };

    /**
     * Reveal correct/incorrect answers
     * @param {boolean} animate
     * @returns {Promise}
     */
    MCQCards.prototype.reveal = function(animate) {
        var self = this;
        this.revealed = true;
        var promises = [];

        this.cards.forEach(function(card) {
            card.disable();

            var isCorrect = Array.isArray(self.options.correctAnswer)
                ? self.options.correctAnswer.includes(card.getId())
                : card.getId() === self.options.correctAnswer;

            if (isCorrect) {
                promises.push(card.markCorrect(animate && card.isSelected()));
            } else if (card.isSelected()) {
                promises.push(card.markIncorrect(animate));
            }
        });

        return Promise.all(promises);
    };

    /**
     * Get current answer
     * @returns {string|Array|null}
     */
    MCQCards.prototype.getAnswer = function() {
        return this.selectedId;
    };

    /**
     * Set answer (for restoring state)
     * @param {string|Array} answer
     */
    MCQCards.prototype.setAnswer = function(answer) {
        if (!answer) return;

        var answerArray = Array.isArray(answer) ? answer : [answer];

        this.cards.forEach(function(card) {
            if (answerArray.includes(card.getId())) {
                card.select();
            }
        });

        this.selectedId = answer;
    };

    /**
     * Check if answered
     * @returns {boolean}
     */
    MCQCards.prototype.isAnswered = function() {
        if (this.options.multiSelect) {
            return this.selectedId && this.selectedId.length > 0;
        }
        return this.selectedId !== null;
    };

    /**
     * Check if correct
     * @returns {boolean}
     */
    MCQCards.prototype.isCorrect = function() {
        if (!this.isAnswered()) return false;

        if (this.options.multiSelect) {
            var correct = this.options.correctAnswer.slice().sort();
            var selected = this.selectedId.slice().sort();
            return JSON.stringify(correct) === JSON.stringify(selected);
        }

        return this.selectedId === this.options.correctAnswer;
    };

    /**
     * Reset the question
     */
    MCQCards.prototype.reset = function() {
        this.revealed = false;
        this.selectedId = null;
        this.cards.forEach(function(card) {
            card.deselect();
            card.enable();
            card.element.classList.remove('aiq-card--correct', 'aiq-card--incorrect');
        });
    };

    /**
     * Destroy the question
     */
    MCQCards.prototype.destroy = function() {
        this.cards.forEach(function(card) {
            card.destroy();
        });
        this.cards = [];

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    };

    return MCQCards;
});
