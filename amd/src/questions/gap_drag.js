/**
 * AI Quiz Maker  -  Drag Words into Gaps Question Type
 * Floating word bank with drag-to-fill gaps
 * 
 * Rules:
 * - Sentence with gaps
 * - Floating word bank below
 * - Words snap into gaps
 * - Extra distractor words included
 * - Gaps visibly accept words
 * - Used words fade from bank
 * 
 * @module     mod_aiquiz/questions/gap_drag
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'mod_aiquiz/core/animations',
    'mod_aiquiz/core/state'
], function(Animations, State) {
    'use strict';

    function GapDrag(options) {
        this.element = null;
        this.placements = {};
        this.revealed = false;
        this.draggedWord = null;

        this.options = Object.assign({
            questionId: '',
            questionText: '',
            sentence: '',
            gaps: [],
            words: [],
            shuffleWords: true
        }, options);

        this.onChange = null;
    }

    GapDrag.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-question aiq-question--gap-drag';
        container.setAttribute('data-question-id', this.options.questionId);

        if (this.options.questionText) {
            var questionText = document.createElement('h2');
            questionText.className = 'aiq-question__text';
            questionText.innerHTML = this.options.questionText;
            container.appendChild(questionText);
        }

        var sentenceEl = document.createElement('div');
        sentenceEl.className = 'aiq-gapdrag-sentence';

        var sentenceHtml = this.buildSentence();
        sentenceEl.innerHTML = sentenceHtml;

        this.bindGaps(sentenceEl);

        container.appendChild(sentenceEl);

        var wordBank = this.createWordBank();
        container.appendChild(wordBank);

        this.element = container;

        Animations.fadeInUp(sentenceEl);
        Animations.stagger(wordBank, '.aiq-gapdrag-word', Animations.scaleIn.bind(Animations), 40);

        return container;
    };

    GapDrag.prototype.buildSentence = function() {
        var self = this;
        var html = this.options.sentence;

        this.options.gaps.forEach(function(gap, index) {
            var placeholder = '{{gap' + index + '}}';
            var gapHtml = '<span class="aiq-gapdrag-gap" data-gap-id="' + gap.id + '" ' +
                          'data-gap-index="' + index + '"></span>';
            html = html.replace(placeholder, gapHtml);
        });

        return html;
    };

    GapDrag.prototype.createWordBank = function() {
        var self = this;

        var bank = document.createElement('div');
        bank.className = 'aiq-gapdrag-bank';

        var label = document.createElement('div');
        label.className = 'aiq-gapdrag-bank__label';
        label.textContent = 'Drag words to fill the gaps:';
        bank.appendChild(label);

        var wordsContainer = document.createElement('div');
        wordsContainer.className = 'aiq-gapdrag-words';

        var words = this.options.words.slice();
        if (this.options.shuffleWords) {
            words = this.shuffleArray(words);
        }

        words.forEach(function(word) {
            var wordEl = self.createWord(word);
            wordsContainer.appendChild(wordEl);
        });

        bank.appendChild(wordsContainer);

        return bank;
    };

    GapDrag.prototype.createWord = function(word) {
        var self = this;

        var wordEl = document.createElement('span');
        wordEl.className = 'aiq-gapdrag-word';
        wordEl.setAttribute('draggable', 'true');
        wordEl.setAttribute('data-word-id', word.id);
        wordEl.setAttribute('role', 'button');
        wordEl.setAttribute('tabindex', '0');
        wordEl.textContent = word.text;

        wordEl.addEventListener('dragstart', function(e) {
            if (self.revealed) {
                e.preventDefault();
                return;
            }
            self.draggedWord = word.id;
            wordEl.classList.add('aiq-gapdrag-word--dragging');
            e.dataTransfer.setData('text/plain', word.id);
            e.dataTransfer.effectAllowed = 'move';
        });

        wordEl.addEventListener('dragend', function() {
            wordEl.classList.remove('aiq-gapdrag-word--dragging');
            self.draggedWord = null;
        });

        return wordEl;
    };

    GapDrag.prototype.bindGaps = function(container) {
        var self = this;
        var gaps = container.querySelectorAll('.aiq-gapdrag-gap');

        gaps.forEach(function(gap) {
            gap.addEventListener('dragover', function(e) {
                if (self.revealed) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                gap.classList.add('aiq-gapdrag-gap--over');
            });

            gap.addEventListener('dragleave', function() {
                gap.classList.remove('aiq-gapdrag-gap--over');
            });

            gap.addEventListener('drop', function(e) {
                if (self.revealed) return;
                e.preventDefault();
                gap.classList.remove('aiq-gapdrag-gap--over');

                var wordId = e.dataTransfer.getData('text/plain');
                if (wordId) {
                    self.placeWord(wordId, gap.getAttribute('data-gap-id'));
                }
            });

            gap.addEventListener('click', function() {
                if (self.revealed) return;
                var gapId = gap.getAttribute('data-gap-id');
                if (self.placements[gapId]) {
                    self.removeWord(gapId);
                }
            });
        });
    };

    GapDrag.prototype.shuffleArray = function(arr) {
        var shuffled = arr.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    };

    GapDrag.prototype.placeWord = function(wordId, gapId) {
        var self = this;

        Object.keys(this.placements).forEach(function(gid) {
            if (self.placements[gid] === wordId) {
                self.removeWord(gid);
            }
        });

        if (this.placements[gapId]) {
            this.returnWordToBank(this.placements[gapId]);
        }

        this.placements[gapId] = wordId;

        var word = this.options.words.find(function(w) { return w.id === wordId; });
        var gap = this.element.querySelector('[data-gap-id="' + gapId + '"]');

        if (gap && word) {
            gap.textContent = word.text;
            gap.classList.add('aiq-gapdrag-gap--filled');
        }

        this.hideWordFromBank(wordId);
        this.updateState();
    };

    GapDrag.prototype.removeWord = function(gapId) {
        var wordId = this.placements[gapId];
        if (!wordId) return;

        delete this.placements[gapId];

        var gap = this.element.querySelector('[data-gap-id="' + gapId + '"]');
        if (gap) {
            gap.textContent = '';
            gap.classList.remove('aiq-gapdrag-gap--filled');
        }

        this.returnWordToBank(wordId);
        this.updateState();
    };

    GapDrag.prototype.hideWordFromBank = function(wordId) {
        var bankWord = this.element.querySelector('.aiq-gapdrag-words [data-word-id="' + wordId + '"]');
        if (bankWord) {
            bankWord.classList.add('aiq-gapdrag-word--used');
        }
    };

    GapDrag.prototype.returnWordToBank = function(wordId) {
        var bankWord = this.element.querySelector('.aiq-gapdrag-words [data-word-id="' + wordId + '"]');
        if (bankWord) {
            bankWord.classList.remove('aiq-gapdrag-word--used');
        }
    };

    GapDrag.prototype.updateState = function() {
        State.setAnswer(this.options.questionId, Object.assign({}, this.placements));

        if (this.onChange) {
            this.onChange(this.options.questionId, this.placements);
        }
    };

    GapDrag.prototype.reveal = function(animate) {
        var self = this;
        this.revealed = true;
        var promises = [];

        var gaps = this.element.querySelectorAll('.aiq-gapdrag-gap');

        gaps.forEach(function(gapEl) {
            var gapId = gapEl.getAttribute('data-gap-id');
            var gap = self.options.gaps.find(function(g) { return g.id === gapId; });
            var placedWordId = self.placements[gapId];
            var isCorrect = placedWordId === gap.correctWordId;

            if (isCorrect) {
                gapEl.classList.add('aiq-gapdrag-gap--correct');
                if (animate) {
                    promises.push(Animations.pulse(gapEl));
                }
            } else {
                gapEl.classList.add('aiq-gapdrag-gap--incorrect');

                var correctWord = self.options.words.find(function(w) { return w.id === gap.correctWordId; });
                if (correctWord) {
                    var correction = document.createElement('span');
                    correction.className = 'aiq-gapdrag-correction';
                    correction.textContent = ' (' + correctWord.text + ')';
                    gapEl.appendChild(correction);
                }

                if (animate && placedWordId) {
                    promises.push(Animations.shake(gapEl));
                }
            }
        });

        return Promise.all(promises);
    };

    GapDrag.prototype.getAnswer = function() {
        return Object.assign({}, this.placements);
    };

    GapDrag.prototype.setAnswer = function(placements) {
        var self = this;
        if (!placements) return;

        Object.keys(placements).forEach(function(gapId) {
            self.placeWord(placements[gapId], gapId);
        });
    };

    GapDrag.prototype.isAnswered = function() {
        return Object.keys(this.placements).length === this.options.gaps.length;
    };

    /**
     * Check if all gaps are correctly filled
     * @returns {boolean}
     */
    GapDrag.prototype.isCorrect = function() {
        var self = this;
        
        if (!this.isAnswered()) {
            return false;
        }
        
        var allCorrect = true;
        this.options.gaps.forEach(function(gap) {
            if (self.placements[gap.id] !== gap.correctWordId) {
                allCorrect = false;
            }
        });
        
        return allCorrect;
    };

    GapDrag.prototype.getScore = function() {
        var self = this;
        var correct = 0;
        var total = this.options.gaps.length;

        this.options.gaps.forEach(function(gap) {
            if (self.placements[gap.id] === gap.correctWordId) {
                correct++;
            }
        });

        return {
            correct: correct,
            total: total,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0
        };
    };

    GapDrag.prototype.reset = function() {
        var self = this;
        this.revealed = false;

        Object.keys(this.placements).forEach(function(gapId) {
            self.returnWordToBank(self.placements[gapId]);
        });

        this.placements = {};

        var gaps = this.element.querySelectorAll('.aiq-gapdrag-gap');
        gaps.forEach(function(gapEl) {
            gapEl.textContent = '';
            gapEl.classList.remove(
                'aiq-gapdrag-gap--filled',
                'aiq-gapdrag-gap--correct',
                'aiq-gapdrag-gap--incorrect'
            );

            var correction = gapEl.querySelector('.aiq-gapdrag-correction');
            if (correction) {
                gapEl.removeChild(correction);
            }
        });
    };

    GapDrag.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    };

    return GapDrag;
});
