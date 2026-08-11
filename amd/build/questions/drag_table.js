/**
 * AI Quiz Maker  -  Drag & Drop 2-Column Table
 * FLAGSHIP DRAG TYPE - Hazards/Controls style
 * 
 * Rules:
 * - Fixed table headers (e.g., Hazards | Controls)
 * - Rows are droppable cells
 * - Draggable chips move into cells
 * - Many-to-one and one-to-one supported
 * - Column headers locked
 * - Cells highlight on hover
 * - Chips snap into cells
 * 
 * @module     mod_aiquiz/questions/drag_table
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/questions/drag_table', [
    'mod_aiquiz/core/animations',
    'mod_aiquiz/core/state'
], function(Animations, State) {
    'use strict';

    /**
     * DragTable Question Type
     * @class
     */
    function DragTable(options) {
        this.element = null;
        this.placements = {};
        this.revealed = false;
        this.draggedChip = null;

        this.options = Object.assign({
            questionId: '',
            questionText: '',
            columns: ['Column 1', 'Column 2'],
            chips: [],
            cells: [],
            correctPlacements: {}
        }, options);

        this.onChange = null;
    }

    /**
     * Render the question
     * @returns {HTMLElement}
     */
    DragTable.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-question aiq-question--drag-table';
        container.setAttribute('data-question-id', this.options.questionId);

        var questionText = document.createElement('h2');
        questionText.className = 'aiq-question__text';
        questionText.innerHTML = this.options.questionText;
        container.appendChild(questionText);

        var chipBank = this.createChipBank();
        container.appendChild(chipBank);

        var table = this.createTable();
        container.appendChild(table);

        this.element = container;

        return container;
    };

    /**
     * Create the chip bank
     * @returns {HTMLElement}
     */
    DragTable.prototype.createChipBank = function() {
        var self = this;

        var bank = document.createElement('div');
        bank.className = 'aiq-drag-bank';

        var label = document.createElement('div');
        label.className = 'aiq-drag-bank__label';
        label.textContent = 'Drag items to the correct column:';
        bank.appendChild(label);

        var chips = document.createElement('div');
        chips.className = 'aiq-drag-chips';

        this.options.chips.forEach(function(chipData) {
            var chip = self.createChip(chipData);
            chips.appendChild(chip);
        });

        bank.appendChild(chips);

        return bank;
    };

    /**
     * Create a draggable chip
     * @param {Object} chipData
     * @returns {HTMLElement}
     */
    DragTable.prototype.createChip = function(chipData) {
        var self = this;

        var chip = document.createElement('div');
        chip.className = 'aiq-drag-chip';
        chip.setAttribute('draggable', 'true');
        chip.setAttribute('data-chip-id', chipData.id);
        chip.setAttribute('role', 'button');
        chip.setAttribute('tabindex', '0');
        chip.textContent = chipData.text;

        chip.addEventListener('dragstart', function(e) {
            if (self.revealed) {
                e.preventDefault();
                return;
            }
            self.draggedChip = chipData.id;
            chip.classList.add('aiq-drag-chip--dragging');
            e.dataTransfer.setData('text/plain', chipData.id);
            e.dataTransfer.effectAllowed = 'move';
        });

        chip.addEventListener('dragend', function() {
            chip.classList.remove('aiq-drag-chip--dragging');
            self.draggedChip = null;
        });

        chip.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                self.showKeyboardDropTargets(chipData.id);
            }
        });

        return chip;
    };

    /**
     * Create the table
     * @returns {HTMLElement}
     */
    DragTable.prototype.createTable = function() {
        var self = this;

        var table = document.createElement('div');
        table.className = 'aiq-drag-table';

        var header = document.createElement('div');
        header.className = 'aiq-drag-table__header';

        this.options.columns.forEach(function(colName) {
            var col = document.createElement('div');
            col.className = 'aiq-drag-table__col-header';
            col.textContent = colName;
            header.appendChild(col);
        });

        table.appendChild(header);

        var body = document.createElement('div');
        body.className = 'aiq-drag-table__body';

        this.options.cells.forEach(function(cellData) {
            var row = self.createRow(cellData);
            body.appendChild(row);
        });

        table.appendChild(body);

        return table;
    };

    /**
     * Create a table row with drop zones
     * @param {Object} cellData
     * @returns {HTMLElement}
     */
    DragTable.prototype.createRow = function(cellData) {
        var self = this;

        var row = document.createElement('div');
        row.className = 'aiq-drag-table__row';
        row.setAttribute('data-row-id', cellData.id);

        this.options.columns.forEach(function(colName, colIndex) {
            var cell = document.createElement('div');
            cell.className = 'aiq-drag-table__cell';
            cell.setAttribute('data-column', colIndex);

            if (colIndex === 0 && cellData.label) {
                cell.classList.add('aiq-drag-table__cell--label');
                cell.textContent = cellData.label;
            } else {
                cell.classList.add('aiq-drag-table__cell--drop');

                var dropZone = document.createElement('div');
                dropZone.className = 'aiq-drag-dropzone';
                dropZone.setAttribute('data-cell-id', cellData.id + '-' + colIndex);

                self.setupDropZone(dropZone, cellData.id, colIndex);

                cell.appendChild(dropZone);
            }

            row.appendChild(cell);
        });

        return row;
    };

    /**
     * Setup drop zone event handlers
     * @param {HTMLElement} dropZone
     * @param {string} rowId
     * @param {number} colIndex
     */
    DragTable.prototype.setupDropZone = function(dropZone, rowId, colIndex) {
        var self = this;
        var cellId = rowId + '-' + colIndex;

        dropZone.addEventListener('dragover', function(e) {
            if (self.revealed) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            dropZone.classList.add('aiq-drag-dropzone--over');
        });

        dropZone.addEventListener('dragleave', function() {
            dropZone.classList.remove('aiq-drag-dropzone--over');
        });

        dropZone.addEventListener('drop', function(e) {
            if (self.revealed) return;
            e.preventDefault();
            dropZone.classList.remove('aiq-drag-dropzone--over');

            var chipId = e.dataTransfer.getData('text/plain');
            if (chipId) {
                self.placeChip(chipId, cellId, dropZone);
            }
        });
    };

    /**
     * Place a chip in a drop zone
     * @param {string} chipId
     * @param {string} cellId
     * @param {HTMLElement} dropZone
     */
    DragTable.prototype.placeChip = function(chipId, cellId, dropZone) {
        var self = this;

        Object.keys(this.placements).forEach(function(cid) {
            if (self.placements[cid] === chipId) {
                delete self.placements[cid];
                var oldZone = self.element.querySelector('[data-cell-id="' + cid + '"]');
                if (oldZone) {
                    var oldChip = oldZone.querySelector('.aiq-drag-chip');
                    if (oldChip) {
                        oldZone.removeChild(oldChip);
                    }
                }
            }
        });

        var existingChip = dropZone.querySelector('.aiq-drag-chip');
        if (existingChip) {
            var existingId = existingChip.getAttribute('data-chip-id');
            this.returnChipToBank(existingId);
            dropZone.removeChild(existingChip);
        }

        this.placements[cellId] = chipId;

        var chipData = this.options.chips.find(function(c) { return c.id === chipId; });
        if (chipData) {
            var placedChip = document.createElement('div');
            placedChip.className = 'aiq-drag-chip aiq-drag-chip--placed';
            placedChip.setAttribute('data-chip-id', chipId);
            placedChip.setAttribute('draggable', 'true');
            placedChip.textContent = chipData.text;

            placedChip.addEventListener('dragstart', function(e) {
                if (self.revealed) {
                    e.preventDefault();
                    return;
                }
                self.draggedChip = chipId;
                placedChip.classList.add('aiq-drag-chip--dragging');
                e.dataTransfer.setData('text/plain', chipId);
                e.dataTransfer.effectAllowed = 'move';
            });

            placedChip.addEventListener('dragend', function() {
                placedChip.classList.remove('aiq-drag-chip--dragging');
                self.draggedChip = null;
            });

            dropZone.appendChild(placedChip);
            Animations.scaleIn(placedChip);
        }

        this.hideChipFromBank(chipId);
        this.updateState();
    };

    /**
     * Hide chip from bank
     * @param {string} chipId
     */
    DragTable.prototype.hideChipFromBank = function(chipId) {
        var bankChip = this.element.querySelector('.aiq-drag-chips [data-chip-id="' + chipId + '"]');
        if (bankChip) {
            bankChip.classList.add('aiq-drag-chip--used');
        }
    };

    /**
     * Return chip to bank
     * @param {string} chipId
     */
    DragTable.prototype.returnChipToBank = function(chipId) {
        var bankChip = this.element.querySelector('.aiq-drag-chips [data-chip-id="' + chipId + '"]');
        if (bankChip) {
            bankChip.classList.remove('aiq-drag-chip--used');
        }
    };

    /**
     * Update state with current placements
     */
    DragTable.prototype.updateState = function() {
        State.setAnswer(this.options.questionId, Object.assign({}, this.placements));

        if (this.onChange) {
            this.onChange(this.options.questionId, this.placements);
        }
    };

    /**
     * Show keyboard drop targets
     * @param {string} chipId
     */
    DragTable.prototype.showKeyboardDropTargets = function(chipId) {
        // Keyboard navigation for accessible drag and drop
        var self = this;
        var dropZones = this.element.querySelectorAll('.aiq-drag-cell');
        dropZones.forEach(function(zone) {
            zone.classList.add('aiq-drag-cell--keyboard-target');
        });
    };

    /**
     * Reveal correct/incorrect answers
     * @param {boolean} animate
     * @returns {Promise}
     */
    DragTable.prototype.reveal = function(animate) {
        var self = this;
        this.revealed = true;
        var promises = [];

        Object.keys(this.placements).forEach(function(cellId) {
            var placedChipId = self.placements[cellId];
            var correctChipId = self.options.correctPlacements[cellId];
            var isCorrect = placedChipId === correctChipId;

            var dropZone = self.element.querySelector('[data-cell-id="' + cellId + '"]');
            var chip = dropZone ? dropZone.querySelector('.aiq-drag-chip') : null;

            if (chip) {
                chip.setAttribute('draggable', 'false');

                if (isCorrect) {
                    chip.classList.add('aiq-drag-chip--correct');
                    if (animate) {
                        promises.push(Animations.pulse(chip));
                    }
                } else {
                    chip.classList.add('aiq-drag-chip--incorrect');
                    if (animate) {
                        promises.push(Animations.shake(chip));
                    }
                }
            }
        });

        return Promise.all(promises);
    };

    /**
     * Get current answer
     * @returns {Object}
     */
    DragTable.prototype.getAnswer = function() {
        return Object.assign({}, this.placements);
    };

    /**
     * Set answer (for restoring state)
     * @param {Object} placements
     */
    DragTable.prototype.setAnswer = function(placements) {
        var self = this;
        if (!placements) return;

        Object.keys(placements).forEach(function(cellId) {
            var chipId = placements[cellId];
            var dropZone = self.element.querySelector('[data-cell-id="' + cellId + '"]');
            if (dropZone) {
                self.placeChip(chipId, cellId, dropZone);
            }
        });
    };

    /**
     * Check if fully answered
     * @returns {boolean}
     */
    DragTable.prototype.isAnswered = function() {
        return Object.keys(this.placements).length > 0;
    };

    /**
     * Check if all placements are correct
     * @returns {boolean}
     */
    DragTable.prototype.isCorrect = function() {
        var self = this;
        var correctPlacements = Object.keys(this.options.correctPlacements);
        
        if (Object.keys(this.placements).length !== correctPlacements.length) {
            return false;
        }
        
        var allCorrect = true;
        correctPlacements.forEach(function(cellId) {
            if (self.placements[cellId] !== self.options.correctPlacements[cellId]) {
                allCorrect = false;
            }
        });
        
        return allCorrect;
    };

    /**
     * Get score
     * @returns {Object}
     */
    DragTable.prototype.getScore = function() {
        var self = this;
        var correct = 0;
        var total = Object.keys(this.options.correctPlacements).length;

        Object.keys(this.options.correctPlacements).forEach(function(cellId) {
            if (self.placements[cellId] === self.options.correctPlacements[cellId]) {
                correct++;
            }
        });

        return {
            correct: correct,
            total: total,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0
        };
    };

    /**
     * Reset the question
     */
    DragTable.prototype.reset = function() {
        var self = this;
        this.revealed = false;
        this.placements = {};

        this.element.querySelectorAll('.aiq-drag-dropzone .aiq-drag-chip').forEach(function(chip) {
            chip.parentNode.removeChild(chip);
        });

        this.element.querySelectorAll('.aiq-drag-chip--used').forEach(function(chip) {
            chip.classList.remove('aiq-drag-chip--used');
        });

        this.element.querySelectorAll('.aiq-drag-chip--correct, .aiq-drag-chip--incorrect').forEach(function(chip) {
            chip.classList.remove('aiq-drag-chip--correct', 'aiq-drag-chip--incorrect');
            chip.setAttribute('draggable', 'true');
        });
    };

    /**
     * Destroy the question
     */
    DragTable.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    };

    return DragTable;
});
