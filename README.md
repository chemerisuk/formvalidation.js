validation.js
=============
HTML5 form validation api polyfill.

Features
--------
* doesn't require initialization call on each form
* tooltip is fully customizable via CSS
* error messages are fully customizable
* internationalization support

Example usage
-------------
All you need is to include several additional files to your page:
```html
<html>
  <head>
    ...
    <link href="validation.css" rel="stylesheet"/>
    ...
  </head>
  <body>
    ...
    <script src="validation.js"></script>
  </body>
</html>
```
This plugin doesn't require any initialization, it just works. Thats why it's perfect for single-page websites with ajax navigation. 

JavaScript API
--------------
See "Constraint Validation API" section from https://developer.mozilla.org/en-US/docs/HTML/Forms_in_HTML

Customization
-------------
_TODO_

Browser support
---------------
* Chrome
* Firefox
* Opera
* IE9+