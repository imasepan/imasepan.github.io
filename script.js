const wordmark = document.querySelector('.wordmark');
const nav = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');
const brandControls = document.querySelector('.brand-controls');
const headerControls = document.querySelector('.header-controls');
const isKorean = document.documentElement.lang === 'ko';
const themeToggle = document.querySelector('.theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

const readSavedTheme = () => {
  try {
    const savedTheme = window.localStorage.getItem('theme');
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
  } catch {
    return null;
  }
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;

  if (themeToggle) {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    themeToggle.textContent = nextTheme === 'dark' ? 'Dark' : 'Light';
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }
};

applyTheme(readSavedTheme() || (systemTheme.matches ? 'dark' : 'light'));

let activeThemeTransition = null;

const transitionTheme = (theme) => {
  if (theme === document.documentElement.dataset.theme || activeThemeTransition) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    applyTheme(theme);
    return;
  }

  document.documentElement.classList.add('theme-is-transitioning');
  if (themeToggle) themeToggle.disabled = true;

  // Flush the transition rules before changing the palette so the colors
  // interpolate directly, without a bright overlay covering the page.
  void document.body.offsetWidth;
  applyTheme(theme);

  activeThemeTransition = window.setTimeout(() => {
    document.documentElement.classList.remove('theme-is-transitioning');
    if (themeToggle) themeToggle.disabled = false;
    activeThemeTransition = null;
  }, 750);
};

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    transitionTheme(nextTheme);

    try {
      window.localStorage.setItem('theme', nextTheme);
    } catch {
      // The selected theme still applies for this page when storage is unavailable.
    }
  });
}

systemTheme.addEventListener('change', (event) => {
  if (!readSavedTheme()) transitionTheme(event.matches ? 'dark' : 'light');
});

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const createSunlitField = () => {
  if (document.querySelector('.sunlit-field')) return;
  const field = document.createElement('div');
  field.className = 'sunlit-field';
  field.setAttribute('aria-hidden', 'true');
  field.innerHTML = `<div class="sunlit-blur"><span></span><span></span><span></span></div><div class="sunlit-glow"></div><div class="sunlit-bounce"></div><div class="sunlit-perspective"><div class="sunlit-blinds"><div class="sunlit-shutters">${'<span class="sunlit-shutter"></span>'.repeat(18)}</div><div class="sunlit-bars"><span class="sunlit-bar"></span><span class="sunlit-bar"></span></div></div></div>`;
  document.body.prepend(field);
};

const createAnalogField = () => {
  if (document.querySelector('.analog-field')) return;

  const field = document.createElement('div');
  field.className = 'analog-field';
  field.setAttribute('aria-hidden', 'true');

  const glyphs = ['\u00b7 : \u00b7', '+ \u00b7 +', '\u2591 \u2592', '\u25e6 \u00b7 \u25e6', ': + :', '\u00b7 \u00d7 \u00b7', '\u2591 \u00b7', '+ : \u00b7', '\u25e6 +', '\u00b7 \u2591 \u00b7', ': \u00d7 :', '\u00b7 + \u25e6', '\u2592 \u00b7', '+ \u00b7 :'];
  const marks = glyphs.map((glyph, index) => {
    const x = 4 + ((index * 23) % 91);
    const y = 6 + ((index * 31) % 87);
    const delay = -((index * 7) % 19);
    const duration = 9 + ((index * 5) % 11);
    return `<span class="analog-mark" style="--analog-x:${x}%;--analog-y:${y}%;--analog-delay:${delay}s;--analog-duration:${duration}s">${glyph}</span>`;
  }).join('');

  field.innerHTML = `<div class="analog-grain"></div>${marks}`;
  document.body.prepend(field);
};

const createFilmGrain = () => {
  if (document.querySelector('.film-grain')) return;

  const grain = document.createElement('div');
  grain.className = 'film-grain';
  grain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(grain);
};

const startAnalogParallax = () => {
  if (reducedMotionQuery.matches) return;
  let animationFrame = null;

  const updateAnalogPosition = () => {
    const offset = Math.min(window.scrollY * 0.02, 54);
    document.documentElement.style.setProperty('--analog-scroll', `${-offset}px`);
    animationFrame = null;
  };

  window.addEventListener('scroll', () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(updateAnalogPosition);
  }, { passive: true });
};

const startInertialScroll = () => {
  const desktopPointerQuery = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const navigationKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab']);
  let currentY = window.scrollY;
  let targetY = window.scrollY;
  let animationFrame = null;
  let lastFrameTime = 0;
  let isEnabled = false;

  const stopInertia = () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
    lastFrameTime = 0;
    root.classList.remove('inertia-enabled');
    currentY = window.scrollY;
    targetY = window.scrollY;
  };

  const normalizeWheelDelta = (event) => {
    let delta = event.deltaY;
    if (event.deltaMode === 1) delta *= 16;
    if (event.deltaMode === 2) delta *= window.innerHeight * .85;
    return clamp(delta, -240, 240);
  };

  const nestedScrollerCanMove = (path, delta) => path.some((node) => {
    if (!(node instanceof Element) || node === document.body || node === root) return false;
    if (node.matches('iframe, .spotify-player, [data-native-scroll], textarea, select, input, [contenteditable="true"]')) return true;
    const overflowY = window.getComputedStyle(node).overflowY;
    if (!/(auto|scroll|overlay)/.test(overflowY) || node.scrollHeight <= node.clientHeight + 1) return false;
    const bottom = node.scrollHeight - node.clientHeight;
    return (delta < 0 && node.scrollTop > 1) || (delta > 0 && node.scrollTop < bottom - 1);
  });

  const stepInertia = (timestamp) => {
    const elapsed = clamp(lastFrameTime ? timestamp - lastFrameTime : 16, 8, 32);
    lastFrameTime = timestamp;
    const easing = 1 - Math.exp(-elapsed / 260);
    currentY += (targetY - currentY) * easing;
    window.scrollTo(0, currentY);

    if (Math.abs(targetY - currentY) < .45) {
      window.scrollTo(0, targetY);
      animationFrame = null;
      lastFrameTime = 0;
      root.classList.remove('inertia-enabled');
      return;
    }

    animationFrame = window.requestAnimationFrame(stepInertia);
  };

  const onWheel = (event) => {
    if (!isEnabled || event.defaultPrevented || event.ctrlKey || event.metaKey || document.body.classList.contains('menu-open') || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const delta = normalizeWheelDelta(event);
    if (!delta || nestedScrollerCanMove(event.composedPath(), delta)) return;
    event.preventDefault();

    const queuedDirection = Math.sign(targetY - currentY);
    if (animationFrame && queuedDirection && Math.sign(delta) !== queuedDirection) stopInertia();

    if (!animationFrame) currentY = targetY = window.scrollY;
    const maximumScroll = Math.max(0, root.scrollHeight - window.innerHeight);
    const maximumQueue = window.innerHeight * 1.25;
    targetY = clamp(targetY + (delta * .92), Math.max(0, currentY - maximumQueue), Math.min(maximumScroll, currentY + maximumQueue));
    if (!animationFrame) {
      root.classList.add('inertia-enabled');
      animationFrame = window.requestAnimationFrame(stepInertia);
    }
  };

  const configureInertia = () => {
    const nextEnabled = desktopPointerQuery.matches && !reducedMotionQuery.matches;
    if (nextEnabled === isEnabled) return;
    if (isEnabled) window.removeEventListener('wheel', onWheel);
    stopInertia();
    isEnabled = nextEnabled;
    if (isEnabled) window.addEventListener('wheel', onWheel, { passive: false });
  };

  window.addEventListener('scroll', () => {
    if (!animationFrame) currentY = targetY = window.scrollY;
  }, { passive: true });
  window.addEventListener('pointerdown', stopInertia, { passive: true });
  window.addEventListener('resize', stopInertia, { passive: true });
  window.addEventListener('blur', stopInertia);
  window.addEventListener('hashchange', stopInertia);
  window.addEventListener('popstate', stopInertia);
  document.addEventListener('focusin', stopInertia);
  document.addEventListener('keydown', (event) => {
    if (navigationKeys.has(event.key)) stopInertia();
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopInertia();
  });
  desktopPointerQuery.addEventListener('change', configureInertia);
  reducedMotionQuery.addEventListener('change', configureInertia);
  configureInertia();
  return stopInertia;
};

createSunlitField();
createAnalogField();
createFilmGrain();
startAnalogParallax();
let stopInertialScroll = () => {};

const startDeferredEnhancements = () => {
  stopInertialScroll = startInertialScroll();
};

if ('requestIdleCallback' in window) {
  window.requestIdleCallback(startDeferredEnhancements, { timeout: 1200 });
} else {
  window.setTimeout(startDeferredEnhancements, 250);
}

const pageLoader = document.createElement('div');
pageLoader.className = 'page-loader';
pageLoader.setAttribute('role', 'status');
pageLoader.setAttribute('aria-label', 'Loading');
pageLoader.setAttribute('aria-hidden', 'true');
pageLoader.innerHTML = '<span class="page-loader-indicator" aria-hidden="true"></span>';
document.body.appendChild(pageLoader);

let arrivingPage = null;
try {
  arrivingPage = window.sessionStorage.getItem('page-loader-label');
  window.sessionStorage.removeItem('page-loader-label');
} catch {
  // Navigation still works if session storage is unavailable.
}

if (arrivingPage) {
  pageLoader.setAttribute('aria-label', `Loading ${arrivingPage}`);
  pageLoader.classList.add('is-arrival');
  pageLoader.setAttribute('aria-hidden', 'false');

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => pageLoader.classList.add('is-revealing'));
  });
}

const runHeadlineMaterialise = () => {
  const headline = document.querySelector('[data-reveal-heading]');
  const hero = document.querySelector('.hero');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (hero) hero.classList.add('hero-tiles-ready');
  if (!headline || headline.dataset.revealed) return;

  headline.dataset.revealed = 'true';
  if (reducedMotion) return;
  headline.classList.add('is-materialising');

  const reveal = () => window.requestAnimationFrame(() => headline.classList.add('is-visible'));
  if (document.querySelector('[data-entry-loader]')) {
    window.addEventListener('entry-loader-ready', reveal, { once: true });
  } else {
    reveal();
  }
};

const handleScrollTarget = (url = new URL(window.location.href)) => {
  const scrollTarget = url.hash.replace(/^#/, '') || new URLSearchParams(url.search).get('scroll');
  if (!scrollTarget) return;
  const target = document.getElementById(scrollTarget);

  if (target) {
    stopInertialScroll();
    const initialScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = initialScrollBehavior;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        window.history.replaceState(null, '', `${url.pathname}#${scrollTarget}`);
      });
    });
  }
};

if (wordmark && siteHeader) {
  let controlsCloseTimer;
  const hoverHeaderQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  const revealHeaderControls = () => {
    if (!hoverHeaderQuery.matches) return;
    window.clearTimeout(controlsCloseTimer);
    siteHeader.classList.add('controls-open');
  };
  const concealHeaderControls = () => {
    if (!hoverHeaderQuery.matches) return;
    window.clearTimeout(controlsCloseTimer);
    controlsCloseTimer = window.setTimeout(() => {
      if (!siteHeader.classList.contains('is-open')) {
        siteHeader.classList.remove('controls-open');
      }
    }, 180);
  };

  brandControls?.addEventListener('pointerenter', revealHeaderControls);
  brandControls?.addEventListener('pointerleave', concealHeaderControls);
  headerControls?.addEventListener('pointerenter', revealHeaderControls);
  headerControls?.addEventListener('pointerleave', concealHeaderControls);
  wordmark.addEventListener('click', () => {
    wordmark.setAttribute('aria-expanded', 'false');
    window.location.href = isKorean ? '/kr/' : '/';
  });
}

const menuButton = document.querySelector('.menu-button');

if (menuButton && siteHeader && nav) {
  const setMenuOpen = (open) => {
    siteHeader.classList.toggle('is-open', open);
    siteHeader.classList.toggle('controls-open', open);
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.setAttribute('aria-hidden', String(!open));
  };

  setMenuOpen(false);
  menuButton.addEventListener('click', () => setMenuOpen(!siteHeader.classList.contains('is-open')));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
}

const loadProjects = () => {
  const projectList = document.querySelector('#project-list');
  if (!projectList || projectList.dataset.loaded) return;
  projectList.dataset.loaded = 'true';

  const cacheKey = 'imasepan-projects-v1';
  const renderProjects = (repos) => {
    projectList.innerHTML = repos.map((repo) => `
      <a class="project-card${repo.name.toLowerCase() === 'playermarket' ? ' player-market' : ''}" href="${repo.html_url}" target="_blank" rel="noreferrer">
        <h3>${repo.name}</h3>
        <p>${repo.description || (isKorean ? 'imasepan의 프로젝트입니다.' : 'A project by imasepan.')}</p>
        <span class="project-meta">${repo.language || 'Code'} · ${isKorean ? 'GitHub에서 보기 ↗' : 'View on GitHub ↗'}</span>
      </a>`).join('');
  };

  try {
    const cachedProjects = JSON.parse(window.sessionStorage.getItem(cacheKey));
    if (Array.isArray(cachedProjects) && cachedProjects.length) {
      renderProjects(cachedProjects);
      return;
    }
  } catch {
    // Continue with the static cards and refresh from GitHub when storage is unavailable.
  }

  fetch('https://api.github.com/users/imasepan/repos?sort=updated&per_page=100')
    .then((response) => {
      if (!response.ok) throw new Error('Could not load repositories');
      return response.json();
    })
    .then((repos) => {
      const visibleRepos = repos
        .filter((repo) => repo.name !== 'imasepan.github.io')
        .slice(0, 3);
      if (!visibleRepos.length) throw new Error('No public repositories found');
      renderProjects(visibleRepos);
      try {
        window.sessionStorage.setItem(cacheKey, JSON.stringify(visibleRepos));
      } catch {
        // The refreshed cards still render when storage is unavailable.
      }
    })
    .catch(() => {
      if (!projectList.querySelector('.project-card')) {
        projectList.innerHTML = '<p class="loading">Projects will appear here as public repositories are added. <a href="https://github.com/imasepan?tab=repositories" target="_blank" rel="noreferrer">Browse GitHub ↗</a></p>';
      }
    });
};

const queueProjectLoad = () => {
  const projectList = document.querySelector('#project-list');
  if (!projectList || projectList.dataset.observed || projectList.dataset.loaded) return;
  projectList.dataset.observed = 'true';

  if (!('IntersectionObserver' in window)) {
    loadProjects();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    loadProjects();
  }, { rootMargin: '500px 0px' });
  observer.observe(projectList);
};

const navigateWithLoader = async (destination, destinationLabel) => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  stopInertialScroll();
  pageLoader.setAttribute('aria-label', `Loading ${destinationLabel}`);
  pageLoader.setAttribute('aria-hidden', 'false');
  pageLoader.className = 'page-loader is-active';

  const finishNavigation = () => {
    pageLoader.className = 'page-loader';
    pageLoader.setAttribute('aria-hidden', 'true');
  };

  try {
    const response = await fetch(destination.href, { headers: { 'X-Requested-With': 'soft-navigation' } });
    if (!response.ok) throw new Error(`Navigation failed: ${response.status}`);

    const nextDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const currentMain = document.querySelector('main');
    const nextMain = nextDocument.querySelector('main');

    // Keep the document (and therefore the Spotify iframe) mounted. If a page
    // does not share this shell, fall back to a normal browser navigation.
    if (!currentMain || !nextMain || !nextDocument.querySelector('.spotify-player')) {
      window.location.assign(destination.href);
      return;
    }

    currentMain.replaceWith(nextMain);
    document.title = nextDocument.title;
    window.history.pushState({}, '', destination.href);
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    initialisePortraitCaption();
    enhancePostFigureCaptions();
    enhancePostSpotifyLinks();
    queueProjectLoad();
    runHeadlineMaterialise();
    handleScrollTarget();

    window.setTimeout(finishNavigation, reducedMotion ? 0 : 250);
  } catch {
    window.location.assign(destination.href);
  }
};

window.addEventListener('popstate', () => {
  if (document.querySelector('.spotify-player')) {
    navigateWithLoader(new URL(window.location.href), 'Page');
  }
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin || destination.pathname === '/kr/' || link.classList.contains('language-switch')) return;

  const homeSection = destination.hash.replace(/^#/, '') || new URLSearchParams(destination.search).get('scroll');
  const isHomePath = (pathname) => /^\/(?:index\.html)?$/.test(pathname);
  if (homeSection && isHomePath(destination.pathname)) {
    const currentTarget = document.getElementById(homeSection);
    if (currentTarget && isHomePath(window.location.pathname)) {
      event.preventDefault();
      stopInertialScroll();
      currentTarget.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      window.history.pushState({}, '', `/#${homeSection}`);
      return;
    }
  }

  const isWriting = link.closest('.latest-post-card') || /(?:\/blog(?:\.html|\/)?|\/\d{4}\/\d{2}\/\d{2}\/)/.test(destination.pathname);
  const isHome = isHomePath(destination.pathname);
  if (!isWriting && !isHome) return;

  event.preventDefault();
  const destinationLabel = isWriting ? 'Writing' : 'Home';
  navigateWithLoader(destination, destinationLabel);
});

runHeadlineMaterialise();
queueProjectLoad();
handleScrollTarget();


// Turn `[figcaption: ...]` into a caption for the most recently rendered image.
// This keeps the syntax compatible with the standard GitHub Pages/Jekyll build,
// including pages inserted by soft navigation.
function enhancePostFigureCaptions() {
  const postContent = document.querySelector(".post-content");
  if (!postContent) return;

  postContent.querySelectorAll("img").forEach((image) => {
    image.loading = "lazy";
    image.decoding = "async";
  });

  const captionPattern = /^\[figcaption:\s*([\s\S]*?)\s*\]$/;
  [...postContent.querySelectorAll("p")].forEach((paragraph) => {
    const match = paragraph.textContent.trim().match(captionPattern);
    if (!match) return;

    const image = [...postContent.querySelectorAll("img")]
      .filter((candidate) => paragraph.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_PRECEDING)
      .at(-1);
    if (!image) return;

    const imageParagraph = image.closest("p");
    if (!imageParagraph || imageParagraph.parentElement !== postContent) return;

    // Keep an optional link around the image, while replacing the Markdown
    // paragraph so the figure remains valid, compact markup.
    const imageContent = image.closest("a") || image;

    const figure = document.createElement("figure");
    figure.className = "post-figure";
    imageParagraph.replaceWith(figure);
    figure.append(imageContent);

    const caption = document.createElement("figcaption");
    caption.textContent = match[1];
    figure.append(caption);
    paragraph.remove();
  });
}

enhancePostFigureCaptions();


const portraitPointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
let disposePortraitCaption = () => {};

// Turn the semantic caption into a cursor-following tag on precise pointers,
// while leaving it in the document flow as a regular caption everywhere else.
// The home page can be replaced by soft navigation, so this must be safe to
// run again for the newly inserted portrait.
function initialisePortraitCaption() {
  disposePortraitCaption();

  const portraitHoverTarget = document.querySelector(".about-photo");
  const portraitCaption = portraitHoverTarget?.querySelector("figcaption");
  const portraitImage = portraitHoverTarget?.querySelector("img");
  if (!portraitHoverTarget || !portraitCaption || !portraitImage) return;

  const portraitTooltip = document.createElement("span");
  portraitTooltip.className = "portrait-caption-tooltip";
  portraitTooltip.textContent = portraitCaption.textContent;
  portraitTooltip.setAttribute("aria-hidden", "true");
  document.body.append(portraitTooltip);

  let previousPointerX = null;
  let targetRotation = 0;
  let currentRotation = 0;
  let rotationFrame = null;

  const animatePortraitCaption = () => {
    currentRotation += (targetRotation - currentRotation) * .18;
    targetRotation *= .72;
    portraitTooltip.style.rotate = `${currentRotation.toFixed(2)}deg`;

    if (Math.abs(currentRotation) > .05 || Math.abs(targetRotation) > .05) {
      rotationFrame = window.requestAnimationFrame(animatePortraitCaption);
      return;
    }

    currentRotation = 0;
    targetRotation = 0;
    portraitTooltip.style.rotate = "0deg";
    rotationFrame = null;
  };

  const movePortraitInteraction = (event) => {
    if (!portraitPointerQuery.matches) return;

    const captionBounds = portraitTooltip.getBoundingClientRect();
    const inset = 8;
    const x = Math.min(event.clientX + 14, window.innerWidth - captionBounds.width - inset);
    const y = Math.min(event.clientY + 18, window.innerHeight - captionBounds.height - inset);
    portraitTooltip.style.left = `${Math.max(inset, x)}px`;
    portraitTooltip.style.top = `${Math.max(inset, y)}px`;

    const bounds = portraitHoverTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - bounds.left) / bounds.width) - .5;
    const normalizedY = ((event.clientY - bounds.top) / bounds.height) - .5;
    portraitHoverTarget.style.setProperty("--portrait-shift-x", `${(-normalizedX * 10).toFixed(2)}px`);
    portraitHoverTarget.style.setProperty("--portrait-shift-y", `${(-normalizedY * 8).toFixed(2)}px`);

    if (previousPointerX !== null && !reducedMotionQuery.matches) {
      targetRotation = Math.max(-5, Math.min(5, (event.clientX - previousPointerX) * .6));
      if (!rotationFrame) rotationFrame = window.requestAnimationFrame(animatePortraitCaption);
    }
    previousPointerX = event.clientX;
  };

  const enterPortrait = (event) => {
    if (!portraitPointerQuery.matches) return;
    movePortraitInteraction(event);
    portraitHoverTarget.classList.add("is-hovering");
    portraitTooltip.classList.remove("is-exiting");
    portraitTooltip.classList.add("is-entering");
  };

  const leavePortrait = () => {
    portraitHoverTarget.style.setProperty("--portrait-shift-x", "0px");
    portraitHoverTarget.style.setProperty("--portrait-shift-y", "0px");
    portraitHoverTarget.classList.remove("is-hovering");
    portraitTooltip.classList.remove("is-entering");
    portraitTooltip.classList.add("is-exiting");
    previousPointerX = null;
    targetRotation = 0;
  };

  const configurePortraitCaption = () => {
    portraitHoverTarget.classList.toggle("has-pointer-caption", portraitPointerQuery.matches);
    if (portraitPointerQuery.matches) return;

    portraitHoverTarget.classList.remove("is-hovering");
    portraitTooltip.classList.remove("is-entering", "is-exiting");
    portraitTooltip.removeAttribute("style");
  };

  portraitHoverTarget.addEventListener("pointerenter", enterPortrait, { passive: true });
  portraitHoverTarget.addEventListener("pointermove", movePortraitInteraction, { passive: true });
  portraitHoverTarget.addEventListener("pointerleave", leavePortrait, { passive: true });
  portraitHoverTarget.addEventListener("pointercancel", leavePortrait, { passive: true });
  portraitPointerQuery.addEventListener("change", configurePortraitCaption);
  configurePortraitCaption();

  disposePortraitCaption = () => {
    portraitHoverTarget.removeEventListener("pointerenter", enterPortrait);
    portraitHoverTarget.removeEventListener("pointermove", movePortraitInteraction);
    portraitHoverTarget.removeEventListener("pointerleave", leavePortrait);
    portraitHoverTarget.removeEventListener("pointercancel", leavePortrait);
    portraitPointerQuery.removeEventListener("change", configurePortraitCaption);
    if (rotationFrame) window.cancelAnimationFrame(rotationFrame);
    portraitTooltip.remove();
    disposePortraitCaption = () => {};
  };
}

initialisePortraitCaption();

// Turn Spotify links placed inside a post into a compact embedded player.
const enhancePostSpotifyLinks = () => {
  const postContent = document.querySelector('.post-content');
  if (!postContent || document.querySelector('.post-spotify')) return;

  const spotifyLink = postContent.querySelector('a[href*="open.spotify.com/"]');
  if (!spotifyLink) return;

  const source = spotifyLink.href;
  const path = source.replace(/^https?:\/\//, '').split('?')[0];
  const embedSource = path.includes('open.spotify.com/embed/')
    ? source.split('?')[0]
    : source.split('?')[0].replace('open.spotify.com/', 'open.spotify.com/embed/');
  const postTitle = document.querySelector('.post-header h1')?.textContent.trim() || 'this post';

  const player = document.createElement('aside');
  player.className = 'post-spotify';
  player.setAttribute('aria-label', 'Spotify player');

  const label = document.createElement('p');
  label.className = 'eyebrow';
  label.textContent = 'soundtrack';

  const iframe = document.createElement('iframe');
  iframe.className = 'post-spotify-player';
  iframe.title = 'Spotify player for ' + postTitle;
  iframe.src = embedSource + '?utm_source=generator';
  iframe.width = '100%';
  iframe.height = '152';
  iframe.setAttribute('frameborder', '0');
  iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  iframe.loading = 'lazy';

  player.append(label, iframe);
  const linkParagraph = spotifyLink.closest('p');
  if (linkParagraph && linkParagraph.textContent.trim() === spotifyLink.textContent.trim()) {
    linkParagraph.replaceWith(player);
  } else {
    spotifyLink.replaceWith(player);
  }
};

enhancePostSpotifyLinks();
