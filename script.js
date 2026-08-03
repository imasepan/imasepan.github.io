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

document.querySelectorAll('a[href]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;

    const isWriting = link.closest('.latest-post-card') || /(?:\/blog(?:\.html|\/)?|\/\d{4}\/\d{2}\/\d{2}\/)/.test(destination.pathname);
    const isGuestbook = /\/guestbook\.html$/.test(destination.pathname);
    if (!isWriting && !isGuestbook) return;

    event.preventDefault();
    pageLoader.querySelector('.page-loader-label').textContent = `Loading ${isWriting ? 'Writing' : 'Guestbook'}`;
    pageLoader.setAttribute('aria-hidden', 'false');
    pageLoader.classList.add('is-active');

    try {
      window.sessionStorage.setItem('page-loader-label', isWriting ? 'Writing' : 'Guestbook');
    } catch {
      // The outgoing animation can still play without a matching reveal.
    }

    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
    window.setTimeout(() => window.location.assign(destination.href), delay);
  });
});

const scrollTarget = new URLSearchParams(window.location.search).get('scroll');
const typewriterText = document.querySelector('[data-typewriter]');

if (typewriterText && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
}

if (scrollTarget) {
  const target = document.getElementById(scrollTarget);

  if (target) {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        window.history.replaceState(null, '', `${window.location.pathname}#${scrollTarget}`);
      });
    });
  }
}

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.textContent = isOpen ? (isKorean ? '닫기' : 'Close') : (isKorean ? '메뉴' : 'Menu');
  });
}

const projectList = document.querySelector('#project-list');

if (projectList) {
  fetch('https://api.github.com/users/imasepan/repos?sort=updated&per_page=6')
    .then((response) => {
      if (!response.ok) throw new Error('Could not load repositories');
      return response.json();
    })
    .then((repos) => {
      const visibleRepos = repos.filter((repo) => !repo.fork && repo.name !== 'imasepan.github.io');
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
}
