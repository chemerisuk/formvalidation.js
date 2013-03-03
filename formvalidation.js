/*!
 * formvalidation.js (https://github.com/chemerisuk/formvalidation.js)
 *
 * HTML5 form validation api polyfill
 *
 * Copyright (c) 2013 Maksim Chemerisuk
 *
 */
window.addEventListener && (function(document, window) {
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
        listenSelector = (function() {
            // use trick discovered by Daniel Buchner to style dateinputs
            // https://github.com/csuwldcat/SelectorListener
            var styles = headEl.appendChild(document.createElement("style")),
                keyframes = headEl.appendChild(document.createElement("style")),
                startNames = ["animationstart", "oAnimationStart", "MSAnimationStart", "webkitAnimationStart"],
                startEvent = function(event) {
                    event.selector = (events[event.animationName] || {}).selector;

                    (listeners[event.animationName] || {}).call(document, event);
                },
                prefix = (function() {
                    var duration = "animation-duration: 0.01s;",
                        name = "animation-name: SelectorListener !important;",
                        computed = window.getComputedStyle(htmlEl, ""),
                        pre = (Array.prototype.slice.call(computed).join("").match(/moz|webkit|ms/)||(computed.OLink===""&&["o"]))[0];
                    return {
                        css: "-" + pre + "-",
                        properties: "{" + duration + name + "-" + pre + "-" + duration + "-" + pre + "-" + name + "}",
                        keyframes: !!(window.CSSKeyframesRule || window[("WebKit|Moz|MS|O").match(new RegExp("(" + pre + ")", "i"))[1] + "CSSKeyframesRule"])
                    };
                })();

            return function(selector, fn) {
                var animationName = "SelectorListener-" + new Date().getTime();

                styles.sheet.insertRule(selector + prefix.properties.replace(/SelectorListener/g, animationName), 0);

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
        calcOffset = function(el) {
            var boundingRect = el.getBoundingClientRect(),
                clientTop = htmlEl.clientTop || bodyEl.clientTop || 0,
                clientLeft = htmlEl.clientLeft || bodyEl.clientLeft || 0,
                scrollTop = window.pageYOffset || htmlEl.scrollTop || bodyEl.scrollTop,
                scrollLeft = window.pageXOffset || htmlEl.scrollLeft || bodyEl.scrollLeft;

            return {
                top: boundingRect.top + scrollTop - clientTop,
                left: boundingRect.left + scrollLeft - clientLeft,
                right: boundingRect.right + scrollLeft - clientLeft,
                bottom: boundingRect.bottom + scrollTop - clientTop
            };
        },
        none = function(form, test) {
            var inputs = Array.prototype.slice.call(form.elements, 0);

            for (var i = 0, n = inputs.length; i < n; ++i) {
                if (!test(inputs[i])) {
                    return false;
                }
            }

            return true;
        },
        tooltipApi = (function() {
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
                            offset = calcOffset(input);
                        
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
                        validityEl.style.top = offset.bottom + "px";
                        validityEl.style.left = offset.left + "px";
                        
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
        
        HTMLInputElement.prototype.setCustomValidity =
        HTMLTextAreaElement.prototype.setCustomValidity =
        HTMLSelectElement.prototype.setCustomValidity = function(message) {
            this.validationMessage = message;
            this.validity.customError = !!message;
        };
        
        HTMLInputElement.prototype.checkValidity =
        HTMLTextAreaElement.prototype.checkValidity =
        HTMLSelectElement.prototype.checkValidity = function() {
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

                        validity.valueMissing = none(this.form, function(input) {
                            return input.checked && input.name === name;
                        });
                        validity.valid = !validity.valueMissing;
                    }
                    break;

                case "checkbox":
                    validity.valueMissing = (!this.checked && this.hasAttribute("required"));
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
                        validity.valueMissing = this.hasAttribute("required");
                        validity.valid = !validity.valueMissing;
                    }
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
        
        HTMLFormElement.prototype.checkValidity = function() {
            return none(this, function(input) {
                return !input.checkValidity || input.checkValidity();
            });
        };
    }
    
    bindCapturingEvent("invalid", function(e) {
        tooltipApi.show(e.target, false);
        // don't show native tooltip
        e.preventDefault();
    });
    
    bindEvent("change", function(e) {
        var target = e.target;

        if (target.checkValidity()) {
            tooltipApi.hide(target, false);
        }
    });
    
    bindEvent("input", function(e) {
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
    });
    
    bindCapturingEvent("submit", function(e) {
        // validate all elements on a form submit
        if (e.target.checkValidity()) {
            tooltipApi.hide(null, true);
        } else {
            // prevent form submition because of errors
            e.preventDefault();
        }
    });
    
    bindEvent("reset", function(e) {
        // hide tooltip when user resets the form
        tooltipApi.hide(null, true);
    });
    
    bindCapturingEvent("click", function(e) {
        // hide tooltip when user goes to other part of page
        if (e.target.form !== tooltipApi.getForm()) {
            tooltipApi.hide(null, true);
        }
    });

    // calendar support

    var calendarAPI = (function() {
        var calendarEl = document.createElement("div"),
            currentEl, currentDate;
        
        calendarEl.id = "formvalidationjs_calendar";
        calendarEl.innerHTML = (function() {
            var content = "<table><caption></caption><tbody>";

            content += "<tr>";
                content += "<th><th><th><th><th><th><th>";
                content += "</tr>";

            content += "<tr>";
                content += "<td class='prev-month'><td class='prev-month'><td class='prev-month'><td class='prev-month'><td><td><td>";
                content += "</tr>";

            for (var i = 0; i < 4; ++i) {
                content += "<tr>";
                //content += i ? "<td><td><td><td><td><td><td>" : "<th><th><th><th><th><th><th>";
                content += "<td><td><td><td><td><td><td>";
                content += "</tr>";
            }

            content += "<tr>";
                content += "<td class='next-month'><td class='next-month'><td class='next-month'><td class='next-month'><td class='next-month'><td class='next-month'><td class='next-month'>";
                content += "</tr>";

            content += "</tbody></table>";

            return content;
        })();

        calendarEl.onclick = function(e) {
            var target = e.target, parent = target.parentNode;

            if (target.nodeName === "TD") {
                currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(),
                    target.cellIndex + 3 + (parent.rowIndex - 1) * 7 -
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay());

                currentEl.value = currentDate.toISOString().split("T")[0];
            }
        };

        return {
            initFor: function(el) {
                // remove legacy dateinput if it exists
                el.type = "text";
                el.className += " dateinput";
            },
            showFor: function(el) {
                var offset = calcOffset(currentEl = el);

                if (calendarEl.parentNode === null) {
                    bodyEl.appendChild(calendarEl);
                }

                calendarEl.style.left = offset.left + "px";
                calendarEl.style.top = offset.bottom + "px";

                calendarEl.removeAttribute("hidden");

                currentDate = el.value ? new Date(el.value) : Date.now();
            }
        };
    })();

    listenSelector("input[type='date']", function(e) {
        // init calendar for browsers that support listenSelector
        calendarAPI.initFor(e.target);
    });

    bindCapturingEvent("focus", function(e) {
        var input = e.target;

        if (input.nodeName === "INPUT") {
            if (input.getAttribute("type") === "date") {
                // init calendar for browsers that don't support listenSelector
                calendarAPI.initFor(input);
            }

            if (input.className.indexOf("dateinput") >= 0) {
                calendarAPI.showFor(input);
            }
        }
    });

})(document, window);