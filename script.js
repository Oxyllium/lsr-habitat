/* ============================================
   LSR HABITAT - Landing Pages JS
   ============================================ */

(function() {
  'use strict';

  /* ---- Before/After Slider ---- */
  function initSliders() {
    document.querySelectorAll('.ba-slider').forEach(function(slider) {
      var handle = slider.querySelector('.ba-slider__handle');
      var afterImg = slider.querySelector('.ba-slider__after');
      var dragging = false;

      function getPercent(e) {
        var rect = slider.getBoundingClientRect();
        var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        return Math.max(0, Math.min(100, (x / rect.width) * 100));
      }

      function update(pct) {
        afterImg.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
        handle.style.left = pct + '%';
      }

      function onStart(e) {
        e.preventDefault();
        dragging = true;
        update(getPercent(e));
      }

      function onMove(e) {
        if (!dragging) return;
        e.preventDefault();
        update(getPercent(e));
      }

      function onEnd() {
        dragging = false;
      }

      slider.addEventListener('mousedown', onStart);
      slider.addEventListener('touchstart', onStart, { passive: false });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

      // Init at 50%
      update(50);
    });
  }

  /* ---- Scroll Animations ---- */
  function initScrollAnimations() {
    var els = document.querySelectorAll('.fade-in');
    if (!els.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function(el) { observer.observe(el); });
  }

  /* ---- Smooth scroll to form ---- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          var offset = 16;
          var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  /* ---- Barre CTA mobile : se masque quand le formulaire est visible ou actif ---- */
  function initCtaBar() {
    var bar = document.querySelector('.cta-bar');
    if (!bar) return;
    var form = document.getElementById('devis');
    var formVisible = false;
    var fieldFocused = false;
    var viewportAltered = false;

    function update() {
      var hidden = formVisible || fieldFocused || viewportAltered;
      bar.classList.toggle('cta-bar--hidden', hidden);
    }

    if (form && 'IntersectionObserver' in window) {
      new IntersectionObserver(function(entries) {
        formVisible = entries[0].isIntersecting;
        update();
      }, { rootMargin: '0px 0px 80px 0px', threshold: 0.05 }).observe(form);
    }

    document.addEventListener('focusin', function(e) {
      if (e.target.matches('input, textarea, select')) {
        fieldFocused = true;
        update();
      }
    });
    document.addEventListener('focusout', function() {
      fieldFocused = false;
      setTimeout(update, 150);
    });

    /* Clavier virtuel ouvert ou pinch-zoom : la barre fixe decroche du bas,
       on la masque tant que le viewport visuel est altere */
    if (window.visualViewport) {
      var vv = window.visualViewport;
      var checkViewport = function() {
        var keyboardOpen = vv.height < window.innerHeight * 0.8;
        var zoomed = vv.scale > 1.1;
        viewportAltered = keyboardOpen || zoomed;
        update();
      };
      vv.addEventListener('resize', checkViewport);
      vv.addEventListener('scroll', checkViewport);
      checkViewport();
    }
  }

  /* ---- Indicateur de présence selon les horaires ---- */
  function initPresence() {
    var dot = document.querySelector('[data-presence-dot]');
    var txt = document.querySelector('[data-presence-text]');
    if (!dot || !txt) return;
    var now = new Date();
    var d = now.getDay(), hh = now.getHours();
    var online = (d >= 1 && d <= 5 && hh >= 7 && hh < 20) || (d === 6 && hh >= 9 && hh < 18);
    if (!online) {
      dot.classList.add('presence-dot--off');
      txt.textContent = "Grégory Quivy, gérant : laissez votre demande, il vous répond dès l'ouverture.";
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    initSliders();
    initScrollAnimations();
    initSmoothScroll();
    initCtaBar();
    initPresence();
  });
})();
