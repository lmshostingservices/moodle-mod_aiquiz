/**
 * AI Quiz Maker  -  Sorting Question Type
 * Drag to reorder items with ghost placeholder
 * 
 * Rules:
 * - Cards stacked vertically
 * - Drag to reorder
 * - Ghost placeholder shows drop position
 * - No jitter
 * - Drag handle optional
 * 
 * @module     mod_aiquiz/questions/sorting
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'mod_aiquiz/core/animations',
    'mod_aiquiz/core/state'
], function(Animations, State) {
    'use strict';

    function Sorting(options) {
        this.element = null;
        this.currentOrder = [];
        this.revealed = false;
        this.draggedItem = null;
        this.placeholder = null;

        this.options = Object.assign({
            questionId: '',
            questionText: '',
            items: [],
            correctOrder: [],
            showHandles: true
        }, options);

        this.onChange = null;
    }

    Sorting.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-question aiq-question--sorting';
        container.setAttribute('data-question-id', this.options.questionId);

        var questionText = document.createElement('h2');
        questionText.className = 'aiq-question__text';
        questionText.innerHTML = this.options.questionText;
        container.appendChild(questionText);

        var sortArea = document.createElement('div');
        sortArea.className = 'aiq-sort-area';

        this.currentOrder = this.shuffleItems(this.options.items.map(function(i) { return i.id; }));

        this.currentOrder.forEach(function(itemId) {
            var item = this.options.items.find(function(i) { return i.id === itemId; });
            var itemEl = this.createItem(item);
            sortArea.appendChild(itemEl);
        }, this);

        container.appendChild(sortArea);

        this.element = container;

        Animations.stagger(sortArea, '.aiq-sort-item', Animations.fadeInUp.bind(Animations), 60);

        return container;
    };

    Sorting.prototype.createItem = function(item) {
        var self = this;

        var itemEl = document.createElement('div');
        itemEl.className = 'aiq-sort-item';
        itemEl.setAttribute('draggable', 'true');
        itemEl.setAttribute('data-item-id', item.id);
        itemEl.setAttribute('role', 'listitem');
        itemEl.setAttribute('tabindex', '0');

        if (this.options.showHandles) {
            var handle = document.createElement('div');
            handle.className = 'aiq-sort-handle';
            handle.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/></svg>';
            itemEl.appendChild(handle);
        }

        var content = document.createElement('div');
        content.className = 'aiq-sort-content';
        content.innerHTML = item.text;
        itemEl.appendChild(content);

        itemEl.addEventListener('dragstart', function(e) {
            if (self.revealed) {
                e.preventDefault();
                return;
            }
            self.draggedItem = item.id;
            itemEl.classList.add('aiq-sort-item--dragging');
            e.dataTransfer.effectAllowed = 'move';
            
            self.createPlaceholder();
        });

        itemEl.addEventListener('dragend', function() {
            itemEl.classList.remove('aiq-sort-item--dragging');
            self.removePlaceholder();
            self.draggedItem = null;
        });

        itemEl.addEventListener('dragover', function(e) {
            if (self.revealed || !self.draggedItem) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            var sortArea = self.element.querySelector('.aiq-sort-area');
            var items = Array.from(sortArea.querySelectorAll('.aiq-sort-item:not(.aiq-sort-item--dragging)'));
            var rect = itemEl.getBoundingClientRect();
            var midY = rect.top + rect.height / 2;

            if (e.clientY < midY) {
                sortArea.insertBefore(self.placeholder, itemEl);
            } else {
                sortArea.insertBefore(self.placeholder, itemEl.nextSibling);
            }
        });

        itemEl.addEventListener('drop', function(e) {
            if (self.revealed || !self.draggedItem) return;
            e.preventDefault();

            var sortArea = self.element.querySelector('.aiq-sort-area');
            var draggedEl = sortArea.querySelector('[data-item-id="' + self.draggedItem + '"]');

            if (draggedEl && self.placeholder) {
                sortArea.insertBefore(draggedEl, self.placeholder);
            }

            self.updateOrder();
        });

        itemEl.addEventListener('keydown', function(e) {
            if (self.revealed) return;
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                self.moveItem(item.id, -1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                self.moveItem(item.id, 1);
            }
        });

        return itemEl;
    };

    Sorting.prototype.createPlaceholder = function() {
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'aiq-sort-placeholder';
    };

    Sorting.prototype.removePlaceholder = function() {
        if (this.placeholder && this.placeholder.parentNode) {
            this.placeholder.parentNode.removeChild(this.placeholder);
        }
        this.placeholder = null;
    };

    Sorting.prototype.shuffleItems = function(items) {
        var shuffled = items.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    };

    Sorting.prototype.moveItem = function(itemId, direction) {
        var idx = this.currentOrder.indexOf(itemId);
        var newIdx = idx + direction;

        if (newIdx < 0 || newIdx >= this.currentOrder.length) return;

        var sortArea = this.element.querySelector('.aiq-sort-area');
        var items = sortArea.querySelectorAll('.aiq-sort-item');
        var itemEl = sortArea.querySelector('[data-item-id="' + itemId + '"]');

        if (direction < 0 && idx > 0) {
            sortArea.insertBefore(itemEl, items[idx - 1]);
        } else if (direction > 0 && idx < items.length - 1) {
            sortArea.insertBefore(items[idx + 1], itemEl);
        }

        this.updateOrder();
        itemEl.focus();
    };

    Sorting.prototype.updateOrder = function() {
        var sortArea = this.element.querySelector('.aiq-sort-area');
        var items = sortArea.querySelectorAll('.aiq-sort-item');
        var self = this;

        this.currentOrder = [];
        items.forEach(function(item) {
            self.currentOrder.push(item.getAttribute('data-item-id'));
        });

        State.setAnswer(this.options.questionId, this.currentOrder.slice());

        if (this.onChange) {
            this.onChange(this.options.questionId, this.currentOrder);
        }
    };

    Sorting.prototype.reveal = function(animate) {
        var self = this;
        this.revealed = true;
        var promises = [];

        var sortArea = this.element.querySelector('.aiq-sort-area');
        var items = sortArea.querySelectorAll('.aiq-sort-item');

        items.forEach(function(itemEl, index) {
            var itemId = itemEl.getAttribute('data-item-id');
            var correctIdx = self.options.correctOrder.indexOf(itemId);
            var isCorrect = index === correctIdx;

            itemEl.setAttribute('draggable', 'false');

            if (isCorrect) {
                itemEl.classList.add('aiq-sort-item--correct');
                if (animate) {
                    promises.push(Animations.pulse(itemEl));
                }
            } else {
                itemEl.classList.add('aiq-sort-item--incorrect');
            }

            var badge = document.createElement('span');
            badge.className = 'aiq-sort-position';
            badge.textContent = (correctIdx + 1);
            itemEl.insertBefore(badge, itemEl.firstChild);
        });

        return Promise.all(promises);
    };

    Sorting.prototype.getAnswer = function() {
        return this.currentOrder.slice();
    };

    Sorting.prototype.setAnswer = function(order) {
        if (!order || !Array.isArray(order)) return;

        var self = this;
        this.currentOrder = order;

        var sortArea = this.element.querySelector('.aiq-sort-area');
        order.forEach(function(itemId) {
            var itemEl = sortArea.querySelector('[data-item-id="' + itemId + '"]');
            if (itemEl) {
                sortArea.appendChild(itemEl);
            }
        });
    };

    Sorting.prototype.isAnswered = function() {
        return this.currentOrder.length > 0;
    };

    Sorting.prototype.isCorrect = function() {
        return JSON.stringify(this.currentOrder) === JSON.stringify(this.options.correctOrder);
    };

    Sorting.prototype.getScore = function() {
        var self = this;
        var correct = 0;
        var total = this.options.correctOrder.length;

        this.currentOrder.forEach(function(itemId, index) {
            if (self.options.correctOrder[index] === itemId) {
                correct++;
            }
        });

        return {
            correct: correct,
            total: total,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0
        };
    };

    Sorting.prototype.reset = function() {
        this.revealed = false;
        this.currentOrder = this.shuffleItems(this.options.items.map(function(i) { return i.id; }));

        var sortArea = this.element.querySelector('.aiq-sort-area');
        sortArea.innerHTML = '';

        this.currentOrder.forEach(function(itemId) {
            var item = this.options.items.find(function(i) { return i.id === itemId; });
            var itemEl = this.createItem(item);
            sortArea.appendChild(itemEl);
        }, this);
    };

    Sorting.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    };

    return Sorting;
});
