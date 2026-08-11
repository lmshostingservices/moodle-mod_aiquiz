/**
 * AI Quiz Maker  -  Results Dashboard SPA
 * Beautiful results page with analytics and review
 * 
 * Features:
 * - Animated score ring
 * - Topic breakdown visualization
 * - Expandable question review
 * - Practice weak areas mode
 * - Retry and navigation buttons
 * 
 * @module     mod_aiquiz/results
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'mod_aiquiz/core/api',
    'mod_aiquiz/core/animations',
    'mod_aiquiz/ui/Feedback'
], function(Api, Animations, Feedback) {
    'use strict';

    function Results(options) {
        this.container = null;
        this.scoreRing = null;
        
        this.options = Object.assign({
            containerId: 'aiq-results-container',
            attemptId: null,
            quizId: null,
            cmId: null,
            quizName: '',
            score: 0,
            maxScore: 100,
            grade: 0,
            gradeToPass: 0,
            passed: false,
            timeTaken: 0,
            correctCount: 0,
            totalQuestions: 0,
            questions: [],
            topicBreakdown: [],
            canRetry: true,
            showCelebration: false
        }, options);
    }

    Results.prototype.init = function() {
        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error('Results container not found:', this.options.containerId);
            return;
        }

        this.render();
        
        if (this.options.showCelebration && this.options.grade >= 100) {
            this.showCelebration();
        }

        return this;
    };

    Results.prototype.render = function() {
        var html = '';

        html += '<div class="aiq-results">';

        html += '<div class="aiq-results__header">';
        html += this.renderScoreSection();
        html += this.renderSummarySection();
        html += '</div>';

        if (this.options.topicBreakdown.length > 0) {
            html += this.renderTopicBreakdown();
        }

        html += this.renderQuestionReview();
        html += this.renderActions();

        html += '</div>';

        this.container.innerHTML = html;

        this.animateScoreRing();

        Animations.staggerFadeIn(
            this.container.querySelectorAll('.aiq-results__topic-bar'),
            100
        );
    };

    Results.prototype.renderScoreSection = function() {
        var grade = Math.round(this.options.grade);
        var passedClass = this.options.passed ? 'aiq-results__score--passed' : 'aiq-results__score--failed';
        var statusText = this.options.passed ? 'Passed' : 'Not Passed';

        return '<div class="aiq-results__score ' + passedClass + '">' +
            '<div class="aiq-results__ring" data-grade="' + grade + '">' +
                '<svg viewBox="0 0 120 120">' +
                    '<circle class="aiq-results__ring-bg" cx="60" cy="60" r="54"/>' +
                    '<circle class="aiq-results__ring-fill" cx="60" cy="60" r="54"/>' +
                '</svg>' +
                '<div class="aiq-results__ring-text">' +
                    '<span class="aiq-results__percent" data-target="' + grade + '">0</span>' +
                    '<span class="aiq-results__percent-sign">%</span>' +
                '</div>' +
            '</div>' +
            '<div class="aiq-results__status">' + statusText + '</div>' +
        '</div>';
    };

    Results.prototype.renderSummarySection = function() {
        return '<div class="aiq-results__summary">' +
            '<div class="aiq-results__summary-item">' +
                '<span class="aiq-results__summary-icon">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>' +
                '</span>' +
                '<span class="aiq-results__summary-value">' + this.formatDuration(this.options.timeTaken) + '</span>' +
                '<span class="aiq-results__summary-label">Time taken</span>' +
            '</div>' +
            '<div class="aiq-results__summary-item">' +
                '<span class="aiq-results__summary-icon">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>' +
                '</span>' +
                '<span class="aiq-results__summary-value">' + this.options.correctCount + ' / ' + this.options.totalQuestions + '</span>' +
                '<span class="aiq-results__summary-label">Correct</span>' +
            '</div>' +
        '</div>';
    };

    Results.prototype.renderTopicBreakdown = function() {
        var html = '<div class="aiq-results__topics">';
        html += '<h3 class="aiq-results__section-title">Performance by Topic</h3>';

        var weakestTopic = null;
        var lowestScore = 101;

        for (var i = 0; i < this.options.topicBreakdown.length; i++) {
            var topic = this.options.topicBreakdown[i];
            var percent = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
            
            if (percent < lowestScore) {
                lowestScore = percent;
                weakestTopic = i;
            }

            var colorClass = percent >= 80 ? 'success' : percent >= 50 ? 'warning' : 'danger';

            html += '<div class="aiq-results__topic">';
            html += '<div class="aiq-results__topic-header">';
            html += '<span class="aiq-results__topic-name">' + this.escapeHtml(topic.name) + '</span>';
            html += '<span class="aiq-results__topic-score">' + percent + '% (' + topic.correct + '/' + topic.total + ')';
            if (i === weakestTopic && lowestScore < 80) {
                html += ' <span class="aiq-results__topic-focus">Focus</span>';
            }
            html += '</span>';
            html += '</div>';
            html += '<div class="aiq-results__topic-bar-bg">';
            html += '<div class="aiq-results__topic-bar aiq-results__topic-bar--' + colorClass + '" style="width: ' + percent + '%"></div>';
            html += '</div>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    };

    Results.prototype.renderQuestionReview = function() {
        var html = '<div class="aiq-results__review">';
        html += '<h3 class="aiq-results__section-title">Question Review</h3>';
        html += '<div class="aiq-results__questions">';

        for (var i = 0; i < this.options.questions.length; i++) {
            var q = this.options.questions[i];
            var isCorrect = q.fraction >= 1;
            var isPartial = q.fraction > 0 && q.fraction < 1;
            var statusClass = isCorrect ? 'correct' : isPartial ? 'partial' : 'incorrect';
            var statusIcon = isCorrect ? 'OK' : isPartial ? '[half]' : 'x';

            html += '<details class="aiq-results__question aiq-results__question--' + statusClass + '">';
            html += '<summary class="aiq-results__question-summary">';
            html += '<span class="aiq-results__question-icon">' + statusIcon + '</span>';
            html += '<span class="aiq-results__question-num">Q' + (i + 1) + '</span>';
            html += '<span class="aiq-results__question-text">' + this.truncate(this.stripHtml(q.questiontext), 60) + '</span>';
            html += '<span class="aiq-results__question-toggle">Details</span>';
            html += '</summary>';
            
            html += '<div class="aiq-results__question-detail">';
            html += '<div class="aiq-results__question-full">' + q.questiontext + '</div>';
            
            if (!isCorrect && q.userAnswer) {
                html += '<div class="aiq-results__answer-user">';
                html += '<strong>Your answer:</strong> ' + this.escapeHtml(q.userAnswer);
                html += '</div>';
            }
            
            if (!isCorrect && q.correctAnswer) {
                html += '<div class="aiq-results__answer-correct">';
                html += '<strong>Correct answer:</strong> ' + this.escapeHtml(q.correctAnswer);
                html += '</div>';
            }
            
            if (q.feedback) {
                html += '<div class="aiq-results__feedback">';
                html += '<span class="aiq-results__feedback-icon">[tip]</span> ' + q.feedback;
                html += '</div>';
            }
            
            html += '</div>';
            html += '</details>';
        }

        html += '</div></div>';
        return html;
    };

    Results.prototype.renderActions = function() {
        var html = '<div class="aiq-results__actions">';
        
        html += '<a href="view.php?id=' + this.options.cmId + '" class="aiq-btn aiq-btn--outline">';
        html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
        html += '<span>Back to Quiz</span>';
        html += '</a>';

        if (this.options.topicBreakdown.length > 0) {
            html += '<button type="button" class="aiq-btn aiq-btn--secondary" data-action="practice-weak">';
            html += '<span>Practice Weak Areas</span>';
            html += '</button>';
        }

        if (this.options.canRetry) {
            html += '<a href="attempt.php?id=' + this.options.cmId + '" class="aiq-btn aiq-btn--primary">';
            html += '<span>Retry Quiz</span>';
            html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
            html += '</a>';
        }

        html += '</div>';
        return html;
    };

    Results.prototype.animateScoreRing = function() {
        var ring = this.container.querySelector('.aiq-results__ring-fill');
        var percentEl = this.container.querySelector('.aiq-results__percent');
        
        if (!ring || !percentEl) return;

        var grade = parseInt(percentEl.dataset.target, 10);
        var circumference = 2 * Math.PI * 54;
        
        ring.style.strokeDasharray = circumference;
        ring.style.strokeDashoffset = circumference;

        requestAnimationFrame(function() {
            var offset = circumference - (grade / 100) * circumference;
            ring.style.transition = 'stroke-dashoffset 1.5s ease-out';
            ring.style.strokeDashoffset = offset;
        });

        var duration = 1500;
        var start = performance.now();
        var self = this;

        function animate(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            
            percentEl.textContent = Math.round(eased * grade);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    };

    Results.prototype.showCelebration = function() {
        var overlay = document.createElement('div');
        overlay.className = 'aiq-celebration-overlay';
        overlay.innerHTML = 
            '<div class="aiq-celebration">' +
                '<div class="aiq-celebration__stars">' +
                    '<span class="aiq-celebration__star">[star]</span>' +
                    '<span class="aiq-celebration__star">[star]</span>' +
                    '<span class="aiq-celebration__star">[star]</span>' +
                '</div>' +
                '<div class="aiq-celebration__trophy">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>' +
                '</div>' +
                '<h2 class="aiq-celebration__title">PERFECT SCORE!</h2>' +
                '<p class="aiq-celebration__subtitle">You answered every question correctly!</p>' +
                '<button type="button" class="aiq-btn aiq-btn--primary" data-action="close-celebration">View Results</button>' +
            '</div>';

        document.body.appendChild(overlay);

        overlay.querySelector('[data-action="close-celebration"]').addEventListener('click', function() {
            overlay.classList.add('aiq-celebration-overlay--closing');
            setTimeout(function() {
                overlay.remove();
            }, 300);
        });

        Animations.scaleIn(overlay.querySelector('.aiq-celebration'), 400);
    };

    Results.prototype.formatDuration = function(seconds) {
        var mins = Math.floor(seconds / 60);
        var secs = seconds % 60;
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    };

    Results.prototype.truncate = function(str, len) {
        if (str.length <= len) return str;
        return str.substr(0, len) + '...';
    };

    Results.prototype.stripHtml = function(html) {
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    Results.prototype.escapeHtml = function(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    return Results;
});
