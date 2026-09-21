/* r360 — foundation scripts */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Undermenyer i huvudmenyn --- */
  var dropdowns = Array.prototype.slice.call(
    document.querySelectorAll('[data-dropdown]')
  );

  var setDropdown = function (dropdown, open) {
    var trigger = dropdown.querySelector('[data-dropdown-trigger]');
    var menu = dropdown.querySelector('[data-dropdown-menu]');
    if (!trigger || !menu) return;

    menu.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
  };

  var closeDropdowns = function (except) {
    dropdowns.forEach(function (dropdown) {
      if (dropdown !== except) setDropdown(dropdown, false);
    });
  };

  dropdowns.forEach(function (dropdown) {
    var trigger = dropdown.querySelector('[data-dropdown-trigger]');
    var menu = dropdown.querySelector('[data-dropdown-menu]');
    if (!trigger || !menu) return;

    trigger.addEventListener('click', function () {
      var open = trigger.getAttribute('aria-expanded') !== 'true';
      closeDropdowns(dropdown);
      setDropdown(dropdown, open);
    });

    // Hovra öppnar på desktop. Den stängs vid klick, inte när pekaren lämnar
    // menyn — annars hinner man inte fram till länkarna.
    dropdown.addEventListener('mouseenter', function () {
      if (window.innerWidth < 992) return;
      closeDropdowns(dropdown);
      setDropdown(dropdown, true);
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setDropdown(dropdown, false);
    });

    // Tab ut ur undermenyn stänger den.
    dropdown.addEventListener('focusout', function (event) {
      if (window.innerWidth < 992) return;
      if (dropdown.contains(event.relatedTarget)) return;
      setDropdown(dropdown, false);
    });
  });

  if (dropdowns.length) {
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-dropdown]')) return;
      closeDropdowns(null);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;

      var open = document.querySelector('[data-dropdown] [aria-expanded="true"]');
      closeDropdowns(null);
      if (open) open.focus();
    });
  }

  /* --- Mobilmeny --- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    closeDropdowns(null);
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) closeNav();
    });
  }

  /* --- Linje under headern när sidan scrollats --- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var setStuck = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    setStuck();
    window.addEventListener('scroll', setStuck, { passive: true });
  }

  /* --- Medlemsbandet: dubblera listan så loopen blir sömlös --- */
  document.querySelectorAll('[data-marquee]').forEach(function (track) {
    var list = track.querySelector('[data-marquee-list]');
    if (!list || reduceMotion) return;

    var clone = list.cloneNode(true);
    clone.removeAttribute('data-marquee-list');
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  /* --- Året i tal: räkna upp värdena när de rullas in i vyn --- */
  var counters = document.querySelectorAll('[data-count-to]');

  if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
    var format = function (value, decimals) {
      return value.toLocaleString('sv-SE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    };

    var countUp = function (el) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      if (isNaN(target)) return;

      var decimals = parseInt(el.getAttribute('data-count-decimals'), 10) || 0;
      var duration = 2200;
      var started = null;

      var step = function (now) {
        if (started === null) started = now;

        var progress = Math.min((now - started) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);

        el.textContent = format(target * eased, decimals);
        if (progress < 1) window.requestAnimationFrame(step);
      };

      window.requestAnimationFrame(step);
    };

    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        counterObserver.unobserve(entry.target);
        countUp(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) {
      // Nollställ först nu — utan JS står slutvärdet kvar i markupen.
      el.textContent = format(0, parseInt(el.getAttribute('data-count-decimals'), 10) || 0);
      counterObserver.observe(el);
    });
  }

  /* --- Språkväxling (placeholder tills sidorna finns) --- */
  document.querySelectorAll('.lang-switch').forEach(function (group) {
    group.addEventListener('click', function (event) {
      var button = event.target.closest('.lang-option');
      if (!button) return;

      group.querySelectorAll('.lang-option').forEach(function (option) {
        var active = option === button;
        option.classList.toggle('is-active', active);
        option.setAttribute('aria-pressed', String(active));
      });
    });
  });
})();
