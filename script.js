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

  /* ---- Move Odoo chat above phone bar on mobile ---- */
  function moveOdooUp() {
    if (window.innerWidth > 960) return;
    var children = document.body.children;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      var tag = el.tagName;
      if (tag !== 'DIV' && tag !== 'IFRAME') continue;
      if (el.classList.contains('rdv-bar') || el.classList.contains('rdv-overlay')) continue;
      // Check if it looks like a third-party widget (not our sections)
      if (el.querySelector('section') || el.querySelector('.hero')) continue;
      var s = window.getComputedStyle(el);
      if (s.position === 'fixed' || s.position === 'absolute') {
        el.style.setProperty('bottom', '120px', 'important');
      }
    }
  }

  /* ---- Auto-open livechat on mobile ---- */
  function initAutoLivechat() {
    if (window.innerWidth > 768) return;

    var selectors = [
      '.o_livechat_button',
      '.o-livechat-LivechatButton',
      'button[aria-label*="chat"]',
      'button[aria-label*="Chat"]',
      '.o-mail-ChatHub button',
      '[class*="livechat" i]',
      '[class*="LiveChat" i]'
    ];

    function tryClick() {
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el) {
          console.log('Odoo chat found:', selectors[i]);
          el.click();
          return true;
        }
      }
      return false;
    }

    var observer = new MutationObserver(function() {
      if (tryClick()) {
        observer.disconnect();
      }
    });

    setTimeout(function() {
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(function() { observer.disconnect(); }, 15000);
    }, 10000);
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', function() {
    initSliders();
    initScrollAnimations();
    initSmoothScroll();
    setInterval(moveOdooUp, 1000);
    initAutoLivechat();
  });
})();
