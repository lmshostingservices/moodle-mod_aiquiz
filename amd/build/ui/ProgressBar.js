/**
 * AI Quiz Maker  -  Progress Bar Component
 * Linear.app-inspired segmented progress with animations
 * 
 * @module     mod_aiquiz/ui/ProgressBar
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/ui/ProgressBar', [], function() {
    'use strict';

    /**
     * ProgressBar component class
     * @class
     */
    function ProgressBar(options) {
        this.element = null;
        this.segments = [];
        this.currentIndex = 0;
        this.answeredSet = new Set();

        this.options = Object.assign({
            total: 0,
            current: 0,
            answered: [],
            variant: 'default',
            showLabels: false
        }, options);

        this.onSegmentClick = null;
    }

    /**
     * Render the progress bar
     * @returns {HTMLElement}
     */
    ProgressBar.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-progress';

        if (this.options.showLabels) {
            var labelStart = document.createElement('span');
            labelStart.className = 'aiq-progress__label aiq-progress__label--start';
            labelStart.textContent = 'Question 1';
            container.appendChild(labelStart);
        }

        var bar = document.createElement('div');
        bar.className = 'aiq-progress__bar';
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-valuenow', this.options.current + 1);
        bar.setAttribute('aria-valuemin', '1');
        bar.setAttribute('aria-valuemax', this.options.total);

        for (var i = 0; i < this.options.total; i++) {
            var segment = this.createSegment(i);
            this.segments.push(segment);
            bar.appendChild(segment);
        }

        container.appendChild(bar);

        if (this.options.showLabels) {
            var labelEnd = document.createElement('span');
            labelEnd.className = 'aiq-progress__label aiq-progress__label--end';
            labelEnd.textContent = 'Question ' + this.options.total;
            container.appendChild(labelEnd);
        }

        this.element = container;
        this.update(this.options.current, this.options.answered);

        return container;
    };

    /**
     * Create a segment element
     * @param {number} index
     * @returns {HTMLElement}
     */
    ProgressBar.prototype.createSegment = function(index) {
        var self = this;
        var segment = document.createElement('button');
        segment.className = 'aiq-progress__segment';
        segment.setAttribute('type', 'button');
        segment.setAttribute('data-index', index);
        segment.setAttribute('aria-label', 'Question ' + (index + 1));
        segment.setAttribute('title', 'Question ' + (index + 1));

        segment.addEventListener('click', function() {
            if (self.onSegmentClick) {
                self.onSegmentClick(index);
            }
        });

        return segment;
    };

    /**
     * Update progress state
     * @param {number} currentIndex
     * @param {Array|Set} answered - Array or Set of answered indices
     */
    ProgressBar.prototype.update = function(currentIndex, answered) {
        this.currentIndex = currentIndex;

        if (Array.isArray(answered)) {
            this.answeredSet = new Set(answered);
        } else if (answered instanceof Set) {
            this.answeredSet = answered;
        }

        this.segments.forEach(function(segment, index) {
            segment.classList.remove(
                'aiq-progress__segment--current',
                'aiq-progress__segment--answered',
                'aiq-progress__segment--past',
                'aiq-progress__segment--future'
            );

            if (index === currentIndex) {
                segment.classList.add('aiq-progress__segment--current');
            } else if (this.answeredSet.has(index)) {
                segment.classList.add('aiq-progress__segment--answered');
            } else if (index < currentIndex) {
                segment.classList.add('aiq-progress__segment--past');
            } else {
                segment.classList.add('aiq-progress__segment--future');
            }
        }, this);

        if (this.element) {
            this.element.querySelector('.aiq-progress__bar')
                .setAttribute('aria-valuenow', currentIndex + 1);
        }
    };

    /**
     * Mark question as answered
     * @param {number} index
     */
    ProgressBar.prototype.markAnswered = function(index) {
        this.answeredSet.add(index);
        var segment = this.segments[index];
        if (segment && index !== this.currentIndex) {
            segment.classList.add('aiq-progress__segment--answered');
        }
    };

    /**
     * Mark question as correct
     * @param {number} index
     */
    ProgressBar.prototype.markCorrect = function(index) {
        var segment = this.segments[index];
        if (segment) {
            segment.classList.add('aiq-progress__segment--correct');
        }
    };

    /**
     * Mark question as incorrect
     * @param {number} index
     */
    ProgressBar.prototype.markIncorrect = function(index) {
        var segment = this.segments[index];
        if (segment) {
            segment.classList.add('aiq-progress__segment--incorrect');
        }
    };

    /**
     * Go to specific question
     * @param {number} index
     */
    ProgressBar.prototype.goTo = function(index) {
        if (index >= 0 && index < this.segments.length) {
            this.update(index, this.answeredSet);
        }
    };

    /**
     * Get answered count
     * @returns {number}
     */
    ProgressBar.prototype.getAnsweredCount = function() {
        return this.answeredSet.size;
    };

    /**
     * Get percentage complete
     * @returns {number}
     */
    ProgressBar.prototype.getPercentage = function() {
        if (this.options.total === 0) return 0;
        return Math.round((this.answeredSet.size / this.options.total) * 100);
    };

    /**
     * Destroy the component
     */
    ProgressBar.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.segments = [];
    };

    return ProgressBar;
});
