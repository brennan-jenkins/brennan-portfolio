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
  const RING_EASE = 0.28;
  let targetX = 0;
  let targetY = 0;
  let ringX = 0;
  let ringY = 0;
  let ringRafId = null;
  let ringReady = false;

  function cursorTransform(x, y) {
    return `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }

  function scheduleRing() {
    if (ringRafId !== null) return;
    ringRafId = requestAnimationFrame(animateRing);
  }

  function snapRing() {
    ringX = targetX;
    ringY = targetY;
    ring?.style.setProperty('transform', cursorTransform(ringX, ringY));
  }

  function moveCursor(x, y) {
    targetX = x;
    targetY = y;
    if (dot) dot.style.transform = cursorTransform(x, y);
    if (!ringReady) {
      ringReady = true;
      snapRing();
      return;
    }
    scheduleRing();
  }

  document.addEventListener(
    'mousemove',
    (e) => moveCursor(e.clientX, e.clientY),
    { passive: true }
  );

  document.addEventListener('mousedown', snapRing, { passive: true });

  function animateRing() {
    ringRafId = null;
    ringX += (targetX - ringX) * RING_EASE;
    ringY += (targetY - ringY) * RING_EASE;
    ring?.style.setProperty('transform', cursorTransform(ringX, ringY));

    if (Math.abs(targetX - ringX) > 0.35 || Math.abs(targetY - ringY) > 0.35) {
      scheduleRing();
    } else {
      snapRing();
    }
  }

  const hoverTargets = 'a, button, input, textarea, select, .magnetic';
  document.querySelectorAll(hoverTargets).forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
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

// ─── Contact form (Web3Forms native POST — https://web3forms.com) ───
const contactForm = document.querySelector('.contact-form');
const formStatus = document.getElementById('form-status');
const formRedirect = document.getElementById('form-redirect');
const formSubject = document.getElementById('form-subject');
const formAccessKey = document.getElementById('web3forms-access-key');

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

const formFields = () =>
  [...contactForm.querySelectorAll('#name, #email, #message')];

function setupWeb3Forms() {
  const configKey = window.PORTFOLIO_FORM?.web3formsAccessKey?.trim();
  if (configKey && formAccessKey) {
    formAccessKey.value = configKey;
  }

  if (formRedirect) {
    const returnUrl = new URL(window.location.href.split('#')[0]);
    returnUrl.searchParams.set('sent', '1');
    returnUrl.hash = 'contact';
    formRedirect.value = returnUrl.toString();
  }
}

function showSentConfirmation() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('sent') !== '1') return;

  setFormStatus('Thank you — your message was sent. I\'ll get back to you soon.');
  contactForm?.reset();
  formFields().forEach((f) => f.setAttribute('aria-invalid', 'false'));

  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete('sent');
  window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.hash);
}

if (contactForm) {
  setupWeb3Forms();
  showSentConfirmation();

  contactForm.querySelectorAll('#name, #email, #message').forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') {
        validateField(field);
      }
    });
  });

  contactForm.addEventListener('submit', (e) => {
    setFormStatus('');

    const fields = formFields();
    const allValid = fields.every((field) => validateField(field));

    if (!allValid) {
      e.preventDefault();
      setFormStatus('Please correct the highlighted fields before sending.', true);
      fields.find((f) => !f.checkValidity())?.focus();
      return;
    }

    if (contactForm.querySelector('[name="botcheck"]')?.checked) {
      e.preventDefault();
      return;
    }

    if (!formAccessKey?.value.trim()) {
      e.preventDefault();
      setFormStatus(
        'Form is not set up yet — please use the email link above.',
        true
      );
      return;
    }

    const name = contactForm.querySelector('#name')?.value.trim() ?? '';
    if (formSubject) {
      formSubject.value = `Portfolio enquiry from ${name}`;
    }

    setupWeb3Forms();

    const btn = contactForm.querySelector('button[type="submit"]');
    if (btn) {
      btn.textContent = 'Sending…';
      btn.setAttribute('aria-busy', 'true');
    }
    // Browser posts to https://api.web3forms.com/submit, then redirects back
  });
}

// ─── Footer year ───
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ─── Skills marquee: pause CSS animation when off-screen ───
if (!prefersReducedMotion) {
  const marquee = document.querySelector('.marquee');
  const marqueeTrack = marquee?.querySelector('.marquee-track');
  if (marquee && marqueeTrack) {
    const marqueeObserver = new IntersectionObserver(
      ([entry]) => {
        marqueeTrack.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      },
      { threshold: 0 }
    );
    marqueeObserver.observe(marquee);
  }
}

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
    slides.forEach((img, i) => {
      const active = i === index;
      img.classList.toggle('is-active', active);
      img.setAttribute('aria-hidden', active ? 'false' : 'true');
      img.alt = active ? `${title} — screenshot ${i + 1} of ${total}` : '';
    });
    dots.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', active ? 'true' : 'false');
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
