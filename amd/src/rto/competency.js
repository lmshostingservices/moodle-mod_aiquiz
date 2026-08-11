/**
 * AI Quiz Maker  -  RTO Competency Integration
 * Training.gov.au unit integration for question generation
 * 
 * Provides:
 * - Unit lookup from training.gov.au
 * - Performance criteria extraction
 * - Knowledge evidence extraction
 * - Criterion-based question generation
 * 
 * @module     mod_aiquiz/rto/competency
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['mod_aiquiz/core/api'], function(Api) {
    'use strict';

    var UNIT_CODE_PATTERN = /^[A-Z]{2,6}[A-Z0-9]{3,10}$/i;

    var cache = {};
    var CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

    function CompetencyLoader(options) {
        this.options = Object.assign({
            apiEndpoint: '/mod/aiquiz/ajax.php',
            useFallback: true
        }, options);
    }

    CompetencyLoader.prototype.validateUnitCode = function(code) {
        if (!code || typeof code !== 'string') {
            return { valid: false, error: 'Unit code is required' };
        }

        code = code.trim().toUpperCase();

        if (!UNIT_CODE_PATTERN.test(code)) {
            return { valid: false, error: 'Invalid unit code format. Expected format: BSBWHS411' };
        }

        return { valid: true, code: code };
    };

    CompetencyLoader.prototype.lookupUnit = function(code) {
        var self = this;
        var validation = this.validateUnitCode(code);

        if (!validation.valid) {
            return Promise.reject(new Error(validation.error));
        }

        code = validation.code;

        if (cache[code] && Date.now() - cache[code].timestamp < CACHE_TTL) {
            return Promise.resolve(cache[code].data);
        }

        return Api.request('lookup_unit', { code: code }).then(function(response) {
            if (response.error) {
                throw new Error(response.error);
            }

            var unit = self.normalizeUnit(response.unit || response);

            cache[code] = {
                data: unit,
                timestamp: Date.now()
            };

            return unit;
        });
    };

    CompetencyLoader.prototype.searchUnits = function(query) {
        if (!query || query.length < 3) {
            return Promise.resolve([]);
        }

        return Api.request('search_units', { query: query }).then(function(response) {
            return response.units || [];
        });
    };

    CompetencyLoader.prototype.normalizeUnit = function(rawUnit) {
        return {
            code: rawUnit.code || '',
            title: rawUnit.title || '',
            description: rawUnit.description || '',
            elements: this.extractElements(rawUnit),
            performanceEvidence: rawUnit.performanceEvidence || [],
            knowledgeEvidence: rawUnit.knowledgeEvidence || [],
            assessmentConditions: rawUnit.assessmentConditions || '',
            occasions: rawUnit.occasions || 2
        };
    };

    CompetencyLoader.prototype.extractElements = function(rawUnit) {
        var elements = [];

        if (rawUnit.elements && Array.isArray(rawUnit.elements)) {
            rawUnit.elements.forEach(function(el, index) {
                elements.push({
                    code: el.code || ('E' + (index + 1)),
                    name: el.name || el.title || '',
                    performanceCriteria: (el.performanceCriteria || []).map(function(pc, pcIndex) {
                        return {
                            code: pc.code || ('PC' + (index + 1) + '.' + (pcIndex + 1)),
                            text: pc.text || pc.description || pc
                        };
                    })
                });
            });
        }

        return elements;
    };

    CompetencyLoader.prototype.getAllCriteria = function(unit) {
        var criteria = [];

        // Performance Criteria (from elements - 1.1, 1.2, 2.1, etc.)
        if (unit.elements) {
            unit.elements.forEach(function(element) {
                if (element.performanceCriteria) {
                    element.performanceCriteria.forEach(function(pc) {
                        criteria.push({
                            type: 'performance',
                            elementCode: element.code,
                            elementName: element.name,
                            code: pc.code,
                            text: pc.text
                        });
                    });
                }
            });
        }

        // Performance Evidence (PE1, PE2, etc.)
        if (unit.performanceEvidence) {
            unit.performanceEvidence.forEach(function(pe, index) {
                criteria.push({
                    type: 'performanceEvidence',
                    elementCode: null,
                    elementName: null,
                    code: 'PE' + (index + 1),
                    text: typeof pe === 'string' ? pe : pe.text
                });
            });
        }

        // Knowledge Evidence (KE1, KE2, etc.)
        if (unit.knowledgeEvidence) {
            unit.knowledgeEvidence.forEach(function(ke, index) {
                criteria.push({
                    type: 'knowledge',
                    elementCode: null,
                    elementName: null,
                    code: 'KE' + (index + 1),
                    text: typeof ke === 'string' ? ke : ke.text
                });
            });
        }

        return criteria;
    };

    CompetencyLoader.prototype.getCriteriaForGeneration = function(unit, options) {
        options = Object.assign({
            includePerformance: true,
            includeKnowledge: true,
            elementsFilter: null,
            maxCriteria: null
        }, options);

        var criteria = [];

        if (options.includePerformance && unit.elements) {
            unit.elements.forEach(function(element) {
                if (options.elementsFilter && !options.elementsFilter.includes(element.code)) {
                    return;
                }

                if (element.performanceCriteria) {
                    element.performanceCriteria.forEach(function(pc) {
                        criteria.push({
                            type: 'performance',
                            code: pc.code,
                            text: pc.text,
                            context: {
                                unitCode: unit.code,
                                unitTitle: unit.title,
                                elementCode: element.code,
                                elementName: element.name
                            }
                        });
                    });
                }
            });
        }

        if (options.includeKnowledge && unit.knowledgeEvidence) {
            unit.knowledgeEvidence.forEach(function(ke, index) {
                criteria.push({
                    type: 'knowledge',
                    code: 'KE' + (index + 1),
                    text: typeof ke === 'string' ? ke : ke.text,
                    context: {
                        unitCode: unit.code,
                        unitTitle: unit.title
                    }
                });
            });
        }

        if (options.maxCriteria && criteria.length > options.maxCriteria) {
            criteria = criteria.slice(0, options.maxCriteria);
        }

        return criteria;
    };

    function CompetencyPicker(container, options) {
        this.container = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        
        this.options = Object.assign({
            onSelect: null,
            multiSelect: true,
            showPreview: true
        }, options);

        this.loader = new CompetencyLoader();
        this.selectedCriteria = [];
        this.currentUnit = null;
    }

    CompetencyPicker.prototype.init = function() {
        this.render();
        this.bindEvents();
        return this;
    };

    CompetencyPicker.prototype.render = function() {
        var self = this;

        this.container.innerHTML = '';
        this.container.className = 'aiq-competency-picker';

        var searchSection = document.createElement('div');
        searchSection.className = 'aiq-cp-search';
        searchSection.innerHTML = [
            '<label class="aiq-cp-label">Unit Code</label>',
            '<div class="aiq-cp-search-row">',
            '  <input type="text" class="aiq-cp-input" id="aiq-unit-input" placeholder="e.g. BSBWHS411" maxlength="15">',
            '  <button type="button" class="aiq-btn aiq-btn-primary" id="aiq-unit-lookup">',
            '    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.867-3.834zm-5.242.156a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>',
            '    Lookup',
            '  </button>',
            '</div>',
            '<p class="aiq-cp-hint">Enter a training.gov.au unit code to load criteria</p>'
        ].join('\n');
        this.container.appendChild(searchSection);

        var loadingEl = document.createElement('div');
        loadingEl.className = 'aiq-cp-loading';
        loadingEl.id = 'aiq-cp-loading';
        loadingEl.style.display = 'none';
        loadingEl.innerHTML = '<div class="aiq-spinner"></div><span>Loading unit data...</span>';
        this.container.appendChild(loadingEl);

        var errorEl = document.createElement('div');
        errorEl.className = 'aiq-cp-error';
        errorEl.id = 'aiq-cp-error';
        errorEl.style.display = 'none';
        this.container.appendChild(errorEl);

        var unitInfo = document.createElement('div');
        unitInfo.className = 'aiq-cp-unit-info';
        unitInfo.id = 'aiq-cp-unit-info';
        unitInfo.style.display = 'none';
        this.container.appendChild(unitInfo);

        var criteriaSection = document.createElement('div');
        criteriaSection.className = 'aiq-cp-criteria';
        criteriaSection.id = 'aiq-cp-criteria';
        criteriaSection.style.display = 'none';
        this.container.appendChild(criteriaSection);

        var actionsSection = document.createElement('div');
        actionsSection.className = 'aiq-cp-actions';
        actionsSection.id = 'aiq-cp-actions';
        actionsSection.style.display = 'none';
        actionsSection.innerHTML = [
            '<div class="aiq-cp-selection-count">',
            '  <span id="aiq-selected-count">0</span> criteria selected',
            '</div>',
            '<div class="aiq-cp-action-buttons">',
            '  <button type="button" class="aiq-btn aiq-btn-secondary" id="aiq-select-all">Select All</button>',
            '  <button type="button" class="aiq-btn aiq-btn-secondary" id="aiq-clear-selection">Clear</button>',
            '</div>'
        ].join('\n');
        this.container.appendChild(actionsSection);
    };

    CompetencyPicker.prototype.bindEvents = function() {
        var self = this;

        var lookupBtn = document.getElementById('aiq-unit-lookup');
        var unitInput = document.getElementById('aiq-unit-input');

        lookupBtn.addEventListener('click', function() {
            self.lookupUnit(unitInput.value);
        });

        unitInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                self.lookupUnit(unitInput.value);
            }
        });

        var selectAllBtn = document.getElementById('aiq-select-all');
        var clearBtn = document.getElementById('aiq-clear-selection');

        selectAllBtn.addEventListener('click', function() {
            self.selectAllCriteria();
        });

        clearBtn.addEventListener('click', function() {
            self.clearSelection();
        });
    };

    CompetencyPicker.prototype.lookupUnit = function(code) {
        var self = this;
        var loadingEl = document.getElementById('aiq-cp-loading');
        var errorEl = document.getElementById('aiq-cp-error');
        var unitInfoEl = document.getElementById('aiq-cp-unit-info');
        var criteriaEl = document.getElementById('aiq-cp-criteria');
        var actionsEl = document.getElementById('aiq-cp-actions');

        errorEl.style.display = 'none';
        unitInfoEl.style.display = 'none';
        criteriaEl.style.display = 'none';
        actionsEl.style.display = 'none';
        loadingEl.style.display = 'flex';

        this.loader.lookupUnit(code)
            .then(function(unit) {
                loadingEl.style.display = 'none';
                self.currentUnit = unit;
                self.displayUnit(unit);
            })
            .catch(function(error) {
                loadingEl.style.display = 'none';
                errorEl.textContent = error.message || 'Failed to load unit';
                errorEl.style.display = 'block';
            });
    };

    CompetencyPicker.prototype.displayUnit = function(unit) {
        var self = this;
        var unitInfoEl = document.getElementById('aiq-cp-unit-info');
        var criteriaEl = document.getElementById('aiq-cp-criteria');
        var actionsEl = document.getElementById('aiq-cp-actions');

        unitInfoEl.innerHTML = [
            '<div class="aiq-unit-header">',
            '  <span class="aiq-unit-code">' + unit.code + '</span>',
            '  <span class="aiq-unit-title">' + unit.title + '</span>',
            '</div>',
            unit.description ? '<p class="aiq-unit-desc">' + unit.description.substring(0, 200) + '...</p>' : ''
        ].join('\n');
        unitInfoEl.style.display = 'block';

        var criteria = this.loader.getAllCriteria(unit);

        var html = '<div class="aiq-criteria-list">';

        var groupedByElement = {};
        criteria.forEach(function(c) {
            var key = c.type === 'performance' ? c.elementCode : '_knowledge';
            if (!groupedByElement[key]) {
                groupedByElement[key] = {
                    name: c.type === 'performance' ? c.elementName : 'Knowledge Evidence',
                    type: c.type,
                    items: []
                };
            }
            groupedByElement[key].items.push(c);
        });

        Object.keys(groupedByElement).forEach(function(key) {
            var group = groupedByElement[key];
            html += '<div class="aiq-criteria-group">';
            html += '<h5 class="aiq-criteria-group-title">';
            html += '<span class="aiq-criteria-type-badge aiq-type-' + group.type + '">' + group.type.charAt(0).toUpperCase() + '</span>';
            html += (key !== '_knowledge' ? key + ': ' : '') + group.name;
            html += '</h5>';

            group.items.forEach(function(item) {
                var id = 'aiq-crit-' + item.code.replace(/\./g, '-');
                html += '<label class="aiq-criteria-item" for="' + id + '">';
                html += '<input type="checkbox" id="' + id + '" data-code="' + item.code + '" data-type="' + item.type + '">';
                html += '<span class="aiq-criteria-code">' + item.code + '</span>';
                html += '<span class="aiq-criteria-text">' + item.text + '</span>';
                html += '</label>';
            });

            html += '</div>';
        });

        html += '</div>';
        criteriaEl.innerHTML = html;
        criteriaEl.style.display = 'block';
        actionsEl.style.display = 'flex';

        criteriaEl.querySelectorAll('input[type="checkbox"]').forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                self.updateSelection();
            });
        });
    };

    CompetencyPicker.prototype.updateSelection = function() {
        var self = this;
        var criteriaEl = document.getElementById('aiq-cp-criteria');
        var countEl = document.getElementById('aiq-selected-count');

        this.selectedCriteria = [];

        criteriaEl.querySelectorAll('input[type="checkbox"]:checked').forEach(function(checkbox) {
            var criteria = self.loader.getAllCriteria(self.currentUnit).find(function(c) {
                return c.code === checkbox.dataset.code;
            });
            if (criteria) {
                self.selectedCriteria.push(criteria);
            }
        });

        countEl.textContent = this.selectedCriteria.length;

        if (this.options.onSelect) {
            this.options.onSelect(this.selectedCriteria, this.currentUnit);
        }
    };

    CompetencyPicker.prototype.selectAllCriteria = function() {
        var criteriaEl = document.getElementById('aiq-cp-criteria');
        criteriaEl.querySelectorAll('input[type="checkbox"]').forEach(function(checkbox) {
            checkbox.checked = true;
        });
        this.updateSelection();
    };

    CompetencyPicker.prototype.clearSelection = function() {
        var criteriaEl = document.getElementById('aiq-cp-criteria');
        criteriaEl.querySelectorAll('input[type="checkbox"]').forEach(function(checkbox) {
            checkbox.checked = false;
        });
        this.updateSelection();
    };

    CompetencyPicker.prototype.getSelection = function() {
        return {
            unit: this.currentUnit,
            criteria: this.selectedCriteria.slice()
        };
    };

    return {
        CompetencyLoader: CompetencyLoader,
        CompetencyPicker: CompetencyPicker,

        createLoader: function(options) {
            return new CompetencyLoader(options);
        },

        createPicker: function(container, options) {
            return new CompetencyPicker(container, options);
        }
    };
});
