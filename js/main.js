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

  /* --- Nyhetsrutor --- */
  var newsLinks = Array.prototype.slice.call(
    document.querySelectorAll('[data-news-open]')
  );

  if (newsLinks.length && typeof HTMLDialogElement !== 'undefined') {
    // Hashen speglar den öppna rutan, så en enskild nyhet går att länka till.
    var setHash = function (hash) {
      var url = hash ? '#' + hash : window.location.pathname + window.location.search;
      window.history.replaceState(null, '', url);
    };

    var openNews = function (dialog) {
      if (!dialog || dialog.open) return;
      dialog.showModal();
      setHash(dialog.id);
    };

    newsLinks.forEach(function (link) {
      link.addEventListener('click', function (event) {
        var dialog = document.getElementById(
          (link.getAttribute('href') || '').slice(1)
        );
        if (!dialog || typeof dialog.showModal !== 'function') return;

        event.preventDefault();
        openNews(dialog);
      });
    });

    document.querySelectorAll('[data-news-dialog]').forEach(function (dialog) {
      // Klick på bakgrunden träffar själva dialogen, inte innehållet.
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog) dialog.close();
      });

      dialog.addEventListener('close', function () {
        if (window.location.hash === '#' + dialog.id) setHash(null);
      });
    });

    // En delad länk öppnar sin ruta direkt.
    if (window.location.hash) {
      var fromHash = document.getElementById(window.location.hash.slice(1));
      if (fromHash && fromHash.hasAttribute('data-news-dialog')) openNews(fromHash);
    }
  }

  /* --- Citatkarusell --- */
  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var slides = Array.prototype.slice.call(
      carousel.querySelectorAll('[data-carousel-slide]')
    );
    var dots = Array.prototype.slice.call(
      carousel.querySelectorAll('[data-carousel-dot]')
    );
    if (slides.length < 2) return;

    var index = 0;
    var timer = null;
    var leavingTimer = null;

    // back styr åt vilket håll citaten glider.
    var show = function (next, back) {
      var previous = index;
      index = (next + slides.length) % slides.length;

      carousel.classList.toggle('is-reverse', !!back);

      slides.forEach(function (slide, i) {
        slide.classList.remove('is-leaving');
        slide.classList.toggle('is-active', i === index);
        slide.setAttribute('aria-hidden', String(i !== index));
      });
      dots.forEach(function (dot, i) {
        dot.setAttribute('aria-current', String(i === index));
      });

      if (previous === index || reduceMotion) return;

      // Sliden som lämnar ligger kvar tills den glidit ut, sedan ställs den
      // tillbaka på väntande plats.
      var leaving = slides[previous];
      leaving.classList.add('is-leaving');

      window.clearTimeout(leavingTimer);
      leavingTimer = window.setTimeout(function () {
        leaving.classList.remove('is-leaving');
      }, 500);
    };

    // Autospelet står stilla för den som valt mindre rörelse.
    var stop = function () {
      window.clearInterval(timer);
      timer = null;
    };
    var start = function () {
      if (reduceMotion || timer) return;
      timer = window.setInterval(function () { show(index + 1); }, 7000);
    };
    // Byter besökaren själv börjar intervallet om från noll.
    var go = function (next, back) {
      show(next, back);
      stop();
      start();
    };

    var prev = carousel.querySelector('[data-carousel-prev]');
    var next = carousel.querySelector('[data-carousel-next]');
    if (prev) prev.addEventListener('click', function () { go(index - 1, true); });
    if (next) next.addEventListener('click', function () { go(index + 1); });

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { go(i, i < index); });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', function (event) {
      if (carousel.contains(event.relatedTarget)) return;
      start();
    });

    show(0);
    start();
  });

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
