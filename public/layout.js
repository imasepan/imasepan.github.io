
(function () {
  'use strict';

  var root = document.documentElement;
  var storageKey = 'imasepan-layout';
  var validLayouts = ['classic', 'industrial'];

  function readSavedLayout() {
    try {
      var saved = window.localStorage.getItem(storageKey);
      return validLayouts.indexOf(saved) !== -1 ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function readRequestedLayout() {
    try {
      var requested = new URLSearchParams(window.location.search).get('layout');
      return validLayouts.indexOf(requested) !== -1 ? requested : null;
    } catch (error) {
      return null;
    }
  }

  var initialLayout = readRequestedLayout() || readSavedLayout() || 'classic';
  root.dataset.layout = initialLayout;

  function closeMenu() {
    var header = document.querySelector('.site-header');
    var nav = document.querySelector('.site-nav');
    var wordmark = document.querySelector('.wordmark');
    if (header) header.classList.remove('is-open', 'controls-open');
    document.body.classList.remove('menu-open');
    if (nav) {
      nav.classList.remove('is-open');
      nav.setAttribute('aria-hidden', 'true');
    }
    if (wordmark) wordmark.setAttribute('aria-expanded', 'false');
  }

  function setLayout(layout, persist) {
    var next = validLayouts.indexOf(layout) !== -1 ? layout : 'classic';
    root.dataset.layout = next;
    closeMenu();

    if (persist) {
      try {
        window.localStorage.setItem(storageKey, next);
      } catch (error) {
        // Keep the selected layout for this page when storage is unavailable.
      }
    }

    document.dispatchEvent(new CustomEvent('imasepan:layout-change', { detail: { layout: next } }));
  }

  function createInterface() {
    if (!document.querySelector('.industrial-hud')) {
      var hud = document.createElement('div');
      hud.className = 'industrial-hud';
      hud.setAttribute('aria-hidden', 'true');
      hud.innerHTML = [
        '<span class="industrial-hud__corner industrial-hud__corner--tl"></span>',
        '<span class="industrial-hud__corner industrial-hud__corner--tr"></span>',
        '<span class="industrial-hud__corner industrial-hud__corner--bl"></span>',
        '<span class="industrial-hud__corner industrial-hud__corner--br"></span>',
        '<span class="industrial-hud__axis industrial-hud__axis--x"></span>',
        '<span class="industrial-hud__axis industrial-hud__axis--y"></span>',
      ].join('');
      document.body.appendChild(hud);
    }

    var projectList = document.querySelector('#project-list');
    var labelProjects = function () {
      if (!projectList) return;
      projectList.querySelectorAll('.project-card').forEach(function (card, index) {
        card.dataset.repoIndex = String(index + 1).padStart(2, '0');
      });
    };
    labelProjects();
    if (projectList && window.MutationObserver) {
      new MutationObserver(labelProjects).observe(projectList, { childList: true });
    }
  }

  var pointerFrame = 0;
  document.addEventListener('pointermove', function (event) {
    if (root.dataset.layout !== 'industrial' || pointerFrame) return;
    pointerFrame = window.requestAnimationFrame(function () {
      root.style.setProperty('--industrial-pointer-x', event.clientX + 'px');
      root.style.setProperty('--industrial-pointer-y', event.clientY + 'px');
      pointerFrame = 0;
    });
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createInterface, { once: true });
  } else {
    createInterface();
  }
})();
