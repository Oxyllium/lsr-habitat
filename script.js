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

  /* ---- Custom Chat Button ---- */
  function initChat() {
    // Create button
    var btn = document.createElement('button');
    btn.className = 'chat-btn';
    btn.setAttribute('aria-label', 'Ouvrir le chat');
    btn.innerHTML = '<span class="chat-btn__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span class="chat-btn__dot"></span></span><span class="chat-btn__label">Un conseiller en ligne<small>Reponse immediate</small></span>';
    document.body.appendChild(btn);

    // Tooltip
    var tip = document.createElement('div');
    tip.className = 'chat-tooltip';
    tip.innerHTML = 'Une question sur nos tarifs&nbsp;? Un conseiller vous repond en direct&nbsp;! <button class="chat-tooltip__close">&times;</button>';
    document.body.appendChild(tip);

    // Show tooltip after 4s
    var tipTimer = setTimeout(function() { tip.classList.add('visible'); }, 4000);
    // Auto-hide after 12s
    setTimeout(function() { tip.classList.remove('visible'); }, 16000);
    tip.querySelector('.chat-tooltip__close').addEventListener('click', function(e) {
      e.stopPropagation();
      tip.classList.remove('visible');
      clearTimeout(tipTimer);
    });

    // Click handler — find and trigger Odoo chat
    btn.addEventListener('click', function() {
      tip.classList.remove('visible');
      // Try all known Odoo selectors
      var odooBtn = document.querySelector('.o_livechat_button')
        || document.querySelector('[class*="o-livechat"] button')
        || document.querySelector('[class*="o_livechat"] button');
      if (odooBtn) {
        odooBtn.style.pointerEvents = 'auto';
        odooBtn.click();
        return;
      }
      // Fallback: look inside shadow DOM
      document.querySelectorAll('[class*="o-livechat-root"], [class*="o_livechat"]').forEach(function(root) {
        if (root.shadowRoot) {
          var inner = root.shadowRoot.querySelector('button');
          if (inner) { inner.click(); }
        }
      });
    });
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', function() {
    initSliders();
    initScrollAnimations();
    initSmoothScroll();
    initChat();
  });
})();
