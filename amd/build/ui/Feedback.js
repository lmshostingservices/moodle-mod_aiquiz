/**
 * AI Quiz Maker  -  Feedback UI Component
 * Unified feedback display with proper SVG icons and animations
 * 
 * Features:
 * - Consistent SVG icons (checkmark, X, partial, retry, trophy)
 * - ARIA live announcements for accessibility
 * - Animated transitions with iconPop, checkDraw, incorrectShake
 * - Retry/Try Again indicators
 * - World-class celebration effects with confetti for perfect scores
 * 
 * @module     mod_aiquiz/ui/Feedback
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/ui/Feedback', ['mod_aiquiz/core/animations'], function(Animations) {
    'use strict';

    /**
     * SVG Icon library for feedback
     */
    var Icons = {
        checkmark: '<svg class="aiq-feedback-svg aiq-feedback-svg--check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path class="aiq-check-path" d="M20 6L9 17l-5-5"/></svg>',
        
        cross: '<svg class="aiq-feedback-svg aiq-feedback-svg--cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
        
        partial: '<svg class="aiq-feedback-svg aiq-feedback-svg--partial" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
        
        retry: '<svg class="aiq-feedback-svg aiq-feedback-svg--retry" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
        
        star: '<svg class="aiq-feedback-svg aiq-feedback-svg--star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
        
        trophy: '<svg class="aiq-feedback-svg aiq-feedback-svg--trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>'
    };

    /**
     * Confetti configuration
     */
    var ConfettiConfig = {
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
        particleCount: 100,
        spread: 70,
        startVelocity: 30,
        decay: 0.94,
        gravity: 0.8,
        ticks: 200
    };

    /**
     * Feedback component class
     * @class
     */
    function Feedback(options) {
        this.element = null;
        
        this.options = Object.assign({
            type: 'info',
            message: '',
            showIcon: true,
            showRetry: false,
            showCorrectAnswer: null,
            animate: true,
            size: 'default',
            inline: false
        }, options);
    }

    /**
     * Render feedback element
     * @returns {HTMLElement}
     */
    Feedback.prototype.render = function() {
        var container = document.createElement('div');
        container.className = 'aiq-feedback aiq-feedback--' + this.options.type;
        
        if (this.options.size !== 'default') {
            container.classList.add('aiq-feedback--' + this.options.size);
        }
        
        if (this.options.inline) {
            container.classList.add('aiq-feedback--inline');
        }
        
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');

        if (this.options.showIcon) {
            var iconWrapper = document.createElement('div');
            iconWrapper.className = 'aiq-feedback__icon';
            if (this.options.animate) {
                iconWrapper.classList.add('aiq-feedback__icon--animated');
            }
            iconWrapper.innerHTML = this.getIcon();
            container.appendChild(iconWrapper);
        }

        var content = document.createElement('div');
        content.className = 'aiq-feedback__content';

        var message = document.createElement('div');
        message.className = 'aiq-feedback__message';
        message.innerHTML = this.options.message;
        content.appendChild(message);

        if (this.options.showCorrectAnswer !== null) {
            var correction = document.createElement('div');
            correction.className = 'aiq-feedback__correction';
            correction.innerHTML = '<span class="aiq-feedback__correction-label">Correct answer:</span> ' +
                                   '<strong>' + this.options.showCorrectAnswer + '</strong>';
            content.appendChild(correction);
        }

        if (this.options.showRetry) {
            var retry = document.createElement('div');
            retry.className = 'aiq-feedback__retry';
            retry.innerHTML = Icons.retry + '<span>Try again</span>';
            content.appendChild(retry);
        }

        container.appendChild(content);

        this.element = container;

        if (this.options.animate) {
            Animations.fadeInUp(container, 200);
        }

        return container;
    };

    /**
     * Get appropriate icon based on feedback type
     * @returns {string}
     */
    Feedback.prototype.getIcon = function() {
        switch (this.options.type) {
            case 'correct':
                return Icons.checkmark;
            case 'incorrect':
                return Icons.cross;
            case 'partial':
                return Icons.partial;
            case 'celebration':
                return Icons.trophy;
            default:
                return '';
        }
    };

    /**
     * Update the feedback message
     * @param {string} message
     */
    Feedback.prototype.setMessage = function(message) {
        if (this.element) {
            var msgEl = this.element.querySelector('.aiq-feedback__message');
            if (msgEl) {
                msgEl.innerHTML = message;
            }
        }
    };

    /**
     * Destroy the feedback element
     */
    Feedback.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    };

    /**
     * Create inline correct icon
     * @param {boolean} animated
     * @returns {HTMLElement}
     */
    Feedback.createCorrectIcon = function(animated) {
        var icon = document.createElement('span');
        icon.className = 'aiq-icon aiq-icon--correct';
        icon.innerHTML = Icons.checkmark;
        icon.setAttribute('aria-label', 'Correct');
        
        if (animated) {
            icon.classList.add('aiq-icon--animated', 'aiq-icon--pop');
        }
        
        return icon;
    };

    /**
     * Create inline incorrect icon
     * @param {boolean} animated
     * @returns {HTMLElement}
     */
    Feedback.createIncorrectIcon = function(animated) {
        var icon = document.createElement('span');
        icon.className = 'aiq-icon aiq-icon--incorrect';
        icon.innerHTML = Icons.cross;
        icon.setAttribute('aria-label', 'Incorrect');
        
        if (animated) {
            icon.classList.add('aiq-icon--animated', 'aiq-icon--shake');
        }
        
        return icon;
    };

    /**
     * Create inline partial credit icon
     * @returns {HTMLElement}
     */
    Feedback.createPartialIcon = function() {
        var icon = document.createElement('span');
        icon.className = 'aiq-icon aiq-icon--partial';
        icon.innerHTML = Icons.partial;
        icon.setAttribute('aria-label', 'Partially correct');
        return icon;
    };

    /**
     * Create a single confetti particle
     * @param {HTMLElement} container
     * @param {number} x
     * @param {number} y
     * @param {Object} config
     * @returns {HTMLElement}
     */
    function createConfettiParticle(container, x, y, config) {
        var particle = document.createElement('div');
        particle.className = 'aiq-confetti-particle';
        
        var color = config.colors[Math.floor(Math.random() * config.colors.length)];
        var size = Math.random() * 8 + 4;
        var shape = Math.random() > 0.5 ? 'circle' : 'rect';
        
        particle.style.cssText = 
            'position: fixed;' +
            'width: ' + size + 'px;' +
            'height: ' + (shape === 'circle' ? size : size * 0.6) + 'px;' +
            'background: ' + color + ';' +
            'border-radius: ' + (shape === 'circle' ? '50%' : '2px') + ';' +
            'left: ' + x + 'px;' +
            'top: ' + y + 'px;' +
            'pointer-events: none;' +
            'z-index: 10001;';
        
        var angle = (Math.random() - 0.5) * config.spread * (Math.PI / 180);
        var velocity = config.startVelocity * (0.5 + Math.random() * 0.5);
        var vx = Math.sin(angle) * velocity;
        var vy = -Math.cos(angle) * velocity;
        var rotation = Math.random() * 360;
        var rotationSpeed = (Math.random() - 0.5) * 20;
        
        container.appendChild(particle);
        
        var tick = 0;
        var decay = config.decay;
        var gravity = config.gravity;
        var ticks = config.ticks;
        var currentX = x;
        var currentY = y;
        
        function animate() {
            tick++;
            
            vx *= decay;
            vy = vy * decay + gravity;
            currentX += vx;
            currentY += vy;
            rotation += rotationSpeed;
            
            var opacity = 1 - (tick / ticks);
            
            particle.style.left = currentX + 'px';
            particle.style.top = currentY + 'px';
            particle.style.transform = 'rotate(' + rotation + 'deg)';
            particle.style.opacity = opacity;
            
            if (tick < ticks && opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }
        }
        
        requestAnimationFrame(animate);
        
        return particle;
    }

    /**
     * Fire confetti burst
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {Object} customConfig - Optional custom configuration
     */
    Feedback.fireConfetti = function(x, y, customConfig) {
        var config = Object.assign({}, ConfettiConfig, customConfig || {});
        var container = document.body;
        
        for (var i = 0; i < config.particleCount; i++) {
            setTimeout(function() {
                createConfettiParticle(container, x, y, config);
            }, i * 2);
        }
    };

    /**
     * Fire confetti from multiple positions
     */
    Feedback.fireConfettiCannon = function() {
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;
        
        Feedback.fireConfetti(viewportWidth * 0.25, viewportHeight * 0.5, { particleCount: 50, spread: 55 });
        
        setTimeout(function() {
            Feedback.fireConfetti(viewportWidth * 0.75, viewportHeight * 0.5, { particleCount: 50, spread: 55 });
        }, 150);
        
        setTimeout(function() {
            Feedback.fireConfetti(viewportWidth * 0.5, viewportHeight * 0.3, { particleCount: 80, spread: 100 });
        }, 300);
    };

    /**
     * Show celebration overlay for perfect scores
     * @param {HTMLElement} container
     * @param {Object} options
     * @returns {Promise}
     */
    Feedback.showCelebration = function(container, options) {
        options = Object.assign({
            score: 100,
            message: 'Perfect Score!',
            showConfetti: true,
            duration: 3500
        }, options);

        return new Promise(function(resolve) {
            var overlay = document.createElement('div');
            overlay.className = 'aiq-celebration';
            overlay.setAttribute('role', 'alert');
            overlay.setAttribute('aria-live', 'assertive');
            
            var scoreRingProgress = Math.round(options.score * 3.14159);
            
            overlay.innerHTML = 
                '<div class="aiq-celebration__backdrop"></div>' +
                '<div class="aiq-celebration__content">' +
                    '<div class="aiq-celebration__trophy">' + Icons.trophy + '</div>' +
                    '<div class="aiq-celebration__score-ring">' +
                        '<svg viewBox="0 0 120 120" class="aiq-celebration__ring-svg">' +
                            '<circle class="aiq-celebration__ring-bg" cx="60" cy="60" r="50" />' +
                            '<circle class="aiq-celebration__ring-progress" cx="60" cy="60" r="50" ' +
                                'stroke-dasharray="' + scoreRingProgress + ' 314" />' +
                        '</svg>' +
                        '<div class="aiq-celebration__score-value">' + options.score + '%</div>' +
                    '</div>' +
                    '<div class="aiq-celebration__message">' + options.message + '</div>' +
                    '<div class="aiq-celebration__stars">' +
                        '<span class="aiq-celebration__star aiq-celebration__star--1">' + Icons.star + '</span>' +
                        '<span class="aiq-celebration__star aiq-celebration__star--2">' + Icons.star + '</span>' +
                        '<span class="aiq-celebration__star aiq-celebration__star--3">' + Icons.star + '</span>' +
                    '</div>' +
                '</div>';
            
            container.appendChild(overlay);
            
            requestAnimationFrame(function() {
                overlay.classList.add('aiq-celebration--active');
            });
            
            var celebrationContent = overlay.querySelector('.aiq-celebration__content');
            Animations.scaleIn(celebrationContent);
            
            if (options.showConfetti) {
                setTimeout(function() {
                    Feedback.fireConfettiCannon();
                }, 200);
            }
            
            setTimeout(function() {
                overlay.classList.add('aiq-celebration--fade');
                setTimeout(function() {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                    resolve();
                }, 500);
            }, options.duration);
        });
    };

    /**
     * Show inline feedback toast
     * @param {HTMLElement} container
     * @param {Object} options
     * @returns {Promise}
     */
    Feedback.showToast = function(container, options) {
        options = Object.assign({
            type: 'info',
            message: '',
            duration: 3000,
            position: 'bottom'
        }, options);

        return new Promise(function(resolve) {
            var toast = document.createElement('div');
            toast.className = 'aiq-toast aiq-toast--' + options.type + ' aiq-toast--' + options.position;
            
            var iconHtml = '';
            switch (options.type) {
                case 'correct':
                    iconHtml = Icons.checkmark;
                    break;
                case 'incorrect':
                    iconHtml = Icons.cross;
                    break;
                case 'partial':
                    iconHtml = Icons.partial;
                    break;
            }
            
            toast.innerHTML = 
                '<div class="aiq-toast__icon">' + iconHtml + '</div>' +
                '<div class="aiq-toast__message">' + options.message + '</div>';
            
            container.appendChild(toast);
            
            Animations.fadeInUp(toast, 200);
            
            setTimeout(function() {
                Animations.fadeOutDown(toast, 200).then(function() {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                    resolve();
                });
            }, options.duration);
        });
    };

    /**
     * Get icon HTML by name
     * @param {string} name
     * @returns {string}
     */
    Feedback.getIcon = function(name) {
        return Icons[name] || '';
    };

    /**
     * Available icon names
     */
    Feedback.Icons = Icons;

    /**
     * Confetti configuration
     */
    Feedback.ConfettiConfig = ConfettiConfig;

    return Feedback;
});
