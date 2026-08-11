/**
 * AI Quiz Maker  -  Matching Question Type
 * Drag lines between left and right columns
 * 
 * Rules:
 * - Left column fixed
 * - Right column items draggable
 * - Draw animated SVG lines between matched items
 * - Lines snap into place when matched
 * - Shuffle order each attempt
 * 
 * @module     mod_aiquiz/questions/matching
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/questions/matching', [
    'mod_aiquiz/core/animations',
    'mod_aiquiz/core/state'
], function(Animations, State) {
    'use strict';

    function Matching(options) {
        this.element = null;
        this.connections = {};
        this.revealed = false;
        this.activeSource = null;
        this.svgLayer = null;

        this.options = Object.assign({
            questionId: '',
            questionText: '',
            leftItems: [],
            rightItems: [],
            correctMatches: {},
            shuffleRight: true
        }, options);

        this.onChange = null;
    }

    Matching.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-question aiq-question--matching';
        container.setAttribute('data-question-id', this.options.questionId);

        var questionText = document.createElement('h2');
        questionText.className = 'aiq-question__text';
        questionText.innerHTML = this.options.questionText;
        container.appendChild(questionText);

        var matchArea = document.createElement('div');
        matchArea.className = 'aiq-match-area';

        var leftColumn = this.createColumn('left', this.options.leftItems);
        var rightColumn = this.createColumn('right', this.shuffleItems(this.options.rightItems));

        this.svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgLayer.setAttribute('class', 'aiq-match-svg');
        this.svgLayer.style.position = 'absolute';
        this.svgLayer.style.top = '0';
        this.svgLayer.style.left = '0';
        this.svgLayer.style.width = '100%';
        this.svgLayer.style.height = '100%';
        this.svgLayer.style.pointerEvents = 'none';

        matchArea.appendChild(leftColumn);
        matchArea.appendChild(this.svgLayer);
        matchArea.appendChild(rightColumn);

        container.appendChild(matchArea);

        this.element = container;

        Animations.stagger(leftColumn, '.aiq-match-item', Animations.fadeInUp.bind(Animations), 60);
        Animations.stagger(rightColumn, '.aiq-match-item', Animations.fadeInUp.bind(Animations), 60);

        return container;
    };

    Matching.prototype.createColumn = function(side, items) {
        var self = this;
        var column = document.createElement('div');
        column.className = 'aiq-match-column aiq-match-column--' + side;

        items.forEach(function(item) {
            var itemEl = document.createElement('div');
            itemEl.className = 'aiq-match-item';
            itemEl.setAttribute('data-item-id', item.id);
            itemEl.setAttribute('data-side', side);
            itemEl.setAttribute('role', 'button');
            itemEl.setAttribute('tabindex', '0');
            itemEl.innerHTML = item.text;

            var connector = document.createElement('div');
            connector.className = 'aiq-match-connector';
            if (side === 'left') {
                itemEl.appendChild(connector);
            } else {
                itemEl.insertBefore(connector, itemEl.firstChild);
            }

            itemEl.addEventListener('click', function() {
                if (self.revealed) return;
                self.handleItemClick(item.id, side);
            });

            itemEl.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    self.handleItemClick(item.id, side);
                }
            });

            column.appendChild(itemEl);
        });

        return column;
    };

    Matching.prototype.shuffleItems = function(items) {
        if (!this.options.shuffleRight) return items;
        var shuffled = items.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    };

    Matching.prototype.handleItemClick = function(itemId, side) {
        var item = this.element.querySelector('[data-item-id="' + itemId + '"]');

        if (this.activeSource) {
            if (this.activeSource.side === side) {
                this.clearActiveSource();
                item.classList.add('aiq-match-item--active');
                this.activeSource = { id: itemId, side: side };
            } else {
                this.createMatch(
                    side === 'left' ? itemId : this.activeSource.id,
                    side === 'right' ? itemId : this.activeSource.id
                );
                this.clearActiveSource();
            }
        } else {
            item.classList.add('aiq-match-item--active');
            this.activeSource = { id: itemId, side: side };
        }
    };

    Matching.prototype.clearActiveSource = function() {
        if (this.activeSource) {
            var activeEl = this.element.querySelector('[data-item-id="' + this.activeSource.id + '"]');
            if (activeEl) {
                activeEl.classList.remove('aiq-match-item--active');
            }
        }
        this.activeSource = null;
    };

    Matching.prototype.createMatch = function(leftId, rightId) {
        var self = this;

        Object.keys(this.connections).forEach(function(lid) {
            if (self.connections[lid] === rightId) {
                delete self.connections[lid];
            }
        });

        if (this.connections[leftId]) {
            this.removeLine(leftId);
        }

        this.connections[leftId] = rightId;
        this.drawLine(leftId, rightId);
        this.updateState();
    };

    Matching.prototype.drawLine = function(leftId, rightId) {
        var leftEl = this.element.querySelector('.aiq-match-column--left [data-item-id="' + leftId + '"]');
        var rightEl = this.element.querySelector('.aiq-match-column--right [data-item-id="' + rightId + '"]');

        if (!leftEl || !rightEl) return;

        var container = this.element.querySelector('.aiq-match-area');
        var containerRect = container.getBoundingClientRect();

        var leftRect = leftEl.getBoundingClientRect();
        var rightRect = rightEl.getBoundingClientRect();

        var x1 = leftRect.right - containerRect.left;
        var y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
        var x2 = rightRect.left - containerRect.left;
        var y2 = rightRect.top + rightRect.height / 2 - containerRect.top;

        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('class', 'aiq-match-line');
        line.setAttribute('data-left-id', leftId);
        line.setAttribute('stroke', 'var(--accent)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');

        this.svgLayer.appendChild(line);

        leftEl.classList.add('aiq-match-item--connected');
        rightEl.classList.add('aiq-match-item--connected');
    };

    Matching.prototype.removeLine = function(leftId) {
        var line = this.svgLayer.querySelector('[data-left-id="' + leftId + '"]');
        if (line) {
            this.svgLayer.removeChild(line);
        }
    };

    Matching.prototype.updateState = function() {
        State.setAnswer(this.options.questionId, Object.assign({}, this.connections));

        if (this.onChange) {
            this.onChange(this.options.questionId, this.connections);
        }
    };

    Matching.prototype.reveal = function(animate) {
        var self = this;
        this.revealed = true;
        var promises = [];

        this.svgLayer.querySelectorAll('.aiq-match-line').forEach(function(line) {
            var leftId = line.getAttribute('data-left-id');
            var rightId = self.connections[leftId];
            var isCorrect = self.options.correctMatches[leftId] === rightId;

            if (isCorrect) {
                line.setAttribute('stroke', 'var(--success)');
                line.classList.add('aiq-match-line--correct');
            } else {
                line.setAttribute('stroke', 'var(--error)');
                line.classList.add('aiq-match-line--incorrect');
            }
        });

        return Promise.all(promises);
    };

    Matching.prototype.getAnswer = function() {
        return Object.assign({}, this.connections);
    };

    Matching.prototype.setAnswer = function(connections) {
        var self = this;
        if (!connections) return;

        Object.keys(connections).forEach(function(leftId) {
            self.createMatch(leftId, connections[leftId]);
        });
    };

    Matching.prototype.isAnswered = function() {
        return Object.keys(this.connections).length > 0;
    };

    /**
     * Check if all matches are correct
     * @returns {boolean}
     */
    Matching.prototype.isCorrect = function() {
        var self = this;
        var allCorrect = true;
        var requiredMatches = Object.keys(this.options.correctMatches);
        
        if (Object.keys(this.connections).length !== requiredMatches.length) {
            return false;
        }
        
        requiredMatches.forEach(function(leftId) {
            if (self.connections[leftId] !== self.options.correctMatches[leftId]) {
                allCorrect = false;
            }
        });
        
        return allCorrect;
    };

    Matching.prototype.getScore = function() {
        var self = this;
        var correct = 0;
        var total = Object.keys(this.options.correctMatches).length;

        Object.keys(this.options.correctMatches).forEach(function(leftId) {
            if (self.connections[leftId] === self.options.correctMatches[leftId]) {
                correct++;
            }
        });

        return {
            correct: correct,
            total: total,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0
        };
    };

    Matching.prototype.reset = function() {
        this.revealed = false;
        this.connections = {};
        this.activeSource = null;

        while (this.svgLayer.firstChild) {
            this.svgLayer.removeChild(this.svgLayer.firstChild);
        }

        this.element.querySelectorAll('.aiq-match-item--connected, .aiq-match-item--active').forEach(function(el) {
            el.classList.remove('aiq-match-item--connected', 'aiq-match-item--active');
        });
    };

    Matching.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    };

    return Matching;
});
