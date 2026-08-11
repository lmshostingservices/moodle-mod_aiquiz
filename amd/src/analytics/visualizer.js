/**
 * AI Quiz Maker  -  Analytics Visualizer
 * Charts and visualizations for quiz statistics
 * 
 * Pure ES6, no external charting libraries
 * Uses CSS-based charts with token styling
 * 
 * @module     mod_aiquiz/analytics/visualizer
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['mod_aiquiz/core/animations'], function(Animations) {
    'use strict';

    var COLORS = {
        primary: 'var(--aiq-primary, #3b82f6)',
        success: 'var(--aiq-success, #22c55e)',
        warning: 'var(--aiq-warning, #f59e0b)',
        danger: 'var(--aiq-danger, #ef4444)',
        neutral: 'var(--aiq-neutral, #94a3b8)',
        surface: 'var(--aiq-surface, #f8fafc)',
        text: 'var(--aiq-text, #1e293b)',
        textMuted: 'var(--aiq-text-muted, #64748b)'
    };

    function Visualizer(container) {
        this.container = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
    }

    Visualizer.prototype.renderBarChart = function(data, options) {
        options = Object.assign({
            title: '',
            height: 200,
            showValues: true,
            animate: true,
            colorFn: null
        }, options);

        var wrapper = document.createElement('div');
        wrapper.className = 'aiq-chart aiq-bar-chart';

        if (options.title) {
            var title = document.createElement('h4');
            title.className = 'aiq-chart-title';
            title.textContent = options.title;
            wrapper.appendChild(title);
        }

        var chartArea = document.createElement('div');
        chartArea.className = 'aiq-chart-area';
        chartArea.style.height = options.height + 'px';

        var maxValue = Math.max.apply(null, data.map(function(d) { return d.value; }));
        if (maxValue === 0) maxValue = 1;

        data.forEach(function(item, index) {
            var barContainer = document.createElement('div');
            barContainer.className = 'aiq-bar-container';

            var bar = document.createElement('div');
            bar.className = 'aiq-bar';
            var heightPercent = (item.value / maxValue) * 100;
            
            if (options.animate) {
                bar.style.height = '0%';
                setTimeout(function() {
                    bar.style.height = heightPercent + '%';
                }, 50 + index * 30);
            } else {
                bar.style.height = heightPercent + '%';
            }

            if (options.colorFn) {
                bar.style.backgroundColor = options.colorFn(item, index);
            }

            if (options.showValues && item.value > 0) {
                var valueLabel = document.createElement('span');
                valueLabel.className = 'aiq-bar-value';
                valueLabel.textContent = item.value;
                bar.appendChild(valueLabel);
            }

            barContainer.appendChild(bar);

            var label = document.createElement('span');
            label.className = 'aiq-bar-label';
            label.textContent = item.label;
            barContainer.appendChild(label);

            chartArea.appendChild(barContainer);
        });

        wrapper.appendChild(chartArea);
        return wrapper;
    };

    Visualizer.prototype.renderDonutChart = function(data, options) {
        options = Object.assign({
            title: '',
            size: 160,
            thickness: 24,
            showLegend: true,
            centerText: '',
            animate: true
        }, options);

        var wrapper = document.createElement('div');
        wrapper.className = 'aiq-chart aiq-donut-chart';

        if (options.title) {
            var title = document.createElement('h4');
            title.className = 'aiq-chart-title';
            title.textContent = options.title;
            wrapper.appendChild(title);
        }

        var chartRow = document.createElement('div');
        chartRow.className = 'aiq-donut-row';

        var total = data.reduce(function(acc, d) { return acc + d.value; }, 0);
        if (total === 0) total = 1;

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', options.size);
        svg.setAttribute('height', options.size);
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.className.baseVal = 'aiq-donut-svg';

        var radius = 40;
        var circumference = 2 * Math.PI * radius;
        var rotation = -90;

        data.forEach(function(item, index) {
            var percent = item.value / total;
            var dashLength = circumference * percent;
            var dashGap = circumference - dashLength;

            var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '50');
            circle.setAttribute('cy', '50');
            circle.setAttribute('r', radius);
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', item.color || COLORS.primary);
            circle.setAttribute('stroke-width', options.thickness / 2);
            circle.setAttribute('transform', 'rotate(' + rotation + ' 50 50)');
            
            if (options.animate) {
                circle.setAttribute('stroke-dasharray', '0 ' + circumference);
                circle.style.transition = 'stroke-dasharray 0.6s ease-out';
                setTimeout(function() {
                    circle.setAttribute('stroke-dasharray', dashLength + ' ' + dashGap);
                }, 50 + index * 100);
            } else {
                circle.setAttribute('stroke-dasharray', dashLength + ' ' + dashGap);
            }

            svg.appendChild(circle);
            rotation += (360 * percent);
        });

        if (options.centerText) {
            var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '50');
            text.setAttribute('y', '50');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', COLORS.text);
            text.setAttribute('font-size', '14');
            text.setAttribute('font-weight', '600');
            text.textContent = options.centerText;
            svg.appendChild(text);
        }

        chartRow.appendChild(svg);

        if (options.showLegend) {
            var legend = document.createElement('div');
            legend.className = 'aiq-donut-legend';

            data.forEach(function(item) {
                var legendItem = document.createElement('div');
                legendItem.className = 'aiq-legend-item';

                var swatch = document.createElement('span');
                swatch.className = 'aiq-legend-swatch';
                swatch.style.backgroundColor = item.color || COLORS.primary;

                var label = document.createElement('span');
                label.className = 'aiq-legend-label';
                label.textContent = item.label;

                var value = document.createElement('span');
                value.className = 'aiq-legend-value';
                value.textContent = item.value + ' (' + Math.round((item.value / total) * 100) + '%)';

                legendItem.appendChild(swatch);
                legendItem.appendChild(label);
                legendItem.appendChild(value);
                legend.appendChild(legendItem);
            });

            chartRow.appendChild(legend);
        }

        wrapper.appendChild(chartRow);
        return wrapper;
    };

    Visualizer.prototype.renderProgressBar = function(value, options) {
        options = Object.assign({
            max: 100,
            label: '',
            showPercent: true,
            color: null,
            height: 8,
            animate: true
        }, options);

        var wrapper = document.createElement('div');
        wrapper.className = 'aiq-progress-wrapper';

        if (options.label) {
            var labelRow = document.createElement('div');
            labelRow.className = 'aiq-progress-label-row';

            var label = document.createElement('span');
            label.className = 'aiq-progress-label';
            label.textContent = options.label;
            labelRow.appendChild(label);

            if (options.showPercent) {
                var percent = document.createElement('span');
                percent.className = 'aiq-progress-percent';
                percent.textContent = Math.round((value / options.max) * 100) + '%';
                labelRow.appendChild(percent);
            }

            wrapper.appendChild(labelRow);
        }

        var track = document.createElement('div');
        track.className = 'aiq-progress-track';
        track.style.height = options.height + 'px';

        var fill = document.createElement('div');
        fill.className = 'aiq-progress-fill';
        var fillPercent = Math.min(100, (value / options.max) * 100);

        if (options.color) {
            fill.style.backgroundColor = options.color;
        }

        if (options.animate) {
            fill.style.width = '0%';
            setTimeout(function() {
                fill.style.width = fillPercent + '%';
            }, 50);
        } else {
            fill.style.width = fillPercent + '%';
        }

        track.appendChild(fill);
        wrapper.appendChild(track);

        return wrapper;
    };

    Visualizer.prototype.renderStatCard = function(data, options) {
        options = Object.assign({
            icon: null,
            trend: null,
            trendUp: true,
            subtitle: ''
        }, options);

        var card = document.createElement('div');
        card.className = 'aiq-stat-card';

        var header = document.createElement('div');
        header.className = 'aiq-stat-header';

        if (options.icon) {
            var iconEl = document.createElement('div');
            iconEl.className = 'aiq-stat-icon';
            iconEl.innerHTML = options.icon;
            header.appendChild(iconEl);
        }

        var label = document.createElement('span');
        label.className = 'aiq-stat-label';
        label.textContent = data.label;
        header.appendChild(label);

        card.appendChild(header);

        var valueRow = document.createElement('div');
        valueRow.className = 'aiq-stat-value-row';

        var value = document.createElement('span');
        value.className = 'aiq-stat-value';
        value.textContent = data.value;
        valueRow.appendChild(value);

        if (options.trend !== null) {
            var trend = document.createElement('span');
            trend.className = 'aiq-stat-trend ' + (options.trendUp ? 'aiq-trend-up' : 'aiq-trend-down');
            trend.innerHTML = (options.trendUp ? '&#9650;' : '&#9660;') + ' ' + options.trend;
            valueRow.appendChild(trend);
        }

        card.appendChild(valueRow);

        if (options.subtitle) {
            var subtitle = document.createElement('p');
            subtitle.className = 'aiq-stat-subtitle';
            subtitle.textContent = options.subtitle;
            card.appendChild(subtitle);
        }

        return card;
    };

    Visualizer.prototype.renderDifficultyMatrix = function(questions, options) {
        options = Object.assign({
            showLabels: true
        }, options);

        var wrapper = document.createElement('div');
        wrapper.className = 'aiq-difficulty-matrix';

        var header = document.createElement('h4');
        header.className = 'aiq-chart-title';
        header.textContent = 'Question Difficulty Overview';
        wrapper.appendChild(header);

        var grid = document.createElement('div');
        grid.className = 'aiq-matrix-grid';

        questions.forEach(function(q, index) {
            var cell = document.createElement('div');
            cell.className = 'aiq-matrix-cell';
            cell.setAttribute('title', 'Q' + (index + 1) + ': ' + q.difficultyLabel);

            var p = q.difficulty !== null ? q.difficulty : 0.5;
            var hue = p * 120;
            cell.style.backgroundColor = 'hsl(' + hue + ', 70%, 50%)';

            if (options.showLabels) {
                var num = document.createElement('span');
                num.className = 'aiq-matrix-label';
                num.textContent = index + 1;
                cell.appendChild(num);
            }

            grid.appendChild(cell);
        });

        wrapper.appendChild(grid);

        var legend = document.createElement('div');
        legend.className = 'aiq-matrix-legend';
        legend.innerHTML = '<span class="aiq-legend-difficult">Difficult</span><span class="aiq-legend-easy">Easy</span>';
        wrapper.appendChild(legend);

        return wrapper;
    };

    Visualizer.prototype.renderDistratorChart = function(distractorData, options) {
        options = Object.assign({
            height: 120,
            showEffectiveness: true
        }, options);

        var wrapper = document.createElement('div');
        wrapper.className = 'aiq-distractor-chart';

        distractorData.forEach(function(d) {
            var row = document.createElement('div');
            row.className = 'aiq-distractor-row';
            if (d.isCorrect) {
                row.classList.add('aiq-distractor-correct');
            }

            var label = document.createElement('div');
            label.className = 'aiq-distractor-label';
            label.textContent = d.answerText.substring(0, 40) + (d.answerText.length > 40 ? '...' : '');
            if (d.isCorrect) {
                label.innerHTML = '<span class="aiq-correct-badge">&#10003;</span> ' + label.textContent;
            }
            row.appendChild(label);

            var barTrack = document.createElement('div');
            barTrack.className = 'aiq-distractor-track';

            var bar = document.createElement('div');
            bar.className = 'aiq-distractor-bar';
            bar.style.width = d.percentage + '%';
            
            if (d.isCorrect) {
                bar.style.backgroundColor = COLORS.success;
            } else if (d.effectiveness === 'Effective') {
                bar.style.backgroundColor = COLORS.primary;
            } else if (d.effectiveness === 'Too Attractive') {
                bar.style.backgroundColor = COLORS.warning;
            } else {
                bar.style.backgroundColor = COLORS.neutral;
            }

            barTrack.appendChild(bar);
            row.appendChild(barTrack);

            var stats = document.createElement('div');
            stats.className = 'aiq-distractor-stats';
            stats.innerHTML = '<span>' + d.percentage + '%</span>';
            
            if (options.showEffectiveness) {
                var effectClass = 'aiq-effect-' + d.effectiveness.toLowerCase().replace(/\s+/g, '-');
                stats.innerHTML += '<span class="aiq-effect-badge ' + effectClass + '">' + d.effectiveness + '</span>';
            }
            
            row.appendChild(stats);
            wrapper.appendChild(row);
        });

        return wrapper;
    };

    return {
        create: function(container) {
            return new Visualizer(container);
        },
        Visualizer: Visualizer,
        COLORS: COLORS
    };
});
