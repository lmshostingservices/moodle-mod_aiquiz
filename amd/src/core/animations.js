/**
 * AI Quiz Maker  -  Animation Helpers
 * Shared motion utilities for SaaS-grade interactions
 * 
 * @module     mod_aiquiz/core/animations
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    'use strict';

    /**
     * Animation timing constants (must match tokens.css)
     */
    var TIMING = {
        fast: 120,
        normal: 200,
        slow: 320,
        slower: 500
    };

    /**
     * Easing functions
     */
    var EASING = {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    };

    return {
        /**
         * Fade in element with upward slide
         * @param {HTMLElement} element
         * @param {number} duration
         * @param {number} delay
         * @returns {Promise}
         */
        fadeInUp: function(element, duration, delay) {
            duration = duration || TIMING.normal;
            delay = delay || 0;

            element.style.opacity = '0';
            element.style.transform = 'translateY(12px)';
            element.style.transition = 'none';

            return new Promise(function(resolve) {
                setTimeout(function() {
                    element.style.transition = 'opacity ' + duration + 'ms ' + EASING.decelerate + 
                                               ', transform ' + duration + 'ms ' + EASING.decelerate;
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';

                    setTimeout(resolve, duration);
                }, delay);
            });
        },

        /**
         * Fade out element with downward slide
         * @param {HTMLElement} element
         * @param {number} duration
         * @returns {Promise}
         */
        fadeOutDown: function(element, duration) {
            duration = duration || TIMING.normal;

            return new Promise(function(resolve) {
                element.style.transition = 'opacity ' + duration + 'ms ' + EASING.accelerate + 
                                           ', transform ' + duration + 'ms ' + EASING.accelerate;
                element.style.opacity = '0';
                element.style.transform = 'translateY(12px)';

                setTimeout(resolve, duration);
            });
        },

        /**
         * Scale in element
         * @param {HTMLElement} element
         * @param {number} duration
         * @returns {Promise}
         */
        scaleIn: function(element, duration) {
            duration = duration || TIMING.normal;

            element.style.opacity = '0';
            element.style.transform = 'scale(0.95)';
            element.style.transition = 'none';

            return new Promise(function(resolve) {
                setTimeout(function() {
                    element.style.transition = 'opacity ' + duration + 'ms ' + EASING.decelerate + 
                                               ', transform ' + duration + 'ms ' + EASING.spring;
                    element.style.opacity = '1';
                    element.style.transform = 'scale(1)';

                    setTimeout(resolve, duration);
                }, 10);
            });
        },

        /**
         * Shake element (for incorrect answers)
         * @param {HTMLElement} element
         * @returns {Promise}
         */
        shake: function(element) {
            return new Promise(function(resolve) {
                element.style.animation = 'aiq-incorrectShake 320ms ' + EASING.standard;

                element.addEventListener('animationend', function handler() {
                    element.removeEventListener('animationend', handler);
                    element.style.animation = '';
                    resolve();
                });
            });
        },

        /**
         * Pulse element (for correct answers)
         * @param {HTMLElement} element
         * @returns {Promise}
         */
        pulse: function(element) {
            return new Promise(function(resolve) {
                element.style.animation = 'aiq-correctPulse 500ms ' + EASING.standard;

                element.addEventListener('animationend', function handler() {
                    element.removeEventListener('animationend', handler);
                    element.style.animation = '';
                    resolve();
                });
            });
        },

        /**
         * Celebrate element (for quiz completion)
         * @param {HTMLElement} element
         * @returns {Promise}
         */
        celebrate: function(element) {
            return new Promise(function(resolve) {
                element.style.animation = 'aiq-celebrate 600ms ' + EASING.spring;

                element.addEventListener('animationend', function handler() {
                    element.removeEventListener('animationend', handler);
                    element.style.animation = '';
                    resolve();
                });
            });
        },

        /**
         * Stagger animate children
         * @param {HTMLElement} parent
         * @param {string} childSelector
         * @param {Function} animateFn
         * @param {number} staggerDelay
         * @returns {Promise}
         */
        stagger: function(parent, childSelector, animateFn, staggerDelay) {
            staggerDelay = staggerDelay || 50;
            var children = parent.querySelectorAll(childSelector);
            var promises = [];
            var self = this;

            children.forEach(function(child, index) {
                var promise = new Promise(function(resolve) {
                    setTimeout(function() {
                        animateFn.call(self, child).then(resolve);
                    }, index * staggerDelay);
                });
                promises.push(promise);
            });

            return Promise.all(promises);
        },

        /**
         * Hover lift effect (apply on mouseenter/mouseleave)
         * @param {HTMLElement} element
         * @param {boolean} isLifted
         */
        hoverLift: function(element, isLifted) {
            if (isLifted) {
                element.style.transform = 'translateY(-2px)';
                element.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
            } else {
                element.style.transform = 'translateY(0)';
                element.style.boxShadow = '';
            }
        },

        /**
         * Add shimmer loading effect
         * @param {HTMLElement} element
         */
        addShimmer: function(element) {
            element.classList.add('aiq-shimmer');
        },

        /**
         * Remove shimmer loading effect
         * @param {HTMLElement} element
         */
        removeShimmer: function(element) {
            element.classList.remove('aiq-shimmer');
        },

        /**
         * Get timing constants
         * @returns {Object}
         */
        getTiming: function() {
            return Object.assign({}, TIMING);
        },

        /**
         * Get easing functions
         * @returns {Object}
         */
        getEasing: function() {
            return Object.assign({}, EASING);
        }
    };
});
