/**
 * AI Quiz Maker  -  Card UI Component
 * Premium card-based interactions for question options
 * 
 * @module     mod_aiquiz/ui/Card
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['mod_aiquiz/core/animations', 'mod_aiquiz/ui/Feedback'], function(Animations, Feedback) {
    'use strict';

    /**
     * Card component class
     * @class
     */
    function Card(options) {
        this.element = null;
        this.selected = false;
        this.correct = null;
        this.disabled = false;

        this.options = Object.assign({
            id: '',
            content: '',
            icon: null,
            selectable: true,
            variant: 'default'
        }, options);

        this.onClick = null;
    }

    /**
     * Render the card element
     * @returns {HTMLElement}
     */
    Card.prototype.render = function() {
        var card = document.createElement('div');
        card.className = 'aiq-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('data-card-id', this.options.id);

        if (this.options.variant) {
            card.classList.add('aiq-card--' + this.options.variant);
        }

        var inner = document.createElement('div');
        inner.className = 'aiq-card__inner';

        if (this.options.icon) {
            var iconWrapper = document.createElement('div');
            iconWrapper.className = 'aiq-card__icon';
            iconWrapper.innerHTML = this.options.icon;
            inner.appendChild(iconWrapper);
        }

        var content = document.createElement('div');
        content.className = 'aiq-card__content';
        content.innerHTML = this.options.content;
        inner.appendChild(content);

        var indicator = document.createElement('div');
        indicator.className = 'aiq-card__indicator';
        inner.appendChild(indicator);

        card.appendChild(inner);

        this.bindEvents(card);

        this.element = card;
        return card;
    };

    /**
     * Bind event handlers
     * @param {HTMLElement} card
     */
    Card.prototype.bindEvents = function(card) {
        var self = this;

        card.addEventListener('mouseenter', function() {
            if (!self.disabled && !self.selected) {
                Animations.hoverLift(card, true);
            }
        });

        card.addEventListener('mouseleave', function() {
            if (!self.disabled && !self.selected) {
                Animations.hoverLift(card, false);
            }
        });

        card.addEventListener('click', function(e) {
            if (!self.disabled && self.options.selectable) {
                self.toggle();
                if (self.onClick) {
                    self.onClick(self.options.id, self.selected);
                }
            }
        });

        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    };

    /**
     * Select the card
     */
    Card.prototype.select = function() {
        if (this.element && !this.selected) {
            this.selected = true;
            this.element.classList.add('aiq-card--selected');
            this.element.setAttribute('aria-pressed', 'true');
        }
    };

    /**
     * Deselect the card
     */
    Card.prototype.deselect = function() {
        if (this.element && this.selected) {
            this.selected = false;
            this.element.classList.remove('aiq-card--selected');
            this.element.setAttribute('aria-pressed', 'false');
        }
    };

    /**
     * Toggle selection
     */
    Card.prototype.toggle = function() {
        if (this.selected) {
            this.deselect();
        } else {
            this.select();
        }
    };

    /**
     * Mark card as correct
     * @param {boolean} showAnimation
     * @returns {Promise}
     */
    Card.prototype.markCorrect = function(showAnimation) {
        var self = this;
        this.correct = true;
        this.element.classList.add('aiq-card--correct');

        var indicator = this.element.querySelector('.aiq-card__indicator');
        if (indicator) {
            var icon = Feedback.createCorrectIcon(showAnimation);
            indicator.innerHTML = '';
            indicator.appendChild(icon);
        }

        if (showAnimation) {
            return Animations.pulse(this.element);
        }
        return Promise.resolve();
    };

    /**
     * Mark card as incorrect
     * @param {boolean} showAnimation
     * @returns {Promise}
     */
    Card.prototype.markIncorrect = function(showAnimation) {
        var self = this;
        this.correct = false;
        this.element.classList.add('aiq-card--incorrect');

        var indicator = this.element.querySelector('.aiq-card__indicator');
        if (indicator) {
            var icon = Feedback.createIncorrectIcon(showAnimation);
            indicator.innerHTML = '';
            indicator.appendChild(icon);
        }

        if (showAnimation) {
            return Animations.shake(this.element);
        }
        return Promise.resolve();
    };

    /**
     * Disable the card
     */
    Card.prototype.disable = function() {
        this.disabled = true;
        this.element.classList.add('aiq-card--disabled');
        this.element.setAttribute('aria-disabled', 'true');
        this.element.setAttribute('tabindex', '-1');
    };

    /**
     * Enable the card
     */
    Card.prototype.enable = function() {
        this.disabled = false;
        this.element.classList.remove('aiq-card--disabled');
        this.element.removeAttribute('aria-disabled');
        this.element.setAttribute('tabindex', '0');
    };

    /**
     * Get card ID
     * @returns {string}
     */
    Card.prototype.getId = function() {
        return this.options.id;
    };

    /**
     * Check if selected
     * @returns {boolean}
     */
    Card.prototype.isSelected = function() {
        return this.selected;
    };

    /**
     * Destroy the card
     */
    Card.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    };

    return Card;
});
