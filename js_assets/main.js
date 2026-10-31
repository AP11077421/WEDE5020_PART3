/* FORMEZ - main.js
   Runs on every page: footer year and the mobile menu button. */
(function () {
    'use strict';

    // Footer copyright year (replaces the old inline document.write script)
    var year = new Date().getFullYear();
    var spots = document.querySelectorAll('.copyright');
    for (var i = 0; i < spots.length; i++) {
        spots[i].textContent = '\u00A9 ' + year + ' FORMEZ. All rights reserved.';
    }

    // Mobile menu: on phones the links hide behind a "Menu" button
    var header = document.querySelector('header');
    var nav = header && header.querySelector('nav');
    if (!nav) { return; }

    nav.id = nav.id || 'main-nav';
    nav.classList.add('js-nav');

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-toggle';
    button.textContent = 'Menu';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', nav.id);
    header.insertBefore(button, nav);

    button.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        button.setAttribute('aria-expanded', String(open));
        button.textContent = open ? 'Close' : 'Menu';
    });
})();
