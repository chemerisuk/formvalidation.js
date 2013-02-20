formvalidation.js
=============
HTML5 form validation api polyfill.

Features
--------
* no additional dependencies
* doesn't require initialization call on each form
* tooltip is fully customizable via CSS
* error messages are fully customizable
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
This plugin doesn't require any initialization, it just works. Thats why it's perfect for single-page websites with ajax navigation. 

JavaScript API
--------------
Plugin uses standards-based javascript API to display validation messages programmatically. So you may use any source which describes HTML5 Constraint Validation API. For example look at the appropriate section on https://developer.mozilla.org/en-US/docs/HTML/Forms_in_HTML.

Internationalization
--------------------
The plugin stores message strings in css. To display them it uses `:before` pseudoelement:
```css
#validity.value-missing:after {
    content: "Please fill this field"
}

#validity.type-mismatch:after {
    content: "Value has illegal format"
}

#validity.email-mismatch:after {
    content: "There is should be a valid email"
}
```
To localize strings in css `:lang()` selector is used:
```css
#validity.value-missing:lang(ru):after {
    content: "Это поле не может быть пустым"
}

#validity.type-mismatch:lang(ru):after {
    content: "Введенное значение имеет недопустимый формат"
}

#validity.email-mismatch:after {
    content: "Здесь должен быть правильный email"
}
```
So it means you need an appropriate `lang` attribute value for the `<html>` element to change language of validation messages.

TODOs
-----
1) add `input[type=date]` support with calendar control
2) add `input[type=number]` support with spin buttons
3) IE8 support

Browser support
---------------
* Chrome
* Firefox
* Opera
* IE9+

It's possible to add IE8 support, but not IE6-7 (these dinosaurs do not support DOM object prototypes)