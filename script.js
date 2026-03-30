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

  /* ---- Resize Odoo livechat button ---- */
  function styleOdooChat() {
    var mobile = window.innerWidth <= 960;
    var roots = document.querySelectorAll('.o-livechat-root, [class*="o-livechat-root"]');
    roots.forEach(function(root) {
      // Position the root
      if (mobile) {
        root.style.cssText += ';bottom:auto!important;top:50%!important;transform:translateY(-50%)!important;right:0!important;';
      }
      // If shadow DOM, inject styles inside
      if (root.shadowRoot) {
        var id = 'lsr-chat-style';
        if (!root.shadowRoot.getElementById(id)) {
          var s = document.createElement('style');
          s.id = id;
          s.textContent =
            'button, .o-livechat-LivechatButton, [class*="LivechatButton"] {' +
            '  width:' + (mobile ? '60' : '70') + 'px!important;' +
            '  height:' + (mobile ? '60' : '70') + 'px!important;' +
            '  border-radius:50%!important;' +
            '}' +
            'button img, button svg, [class*="LivechatButton"] img, [class*="LivechatButton"] svg {' +
            '  width:36px!important; height:36px!important;' +
            '}';
          root.shadowRoot.appendChild(s);
        }
      }
    });
    if (!roots.length) return false;
    return true;
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', function() {
    initSliders();
    initScrollAnimations();
    initSmoothScroll();
    // Poll for Odoo widget (loads deferred)
    var tries = 0;
    var poll = setInterval(function() {
      if (styleOdooChat() || ++tries > 20) clearInterval(poll);
    }, 500);
  });
})();
