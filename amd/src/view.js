/**
 * AI Quiz Maker  -  View Page SPA
 * Pre-quiz landing experience with engagement elements
 * 
 * Features:
 * - Quiz information display
 * - Previous attempts history
 * - Practice mode option
 * - Encouraging CTA
 * - What to expect preview
 * 
 * @module     mod_aiquiz/view
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'mod_aiquiz/core/api',
    'mod_aiquiz/core/animations',
    'mod_aiquiz/ui/Button'
], function(Api, Animations, Button) {
    'use strict';

    function View(options) {
        this.container = null;
        
        this.options = Object.assign({
            containerId: 'aiq-view-container',
            quizId: null,
            cmId: null,
            quizName: '',
            quizIntro: '',
            questionCount: 0,
            timelimit: 0,
            gradeToPass: 0,
            attemptsAllowed: 0,
            attemptsRemaining: null,
            previousAttempts: [],
            canAttempt: true,
            inProgressAttemptId: null,
            questionTypes: [],
            hasFeedback: true
        }, options);
    }

    View.prototype.init = function() {
        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error('View container not found:', this.options.containerId);
            return;
        }

        this.render();
        return this;
    };

    View.prototype.render = function() {
        var html = '';

        html += '<div class="aiq-view">';
        
        html += '<div class="aiq-view__header">';
        html += '<div class="aiq-view__icon">';
        html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2Z"/><path d="M9 3H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/><path d="M19 3h-4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/><path d="M19 15h-4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z"/></svg>';
        html += '</div>';
        html += '<h1 class="aiq-view__title">' + this.escapeHtml(this.options.quizName) + '</h1>';
        if (this.options.quizIntro) {
            html += '<p class="aiq-view__intro">' + this.options.quizIntro + '</p>';
        }
        html += '</div>';

        html += '<div class="aiq-view__stats">';
        html += this.renderStatCard('Questions', this.options.questionCount, 'question');
        html += this.renderStatCard('Time', this.formatTime(this.options.timelimit), 'clock');
        if (this.options.gradeToPass > 0) {
            html += this.renderStatCard('To Pass', this.options.gradeToPass + '%', 'target');
        }
        if (this.options.attemptsAllowed > 0) {
            var attemptsLabel = this.options.attemptsRemaining !== null ? 
                this.options.attemptsRemaining + ' left' : this.options.attemptsAllowed;
            html += this.renderStatCard('Attempts', attemptsLabel, 'retry');
        } else {
            html += this.renderStatCard('Attempts', 'Unlimited', 'infinity');
        }
        html += '</div>';

        html += '<div class="aiq-view__expect">';
        html += '<h3 class="aiq-view__expect-title">What to Expect</h3>';
        html += '<ul class="aiq-view__expect-list">';
        html += '<li><span class="aiq-view__check">OK</span> Multiple choice and interactive questions</li>';
        if (this.options.hasFeedback) {
            html += '<li><span class="aiq-view__check">OK</span> Instant feedback after each question</li>';
        }
        html += '<li><span class="aiq-view__check">OK</span> Review your answers at the end</li>';
        html += '<li><span class="aiq-view__check">\u{1F4F1}</span> Works great on mobile!</li>';
        html += '</ul>';
        html += '</div>';

        if (this.options.previousAttempts.length > 0) {
            html += this.renderPreviousAttempts();
        }

        html += '<div class="aiq-view__actions">';
        if (this.options.canAttempt) {
            if (this.options.inProgressAttemptId) {
                html += '<a href="attempt.php?id=' + this.options.cmId + '&attempt=' + this.options.inProgressAttemptId + '" class="aiq-btn aiq-btn--primary aiq-btn--lg">';
                html += '<span>Continue Attempt</span>';
                html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
                html += '</a>';
            } else {
                html += '<a href="attempt.php?id=' + this.options.cmId + '" class="aiq-btn aiq-btn--primary aiq-btn--lg">';
                html += '<span>Begin Assessment</span>';
                html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
                html += '</a>';
            }
            html += '<p class="aiq-view__encouragement">You\'ve got this! Take your time.</p>';
        } else {
            html += '<div class="aiq-view__blocked">';
            html += '<p>You have used all your attempts for this quiz.</p>';
            html += '</div>';
        }
        html += '</div>';

        html += '</div>';

        this.container.innerHTML = html;

        Animations.staggerFadeIn(this.container.querySelectorAll('.aiq-view__stat, .aiq-view__expect-list li'), 50);
    };

    View.prototype.renderStatCard = function(label, value, icon) {
        var iconSvg = this.getIcon(icon);
        return '<div class="aiq-view__stat">' +
            '<div class="aiq-view__stat-icon">' + iconSvg + '</div>' +
            '<div class="aiq-view__stat-value">' + value + '</div>' +
            '<div class="aiq-view__stat-label">' + label + '</div>' +
        '</div>';
    };

    View.prototype.renderPreviousAttempts = function() {
        var html = '<div class="aiq-view__attempts">';
        html += '<h3 class="aiq-view__attempts-title">Your Previous Attempts</h3>';
        html += '<div class="aiq-view__attempts-list">';

        var bestGrade = Math.max.apply(Math, this.options.previousAttempts.map(function(a) { return a.grade || 0; }));

        for (var i = 0; i < this.options.previousAttempts.length; i++) {
            var attempt = this.options.previousAttempts[i];
            var isBest = attempt.grade === bestGrade;
            
            html += '<div class="aiq-view__attempt' + (isBest ? ' aiq-view__attempt--best' : '') + '">';
            html += '<div class="aiq-view__attempt-info">';
            html += '<span class="aiq-view__attempt-num">Attempt ' + (i + 1) + '</span>';
            html += '<span class="aiq-view__attempt-date">' + this.formatDate(attempt.timecreated) + '</span>';
            html += '</div>';
            html += '<div class="aiq-view__attempt-grade">';
            html += '<span class="aiq-view__attempt-score">' + Math.round(attempt.grade || 0) + '%</span>';
            if (isBest) {
                html += '<span class="aiq-view__attempt-badge">Best Score</span>';
            }
            html += '</div>';
            html += '<a href="review.php?id=' + this.options.cmId + '&attempt=' + attempt.id + '" class="aiq-view__attempt-review">Review</a>';
            html += '</div>';
        }

        html += '</div></div>';
        return html;
    };

    View.prototype.getIcon = function(name) {
        var icons = {
            question: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
            clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
            target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
            retry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
            infinity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/></svg>'
        };
        return icons[name] || '';
    };

    View.prototype.formatTime = function(seconds) {
        if (!seconds || seconds <= 0) {
            return 'No limit';
        }
        var minutes = Math.floor(seconds / 60);
        if (minutes >= 60) {
            var hours = Math.floor(minutes / 60);
            var remainingMins = minutes % 60;
            return hours + 'h ' + (remainingMins > 0 ? remainingMins + 'm' : '');
        }
        return '~' + minutes + ' min';
    };

    View.prototype.formatDate = function(timestamp) {
        var date = new Date(timestamp * 1000);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    View.prototype.escapeHtml = function(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    return View;
});
