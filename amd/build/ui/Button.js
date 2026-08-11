/**
 * AI Quiz Maker  -  Button UI Component
 * Premium button styles with loading states
 * 
 * @module     mod_aiquiz/ui/Button
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/ui/Button', [], function() {
    'use strict';

    /**
     * Button component class
     * @class
     */
    function Button(options) {
        this.element = null;
        this.loading = false;
        this.disabled = false;

        this.options = Object.assign({
            id: '',
            text: '',
            icon: null,
            iconPosition: 'left',
            variant: 'default',
            size: 'medium',
            fullWidth: false,
            type: 'button'
        }, options);

        this.onClick = null;
    }

    /**
     * Render the button
     * @returns {HTMLElement}
     */
    Button.prototype.render = function() {
        var button = document.createElement('button');
        button.className = 'aiq-btn';
        button.type = this.options.type;

        if (this.options.id) {
            button.id = this.options.id;
            button.setAttribute('data-testid', 'button-' + this.options.id);
        }

        button.classList.add('aiq-btn--' + this.options.variant);
        button.classList.add('aiq-btn--' + this.options.size);

        if (this.options.fullWidth) {
            button.classList.add('aiq-btn--full');
        }

        this.renderContent(button);
        this.bindEvents(button);

        this.element = button;
        return button;
    };

    /**
     * Render button content
     * @param {HTMLElement} button
     */
    Button.prototype.renderContent = function(button) {
        button.innerHTML = '';

        if (this.loading) {
            var spinner = document.createElement('span');
            spinner.className = 'aiq-btn__spinner';
            spinner.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="62.83" stroke-dashoffset="15.71"/></svg>';
            button.appendChild(spinner);
        }

        if (this.options.icon && this.options.iconPosition === 'left' && !this.loading) {
            var iconLeft = document.createElement('span');
            iconLeft.className = 'aiq-btn__icon aiq-btn__icon--left';
            iconLeft.innerHTML = this.options.icon;
            button.appendChild(iconLeft);
        }

        var text = document.createElement('span');
        text.className = 'aiq-btn__text';
        text.textContent = this.loading ? 'Loading...' : this.options.text;
        button.appendChild(text);

        if (this.options.icon && this.options.iconPosition === 'right' && !this.loading) {
            var iconRight = document.createElement('span');
            iconRight.className = 'aiq-btn__icon aiq-btn__icon--right';
            iconRight.innerHTML = this.options.icon;
            button.appendChild(iconRight);
        }
    };

    /**
     * Bind event handlers
     * @param {HTMLElement} button
     */
    Button.prototype.bindEvents = function(button) {
        var self = this;

        button.addEventListener('click', function(e) {
            if (self.disabled || self.loading) {
                e.preventDefault();
                return;
            }
            if (self.onClick) {
                self.onClick(e);
            }
        });
    };

    /**
     * Set loading state
     * @param {boolean} isLoading
     */
    Button.prototype.setLoading = function(isLoading) {
        this.loading = isLoading;
        if (this.element) {
            if (isLoading) {
                this.element.classList.add('aiq-btn--loading');
                this.element.setAttribute('aria-busy', 'true');
            } else {
                this.element.classList.remove('aiq-btn--loading');
                this.element.removeAttribute('aria-busy');
            }
            this.renderContent(this.element);
        }
    };

    /**
     * Disable the button
     */
    Button.prototype.disable = function() {
        this.disabled = true;
        if (this.element) {
            this.element.disabled = true;
            this.element.classList.add('aiq-btn--disabled');
        }
    };

    /**
     * Enable the button
     */
    Button.prototype.enable = function() {
        this.disabled = false;
        if (this.element) {
            this.element.disabled = false;
            this.element.classList.remove('aiq-btn--disabled');
        }
    };

    /**
     * Update button text
     * @param {string} text
     */
    Button.prototype.setText = function(text) {
        this.options.text = text;
        if (this.element && !this.loading) {
            var textEl = this.element.querySelector('.aiq-btn__text');
            if (textEl) {
                textEl.textContent = text;
            }
        }
    };

    /**
     * Destroy the button
     */
    Button.prototype.destroy = function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    };

    return Button;
});
