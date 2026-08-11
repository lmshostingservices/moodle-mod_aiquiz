/**
 * AI Quiz Maker  -  Category Sorting Question Type
 * Sort items into labeled categories (buckets)
 * 
 * Rules:
 * - 2-4 category buckets displayed horizontally
 * - Items start in an "unsorted" bank
 * - Drag items to correct category
 * - Categories have distinct colors
 * - Supports WHS hazard/control sorting
 * - Partial scoring supported
 * 
 * @module     mod_aiquiz/questions/category_sort
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/questions/category_sort', [
    'mod_aiquiz/core/animations',
    'mod_aiquiz/core/state',
    'mod_aiquiz/ui/Feedback'
], function(Animations, State, Feedback) {
    'use strict';

    /**
     * CategorySort Question Type
     * @class
     */
    function CategorySort(options) {
        this.element = null;
        this.placements = {};
        this.revealed = false;
        this.draggedItem = null;

        this.options = Object.assign({
            questionId: '',
            questionText: '',
            categories: [],
            items: [],
            shuffleItems: true
        }, options);

        this.onChange = null;
    }

    /**
     * Render the question
     * @returns {HTMLElement}
     */
    CategorySort.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-question aiq-question--category-sort';
        container.setAttribute('data-question-id', this.options.questionId);

        var questionText = document.createElement('h2');
        questionText.className = 'aiq-question__text';
        questionText.innerHTML = this.options.questionText;
        container.appendChild(questionText);

        var itemBank = this.createItemBank();
        container.appendChild(itemBank);

        var categoriesArea = this.createCategoriesArea();
        container.appendChild(categoriesArea);

        this.element = container;

        var self = this;
        setTimeout(function() {
            Animations.stagger(itemBank, '.aiq-catsort-item', Animations.scaleIn.bind(Animations), 40);
        }, 100);

        return container;
    };

    /**
     * Create the unsorted items bank
     * @returns {HTMLElement}
     */
    CategorySort.prototype.createItemBank = function() {
        var self = this;

        var bank = document.createElement('div');
        bank.className = 'aiq-catsort-bank';

        var label = document.createElement('div');
        label.className = 'aiq-catsort-bank__label';
        label.textContent = 'Drag each item to the correct category:';
        bank.appendChild(label);

        var itemsContainer = document.createElement('div');
        itemsContainer.className = 'aiq-catsort-items';
        itemsContainer.setAttribute('data-zone', 'bank');

        var items = this.options.items.slice();
        if (this.options.shuffleItems) {
            items = this.shuffleArray(items);
        }

        items.forEach(function(item) {
            var itemEl = self.createItem(item);
            itemsContainer.appendChild(itemEl);
        });

        this.setupDropZone(itemsContainer, 'bank');
        bank.appendChild(itemsContainer);

        return bank;
    };

    /**
     * Create a draggable item
     * @param {Object} item
     * @returns {HTMLElement}
     */
    CategorySort.prototype.createItem = function(item) {
        var self = this;

        var itemEl = document.createElement('div');
        itemEl.className = 'aiq-catsort-item';
        itemEl.setAttribute('draggable', 'true');
        itemEl.setAttribute('data-item-id', item.id);
        itemEl.setAttribute('role', 'button');
        itemEl.setAttribute('tabindex', '0');
        itemEl.textContent = item.text;

        itemEl.addEventListener('dragstart', function(e) {
            if (self.revealed) {
                e.preventDefault();
                return;
            }
            self.draggedItem = item.id;
            itemEl.classList.add('aiq-catsort-item--dragging');
            e.dataTransfer.setData('text/plain', item.id);
            e.dataTransfer.effectAllowed = 'move';
        });

        itemEl.addEventListener('dragend', function() {
            itemEl.classList.remove('aiq-catsort-item--dragging');
            self.draggedItem = null;
            self.clearDropHighlights();
        });

        itemEl.addEventListener('keydown', function(e) {
            if (self.revealed) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                self.showKeyboardPlacement(item.id, itemEl);
            }
        });

        return itemEl;
    };

    /**
     * Create the categories area
     * @returns {HTMLElement}
     */
    CategorySort.prototype.createCategoriesArea = function() {
        var self = this;

        var area = document.createElement('div');
        area.className = 'aiq-catsort-categories';

        var colCount = Math.min(this.options.categories.length, 4);
        area.style.gridTemplateColumns = 'repeat(' + colCount + ', 1fr)';

        this.options.categories.forEach(function(category, index) {
            var categoryEl = self.createCategory(category, index);
            area.appendChild(categoryEl);
        });

        return area;
    };

    /**
     * Create a category bucket
     * @param {Object} category
     * @param {number} index
     * @returns {HTMLElement}
     */
    CategorySort.prototype.createCategory = function(category, index) {
        var self = this;

        var categoryEl = document.createElement('div');
        categoryEl.className = 'aiq-catsort-category';
        categoryEl.setAttribute('data-category-id', category.id);

        if (category.color) {
            categoryEl.style.setProperty('--category-color', category.color);
        } else {
            var colors = ['hsl(217 91% 60%)', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(280 65% 60%)'];
            categoryEl.style.setProperty('--category-color', colors[index % colors.length]);
        }

        var header = document.createElement('div');
        header.className = 'aiq-catsort-category__header';
        
        if (category.icon) {
            var icon = document.createElement('span');
            icon.className = 'aiq-catsort-category__icon';
            icon.innerHTML = category.icon;
            header.appendChild(icon);
        }

        var label = document.createElement('span');
        label.className = 'aiq-catsort-category__label';
        label.textContent = category.label;
        header.appendChild(label);

        var count = document.createElement('span');
        count.className = 'aiq-catsort-category__count';
        count.textContent = '0';
        header.appendChild(count);

        categoryEl.appendChild(header);

        var dropZone = document.createElement('div');
        dropZone.className = 'aiq-catsort-category__dropzone';
        dropZone.setAttribute('data-zone', category.id);

        var placeholder = document.createElement('div');
        placeholder.className = 'aiq-catsort-category__placeholder';
        placeholder.textContent = 'Drop items here';
        dropZone.appendChild(placeholder);

        this.setupDropZone(dropZone, category.id);
        categoryEl.appendChild(dropZone);

        return categoryEl;
    };

    /**
     * Setup drop zone event handlers
     * @param {HTMLElement} zone
     * @param {string} zoneId
     */
    CategorySort.prototype.setupDropZone = function(zone, zoneId) {
        var self = this;

        zone.addEventListener('dragover', function(e) {
            if (self.revealed) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            zone.classList.add('aiq-catsort-dropzone--over');
        });

        zone.addEventListener('dragleave', function(e) {
            if (!zone.contains(e.relatedTarget)) {
                zone.classList.remove('aiq-catsort-dropzone--over');
            }
        });

        zone.addEventListener('drop', function(e) {
            if (self.revealed) return;
            e.preventDefault();
            zone.classList.remove('aiq-catsort-dropzone--over');

            var itemId = e.dataTransfer.getData('text/plain');
            if (itemId) {
                self.placeItem(itemId, zoneId);
            }
        });
    };

    /**
     * Place an item in a category
     * @param {string} itemId
     * @param {string} categoryId
     */
    CategorySort.prototype.placeItem = function(itemId, categoryId) {
        var itemEl = this.element.querySelector('[data-item-id="' + itemId + '"]');
        if (!itemEl) return;

        var targetZone;
        if (categoryId === 'bank') {
            targetZone = this.element.querySelector('[data-zone="bank"]');
        } else {
            targetZone = this.element.querySelector('.aiq-catsort-category__dropzone[data-zone="' + categoryId + '"]');
        }
        
        if (!targetZone) return;

        targetZone.appendChild(itemEl);

        if (categoryId === 'bank') {
            delete this.placements[itemId];
        } else {
            this.placements[itemId] = categoryId;
        }

        this.updateCounts();
        this.updateState();

        Animations.scaleIn(itemEl);
    };

    /**
     * Update category item counts
     */
    CategorySort.prototype.updateCounts = function() {
        var self = this;
        
        this.options.categories.forEach(function(category) {
            var categoryEl = self.element.querySelector('[data-category-id="' + category.id + '"]');
            var dropZone = categoryEl.querySelector('.aiq-catsort-category__dropzone');
            var count = dropZone.querySelectorAll('.aiq-catsort-item').length;
            
            var countEl = categoryEl.querySelector('.aiq-catsort-category__count');
            countEl.textContent = count;

            var placeholder = dropZone.querySelector('.aiq-catsort-category__placeholder');
            if (count > 0) {
                placeholder.style.display = 'none';
            } else {
                placeholder.style.display = '';
            }
        });
    };

    /**
     * Clear all drop highlights
     */
    CategorySort.prototype.clearDropHighlights = function() {
        var zones = this.element.querySelectorAll('.aiq-catsort-dropzone--over');
        zones.forEach(function(zone) {
            zone.classList.remove('aiq-catsort-dropzone--over');
        });
    };

    /**
     * Show keyboard placement options
     * @param {string} itemId
     * @param {HTMLElement} itemEl
     */
    CategorySort.prototype.showKeyboardPlacement = function(itemId, itemEl) {
        var self = this;

        var existing = this.element.querySelector('.aiq-catsort-keyboard-menu');
        if (existing) {
            existing.remove();
        }

        var menu = document.createElement('div');
        menu.className = 'aiq-catsort-keyboard-menu';

        var bankBtn = document.createElement('button');
        bankBtn.type = 'button';
        bankBtn.className = 'aiq-catsort-keyboard-btn';
        bankBtn.textContent = 'Return to bank';
        bankBtn.addEventListener('click', function() {
            self.placeItem(itemId, 'bank');
            menu.remove();
        });
        menu.appendChild(bankBtn);

        this.options.categories.forEach(function(category) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'aiq-catsort-keyboard-btn';
            btn.textContent = category.label;
            btn.addEventListener('click', function() {
                self.placeItem(itemId, category.id);
                menu.remove();
            });
            menu.appendChild(btn);
        });

        itemEl.parentNode.insertBefore(menu, itemEl.nextSibling);

        document.addEventListener('click', function handler(e) {
            if (!menu.contains(e.target) && e.target !== itemEl) {
                menu.remove();
                document.removeEventListener('click', handler);
            }
        });
    };

    /**
     * Shuffle array
     * @param {Array} arr
     * @returns {Array}
     */
    CategorySort.prototype.shuffleArray = function(arr) {
        var shuffled = arr.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    };

    /**
     * Update state
     */
    CategorySort.prototype.updateState = function() {
        State.setAnswer(this.options.questionId, Object.assign({}, this.placements));

        if (this.onChange) {
            this.onChange(this.options.questionId, this.placements);
        }
    };

    /**
     * Reveal correct/incorrect placements
     * @param {boolean} animate
     * @returns {Promise}
     */
    CategorySort.prototype.reveal = function(animate) {
        var self = this;
        this.revealed = true;
        var promises = [];

        var items = this.element.querySelectorAll('.aiq-catsort-item');
        items.forEach(function(itemEl) {
            itemEl.setAttribute('draggable', 'false');
            itemEl.removeAttribute('tabindex');
        });

        this.options.items.forEach(function(item) {
            var itemEl = self.element.querySelector('[data-item-id="' + item.id + '"]');
            if (!itemEl) return;

            var userPlacement = self.placements[item.id];
            var isCorrect = userPlacement === item.correctCategory;

            if (isCorrect) {
                itemEl.classList.add('aiq-catsort-item--correct');
                var icon = Feedback.createCorrectIcon(animate);
                itemEl.appendChild(icon);
                
                if (animate) {
                    promises.push(Animations.pulse(itemEl));
                }
            } else {
                itemEl.classList.add('aiq-catsort-item--incorrect');
                var icon = Feedback.createIncorrectIcon(animate);
                itemEl.appendChild(icon);

                var correctCategory = self.options.categories.find(function(c) {
                    return c.id === item.correctCategory;
                });

                if (correctCategory) {
                    var hint = document.createElement('span');
                    hint.className = 'aiq-catsort-item__hint';
                    hint.textContent = 'Should be: ' + correctCategory.label;
                    itemEl.appendChild(hint);
                }

                if (animate) {
                    promises.push(Animations.shake(itemEl));
                }
            }
        });

        return Promise.all(promises);
    };

    /**
     * Get current answer
     * @returns {Object}
     */
    CategorySort.prototype.getAnswer = function() {
        return Object.assign({}, this.placements);
    };

    /**
     * Set answer (for restoring state)
     * @param {Object} placements
     */
    CategorySort.prototype.setAnswer = function(placements) {
        var self = this;
        if (!placements) return;

        Object.keys(placements).forEach(function(itemId) {
            var categoryId = placements[itemId];
            self.placeItem(itemId, categoryId);
        });
    };

    /**
     * Check if all items are placed
     * @returns {boolean}
     */
    CategorySort.prototype.isAnswered = function() {
        return Object.keys(this.placements).length === this.options.items.length;
    };

    /**
     * Check if all items are correctly placed
     * @returns {boolean}
     */
    CategorySort.prototype.isCorrect = function() {
        var self = this;
        
        if (!this.isAnswered()) {
            return false;
        }
        
        var allCorrect = true;
        this.options.items.forEach(function(item) {
            if (self.placements[item.id] !== item.correctCategory) {
                allCorrect = false;
            }
        });
        
        return allCorrect;
    };

    /**
     * Get score (partial scoring)
     * @returns {Object}
     */
    CategorySort.prototype.getScore = function() {
        var self = this;
        var correct = 0;
        var total = this.options.items.length;

        this.options.items.forEach(function(item) {
            if (self.placements[item.id] === item.correctCategory) {
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
    CategorySort.prototype.reset = function() {
        var self = this;
        this.revealed = false;
        this.placements = {};

        var bank = this.element.querySelector('[data-zone="bank"]');
        var items = this.element.querySelectorAll('.aiq-catsort-item');

        items.forEach(function(itemEl) {
            itemEl.classList.remove('aiq-catsort-item--correct', 'aiq-catsort-item--incorrect');
            itemEl.setAttribute('draggable', 'true');
            itemEl.setAttribute('tabindex', '0');

            var icon = itemEl.querySelector('.aiq-icon');
            if (icon) icon.remove();

            var hint = itemEl.querySelector('.aiq-catsort-item__hint');
            if (hint) hint.remove();

            bank.appendChild(itemEl);
        });

        this.updateCounts();
    };

    /**
     * Destroy the question
     */
    CategorySort.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    };

    return CategorySort;
});
