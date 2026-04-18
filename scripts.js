/* ============================================================
   COMPETITIVE ROOFING & CONSTRUCTION — scripts.js
   Pass 3: Modular JS — mobile menu, modal, slider, gallery,
   counters, scroll animations, hours dot, parallax
   ============================================================ */

'use strict';

// ── Utility: scroll lock ──────────────────────────────────────
const scrollLock = {
  lock()   { document.body.classList.add('modal-open'); },
  unlock() { document.body.classList.remove('modal-open'); },
};

// ── Utility: is open hours? ───────────────────────────────────
function isOpenNow() {
  const now = new Date();
  const day = now.getDay();   // 0=Sun, 1=Mon…6=Sat
  const hour = now.getHours();
  if (day === 0) return false;           // Closed Sunday
  return hour >= 8 && hour < 18;         // 8 AM – 6 PM
}

// ── Status dot ───────────────────────────────────────────────
function initStatusDot() {
  const dot = document.querySelector('.status-dot');
  if (!dot) return;
  if (!isOpenNow()) {
    dot.classList.add('offline');
    dot.title = 'Currently closed';
  } else {
    dot.title = 'Open now';
  }
}

// ── Mobile hamburger menu ─────────────────────────────────────
function initMobileMenu() {
  const btn     = document.querySelector('.hamburger');
  const overlay = document.getElementById('menu-overlay');
  if (!btn || !overlay) return;

  function openMenu() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    btn.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close menu');
    scrollLock.lock();
  }

  function closeMenu() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    btn.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open menu');
    scrollLock.unlock();
  }

  btn.addEventListener('click', () => {
    btn.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
  });

  // Close on any link or button inside overlay
  overlay.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('click', closeMenu);
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeMenu();
  });
}

// ── Modal ─────────────────────────────────────────────────────
function initModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  if (!modalOverlay) return;

  function openModal() {
    modalOverlay.setAttribute('aria-hidden', 'false');
    scrollLock.lock();
    // Focus first input
    const first = modalOverlay.querySelector('input, select, textarea');
    if (first) setTimeout(() => first.focus(), 50);
  }

  function closeModal() {
    modalOverlay.setAttribute('aria-hidden', 'true');
    scrollLock.unlock();
  }

  // All CTA triggers
  document.querySelectorAll('.js-modal-trigger').forEach(btn => {
    btn.addEventListener('click', openModal);
  });

  // Close button
  document.querySelectorAll('.js-modal-close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Click overlay (outside .modal)
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });

  // Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalOverlay.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });
}

// ── Form validation ───────────────────────────────────────────
function initFormValidation() {
  document.querySelectorAll('.estimate-form').forEach(form => {
    form.addEventListener('submit', e => {
      let valid = true;

      form.querySelectorAll('[required]').forEach(field => {
        const errorEl = field.nextElementSibling;
        if (!field.value.trim()) {
          field.classList.add('error');
          if (errorEl && errorEl.classList.contains('field-error')) {
            errorEl.textContent = 'This field is required.';
          }
          valid = false;
        } else if (field.type === 'email' && !/\S+@\S+\.\S+/.test(field.value)) {
          field.classList.add('error');
          if (errorEl && errorEl.classList.contains('field-error')) {
            errorEl.textContent = 'Please enter a valid email.';
          }
          valid = false;
        } else {
          field.classList.remove('error');
          if (errorEl && errorEl.classList.contains('field-error')) {
            errorEl.textContent = '';
          }
        }
      });

      if (!valid) e.preventDefault();
    });

    // Clear error on input
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => {
        field.classList.remove('error');
        const errorEl = field.nextElementSibling;
        if (errorEl && errorEl.classList.contains('field-error')) {
          errorEl.textContent = '';
        }
      });
    });
  });
}

// ── Before/After Slider (Pointer Events API) ─────────────────
function initSlider(containerId, beforeId, handleId) {
  const container = document.getElementById(containerId);
  const before    = document.getElementById(beforeId);
  const handle    = document.getElementById(handleId);
  if (!container || !before || !handle) return;

  let dragging = false;
  let pct = 50;

  function setPosition(x) {
    const rect = container.getBoundingClientRect();
    pct = Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100));
    before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left   = pct + '%';
    handle.style.transform = 'translateX(-50%)';
    handle.setAttribute('aria-valuenow', Math.round(pct));
  }

  handle.addEventListener('pointerdown', e => {
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    setPosition(e.clientX);
  });

  handle.addEventListener('pointerup', () => { dragging = false; });
  handle.addEventListener('pointercancel', () => { dragging = false; });

  // Keyboard support
  handle.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { pct = Math.max(0,   pct - 2); before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`; handle.style.left = pct + '%'; }
    if (e.key === 'ArrowRight') { pct = Math.min(100, pct + 2); before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`; handle.style.left = pct + '%'; }
    handle.setAttribute('aria-valuenow', Math.round(pct));
  });

  // Initial position set via CSS (clip-path + left: 50%) — no JS read needed
}

// ── Gallery Lightbox ─────────────────────────────────────────
function initGallery() {
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lightbox-img');
  const closeBtn  = document.querySelector('.js-lightbox-close');
  const prevBtn   = document.querySelector('.js-lightbox-prev');
  const nextBtn   = document.querySelector('.js-lightbox-next');
  const items     = document.querySelectorAll('.js-gallery-open');
  if (!lightbox || !lbImg) return;

  const images = [];
  items.forEach(btn => {
    const img = btn.querySelector('img');
    if (img) images.push({ src: img.src, alt: img.alt });
  });

  let current = 0;

  function openLightbox(idx) {
    current = idx;
    lbImg.src = images[idx].src;
    lbImg.alt = images[idx].alt;
    lightbox.setAttribute('aria-hidden', 'false');
    scrollLock.lock();
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.setAttribute('aria-hidden', 'true');
    lbImg.src = '';
    scrollLock.unlock();
    items[current].focus();
  }

  function prev() { current = (current - 1 + images.length) % images.length; lbImg.src = images[current].src; lbImg.alt = images[current].alt; }
  function next() { current = (current + 1) % images.length; lbImg.src = images[current].src; lbImg.alt = images[current].alt; }

  items.forEach((btn, idx) => {
    btn.addEventListener('click', () => openLightbox(idx));
  });

  closeBtn?.addEventListener('click', closeLightbox);
  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (lightbox.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  // Swipe support (touch)
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
  });
}

// ── Animated counters ─────────────────────────────────────────
function initCounters() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function animateCounter(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = 'true';
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1500;
    const start    = performance.now();

    if (prefersReduced) { el.textContent = target; return; }

    function step(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      el.textContent = Math.floor(easeOut(t) * target);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) animateCounter(entry.target);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ── Scroll fade-up animations ─────────────────────────────────
function initScrollAnimations() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));
}

// ── Gallery card parallax (hover only, reduced-motion aware) ──
function initGalleryParallax() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover       = window.matchMedia('(hover: hover)').matches;
  if (prefersReduced || !canHover) return;

  document.querySelectorAll('.gallery-item').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const rx     = Math.min(8, Math.max(-8, ((e.clientY - cy) / (rect.height / 2)) * 6));
      const ry     = Math.min(8, Math.max(-8, ((e.clientX - cx) / (rect.width  / 2)) * -6));
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ── Nav scroll shadow + shrink ────────────────────────────────
function initNavShadow() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 10;
    nav.style.boxShadow = scrolled
      ? '0 4px 32px rgba(0,0,0,0.5)'
      : '0 2px 20px rgba(0,0,0,0.3)';
    nav.classList.toggle('scrolled', scrolled);
  }, { passive: true });
}

// ── Footer year ───────────────────────────────────────────────
function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

// ── Anchor smooth-close on mobile menu links ──────────────────
// (handled inside initMobileMenu already)

// ── Init all on DOM ready ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initStatusDot();
  initMobileMenu();
  initModal();
  initFormValidation();
  initSlider('js-slider',       'js-slider-before',       'js-slider-handle');
  initSlider('js-slider-fence', 'js-slider-fence-before', 'js-slider-fence-handle');
  initGallery();
  initCounters();
  initScrollAnimations();
  initGalleryParallax();
  initNavShadow();
  initFooterYear();
});
