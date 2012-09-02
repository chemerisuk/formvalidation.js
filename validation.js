/*!
 * validation.js
 * 
 * Copyright (c) 2012 Maksim Chemerisuk
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
(function(document, window) {
	
	if (document.addEventListener) {
		// for input - do validation depend on type
		// for textarea - check maxlength? or it might be better to block extra chars input?
		// form.checkValidity
		
		var validateElement = function(input) {
				if (!input.checkValidity()) {
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
				
				document.body.appendChild(validityTooltip);
				
				return {
					show: function(input, force) {
						if (force || !invalidInput || invalidInput === input) {
							var rect = input.getBoundingClientRect(),
								validity = input.validity,
								errorArray = [];
							
							if (validity.customError) {
								validityTooltip.textContent = input.validationMessage;
							}
							
							for (var errorType in validity) {
								if (validity[errorType]) {
									errorArray.push(errorType);
								}
							}
							
							validityTooltip.className = errorArray.join(" ");
							validityTooltip.style.top = rect.bottom + "px";
							validityTooltip.style.left = rect.left + "px";
							
							invalidInput = input;
						}
					},
					hide: function(input, force) {
						if (force || !invalidInput || invalidInput === input) {
							validityTooltip.removeAttribute('class');
							
							invalidInput = null;	
						}
					}
				}
			})();
		
		if (!("validity" in document.createElement("input"))) {
			var RE = {
					email: new RegExp("^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$", "i"),
					url: new RegExp("^(https?:\/\/)?[\da-z\.\-]+\.[a-z\.]{2,6}[#&+_\?\/\w \.\-=]*$", "i"),
					number: new RegExp("^-?[0-9]*(\.[0-9]+)?$")
				};
			
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
			}
			
			HTMLInputElement.prototype.setCustomValidity = HTMLTextAreaElement.prototype.setCustomValidity = function(message) {
				this.validationMessage = message;
				this.validity.customError = !!message;
			};
			
			// TODO: type == number
			
			HTMLInputElement.prototype.checkValidity = function() {
				var validity = new ValidityState();
				
				switch(this.type) {
					case "image":
					case "submit":
					case "button":
						return true;
					
					case "radio":
						// required check
						break;
					case "checkbox":
						validity.valueMissing = (!this.checked && this.getAttribute("required"));
						validity.valid = !validity.valueMissing;
						break;
					case "email":
					case "url":
						validity.typeMismatch = this.value && RE[this.type].test(this.value);
						validity.valid = !validity.typeMismatch;
					default: {
						var pattern = this.getAttribute("pattern");
						
						if (this.value) {
							validity.patternMismatch = (pattern && new RegExp(pattern, "i").test(this.value));
							validity.valid = !validity.patternMismatch;
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
			}
			
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
			}
			
			HTMLFormElement.prototype.checkValidity = function() {
				var inputs = Array.prototype.slice.call(this.elements,0),
					valid = true;
				
				for (var i = 0, n = inputs.length; i < n; ++i) {
					if (!validateElement(inputs[i])) {
						// show tooltip at the first element
						tooltipApi.show(inputs[i]);
						
						valid = false;
					}
				}
				
				return valid;
			}
			// validate all elements on a form submit
			document.addEventListener("submit", function(e) {
				this.checkValidity();
			}, true);
		}
		
		document.addEventListener("invalid", function(e) {
			tooltipApi.show(e.target, false);
			// hide native tooltip
			e.preventDefault();
		}, true);
		
		document.addEventListener("change", function(e) {
			if (!validateElement(e.target)) {
				tooltipApi.show(e.target, true);
			} else {
				tooltipApi.hide(e.target, false);
			};
		}, true);
		
		document.addEventListener("submit", function(e) {
			var inputs = Array.prototype.slice.call(e.target.elements,0);
			
			for (var i = 0, n = inputs.length; i < n; ++i) {
				if (!inputs[i].validity.valid) {
					// prevent form submitting
					e.preventDefault();
					
					break;
				}
			}
		}, true);
		
		document.addEventListener("reset", function(e) {
			tooltipApi.hide(null, true);
		}, true);
	}
	
})(document, window);