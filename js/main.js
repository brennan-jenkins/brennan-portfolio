document.documentElement.classList.add('js-enabled');

// Hero visible immediately; sections below animate on scroll
document.querySelectorAll('#hero .reveal').forEach((el) => el.classList.add('visible'));

// ─── Keyboard vs pointer (restore cursor for keyboard users) ───
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    document.body.classList.add('keyboard-nav');
  }
});

document.addEventListener('mousedown', () => {
  document.body.classList.remove('keyboard-nav');
});

// ─── Smooth scroll ───
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      if (href === '#main-content' || target.id === 'main-content') {
        target.focus({ preventScroll: true });
      }
      closeMobileNav();
    }
  });
});

// ─── Header scroll state (rAF-throttled to avoid jank) ───
const header = document.getElementById('header');
let headerScrollPending = false;

function updateHeaderOnScroll() {
  header?.classList.toggle('scrolled', window.scrollY > 40);
  headerScrollPending = false;
}

window.addEventListener(
  'scroll',
  () => {
    if (!headerScrollPending) {
      headerScrollPending = true;
      requestAnimationFrame(updateHeaderOnScroll);
    }
  },
  { passive: true }
);
updateHeaderOnScroll();

// ─── Mobile navigation ───
const navToggle = document.querySelector('.nav-toggle');
const navOverlay = document.getElementById('mobile-nav-overlay');
const navLinks = document.getElementById('primary-navigation');
const mobileMq = window.matchMedia('(max-width: 768px)');
const NAV_ANIM_MS = prefersReducedMotion ? 0 : 520;
let menuPreviouslyFocused = null;
let navCloseTimer = null;

function isMobileNav() {
  return mobileMq.matches;
}

function isNavOpen() {
  return navOverlay?.classList.contains('is-open');
}

function getNavFocusables() {
  if (!navLinks) return [];
  return [...navLinks.querySelectorAll('a[href], button:not([disabled])')];
}

function setNavToggleLabel(isOpen) {
  if (!navToggle) return;
  navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function updateNavPanelState() {
  if (!navOverlay || !navLinks) return;
  const open = isNavOpen();

  if (isMobileNav()) {
    navOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
      navOverlay.removeAttribute('inert');
    } else if (!navOverlay.classList.contains('is-closing')) {
      navOverlay.setAttribute('inert', '');
    }
    getNavFocusables().forEach((el) => {
      if (!open) el.setAttribute('tabindex', '-1');
      else el.removeAttribute('tabindex');
    });
  } else {
    navOverlay.classList.remove('is-open', 'is-closing');
    navOverlay.removeAttribute('inert');
    navOverlay.removeAttribute('aria-hidden');
    navToggle?.classList.remove('active');
    document.body.classList.remove('nav-open');
    getNavFocusables().forEach((el) => el.removeAttribute('tabindex'));
  }

  setNavToggleLabel(open);
}

function closeMobileNav(restoreFocus = true) {
  if (!navOverlay || !isNavOpen()) return;

  if (navCloseTimer) {
    window.clearTimeout(navCloseTimer);
    navCloseTimer = null;
  }

  navOverlay.classList.add('is-closing');
  navOverlay.classList.remove('is-open');
  navToggle?.classList.remove('active');
  document.body.classList.remove('nav-open');
  setNavToggleLabel(false);

  const finish = () => {
    navOverlay.classList.remove('is-closing');
    navOverlay.setAttribute('inert', '');
    navOverlay.setAttribute('aria-hidden', 'true');
    getNavFocusables().forEach((el) => el.setAttribute('tabindex', '-1'));
    if (restoreFocus && menuPreviouslyFocused) {
      menuPreviouslyFocused.focus();
    }
  };

  if (NAV_ANIM_MS === 0) {
    finish();
  } else {
    navCloseTimer = window.setTimeout(finish, NAV_ANIM_MS);
  }
}

function openMobileNav() {
  if (!navOverlay || !isMobileNav()) return;

  if (navCloseTimer) {
    window.clearTimeout(navCloseTimer);
    navCloseTimer = null;
  }

  menuPreviouslyFocused = document.activeElement;
  navOverlay.classList.remove('is-closing');
  navOverlay.removeAttribute('inert');
  navOverlay.setAttribute('aria-hidden', 'false');
  navOverlay.classList.add('is-open');
  navToggle?.classList.add('active');
  document.body.classList.add('nav-open');
  setNavToggleLabel(true);
  getNavFocusables().forEach((el) => el.removeAttribute('tabindex'));
  getNavFocusables()[0]?.focus();
}

navToggle?.addEventListener('click', () => {
  if (isNavOpen()) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
});

navOverlay?.addEventListener('click', (e) => {
  if (e.target === navOverlay) {
    closeMobileNav();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isNavOpen()) {
    closeMobileNav();
  }

  if (e.key !== 'Tab' || !isNavOpen() || !isMobileNav()) return;

  const focusables = getNavFocusables();
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

mobileMq.addEventListener('change', updateNavPanelState);
updateNavPanelState();

// ─── Scroll reveal ───
const revealEls = document.querySelectorAll('.reveal');

if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '120px 0px 80px 0px' }
  );

  const revealInInitialView = () => {
    const viewBottom = window.innerHeight + 120;
    revealEls.forEach((el) => {
      const { top, bottom } = el.getBoundingClientRect();
      if (top < viewBottom && bottom > -80) {
        el.classList.add('visible');
        revealObserver.unobserve(el);
      } else {
        revealObserver.observe(el);
      }
    });
  };

  revealInInitialView();
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

// ─── Custom cursor (desktop, motion allowed) ───
if (
  window.matchMedia('(pointer: fine)').matches &&
  !prefersReducedMotion
) {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let ringX = 0;
  let ringY = 0;
  let dotX = 0;
  let dotY = 0;
  let cursorRafId = null;
  let isScrolling = false;
  let scrollEndTimer = null;

  document.addEventListener('mousemove', (e) => {
    dotX = e.clientX;
    dotY = e.clientY;
    if (!cursorRafId && !isScrolling) {
      cursorRafId = requestAnimationFrame(animateCursor);
    }
  }, { passive: true });

  window.addEventListener(
    'scroll',
    () => {
      isScrolling = true;
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        isScrolling = false;
      }, 120);
    },
    { passive: true }
  );

  const hoverTargets = 'a, button, input, textarea, select, .magnetic';
  document.querySelectorAll(hoverTargets).forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  function animateCursor() {
    if (isScrolling) {
      cursorRafId = null;
      return;
    }
    ringX += (dotX - ringX) * 0.12;
    ringY += (dotY - ringY) * 0.12;
    dot?.style.setProperty('left', `${dotX}px`);
    dot?.style.setProperty('top', `${dotY}px`);
    ring?.style.setProperty('left', `${ringX}px`);
    ring?.style.setProperty('top', `${ringY}px`);
    cursorRafId = requestAnimationFrame(animateCursor);
  }
}

// ─── Magnetic buttons (skip when reduced motion or scrolling) ───
if (!prefersReducedMotion) {
  let magneticScrolling = false;
  let magneticScrollTimer = null;

  window.addEventListener(
    'scroll',
    () => {
      magneticScrolling = true;
      clearTimeout(magneticScrollTimer);
      magneticScrollTimer = setTimeout(() => {
        magneticScrolling = false;
      }, 120);
    },
    { passive: true }
  );

  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      if (magneticScrolling) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

// ─── Contact form ───
const contactForm = document.querySelector('.contact-form');
const formStatus = document.getElementById('form-status');

function setFormStatus(message, isError = false) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.toggle('is-error', isError);
}

function validateField(field) {
  const valid = field.checkValidity();
  field.setAttribute('aria-invalid', valid ? 'false' : 'true');
  return valid;
}

contactForm?.querySelectorAll('input, textarea').forEach((field) => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') {
      validateField(field);
    }
  });
});

contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  setFormStatus('');

  const fields = [...contactForm.querySelectorAll('input, textarea')];
  const allValid = fields.every((field) => validateField(field));

  if (!allValid) {
    setFormStatus('Please correct the highlighted fields before sending.', true);
    fields.find((f) => !f.checkValidity())?.focus();
    return;
  }

  const btn = contactForm.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.textContent = 'Sending…';
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');

  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    setFormStatus('Thank you — your message was sent successfully.');
    contactForm.reset();
    fields.forEach((f) => f.setAttribute('aria-invalid', 'false'));
  }, 1200);
});

// ─── Footer year ───
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ─── Skills marquee (seamless loop: duplicated segments + rAF scroll) ───
(function initMarquee() {
  const track = document.querySelector('.marquee-track');
  const seedGroup = track?.querySelector('.marquee-group');
  if (!track || !seedGroup) return;

  let offset = 0;
  let loopWidth = 0;
  let lastTime = 0;
  let running = false;
  const pxPerSecond = prefersReducedMotion ? 40 : 72;

  /** Enough identical copies that the viewport is never empty while we reset offset. */
  function ensureCopies() {
    let groups = track.querySelectorAll('.marquee-group');
    const minTrackWidth = window.innerWidth * 2;

    while (groups.length < 2 || track.scrollWidth < minTrackWidth) {
      if (groups.length >= 10) break;
      track.appendChild(seedGroup.cloneNode(true));
      groups = track.querySelectorAll('.marquee-group');
    }
  }

  function measure() {
    ensureCopies();
    const groups = track.querySelectorAll('.marquee-group');
    const first = groups[0];
    const second = groups[1];
    if (!first) return;

    loopWidth =
      second && second.offsetLeft > first.offsetLeft
        ? second.offsetLeft - first.offsetLeft
        : first.offsetWidth;

    if (loopWidth > 0 && offset <= -loopWidth) {
      offset = offset % loopWidth;
      if (offset > 0) offset -= loopWidth;
    }
  }

  function tick(now) {
    requestAnimationFrame(tick);

    if (!loopWidth) {
      measure();
      return;
    }

    if (document.hidden) {
      lastTime = 0;
      return;
    }

    if (!lastTime) lastTime = now;
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    offset -= pxPerSecond * delta;
    while (offset <= -loopWidth) {
      offset += loopWidth;
    }

    track.style.transform = `translate3d(${offset}px, 0, 0)`;
  }

  function start() {
    if (running) return;
    running = true;
    measure();
    requestAnimationFrame(tick);
  }

  ensureCopies();
  measure();
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      measure();
    });
  }
  start();

  window.addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastTime = 0;
  });
})();

// ─── Project screenshot carousel (Career Mode) ───
document.querySelectorAll('[data-carousel]').forEach((root) => {
  const slides = [...root.querySelectorAll('.project-carousel-slides img')];
  const dots = [...root.querySelectorAll('.project-carousel-dots button')];
  if (!slides.length) return;

  let index = 0;
  let timer = null;
  const total = slides.length;
  const title = root.getAttribute('aria-label') || 'App screenshots';

  function goTo(next) {
    index = (next + total) % total;
    slides.forEach((img, i) => img.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    slides.forEach((img, i) => {
      img.alt =
        i === index
          ? `${title} — screenshot ${i + 1} of ${total}`
          : '';
    });
  }

  function startAutoplay() {
    if (prefersReducedMotion || total < 2) return;
    stopAutoplay();
    timer = window.setInterval(() => goTo(index + 1), 4500);
  }

  function stopAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      startAutoplay();
    });
  });

  root.addEventListener('mouseenter', stopAutoplay);
  root.addEventListener('mouseleave', startAutoplay);
  root.addEventListener('focusin', stopAutoplay);
  root.addEventListener('focusout', startAutoplay);

  goTo(0);
  startAutoplay();
});
