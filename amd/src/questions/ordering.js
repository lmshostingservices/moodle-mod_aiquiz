/**
 * AI Quiz Maker  -  Ordering (Process Steps) Question Type
 * Timeline-style vertical layout for process/workflow ordering
 * 
 * Rules:
 * - Timeline-style vertical list
 * - Each item represents a step
 * - Steps numbered automatically
 * - Numbers animate in when correct
 * - Emphasise flow and clarity
 * 
 * @module     mod_aiquiz/questions/ordering
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'mod_aiquiz/core/animations',
    'mod_aiquiz/core/state'
], function(Animations, State) {
    'use strict';

    function Ordering(options) {
        this.element = null;
        this.currentOrder = [];
        this.revealed = false;
        this.draggedItem = null;

        this.options = Object.assign({
            questionId: '',
            questionText: '',
            processTitle: '',
            steps: [],
            correctOrder: []
        }, options);

        this.onChange = null;
    }

    Ordering.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-question aiq-question--ordering';
        container.setAttribute('data-question-id', this.options.questionId);

        var questionText = document.createElement('h2');
        questionText.className = 'aiq-question__text';
        questionText.innerHTML = this.options.questionText;
        container.appendChild(questionText);

        if (this.options.processTitle) {
            var processTitle = document.createElement('div');
            processTitle.className = 'aiq-order-title';
            processTitle.innerHTML = '<strong>Process:</strong> ' + this.options.processTitle;
            container.appendChild(processTitle);
        }

        var timeline = document.createElement('div');
        timeline.className = 'aiq-order-timeline';

        this.currentOrder = this.shuffleItems(this.options.steps.map(function(s) { return s.id; }));

        this.currentOrder.forEach(function(stepId, index) {
            var step = this.options.steps.find(function(s) { return s.id === stepId; });
            var stepEl = this.createStep(step, index);
            timeline.appendChild(stepEl);
        }, this);

        container.appendChild(timeline);

        this.element = container;

        Animations.stagger(timeline, '.aiq-order-step', Animations.fadeInUp.bind(Animations), 80);

        return container;
    };

    Ordering.prototype.createStep = function(step, index) {
        var self = this;

        var stepEl = document.createElement('div');
        stepEl.className = 'aiq-order-step';
        stepEl.setAttribute('draggable', 'true');
        stepEl.setAttribute('data-step-id', step.id);
        stepEl.setAttribute('role', 'listitem');
        stepEl.setAttribute('tabindex', '0');

        var connector = document.createElement('div');
        connector.className = 'aiq-order-connector';
        stepEl.appendChild(connector);

        var number = document.createElement('div');
        number.className = 'aiq-order-number';
        number.textContent = index + 1;
        stepEl.appendChild(number);

        var content = document.createElement('div');
        content.className = 'aiq-order-content';

        var text = document.createElement('div');
        text.className = 'aiq-order-text';
        text.innerHTML = step.text;
        content.appendChild(text);

        if (step.description) {
            var desc = document.createElement('div');
            desc.className = 'aiq-order-desc';
            desc.innerHTML = step.description;
            content.appendChild(desc);
        }

        stepEl.appendChild(content);

        var handle = document.createElement('div');
        handle.className = 'aiq-order-handle';
        handle.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6h8v1H4V6zm0 3h8v1H4V9z"/></svg>';
        stepEl.appendChild(handle);

        stepEl.addEventListener('dragstart', function(e) {
            if (self.revealed) {
                e.preventDefault();
                return;
            }
            self.draggedItem = step.id;
            stepEl.classList.add('aiq-order-step--dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        stepEl.addEventListener('dragend', function() {
            stepEl.classList.remove('aiq-order-step--dragging');
            self.draggedItem = null;
        });

        stepEl.addEventListener('dragover', function(e) {
            if (self.revealed || !self.draggedItem) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            var timeline = self.element.querySelector('.aiq-order-timeline');
            var rect = stepEl.getBoundingClientRect();
            var midY = rect.top + rect.height / 2;
            var draggedEl = timeline.querySelector('[data-step-id="' + self.draggedItem + '"]');

            if (e.clientY < midY) {
                timeline.insertBefore(draggedEl, stepEl);
            } else {
                timeline.insertBefore(draggedEl, stepEl.nextSibling);
            }

            self.updateNumbers();
        });

        stepEl.addEventListener('drop', function(e) {
            if (self.revealed) return;
            e.preventDefault();
            self.updateOrder();
        });

        stepEl.addEventListener('keydown', function(e) {
            if (self.revealed) return;
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                self.moveStep(step.id, -1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                self.moveStep(step.id, 1);
            }
        });

        return stepEl;
    };

    Ordering.prototype.shuffleItems = function(items) {
        var shuffled = items.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    };

    Ordering.prototype.updateNumbers = function() {
        var timeline = this.element.querySelector('.aiq-order-timeline');
        var steps = timeline.querySelectorAll('.aiq-order-step');

        steps.forEach(function(stepEl, index) {
            var number = stepEl.querySelector('.aiq-order-number');
            if (number) {
                number.textContent = index + 1;
            }
        });
    };

    Ordering.prototype.moveStep = function(stepId, direction) {
        var timeline = this.element.querySelector('.aiq-order-timeline');
        var steps = Array.from(timeline.querySelectorAll('.aiq-order-step'));
        var stepEl = timeline.querySelector('[data-step-id="' + stepId + '"]');
        var idx = steps.indexOf(stepEl);
        var newIdx = idx + direction;

        if (newIdx < 0 || newIdx >= steps.length) return;

        if (direction < 0) {
            timeline.insertBefore(stepEl, steps[idx - 1]);
        } else {
            timeline.insertBefore(steps[idx + 1], stepEl);
        }

        this.updateNumbers();
        this.updateOrder();
        stepEl.focus();
    };

    Ordering.prototype.updateOrder = function() {
        var timeline = this.element.querySelector('.aiq-order-timeline');
        var steps = timeline.querySelectorAll('.aiq-order-step');
        var self = this;

        this.currentOrder = [];
        steps.forEach(function(stepEl) {
            self.currentOrder.push(stepEl.getAttribute('data-step-id'));
        });

        State.setAnswer(this.options.questionId, this.currentOrder.slice());

        if (this.onChange) {
            this.onChange(this.options.questionId, this.currentOrder);
        }
    };

    Ordering.prototype.reveal = function(animate) {
        var self = this;
        this.revealed = true;
        var promises = [];

        var timeline = this.element.querySelector('.aiq-order-timeline');
        var steps = timeline.querySelectorAll('.aiq-order-step');

        steps.forEach(function(stepEl, index) {
            var stepId = stepEl.getAttribute('data-step-id');
            var correctIdx = self.options.correctOrder.indexOf(stepId);
            var isCorrect = index === correctIdx;

            stepEl.setAttribute('draggable', 'false');

            if (isCorrect) {
                stepEl.classList.add('aiq-order-step--correct');
                if (animate) {
                    promises.push(Animations.pulse(stepEl));
                }
            } else {
                stepEl.classList.add('aiq-order-step--incorrect');

                var badge = document.createElement('span');
                badge.className = 'aiq-order-correct-pos';
                badge.textContent = 'Should be #' + (correctIdx + 1);
                stepEl.querySelector('.aiq-order-content').appendChild(badge);
            }
        });

        return Promise.all(promises);
    };

    Ordering.prototype.getAnswer = function() {
        return this.currentOrder.slice();
    };

    Ordering.prototype.setAnswer = function(order) {
        if (!order || !Array.isArray(order)) return;
        
        var self = this;
        this.currentOrder = order;

        var timeline = this.element.querySelector('.aiq-order-timeline');
        order.forEach(function(stepId) {
            var stepEl = timeline.querySelector('[data-step-id="' + stepId + '"]');
            if (stepEl) {
                timeline.appendChild(stepEl);
            }
        });

        this.updateNumbers();
    };

    Ordering.prototype.isAnswered = function() {
        return this.currentOrder.length > 0;
    };

    Ordering.prototype.isCorrect = function() {
        return JSON.stringify(this.currentOrder) === JSON.stringify(this.options.correctOrder);
    };

    Ordering.prototype.getScore = function() {
        var self = this;
        var correct = 0;
        var total = this.options.correctOrder.length;

        this.currentOrder.forEach(function(stepId, index) {
            if (self.options.correctOrder[index] === stepId) {
                correct++;
            }
        });

        return {
            correct: correct,
            total: total,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0
        };
    };

    Ordering.prototype.reset = function() {
        this.revealed = false;
        this.currentOrder = this.shuffleItems(this.options.steps.map(function(s) { return s.id; }));

        var timeline = this.element.querySelector('.aiq-order-timeline');
        timeline.innerHTML = '';

        this.currentOrder.forEach(function(stepId, index) {
            var step = this.options.steps.find(function(s) { return s.id === stepId; });
            var stepEl = this.createStep(step, index);
            timeline.appendChild(stepEl);
        }, this);
    };

    Ordering.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    };

    return Ordering;
});
