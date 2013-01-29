/*!
 * formvalidation.js (https://github.com/chemerisuk/formvalidation.js)
 *
 * HTML5 form validation api polyfill
 *
 * Copyright (c) 2013 Maksim Chemerisuk
 *
 */
window.addEventListener && (function(document, window, bodyEl, htmlEl) {
    var tooltipApi = (function() {
            var validityEl = bodyEl.appendChild(document.createElement("div")),
                invalidInput = null,
                buildErrorClass = (function() {
                    var rUpperCase = /[A-Z]/g,
                        camelCaseToDashSeparated = function(l) {
                            return "-" + l.toLowerCase();
                        };

                    return function(errorType, input) {
                        var inputType = input.getAttribute("type");

                        if (errorType === "typeMismatch" && inputType) {
                            // special case for email-mismatch, url-mismatch etc.
                            return inputType.toLowerCase() + "-mismatch";
                        } else {
                            // convert camel case to dash separated
                            return errorType.replace(rUpperCase, camelCaseToDashSeparated);
                        }
                    };
                })();
            
            validityEl.id = "validity";
            
            return {
                show: function(input, force) {
                    if ((force || !invalidInput || invalidInput === input) && !input.validity.valid) {
                        var // validity vars
                            validity = input.validity,
                            classesArray = [],
                            errorMessage,
                            // position vars
                            boundingRect = input.getBoundingClientRect(),
                            clientTop = htmlEl.clientTop || bodyEl.clientTop || 0,
                            clientLeft = htmlEl.clientLeft || bodyEl.clientLeft || 0,
                            scrollTop = (window.pageYOffset || htmlEl.scrollTop || bodyEl.scrollTop),
                            scrollLeft = (window.pageXOffset || htmlEl.scrollLeft || bodyEl.scrollLeft);
                        
                        for (var errorType in validity) {
                            if (validity[errorType]) {
                                classesArray.push(buildErrorClass(errorType, input));
                            }
                        }
                        
                        if (validity.patternMismatch) {
                            // if pattern check fails use title to get error message
                            errorMessage = input.title;
                        }
                        
                        if (validity.customError) {
                            errorMessage = input.validationMessage;
                        }
                        
                        validityEl.textContent = errorMessage || "";
                        validityEl.className = classesArray.join(" ");
                        validityEl.style.top = boundingRect.bottom + scrollTop - clientTop + "px";
                        validityEl.style.left = boundingRect.left + scrollLeft - clientLeft + "px";
                        
                        invalidInput = input;
                    }
                },
                hide: function(input, force) {
                    if (force || !invalidInput || invalidInput === input) {
                        validityEl.removeAttribute("class");
                        
                        invalidInput = null;
                    }
                },
                getForm: function() {
                    return invalidInput ? invalidInput.form : null;
                }
            };
        })();
    
    if (!("validity" in document.createElement("input"))) {
        var rNumber = /^-?[0-9]*(\.[0-9]+)?$/,
            rEmail = /^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/i,
            rUrl = /^(https?:\/\/)?[\da-z\.\-]+\.[a-z\.]{2,6}[#&+_\?\/\w \.\-=]*$/i;
        
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
        
        HTMLInputElement.prototype.checkValidity = HTMLTextAreaElement.prototype.checkValidity = function() {
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
                            validity.typeMismatch = !rEmail.test(this.value);
                            validity.valid = !validity.typeMismatch;
                            break;
                        case "url":
                            validity.typeMismatch = !rUrl.test(this.value);
                            validity.valid = !validity.typeMismatch;
                            break;
                        }

                        if (this.type !== "textarea") {
                            var pattern = this.getAttribute("pattern");
                            
                            if (pattern) {
                                pattern = new RegExp("^(?:" + pattern + ")$");
                                
                                validity.patternMismatch = !pattern.test(this.value);
                                validity.valid = !validity.patternMismatch;
                            }    
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

            if (!validity.valid) {
                // trigger invalid event
                var evt = document.createEvent("Event");
        
                evt.initEvent("invalid", false, false);

                this.dispatchEvent(evt);
            }
            
            // TODO: set validationMessage
            
            return validity.valid;
        };
        
        HTMLFormElement.prototype.checkValidity = function() {
            var inputs = Array.prototype.slice.call(this.elements, 0);

            for (var i = 0, n = inputs.length; i < n; ++i) {
                if (!inputs[i].checkValidity()) {
                    return false;
                }
            }

            return true;
        };
    }
    
    document.addEventListener("invalid", function(e) {
        tooltipApi.show(e.target, false);
        // don't show native tooltip
        e.preventDefault();
    }, true);
    
    document.addEventListener("change", function(e) {
        if (e.target.checkValidity()) {
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
        if (e.target.checkValidity()) {
            tooltipApi.hide(null, true);
        } else {
            // prevent form submition because of errors
            e.preventDefault();
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