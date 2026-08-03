const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');
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

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.textContent = isOpen ? (isKorean ? '닫기' : 'Close') : (isKorean ? '메뉴' : 'Menu');
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

const updateCurrentNavigation = (pathname) => {
  document.querySelectorAll('.site-nav a').forEach((link) => {
    link.removeAttribute('aria-current');
    const linkPath = new URL(link.href, window.location.href).pathname;
    if ((pathname.startsWith('/blog') && linkPath.startsWith('/blog')) || (pathname === '/guestbook.html' && linkPath === pathname)) {
      link.setAttribute('aria-current', 'page');
    }
  });
};

const revealLoadedPage = () => {
  pageLoader.className = 'page-loader is-arrival';
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => pageLoader.classList.add('is-revealing'));
  });
  window.setTimeout(() => {
    pageLoader.className = 'page-loader';
    pageLoader.setAttribute('aria-hidden', 'true');
  }, 1500);
};

const loadInternalPage = async (destination, destinationLabel, addHistory = true) => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  pageLoader.querySelector('.page-loader-label').textContent = `Loading ${destinationLabel}`;
  pageLoader.setAttribute('aria-hidden', 'false');
  pageLoader.className = 'page-loader is-active';

  try {
    const [response] = await Promise.all([
      fetch(destination.href),
      new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 0 : 650)),
    ]);
    if (!response.ok) throw new Error('Could not load page');

    const nextDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const currentMain = document.querySelector('main');
    const nextMain = nextDocument.querySelector('main');
    if (!currentMain || !nextMain) throw new Error('Page content was missing');

    currentMain.replaceWith(nextMain);
    document.title = nextDocument.title;
    if (addHistory) window.history.pushState({}, '', destination.href);
    window.scrollTo(0, 0);
    nav?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    updateCurrentNavigation(destination.pathname);
    runTypewriter();
    loadProjects();
    handleScrollTarget(destination);
    revealLoadedPage();
  } catch {
    try {
      window.sessionStorage.setItem('page-loader-label', destinationLabel);
    } catch {
      // A normal navigation remains available as a fallback.
    }
    window.location.assign(destination.href);
  }
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
      nav?.classList.remove('is-open');
      menuButton?.setAttribute('aria-expanded', 'false');
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
  loadInternalPage(destination, destinationLabel);
});

window.addEventListener('popstate', () => {
  const destination = new URL(window.location.href);
  const destinationLabel = destination.pathname.startsWith('/blog') ? 'Writing' : destination.pathname === '/guestbook.html' ? 'Guestbook' : 'Home';
  loadInternalPage(destination, destinationLabel, false);
});

runTypewriter();
loadProjects();
handleScrollTarget();
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');
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
  const scrollTarget = new URLSearchParams(url.search).get('scroll');
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

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.textContent = isOpen ? (isKorean ? '닫기' : 'Close') : (isKorean ? '메뉴' : 'Menu');
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

const updateCurrentNavigation = (pathname) => {
  document.querySelectorAll('.site-nav a').forEach((link) => {
    link.removeAttribute('aria-current');
    const linkPath = new URL(link.href, window.location.href).pathname;
    if ((pathname.startsWith('/blog') && linkPath.startsWith('/blog')) || (pathname === '/guestbook.html' && linkPath === pathname)) {
      link.setAttribute('aria-current', 'page');
    }
  });
};

const revealLoadedPage = () => {
  pageLoader.className = 'page-loader is-arrival';
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => pageLoader.classList.add('is-revealing'));
  });
  window.setTimeout(() => {
    pageLoader.className = 'page-loader';
    pageLoader.setAttribute('aria-hidden', 'true');
  }, 1500);
};

const loadInternalPage = async (destination, destinationLabel, addHistory = true) => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  pageLoader.querySelector('.page-loader-label').textContent = `Loading ${destinationLabel}`;
  pageLoader.setAttribute('aria-hidden', 'false');
  pageLoader.className = 'page-loader is-active';

  try {
    const [response] = await Promise.all([
      fetch(destination.href),
      new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 0 : 650)),
    ]);
    if (!response.ok) throw new Error('Could not load page');

    const nextDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const currentMain = document.querySelector('main');
    const nextMain = nextDocument.querySelector('main');
    if (!currentMain || !nextMain) throw new Error('Page content was missing');

    currentMain.replaceWith(nextMain);
    document.title = nextDocument.title;
    if (addHistory) window.history.pushState({}, '', destination.href);
    window.scrollTo(0, 0);
    nav?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    updateCurrentNavigation(destination.pathname);
    runTypewriter();
    loadProjects();
    handleScrollTarget(destination);
    revealLoadedPage();
  } catch {
    try {
      window.sessionStorage.setItem('page-loader-label', destinationLabel);
    } catch {
      // A normal navigation remains available as a fallback.
    }
    window.location.assign(destination.href);
  }
};

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin || destination.pathname === '/kr/' || link.classList.contains('language-switch')) return;
  if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.hash) return;

  const isWriting = link.closest('.latest-post-card') || /(?:\/blog(?:\.html|\/)?|\/\d{4}\/\d{2}\/\d{2}\/)/.test(destination.pathname);
  const isGuestbook = /\/guestbook\.html$/.test(destination.pathname);
  const isHome = /\/(?:index\.html)?$/.test(destination.pathname);
  if (!isWriting && !isGuestbook && !isHome) return;

  event.preventDefault();
  const destinationLabel = isWriting ? 'Writing' : isGuestbook ? 'Guestbook' : 'Home';
  loadInternalPage(destination, destinationLabel);
});

window.addEventListener('popstate', () => {
  const destination = new URL(window.location.href);
  const destinationLabel = destination.pathname.startsWith('/blog') ? 'Writing' : destination.pathname === '/guestbook.html' ? 'Guestbook' : 'Home';
  loadInternalPage(destination, destinationLabel, false);
});

runTypewriter();
loadProjects();
handleScrollTarget();
