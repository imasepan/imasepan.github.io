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

  field.innerHTML = `<div class="analog-grid"></div><div class="analog-grain"></div>${marks}`;
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

const startAnalogPointerResponse = () => {
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (reducedMotionQuery.matches || !finePointerQuery.matches) return;

  let animationFrame = null;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;

  const updatePointerPosition = () => {
    const normalizedX = (pointerX / Math.max(window.innerWidth, 1)) - .5;
    const normalizedY = (pointerY / Math.max(window.innerHeight, 1)) - .5;
    document.documentElement.style.setProperty('--analog-pointer-shift-x', `${normalizedX * 18}px`);
    document.documentElement.style.setProperty('--analog-pointer-shift-y', `${normalizedY * 12}px`);
    animationFrame = null;
  };

  const resetPointerPosition = () => {
    pointerX = window.innerWidth / 2;
    pointerY = window.innerHeight / 2;
    if (!animationFrame) animationFrame = window.requestAnimationFrame(updatePointerPosition);
  };

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || reducedMotionQuery.matches) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!animationFrame) animationFrame = window.requestAnimationFrame(updatePointerPosition);
  }, { passive: true });
  window.addEventListener('blur', resetPointerPosition);
  document.documentElement.addEventListener('pointerleave', resetPointerPosition);
  reducedMotionQuery.addEventListener('change', resetPointerPosition);
};

createAnalogField();
startAnalogParallax();
startAnalogPointerResponse();

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
    window.scrollTo(0, 0);
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
