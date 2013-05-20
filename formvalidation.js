/*!
 * formvalidation.js (https://github.com/chemerisuk/formvalidation.js)
 *
 * HTML5 forms polyfill
 *
 * Copyright (c) 2013 Maksim Chemerisuk
 *
 */
window.addEventListener && (function(document, window) {
    // helper type
    function TooltipAPI(options, overrides) {
        var el = document.createElement(options && options.tagName || "div");

        Object.keys(options || {}).forEach(function(key) {
            if (key !== "tagName") el[key] = options[key];
        });
        
        el.className = "formvalidation-tooltip";
        
        var self = this;
        el.onmousedown = function(e) {
            self._target.focus();
            // fix problems with loosing focus when click on tooltip
            e.preventDefault();
            e.stopPropagation();
        };

        this._el = el;

        Object.keys(overrides || {}).forEach(function(key) {
            this[key] = overrides[key];
        }, this);

        this.hide();
    }

    TooltipAPI.prototype = {
        capture: function(el) {
            return !!(this._target = el);
        },
        show: function() {
            if (this._target) {
                this.refresh();

                var boundingRect = this._target.getBoundingClientRect(),
                    clientTop = htmlEl.clientTop || bodyEl.clientTop || 0,
                    clientLeft = htmlEl.clientLeft || bodyEl.clientLeft || 0,
                    scrollTop = window.pageYOffset || htmlEl.scrollTop || bodyEl.scrollTop,
                    scrollLeft = window.pageXOffset || htmlEl.scrollLeft || bodyEl.scrollLeft;

                if (this._el.parentNode === null) {
                    bodyEl.appendChild(this._el);
                }

                this._el.style.left = boundingRect.left + scrollLeft - clientLeft + "px";
                this._el.style.top = boundingRect.bottom + scrollTop - clientTop + "px";
                this._el.removeAttribute("hidden");
            }
        },
        refresh: function() {},
        hide: function() {
            if (this._target !== null) {
                this._target = null;
                this._el.setAttribute("hidden", "hidden");
            }
        }
    };

    var bodyEl = document.body,
        headEl = document.head,
        htmlEl = document.documentElement,
        bindEvent = function(eventType, handler, capturing) {
            document.addEventListener(eventType, handler, !!capturing);
        },
        bindCapturingEvent = function(eventType, handler) {
            bindEvent(eventType, handler, true);
        },
        fireEvent = function(eventType, thisPtr) {
            var evt = document.createEvent("Event");
        
            evt.initEvent(eventType, false, false);

            thisPtr.dispatchEvent(evt);
        },
        watch = (function() {
            // use trick discovered by Daniel Buchner to style dateinputs
            // https://github.com/csuwldcat/SelectorListener
            var styles = headEl.appendChild(document.createElement("style")),
                keyframes = headEl.appendChild(document.createElement("style")),
                startNames = ["animationstart", "oAnimationStart", "MSAnimationStart", "webkitAnimationStart"],
                prefix = (function() {
                    var duration = "animation-duration: 0.01s;",
                        name = "animation-name: formvalidation !important;",
                        computed = window.getComputedStyle(htmlEl, ""),
                        pre = (Array.prototype.slice.call(computed).join("").match(/moz|webkit|ms/)||(computed.OLink===""&&["o"]))[0];
                    return {
                        css: "-" + pre + "-",
                        properties: "{" + duration + name + "-" + pre + "-" + duration + "-" + pre + "-" + name + "}",
                        keyframes: !!(window.CSSKeyframesRule || window[("WebKit|Moz|MS|O").match(new RegExp("(" + pre + ")", "i"))[1] + "CSSKeyframesRule"])
                    };
                })();

            return function(selector, fn) {
                var animationName = "formvalidation-" + new Date().getTime();

                styles.sheet.insertRule(selector + prefix.properties.replace(/formvalidation/g, animationName), 0);

                keyframes.appendChild(
                    document.createTextNode("@" + (prefix.keyframes ? prefix.css : "") + "keyframes " + animationName +
                        " {" + "from { clip: rect(1px, auto, auto, auto); } to { clip: rect(0px, auto, auto, auto); }" +
                    "}")
                );

                startNames.forEach(function(name){
                    bindEvent(name, function(event) {
                        if (event.animationName === animationName) {
                            fn.call(this, event, selector);
                        }
                    });
                });
            };
        })(),
        any = function(form, test, thisPtr) {
            return Array.prototype.slice.call(form.elements, 0).some(test, thisPtr);
        };

    var validityAPI = new TooltipAPI({ id: "formvalidation_validity" }, {
        tagName: "label",
        capture: function(el) {
            if (this._target === el) {
                this.refresh();
            }

            return !this._target && TooltipAPI.prototype.capture.call(this, el);
        },
        show: function() {
            TooltipAPI.prototype.show.apply(this, arguments);
            if (this._target && this._target.id)
                this._el.setAttribute("for", this._target.id);
        },
        hide: function() {
            TooltipAPI.prototype.hide.apply(this, arguments);
            if (this._target && this._target.id)
                this._el.removeAttribute("for");
        },
        refresh: function() {
            var validity = this._target.validity,
                i18nSuffix, errorMessage;
            
            if (validity.patternMismatch) {
                // if pattern check fails use title to get error message
                errorMessage = this._target.title;
            }
            
            if (validity.customError) {
                errorMessage = this._target.validationMessage;
            }

            if (!errorMessage) {
                for (var errorType in validity) {
                    if (validity[errorType]) {
                        i18nSuffix = this.getErrorClass(errorType);
                        if (i18nSuffix) {
                            break;
                        }  
                    }
                }
            }

            this._el.textContent = errorMessage || "";
            this._el.setAttribute("data-i18n", i18nSuffix ? "validity." + i18nSuffix : "");
        },
        getErrorClass: (function() {
            var rUpperCase = /[A-Z]/g,
                camelCaseToDashSeparated = function(l) {
                    return "." + l.toLowerCase();
                };

            return function(errorType) {
                var inputType = this._target.getAttribute("type");

                if (errorType === "typeMismatch" && inputType) {
                    // special case for email-mismatch, url-mismatch etc.
                    return inputType.toLowerCase() + ".mismatch";
                } else {
                    // convert camel case to dash separated
                    return errorType.replace(rUpperCase, camelCaseToDashSeparated);
                }
            };
        })(),
        getForm: function() {
            return this._target ? this._target.form : null;
        }
    });
    
    if (!("validity" in document.createElement("input"))) {
        var rNumber = /^-?[0-9]*(\.[0-9]+)?$/,
            rEmail = /^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/i,
            rUrl = /^(https?:\/\/)?[\da-z\.\-]+\.[a-z\.]{2,6}[#&+_\?\/\w \.\-=]*$/i,
            predefinedPatterns = {number: rNumber, email: rEmail, url: rUrl},
            hasCheckedRadio = function(el) { return el.checked && el.name === this; },
            hasInvalidElement = function(el) { return el.checkValidity && !el.checkValidity(); },
            ValidityState = function() {
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

        window.ValidityState = ValidityState;

        [HTMLInputElement, HTMLTextAreaElement, HTMLSelectElement].forEach(function(Type) {
            Type.prototype.setCustomValidity = function(message) {
                this.validationMessage = message;
                this.validity.customError = !!message;
            };

            Type.prototype.checkValidity = function() {
                var validity = new ValidityState();
                
                switch(this.type) {
                case "image":
                case "submit":
                case "button":
                    return true;

                case "select-one":
                case "select-multiple":
                    // for a select only check custom error case
                    break;
                    
                case "radio":
                    if (!this.checked && this.hasAttribute("required")) {
                        var name = this.name;

                        validity.valueMissing = !any(this.form, hasCheckedRadio, this);
                        validity.valid = !validity.valueMissing;
                    }
                    break;

                case "checkbox":
                    validity.valueMissing = (!this.checked && this.hasAttribute("required"));
                    validity.valid = !validity.valueMissing;
                    break;

                default:
                    if (this.value) {
                        var regexp = predefinedPatterns[this.getAttribute("type")];

                        if (regexp) {
                            validity.typeMismatch = !regexp.test(this.value);
                            validity.valid = !validity.typeMismatch;
                        }

                        if (this.type !== "textarea") {
                            regexp = this.getAttribute("pattern");
                            
                            if (regexp) {
                                validity.patternMismatch = !new RegExp("^(?:" + regexp + ")$").test(this.value);
                                validity.valid = !validity.patternMismatch;
                            }
                        }
                    } else {
                        validity.valueMissing = this.hasAttribute("required");
                        validity.valid = !validity.valueMissing;
                    }
                }
                
                if (this.validity) {
                    validity.customError = this.validity.customError;
                    validity.validationMessage = this.validity.validationMessage;
                    validity.valid = validity.valid && !validity.customError;
                }
                
                this.validity = validity;

                return validity.valid || !!fireEvent("invalid", this);
            };
        });
        
        HTMLFormElement.prototype.checkValidity = function() {
            return !any(this, hasInvalidElement);
        };
    }
    
    bindCapturingEvent("invalid", function(e) {
        if (validityAPI.capture(e.target)) {
            validityAPI.show();
        }
        // don't show native tooltip
        e.preventDefault();
    });
    
    bindEvent("change", function(e) {
        if (e.target.checkValidity()) {
            validityAPI.hide();
        }
    });
    
    bindEvent("input", function(e) {
        var target = e.target;
        // polyfill textarea maxlength attribute
        if (target.type === "textarea") {
            if (target.maxlength === undefined) {
                target.maxlength = parseInt(target.getAttribute("maxlength"), 10);
            }
            
            if (target.maxlength) {
                target.value = target.value.substr(0, target.maxlength);
            }
        }
    });
    
    bindCapturingEvent("submit", function(e) {
        // validate all elements on a form submit
        if (e.target.checkValidity()) {
            validityAPI.hide();
        } else {
            // prevent form submition because of errors
            e.preventDefault();
        }
    });
    
    bindEvent("reset", function(e) {
        // hide tooltip when user resets the form
        validityAPI.hide();
    });
    
    bindCapturingEvent("click", function(e) {
        // hide tooltip when user goes to other part of page
        var form = validityAPI.getForm();

        if (form) {
            for (var parent = e.target; parent; parent = parent.parentNode) {
                if (parent === form) {
                    return;
                }
            }
        }

        validityAPI.hide();
    });

    // calendar api

    var calendarAPI = new TooltipAPI({
        id: "formvalidation_calendar",
        innerHTML: (function() {
            var content = "<p class='formvalidation-calendar-header'></p><a class='formvalidation-calendar-prev'></a><a class='formvalidation-calendar-next'></a><div class='formvalidation-calendar-days'>";

            for (var i = 0; i < 7; ++i) {
                content += "<ol class='formvalidation-calendar-row'>";

                for (var j = 0; j < 7; ++j) {
                    content += (i ? "<li data-index='" + (j + 7 * (i - 1)) : "<li data-i18n='calendar.weekday." + j) + "'>"; 
                }

                content += "</ol>";
            }

            return content;
        })(),
        onclick: function(e) {
            var target = e.target,
                currentYear = calendarAPI._currentDate.getFullYear(),
                currentMonth = calendarAPI._currentDate.getMonth(),
                currentDate = calendarAPI._currentDate.getDate(),
                targetDate;

            if (target.hasAttribute("data-index")) {
                targetDate = new Date(currentYear, currentMonth,
                    parseInt(target.getAttribute("data-index"), 10) + 3 -
                        new Date(currentYear, currentMonth, 1).getDay());

                if (targetDate.getFullYear() !== currentYear ||
                    targetDate.getMonth() !== currentMonth ||
                    targetDate.getDate() !== currentDate) {
                    // update input value
                    calendarAPI._target.value = targetDate.toISOString().split("T")[0];
                    // trigger blur manually to hide calendar control
                    calendarAPI._target.blur();
                }
            } else if (~target.className.lastIndexOf("prev")) {
                calendarAPI.moveTo(new Date(currentYear, currentMonth - 1, 1));
            } else if (~target.className.lastIndexOf("next")) {
                calendarAPI.moveTo(new Date(currentYear, currentMonth + 1, 1));
            }
        }
    }, {
        capture: function(el) {
            if (el.nodeName === "INPUT") {
                // init calendar for browsers that don't support watch
                if (el.getAttribute("type") === "date") {
                    // remove legacy dateinput if it exists
                    el.type = "text";
                    el.className += " dateinput";
                    // update calendar when user types
                    el.addEventListener("input", this, false);
                }

                if (~el.className.indexOf("dateinput")) {
                    // call prototype's method
                    return TooltipAPI.prototype.capture.call(this, el);
                }
            }

            return false;
        },
        refresh: function() {
            var inputValue = this._target.value;
            // switch calendar to appropriate month
            this.moveTo(inputValue ? new Date(inputValue) : new Date());
        },
        moveTo: function(date) {
            var tableEl = this._el.querySelector(".formvalidation-calendar-days"),
                tableHeader = this._el.querySelector(".formvalidation-calendar-header"),
                tableCells = Array.prototype.splice.call(tableEl.querySelectorAll("[data-index]"), 0);

            this.moveTo = function(date) {
                var iterDate = new Date(date.getFullYear(), date.getMonth(), 0);
                // update caption
                tableHeader.innerHTML = "<span data-i18n='calendar.month." + date.getMonth() + "'></span> " + (isNaN(date.getFullYear()) ? "" : date.getFullYear());
                // check if date is valid
                if (!isNaN(iterDate.getTime())) {
                    // move to begin of the start week
                    iterDate.setDate(iterDate.getDate() - iterDate.getDay());
                    // setup appropriate counter-reset property
                    tableEl.style["counter-reset"] = "prev_counter " + iterDate.getDate() + " current_counter 0 next_counter 0";
                    // update class names
                    tableCells.forEach(function(cell) {
                        // increment date
                        iterDate.setDate(iterDate.getDate() + 1);
                        // calc differences
                        var mDiff = date.getMonth() - iterDate.getMonth(),
                            dDiff = date.getDate() - iterDate.getDate();

                        if (date.getFullYear() !== iterDate.getFullYear()) {
                            mDiff *= -1;
                        }

                        cell.className = mDiff ?
                            (mDiff > 0 ? "prev-calendar-day" : "next-calendar-day") :
                            (dDiff ? "calendar-day" : "current-calendar-day");
                    });
                    // update current date
                    this._currentDate = date;
                }
            };

            this.moveTo(date);
        },
        handleEvent: function(e) {
            var inputValue = e.target.value;

            inputValue && this.refresh(new Date(inputValue));
        }
    });

    watch("input[type='date']", function(e) {
        // init calendar for browsers that support watch
        calendarAPI.capture(e.target);
    });

    bindCapturingEvent("focus", function(e) {
        if (calendarAPI.capture(e.target)) {
            calendarAPI.show();
        }
    });

    bindCapturingEvent("blur", function() {
        calendarAPI.hide();
    });

})(document, window);
