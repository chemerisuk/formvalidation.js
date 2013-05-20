formvalidation.js[![Build Status](https://api.travis-ci.org/chemerisuk/formvalidation.js.png?branch=master)](http://travis-ci.org/chemerisuk/formvalidation.js)
=================
HTML5 forms polyfill

Features
--------
* no additional dependencies
* doesn't require initialization call on each form
* every UI element and text content is fully customizable via CSS
* displays calendar control for `input[type="date"]`
* internationalization support

Example usage
-------------
All you need is to include several additional files on your page:
```html
<html>
  <head>
    ...
    <link href="formvalidation.css" rel="stylesheet"/>
    ...
  </head>
  <body>
    ...
    <script src="formvalidation.js"></script>
  </body>
</html>
```
No initialization is required, it just works. And even for dynamic content. So it's perfect for single-page websites with ajax navigation. 

JavaScript API
--------------
Plugin uses standards-based javascript API to display validation messages programmatically. So you may use any source which describes HTML5 Constraint Validation API. For example look at the appropriate section on https://developer.mozilla.org/en-US/docs/HTML/Forms_in_HTML.

Internationalization
--------------------
All message strings are stored in css. To display them `data-i18n` attribute is used with combination of `:before` pseudoelement:
```css
[data-i18n="validity.value.missing"]:before { content: "Please fill this field" }
[data-i18n="validity.type.mismatch"]:before { content: "Value has illegal format" }
[data-i18n="validity.email.mismatch"]:before { content: "Should be a valid email" }
```
`:lang` selector allows to target specific language and localize strings for it:
```css
[data-i18n="validity.value.missing"]:lang(ru):before { content: "Это поле не может быть пустым" }
[data-i18n="validity.type.mismatch"]:lang(ru):before { content: "Введенное значение имеет недопустимый формат" }
[data-i18n="validity.email.mismatch"]:lang(ru):before { content: "Здесь должен быть правильный email" }
```
Therefore you need an appropriate `lang` attribute value for the `<html>` element to change plugin language.

TODOs
-----
1. add `input[type=number]` support with spin buttons
2. IE8 support?

Browser support
---------------
* Chrome
* Firefox
* Opera
* IE9+

It's possible to add IE8 support, but not IE6-7 (these dinosaurs do not support DOM object prototypes)
