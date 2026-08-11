/**
 * AI Quiz Maker  -  Timer Component
 * Premium timer display with urgency states and animations
 * 
 * Features:
 * - Countdown display (optional)
 * - Estimated time remaining mode
 * - Urgency color transitions
 * - Final minutes warning
 * - Pause/resume support
 * - ARIA time announcements
 * 
 * @module     mod_aiquiz/ui/Timer
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    'use strict';

    var URGENCY_THRESHOLDS = {
        warning: 300,
        critical: 60
    };

    function Timer(options) {
        this.element = null;
        this.intervalId = null;
        this.isPaused = false;

        this.options = Object.assign({
            timeLimit: 0,
            timeStarted: Date.now(),
            showEstimate: true,
            showCountdown: false,
            estimatedMinutes: 15,
            onTimeUp: null,
            onWarning: null,
            onCritical: null
        }, options);

        this.remainingSeconds = this.options.timeLimit;
    }

    Timer.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-timer';
        container.setAttribute('role', 'timer');
        container.setAttribute('aria-live', 'polite');

        var icon = document.createElement('span');
        icon.className = 'aiq-timer__icon';
        icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>';
        container.appendChild(icon);

        var display = document.createElement('span');
        display.className = 'aiq-timer__display';
        container.appendChild(display);
        this.displayEl = display;

        this.element = container;
        this.updateDisplay();

        if (this.options.timeLimit > 0) {
            this.start();
        }

        return container;
    };

    Timer.prototype.start = function() {
        var self = this;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.calculateRemaining();
        this.updateDisplay();

        this.intervalId = setInterval(function() {
            if (!self.isPaused) {
                self.tick();
            }
        }, 1000);
    };

    Timer.prototype.tick = function() {
        this.calculateRemaining();
        this.updateDisplay();
        this.checkUrgency();

        if (this.remainingSeconds <= 0) {
            this.stop();
            if (this.options.onTimeUp) {
                this.options.onTimeUp();
            }
        }
    };

    Timer.prototype.calculateRemaining = function() {
        if (this.options.timeLimit <= 0) {
            return;
        }

        var elapsed = Math.floor((Date.now() - this.options.timeStarted) / 1000);
        this.remainingSeconds = Math.max(0, this.options.timeLimit - elapsed);
    };

    Timer.prototype.updateDisplay = function() {
        if (!this.displayEl) return;

        if (this.options.timeLimit <= 0) {
            if (this.options.showEstimate) {
                this.displayEl.textContent = '~' + this.options.estimatedMinutes + ' min';
            } else {
                this.displayEl.textContent = '';
            }
            return;
        }

        var remaining = this.remainingSeconds;

        if (this.options.showCountdown || remaining <= URGENCY_THRESHOLDS.warning) {
            var hours = Math.floor(remaining / 3600);
            var minutes = Math.floor((remaining % 3600) / 60);
            var seconds = remaining % 60;

            if (hours > 0) {
                this.displayEl.textContent = this.pad(hours) + ':' + this.pad(minutes) + ':' + this.pad(seconds);
            } else {
                this.displayEl.textContent = this.pad(minutes) + ':' + this.pad(seconds);
            }
        } else {
            var minutesRemaining = Math.ceil(remaining / 60);
            this.displayEl.textContent = '~' + minutesRemaining + ' min remaining';
        }

        this.element.setAttribute('aria-label', 'Time remaining: ' + this.getAriaTime());
    };

    Timer.prototype.getAriaTime = function() {
        var remaining = this.remainingSeconds;
        var hours = Math.floor(remaining / 3600);
        var minutes = Math.floor((remaining % 3600) / 60);
        var seconds = remaining % 60;

        var parts = [];
        if (hours > 0) parts.push(hours + ' hour' + (hours !== 1 ? 's' : ''));
        if (minutes > 0) parts.push(minutes + ' minute' + (minutes !== 1 ? 's' : ''));
        if (remaining < 60) parts.push(seconds + ' second' + (seconds !== 1 ? 's' : ''));

        return parts.join(' ') || 'Time is up';
    };

    Timer.prototype.pad = function(num) {
        return num < 10 ? '0' + num : num;
    };

    Timer.prototype.checkUrgency = function() {
        if (!this.element) return;

        this.element.classList.remove('aiq-timer--warning', 'aiq-timer--critical');

        if (this.remainingSeconds <= URGENCY_THRESHOLDS.critical) {
            this.element.classList.add('aiq-timer--critical');
            if (this.remainingSeconds === URGENCY_THRESHOLDS.critical && this.options.onCritical) {
                this.options.onCritical();
            }
        } else if (this.remainingSeconds <= URGENCY_THRESHOLDS.warning) {
            this.element.classList.add('aiq-timer--warning');
            if (this.remainingSeconds === URGENCY_THRESHOLDS.warning && this.options.onWarning) {
                this.options.onWarning();
            }
        }
    };

    Timer.prototype.pause = function() {
        this.isPaused = true;
        if (this.element) {
            this.element.classList.add('aiq-timer--paused');
        }
    };

    Timer.prototype.resume = function() {
        this.isPaused = false;
        if (this.element) {
            this.element.classList.remove('aiq-timer--paused');
        }
    };

    Timer.prototype.stop = function() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    };

    Timer.prototype.addTime = function(seconds) {
        this.options.timeLimit += seconds;
        this.calculateRemaining();
        this.updateDisplay();
    };

    Timer.prototype.setEstimate = function(minutes) {
        this.options.estimatedMinutes = minutes;
        this.updateDisplay();
    };

    Timer.prototype.destroy = function() {
        this.stop();
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.displayEl = null;
    };

    return Timer;
});
