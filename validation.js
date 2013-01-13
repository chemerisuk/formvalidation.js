/*!
 * validation.js
 *
 * Copyright (c) 2013 Maksim Chemerisuk
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
document.addEventListener && (function(document, window, body, html) {
    var validateElement = function(input) {
            if ("checkValidity" in input && !input.checkValidity()) {
                var evt = document.createEvent("Event");
        
                evt.initEvent("invalid", false, false);

                input.dispatchEvent(evt);
                
                return false;
            }
            
            return true;
        },
        tooltipApi = (function() {
            var validityTooltip = document.createElement("div"),
                invalidInput = null;
            
            validityTooltip.id = "validity";
            
            body.appendChild(validityTooltip);
            
            return {
                show: function(input, force) {
                    if ((force || !invalidInput || invalidInput === input) && !input.validity.valid) {
                        var // validity vars
                            validity = input.validity,
                            errorArray = [],
                            errorMessage,
                            // position vars
                            boundingRect = input.getBoundingClientRect(),
                            clientTop = html.clientTop || body.clientTop || 0,
                            clientLeft = html.clientLeft || body.clientLeft || 0,
                            scrollTop = (window.pageYOffset || html.scrollTop || body.scrollTop),
                            scrollLeft = (window.pageXOffset || html.scrollLeft || body.scrollLeft);
                        
                        for (var errorType in validity) {
                            if (validity[errorType]) {
                                errorArray.push(errorType);
                            }
                        }
                        
                        if (validity.patternMismatch) {
                            // if pattern check fails use title to get error message
                            errorMessage = input.title;
                        }
                        
                        if (validity.customError) {
                            errorMessage = input.validationMessage;
                        }
                        
                        validityTooltip.textContent = errorMessage || "";
                        validityTooltip.className = errorArray.join(" ");
                        validityTooltip.style.top = boundingRect.bottom + scrollTop - clientTop + "px";
                        validityTooltip.style.left = boundingRect.left + scrollLeft - clientLeft + "px";
                        
                        invalidInput = input;
                    }
                },
                hide: function(input, force) {
                    if (force || !invalidInput || invalidInput === input) {
                        validityTooltip.removeAttribute("class");
                        
                        invalidInput = null;
                    }
                },
                getForm: function() {
                    return invalidInput ? invalidInput.form : null;
                }
            };
        })();
    
    if (!("validity" in document.createElement("input"))) {
        var numberRe = /^-?[0-9]*(\.[0-9]+)?$/,
            emailRe = /^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/i,
            urlRe = /^(https?:\/\/)?[\da-z\.\-]+\.[a-z\.]{2,6}[#&+_\?\/\w \.\-=]*$/i;
        
        window.ValidityState = function() {
            this.customError = false;
            this.patternMismatch = false;
            this.rangeOverflow = false;
            this.rangeUnderflow = false;
            this.stepMismatch = false;
            this.tooLong = false;
            this.typeMismatch = false;
            this.valid = true;
            this.valueMissing = false;
        };
        
        HTMLInputElement.prototype.setCustomValidity = HTMLTextAreaElement.prototype.setCustomValidity = function(message) {
            this.validationMessage = message;
            this.validity.customError = !!message;
        };
        
        // TODO: input[type=number]
        
        HTMLInputElement.prototype.checkValidity = function() {
            var validity = new ValidityState();
            
            switch(this.type) {
                case "image":
                case "submit":
                case "button":
                    return true;
                
                case "radio":
                    if (!this.checked && this.getAttribute("required")) {
                        validity.valueMissing = Array.prototype.some.call(this.form.elements, function(el) {
                            return this.name === el.name && el.checked;
                        }, this);
                        validity.valid = !validity.valueMissing;
                    }
                    break;
                case "checkbox":
                    validity.valueMissing = (!this.checked && this.getAttribute("required"));
                    validity.valid = !validity.valueMissing;
                    break;
                default: {
                    if (this.value) {
                        switch (this.getAttribute("type")) {
                        case "number":
                            validity.typeMismatch = !numberRe.test(this.value);
                            validity.valid = !validity.typeMismatch;
                            break;
                        case "email":
                            validity.typeMismatch = !emailRe.test(this.value);
                            validity.valid = !validity.typeMismatch;
                            break;
                        case "url":
                            validity.typeMismatch = !urlRe.test(this.value);
                            validity.valid = !validity.typeMismatch;
                            break;
                        }
                        
                        var pattern = this.getAttribute("pattern");
                        
                        if (pattern) {
                            pattern = new RegExp("^(?:" + pattern + ")$");
                            
                            validity.patternMismatch = (pattern && !pattern.test(this.value));
                            validity.valid = !validity.patternMismatch;
                        }
                    } else {
                        validity.valueMissing = !!this.getAttribute("required");
                        validity.valid = !validity.valueMissing;
                    }
                }
            }
            
            if (this.validity) {
                validity.customError = this.validity.customError;
                validity.valid &= !validity.customError;
            }
            
            this.validity = validity;
            
            // TODO: set validationMessage
            
            return validity.valid;
        };
        
        HTMLTextAreaElement.prototype.checkValidity = function() {
            var validity = new ValidityState();
            
            validity.valueMissing = (this.value && !this.getAttribute("required"));
            validity.valid = !validity.valueMissing;
            
            if (this.validity) {
                validity.customError = this.validity.customError;
                validity.valid &= !validity.customError;
            }
            
            this.validity = validity;
            
            return validity.valid;
        };
        
        HTMLFormElement.prototype.checkValidity = function() {
            return Array.prototype.every.call(this.elements, function(el) {
                return validateElement(el) || !!tooltipApi.show(el);
            });
        };
    }
    
    document.addEventListener("invalid", function(e) {
        tooltipApi.show(e.target, false);
        // don't show native tooltip
        e.preventDefault();
    }, true);
    
    document.addEventListener("change", function(e) {
        if (!validateElement(e.target)) {
            tooltipApi.show(e.target, true);
        } else {
            tooltipApi.hide(e.target, false);
        }
    }, false);
    
    document.addEventListener("input", function(e) {
        var target = e.target;
        // polyfill textarea maxlength attribute
        if (target.type == "textarea") {
            var maxlength = parseInt(target.getAttribute("maxlength"), 10);
            
            if (maxlength) {
                target.value = target.value.substr(0, maxlength);
            }
        }
        
        // hide tooltip on user input
        tooltipApi.hide(target, true);
    }, false);
    
    // validate all elements on a form submit
    document.addEventListener("submit", function(e) {
        if (!e.target.checkValidity()) {
            // prevent form submitting
            e.preventDefault();
        } else {
            tooltipApi.hide(null, true);
        }
    }, true);
    
    // hide tooltip when user resets the form
    document.addEventListener("reset", function(e) {
        tooltipApi.hide(null, true);
    }, false);
    
    // hide tooltip when user goes to other part of page
    document.addEventListener("click", function(e) {
        if (e.target.form !== tooltipApi.getForm()) {
            tooltipApi.hide(null, true);
        }
    }, true);
    
})(document, window, document.body, document.documentElement);