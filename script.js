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

  /* ---- Callback Popup ---- */
  function initCallbackPopup() {
    var overlay = document.querySelector('.popup-overlay');
    if (!overlay) return;

    var shown = false;
    var STORAGE_KEY = 'lsr_popup_dismissed';

    // Don't show if already dismissed in this session
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    function showPopup() {
      if (shown) return;
      shown = true;
      overlay.classList.add('active');
    }

    function hidePopup() {
      overlay.classList.remove('active');
      sessionStorage.setItem(STORAGE_KEY, '1');
    }

    // Close button
    var closeBtn = overlay.querySelector('.popup__close');
    if (closeBtn) closeBtn.addEventListener('click', hidePopup);

    // Close on overlay click (outside popup)
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) hidePopup();
    });

    // Trigger 1: Slider reaches >= 90%
    document.querySelectorAll('.ba-slider').forEach(function(slider) {
      var afterImg = slider.querySelector('.ba-slider__after');
      var originalUpdate = null;

      // Watch clip-path changes via MutationObserver
      var observer = new MutationObserver(function() {
        var cp = afterImg.style.clipPath || '';
        var match = cp.match(/inset\(0(?:px)? 0(?:px)? 0(?:px)? ([\d.]+)%\)/);
        if (match) {
          var pct = parseFloat(match[1]);
          // pct represents how much of "after" is hidden from left
          // When pct >= 90, user has slid almost fully to the right (showing mostly "avant")
          // When pct <= 10, user has slid almost fully to the left (showing mostly "après")
          if (pct >= 90 || pct <= 10) {
            showPopup();
          }
        }
      });
      observer.observe(afterImg, { attributes: true, attributeFilter: ['style'] });
    });

    // Trigger 2: 10 seconds on page
    setTimeout(showPopup, 10000);
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', function() {
    initSliders();
    initScrollAnimations();
    initSmoothScroll();
    initCallbackPopup();
  });
})();
