const CONFIG = {
  CHECKOUT_URL: "https://nicolasgenesir.tiendup.com/e/control-remoto-ordena-delegar-y-tener-un-negocio-replicable",
  CHECKOUT_USD_URL: "https://nicolasgenesir.tiendup.com/e/control-remoto-ordena-delegar-y-tener-un-negocio-replicable?currency=USD",
  CLOSE_AT: "2026-11-04T23:59:00-03:00",
  CTA_VALUE: 23999,
  CURRENCY: "ARS",
  CTA_USD_VALUE: 24,
  USD_CURRENCY: "USD",
};

function withTracking(url) {
  const params = new URLSearchParams(window.location.search);
  if (![...params.keys()].length) return url;
  const u = new URL(url);
  params.forEach((v, k) => { if (!u.searchParams.has(k)) u.searchParams.set(k, v); });
  return u.toString();
}

function trackAndGo(url, name, value, currency) {
  if (window.fbq) {
    fbq('trackCustom', 'ClicComprarLanding', {
      content_name: name,
      value: typeof value === 'number' ? value : CONFIG.CTA_VALUE,
      currency: currency || CONFIG.CURRENCY,
    });
  }
  setTimeout(() => { window.location.href = withTracking(url); }, 300);
}

(function initLanding() {
  'use strict';

  document.documentElement.classList.add('js-ready');

  const ctaElements = Array.from(document.querySelectorAll('[data-cta]'));
  const topBanner = document.getElementById('top-banner');
  const bannerTimer = document.getElementById('banner-timer');
  const bannerPrefix = document.getElementById('banner-prefix');
  const bannerUnits = document.getElementById('banner-units');
  const bannerSep = document.getElementById('banner-sep');
  const closingSection = document.getElementById('cierre');
  const closingTimer = document.getElementById('closing-timer');
  const ticketCloseNote = document.getElementById('ticket-close-note');
  const scrollProgress = document.getElementById('scroll-progress');

  const dayNodes = Array.from(document.querySelectorAll('[data-timer-days]'));
  const hourNodes = Array.from(document.querySelectorAll('[data-timer-hours]'));
  const minuteNodes = Array.from(document.querySelectorAll('[data-timer-minutes]'));
  const secondNodes = Array.from(document.querySelectorAll('[data-timer-seconds]'));

  let isSalesClosed = false;
  let timerIntervalId = null;
  let lastAriaMinuteKey = '';

  /* ========================================================================
     1. AVATAR FALLBACKS (Photos vs Monograms)
     ======================================================================== */
  function initAvatarFallbacks() {
    const avatarContainers = document.querySelectorAll('[data-avatar]');
    avatarContainers.forEach((container) => {
      const img = container.querySelector('img');
      if (!img) return;

      const markFallback = () => container.classList.add('is-fallback');
      const markLoaded = () => {
        if (img.naturalWidth > 0) {
          container.classList.remove('is-fallback');
        } else {
          markFallback();
        }
      };

      img.addEventListener('error', markFallback);
      img.addEventListener('load', markLoaded);

      if (img.complete) {
        if (img.naturalWidth === 0) {
          markFallback();
        } else {
          container.classList.remove('is-fallback');
        }
      }
    });
  }

  /* ========================================================================
     2. CTA MANAGEMENT & TRACKING
     ======================================================================== */
  function disableAllCtas(closedText) {
    ctaElements.forEach((el) => {
      el.setAttribute('aria-disabled', 'true');
      el.removeAttribute('href');
      if (closedText) {
        const textSpan = el.querySelector('.btn-text');
        if (textSpan) {
          textSpan.textContent = closedText;
          const arrow = el.querySelector('.btn-arrow');
          if (arrow) arrow.style.display = 'none';
        } else {
          el.textContent = closedText;
        }
      }
    });

    const heroBtn = document.getElementById('hero-cta-btn');
    if (heroBtn) {
      heroBtn.setAttribute('aria-disabled', 'true');
      heroBtn.removeAttribute('href');
      if (closedText) {
        const textSpan = heroBtn.querySelector('.btn-text');
        if (textSpan) {
          textSpan.textContent = closedText;
          const arrow = heroBtn.querySelector('.btn-arrow');
          if (arrow) arrow.style.display = 'none';
        } else {
          heroBtn.textContent = closedText;
        }
      }
    }
  }

  function setupCtas() {
    const rawUrl = (CONFIG.CHECKOUT_URL || '').trim();
    const rawUsdUrl = (CONFIG.CHECKOUT_USD_URL || rawUrl).trim();
    const isLocalPreview =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.protocol === 'file:';

    if (isSalesClosed) {
      disableAllCtas('Ventas cerradas');
      return;
    }

    if (!rawUrl) {
      console.warn(
        '[Control Remoto] CONFIG.CHECKOUT_URL está vacío. Pegá el link de TiendUp en script.js antes de publicar.'
      );
      // En vista previa local mantenemos el estilo activo para visualizar el diseño de botones
      if (!isLocalPreview) {
        disableAllCtas(null);
      }
      return;
    }

    let trackedUrl = rawUrl;
    let trackedUsdUrl = rawUsdUrl;
    try {
      trackedUrl = withTracking(rawUrl);
      trackedUsdUrl = withTracking(rawUsdUrl);
    } catch (err) {
      console.warn('[Control Remoto] URL de checkout inválida:', err);
      disableAllCtas(null);
      return;
    }

    ctaElements.forEach((el) => {
      el.removeAttribute('aria-disabled');
      const isUsd = el.getAttribute('data-cta') === 'cierre-usd';
      el.setAttribute('href', isUsd ? trackedUsdUrl : trackedUrl);
    });
  }

  ctaElements.forEach((el) => {
    el.addEventListener('click', (event) => {
      if (isSalesClosed || el.getAttribute('aria-disabled') === 'true') {
        event.preventDefault();
        return;
      }

      const isUsd = el.getAttribute('data-cta') === 'cierre-usd';
      const targetUrl = isUsd ? (CONFIG.CHECKOUT_USD_URL || CONFIG.CHECKOUT_URL) : (CONFIG.CHECKOUT_URL || '');
      const rawUrl = (targetUrl || '').trim();
      if (!rawUrl) {
        event.preventDefault();
        console.warn('[Control Remoto] Clic en CTA detectado (modo preview sin CHECKOUT_URL).');
        return;
      }

      const val = isUsd ? (CONFIG.CTA_USD_VALUE || 24) : CONFIG.CTA_VALUE;
      const curr = isUsd ? (CONFIG.USD_CURRENCY || 'USD') : CONFIG.CURRENCY;
      const ctaName = el.getAttribute('data-cta') || 'cta';

      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        if (window.fbq) {
          fbq('trackCustom', 'ClicComprarLanding', {
            content_name: ctaName,
            value: val,
            currency: curr,
          });
        }
        return;
      }

      event.preventDefault();
      trackAndGo(rawUrl, ctaName, val, curr);
    });
  });

  function initHeroCtaScroll() {
    const heroBtn = document.getElementById('hero-cta-btn');
    if (!heroBtn) return;
    heroBtn.addEventListener('click', (event) => {
      const offerTarget = document.getElementById('oferta');
      if (!offerTarget) return;
      event.preventDefault();
      offerTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ========================================================================
     3. COUNTDOWN TIMER (Banner + Closing Section)
     ======================================================================== */
  function pad2(num) {
    return String(Math.max(0, num)).padStart(2, '0');
  }

  function applyClosedState() {
    isSalesClosed = true;
    stopCountdownLoop();

    dayNodes.forEach((n) => { n.textContent = '00'; });
    hourNodes.forEach((n) => { n.textContent = '00'; });
    minuteNodes.forEach((n) => { n.textContent = '00'; });
    secondNodes.forEach((n) => { n.textContent = '00'; });

    if (topBanner) topBanner.classList.add('is-closed');
    if (bannerPrefix) bannerPrefix.textContent = 'Ventas cerradas';
    const bannerPrefixDesktop = document.querySelector('.banner-prefix-desktop');
    if (bannerPrefixDesktop) bannerPrefixDesktop.style.display = 'none';
    if (bannerUnits) bannerUnits.style.display = 'none';
    if (bannerSep) bannerSep.style.display = 'none';
    if (bannerTimer) bannerTimer.setAttribute('aria-label', 'Ventas cerradas');
    if (closingTimer) closingTimer.setAttribute('aria-label', 'Ventas cerradas');
    if (closingSection) closingSection.classList.add('is-closed');
    if (ticketCloseNote) ticketCloseNote.textContent = 'Ventas cerradas';

    disableAllCtas('Ventas cerradas');
  }

  function updateCountdown() {
    const closeTimestamp = new Date(CONFIG.CLOSE_AT).getTime();
    const now = Date.now();
    const diffMs = closeTimestamp - now;

    if (diffMs <= 0 || Number.isNaN(closeTimestamp)) {
      applyClosedState();
      return;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const dStr = pad2(days);
    const hStr = pad2(hours);
    const mStr = pad2(minutes);
    const sStr = pad2(seconds);

    dayNodes.forEach((n) => { n.textContent = dStr; });
    hourNodes.forEach((n) => { n.textContent = hStr; });
    minuteNodes.forEach((n) => { n.textContent = mStr; });
    secondNodes.forEach((n) => { n.textContent = sStr; });

    const minuteKey = `${days}-${hours}-${minutes}`;
    if (minuteKey !== lastAriaMinuteKey) {
      lastAriaMinuteKey = minuteKey;
      const dLabel = days === 1 ? '1 día' : `${days} días`;
      const hLabel = hours === 1 ? '1 hora' : `${hours} horas`;
      const mLabel = minutes === 1 ? '1 minuto' : `${minutes} minutos`;
      const prefix = days === 1 && hours === 0 && minutes === 0 ? 'Queda' : 'Quedan';
      const descriptiveLabel = `${prefix} ${dLabel}, ${hLabel} y ${mLabel} para el cierre de entradas`;

      if (bannerTimer) bannerTimer.setAttribute('aria-label', descriptiveLabel);
      if (closingTimer) closingTimer.setAttribute('aria-label', descriptiveLabel);
    }
  }

  function startCountdownLoop() {
    if (isSalesClosed || timerIntervalId !== null) return;
    updateCountdown();
    if (!isSalesClosed) {
      timerIntervalId = window.setInterval(updateCountdown, 1000);
    }
  }

  function stopCountdownLoop() {
    if (timerIntervalId !== null) {
      window.clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopCountdownLoop();
    } else if (!isSalesClosed) {
      startCountdownLoop();
    }
  });

  /* ========================================================================
     4. FLUID INFINITE CAROUSEL WITH EDGE FADE
     ======================================================================== */
  function initCarousel() {
    const track = document.getElementById('cases-track');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');
    if (!track) return;

    const originalCards = Array.from(track.querySelectorAll('.case-card'));
    const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.carousel-dot')) : [];
    const totalOriginal = originalCards.length;
    if (!totalOriginal) return;

    // Clone cards once for seamless infinite loop
    originalCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('data-clone', 'true');
      track.appendChild(clone);
    });

    initAvatarFallbacks();

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let currentIndex = 0;
    let rafId = null;
    let isPaused = false;
    let resumeTimeoutId = null;
    let exactScroll = track.scrollLeft;

    function getSingleLoopWidth() {
      const firstCard = originalCards[0];
      const firstClone = track.querySelector('[data-clone="true"]');
      if (firstCard && firstClone) {
        return firstClone.offsetLeft - firstCard.offsetLeft;
      }
      return track.scrollWidth / 2;
    }

    function setActiveDot(index) {
      const normalized = ((index % totalOriginal) + totalOriginal) % totalOriginal;
      currentIndex = normalized;
      dots.forEach((dot, idx) => {
        const active = idx === normalized;
        dot.classList.toggle('is-active', active);
        if (active) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    }

    function syncActiveDotFromScroll() {
      const loopWidth = getSingleLoopWidth();
      if (loopWidth <= 0) return;

      const wrappedLeft = ((track.scrollLeft % loopWidth) + loopWidth) % loopWidth;
      const stepWidth = loopWidth / totalOriginal;
      const index = Math.round(wrappedLeft / stepWidth) % totalOriginal;
      setActiveDot(index);
    }

    function stepContinuousScroll() {
      if (!isPaused && !document.hidden && !reducedMotionQuery.matches) {
        const loopWidth = getSingleLoopWidth();
        exactScroll += 0.65;
        if (loopWidth > 0 && exactScroll >= loopWidth) {
          exactScroll -= loopWidth;
        }
        track.scrollLeft = exactScroll;
        syncActiveDotFromScroll();
      }
      rafId = window.requestAnimationFrame(stepContinuousScroll);
    }

    function pauseTemporarily(ms) {
      isPaused = true;
      window.clearTimeout(resumeTimeoutId);
      if (ms) {
        resumeTimeoutId = window.setTimeout(() => {
          exactScroll = track.scrollLeft;
          isPaused = false;
        }, ms);
      }
    }

    function scrollToCardIndex(index) {
      const normalized = ((index % totalOriginal) + totalOriginal) % totalOriginal;
      const targetCard = originalCards[normalized];
      if (!targetCard) return;

      pauseTemporarily(3500);
      const leftPos = targetCard.offsetLeft - originalCards[0].offsetLeft;
      const behavior = reducedMotionQuery.matches ? 'auto' : 'smooth';
      track.scrollTo({ left: leftPos, behavior });
      exactScroll = leftPos;
      setActiveDot(normalized);
    }

    track.addEventListener(
      'scroll',
      () => {
        if (isPaused) {
          const loopWidth = getSingleLoopWidth();
          if (loopWidth > 0 && track.scrollLeft >= loopWidth * 1.5) {
            track.scrollLeft -= loopWidth;
          }
          exactScroll = track.scrollLeft;
          syncActiveDotFromScroll();
        }
      },
      { passive: true }
    );

    track.addEventListener('mouseenter', () => {
      isPaused = true;
      window.clearTimeout(resumeTimeoutId);
    });

    track.addEventListener('mouseleave', () => {
      exactScroll = track.scrollLeft;
      isPaused = false;
    });

    track.addEventListener('focusin', () => {
      isPaused = true;
      window.clearTimeout(resumeTimeoutId);
    });

    track.addEventListener('focusout', (e) => {
      if (!track.contains(e.relatedTarget)) {
        exactScroll = track.scrollLeft;
        isPaused = false;
      }
    });

    track.addEventListener(
      'touchstart',
      () => {
        isPaused = true;
        window.clearTimeout(resumeTimeoutId);
      },
      { passive: true }
    );

    track.addEventListener(
      'touchend',
      () => {
        pauseTemporarily(2800);
      },
      { passive: true }
    );

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToCardIndex(currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToCardIndex(currentIndex - 1);
      }
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        scrollToCardIndex(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        scrollToCardIndex(currentIndex + 1);
      });
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        scrollToCardIndex(idx);
      });
    });

    if (!reducedMotionQuery.matches) {
      rafId = window.requestAnimationFrame(stepContinuousScroll);
    }

    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', () => {
        if (reducedMotionQuery.matches && rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        } else if (!reducedMotionQuery.matches && rafId === null) {
          exactScroll = track.scrollLeft;
          rafId = window.requestAnimationFrame(stepContinuousScroll);
        }
      });
    }
  }

  /* ========================================================================
     5. SCROLL REVEAL & PROGRESS BAR
     ======================================================================== */
  function initScrollFluidity() {
    const revealItems = Array.from(document.querySelectorAll('.reveal-item'));

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
      );

      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add('is-revealed'));
    }

    if (scrollProgress) {
      let ticking = false;
      window.addEventListener(
        'scroll',
        () => {
          if (!ticking) {
            window.requestAnimationFrame(() => {
              const docEl = document.documentElement;
              const maxScroll = docEl.scrollHeight - docEl.clientHeight;
              const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
              scrollProgress.style.transform = `scaleX(${ratio.toFixed(4)})`;
              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true }
      );
    }
  }

  /* ========================================================================
     6. MOBILE STICKY BAR (IntersectionObserver on Hero & Closing)
     ======================================================================== */
  function initMobileStickyBar() {
    const stickyBar = document.getElementById('mobile-sticky-bar');
    const heroSection = document.getElementById('hero');
    if (!stickyBar || !heroSection || !closingSection || !('IntersectionObserver' in window)) {
      return;
    }

    let heroVisible = true;
    let closingVisible = false;

    function syncStickyBarVisibility() {
      const heroRect = heroSection.getBoundingClientRect();
      const hasScrolledPastHero = !heroVisible && heroRect.bottom <= 80;
      const shouldShow = hasScrolledPastHero && !closingVisible;
      const barCta = stickyBar.querySelector('[data-cta]');

      stickyBar.classList.toggle('is-visible', shouldShow);
      stickyBar.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      if (shouldShow) {
        stickyBar.removeAttribute('inert');
        if (barCta) barCta.removeAttribute('tabindex');
      } else {
        stickyBar.setAttribute('inert', '');
        if (barCta) barCta.setAttribute('tabindex', '-1');
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === heroSection) {
            heroVisible = entry.isIntersecting;
          } else if (entry.target === closingSection) {
            closingVisible = entry.isIntersecting;
          }
        });
        syncStickyBarVisibility();
      },
      { threshold: 0.05 }
    );

    observer.observe(heroSection);
    observer.observe(closingSection);
  }

  // Initialize everything
  initAvatarFallbacks();
  startCountdownLoop();
  setupCtas();
  initHeroCtaScroll();
  initCarousel();
  initScrollFluidity();
  initMobileStickyBar();
})();
