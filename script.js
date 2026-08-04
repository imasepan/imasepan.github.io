const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');
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

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && document.startViewTransition) {
      document.startViewTransition(() => applyTheme(nextTheme));
    } else {
      applyTheme(nextTheme);
    }

    try {
      window.localStorage.setItem('theme', nextTheme);
    } catch {
      // The selected theme still applies for this page when storage is unavailable.
    }
  });
}

systemTheme.addEventListener('change', (event) => {
  if (!readSavedTheme()) applyTheme(event.matches ? 'dark' : 'light');
});

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  field.innerHTML = `<div class="analog-grid"></div><canvas class="analog-ripple" aria-hidden="true"></canvas><div class="analog-grain"></div>${marks}`;
  document.body.prepend(field);
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

const startAnalogRipple = () => {
  const field = document.querySelector('.analog-field');
  const canvas = field?.querySelector('.analog-ripple');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!field || !canvas || !context) return;

  const root = document.documentElement;
  const clusters = [
    { x: .18, y: .13, radiusX: .44, radiusY: .30, core: .25, edge: .78 },
    { x: .82, y: .38, radiusX: .38, radiusY: .28, core: .18, edge: .78 },
    { x: .45, y: .84, radiusX: .52, radiusY: .34, core: .16, edge: .82 }
  ];
  const rippleLifetime = 900;
  const rippleSpeed = .3;
  const rippleBand = 38;
  const rippleStrength = 11;
  let width = 0;
  let height = 0;
  let points = [];
  let ripples = [];
  let animationFrame = null;
  let resizeFrame = null;
  let lastDraw = 0;
  let lastRippleTime = -Infinity;
  let lastRippleX = null;
  let lastRippleY = null;
  let dotColor = '#787569';
  let isActive = false;

  const readDotColor = () => {
    dotColor = window.getComputedStyle(root).getPropertyValue('--muted').trim() || '#787569';
  };

  const maskOpacityAt = (x, y) => clusters.reduce((opacity, cluster) => {
    const normalizedX = (x - (cluster.x * width)) / Math.max(cluster.radiusX * width, 1);
    const normalizedY = (y - (cluster.y * height)) / Math.max(cluster.radiusY * height, 1);
    const distance = Math.hypot(normalizedX, normalizedY);
    if (distance <= cluster.core) return 1;
    if (distance >= cluster.edge) return opacity;
    const fade = 1 - ((distance - cluster.core) / (cluster.edge - cluster.core));
    return Math.max(opacity, fade);
  }, 0);

  const buildLattice = () => {
    const baseSpacing = width <= 720 ? 23 : 19;
    const spacing = Math.max(baseSpacing, Math.sqrt((width * height) / 8000));
    const nextPoints = [];

    for (let y = 0; y <= height; y += spacing) {
      for (let x = 0; x <= width; x += spacing) {
        const opacity = maskOpacityAt(x, y);
        if (opacity > .025) nextPoints.push({ x, y, opacity });
      }
    }

    points = nextPoints;
  };

  const drawLattice = (timestamp = 0) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = dotColor;
    const activeRipples = ripples.filter((ripple) => timestamp - ripple.startedAt < rippleLifetime);
    ripples = activeRipples;

    points.forEach((point) => {
      let offsetX = 0;
      let offsetY = 0;
      let peak = 0;

      activeRipples.forEach((ripple) => {
        const age = timestamp - ripple.startedAt;
        const distanceX = point.x - ripple.x;
        const distanceY = point.y - ripple.y;
        const distance = Math.max(Math.hypot(distanceX, distanceY), 1);
        const distanceFromWave = distance - (age * rippleSpeed);
        const envelope = Math.exp(-(distanceFromWave ** 2) / (2 * rippleBand ** 2)) * (1 - (age / rippleLifetime));
        if (envelope < .015) return;
        const wave = Math.sin(distanceFromWave * .18) * envelope * rippleStrength;
        offsetX += (distanceX / distance) * wave;
        offsetY += (distanceY / distance) * wave;
        peak = Math.max(peak, envelope);
      });

      const dotSize = 2 + (peak * 1.2);
      context.globalAlpha = Math.min(1, point.opacity * (.88 + (peak * .9)));
      context.fillRect(point.x + offsetX - (dotSize / 2), point.y + offsetY - (dotSize / 2), dotSize, dotSize);
    });

    context.globalAlpha = 1;
  };

  const animateRipples = (timestamp) => {
    if (timestamp - lastDraw < 30) {
      animationFrame = window.requestAnimationFrame(animateRipples);
      return;
    }

    lastDraw = timestamp;
    drawLattice(timestamp);
    if (ripples.length) {
      animationFrame = window.requestAnimationFrame(animateRipples);
    } else {
      animationFrame = null;
      lastDraw = 0;
    }
  };

  const resizeCanvas = () => {
    width = Math.max(window.innerWidth, 1);
    height = Math.max(window.innerHeight, 1);
    const areaScale = Math.sqrt(8000000 / (width * height));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, areaScale);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.imageSmoothingEnabled = false;
    ripples = [];
    readDotColor();
    buildLattice();
    drawLattice();
  };

  const stopRipples = () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    animationFrame = null;
    resizeFrame = null;
    lastDraw = 0;
    ripples = [];
    context.clearRect(0, 0, width, height);
  };

  const configureRipple = () => {
    const nextActive = finePointerQuery.matches && !reducedMotionQuery.matches;
    if (nextActive === isActive) return;
    stopRipples();
    isActive = nextActive;
    field.classList.toggle('has-ripple', isActive);
    if (isActive) resizeCanvas();
  };

  window.addEventListener('pointermove', (event) => {
    if (!isActive || event.pointerType === 'touch') return;
    const now = window.performance.now();
    const distanceFromLast = lastRippleX === null ? Infinity : Math.hypot(event.clientX - lastRippleX, event.clientY - lastRippleY);
    if (now - lastRippleTime < 70 || distanceFromLast < 12) return;

    ripples.push({ x: event.clientX, y: event.clientY, startedAt: now });
    if (ripples.length > 4) ripples.shift();
    lastRippleTime = now;
    lastRippleX = event.clientX;
    lastRippleY = event.clientY;
    if (!animationFrame) animationFrame = window.requestAnimationFrame(animateRipples);
  }, { passive: true });
  window.addEventListener('resize', () => {
    if (!isActive || resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = null;
      resizeCanvas();
    });
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopRipples();
    else if (isActive) drawLattice();
  });
  finePointerQuery.addEventListener('change', configureRipple);
  reducedMotionQuery.addEventListener('change', configureRipple);
  new MutationObserver(() => {
    readDotColor();
    if (isActive) drawLattice(window.performance.now());
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  configureRipple();
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
    const easing = 1 - Math.exp(-elapsed / 140);
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

createAnalogField();
startAnalogParallax();
startAnalogRipple();
const stopInertialScroll = startInertialScroll();

const pageLoader = document.createElement('div');
pageLoader.className = 'page-loader';
pageLoader.setAttribute('aria-hidden', 'true');
pageLoader.innerHTML = '<span class="page-loader-label">Loading</span>';
document.body.appendChild(pageLoader);

let arrivingPage = null;
try {
  arrivingPage = window.sessionStorage.getItem('page-loader-label');
  window.sessionStorage.removeItem('page-loader-label');
} catch {
  // Navigation still works if session storage is unavailable.
}

if (arrivingPage) {
  pageLoader.querySelector('.page-loader-label').textContent = `Loading ${arrivingPage}`;
  pageLoader.classList.add('is-arrival');
  pageLoader.setAttribute('aria-hidden', 'false');

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => pageLoader.classList.add('is-revealing'));
  });
}

const runTypewriter = () => {
  const typewriterText = document.querySelector('[data-typewriter]');
  if (!typewriterText || typewriterText.dataset.animated || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  typewriterText.dataset.animated = 'true';
  const fullText = typewriterText.textContent.trim();
  const fullHeight = typewriterText.getBoundingClientRect().height;
  let characterIndex = 0;

  typewriterText.setAttribute('aria-label', fullText);
  typewriterText.style.minHeight = `${fullHeight}px`;
  typewriterText.textContent = '';
  typewriterText.classList.add('has-caret');

  const typeNextCharacter = () => {
    typewriterText.textContent += fullText[characterIndex];
    characterIndex += 1;

    if (characterIndex < fullText.length) {
      window.setTimeout(typeNextCharacter, fullText[characterIndex - 1] === ' ' ? 120 : 70);
    } else {
      window.setTimeout(() => typewriterText.classList.remove('has-caret'), 2000);
    }
  };

  window.setTimeout(typeNextCharacter, 250);
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

const setMenuState = (isOpen, returnFocus = false) => {
  if (!menuButton || !nav || !siteHeader) return;

  stopInertialScroll();
  nav.classList.toggle('is-open', isOpen);
  siteHeader.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
  document.querySelectorAll('.music-banner, main, .site-footer').forEach((region) => {
    region.inert = isOpen;
  });
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.textContent = isOpen ? (isKorean ? '닫기' : 'Close') : (isKorean ? '메뉴' : 'Menu');
  nav.setAttribute('aria-hidden', String(!isOpen));

  if (isOpen) window.requestAnimationFrame(() => nav.querySelector('a')?.focus());
  if (!isOpen && returnFocus) menuButton.focus();
};

if (menuButton && nav && siteHeader) {
  setMenuState(false);

  menuButton.addEventListener('click', () => {
    setMenuState(!siteHeader.classList.contains('is-open'));
  });

  siteHeader.addEventListener('click', (event) => {
    if (event.target === siteHeader && siteHeader.classList.contains('is-open')) setMenuState(false, true);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && siteHeader.classList.contains('is-open')) setMenuState(false, true);
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) setMenuState(false);
  });
}

const loadProjects = () => {
  const projectList = document.querySelector('#project-list');
  if (!projectList || projectList.dataset.loaded) return;
  projectList.dataset.loaded = 'true';

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
      projectList.innerHTML = visibleRepos.map((repo) => `
        <a class="project-card${repo.name.toLowerCase() === 'playermarket' ? ' player-market' : ''}" href="${repo.html_url}" target="_blank" rel="noreferrer">
          <h3>${repo.name}</h3>
          <p>${repo.description || (isKorean ? 'imasepan의 프로젝트입니다.' : 'A project by imasepan.')}</p>
          <span class="project-meta">${repo.language || 'Code'} · ${isKorean ? 'GitHub에서 보기 ↗' : 'View on GitHub ↗'}</span>
        </a>`).join('');
    })
    .catch(() => {
      projectList.innerHTML = '<p class="loading">Projects will appear here as public repositories are added. <a href="https://github.com/imasepan?tab=repositories" target="_blank" rel="noreferrer">Browse GitHub ↗</a></p>';
    });
};

const navigateWithLoader = (destination, destinationLabel) => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  stopInertialScroll();
  pageLoader.querySelector('.page-loader-label').textContent = `Loading ${destinationLabel}`;
  pageLoader.setAttribute('aria-hidden', 'false');
  pageLoader.className = 'page-loader is-active';

  try {
    window.sessionStorage.setItem('page-loader-label', destinationLabel);
  } catch {
    // Navigation and animation still work when session storage is unavailable.
  }

  window.setTimeout(() => window.location.assign(destination.href), reducedMotion ? 0 : 650);
};

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
      setMenuState(false, true);
      stopInertialScroll();
      currentTarget.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      window.history.pushState({}, '', `/#${homeSection}`);
      return;
    }
  }

  const isWriting = link.closest('.latest-post-card') || /(?:\/blog(?:\.html|\/)?|\/\d{4}\/\d{2}\/\d{2}\/)/.test(destination.pathname);
  const isGuestbook = /\/guestbook\.html$/.test(destination.pathname);
  const isHome = isHomePath(destination.pathname);
  if (!isWriting && !isGuestbook && !isHome) return;

  event.preventDefault();
  const destinationLabel = isWriting ? 'Writing' : isGuestbook ? 'Guestbook' : 'Home';
  navigateWithLoader(destination, destinationLabel);
});

runTypewriter();
loadProjects();
handleScrollTarget();
