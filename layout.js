
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

  function updateToggle(button, layout) {
    var industrial = layout === 'industrial';
    button.textContent = industrial ? 'CLASSIC' : 'SYSTEM';
    button.setAttribute('aria-label', industrial ? 'Switch to the classic layout' : 'Switch to the industrial layout');
    button.setAttribute('aria-pressed', String(industrial));
    button.dataset.layoutCurrent = layout;
  }

  function closeMenu() {
    var header = document.querySelector('.site-header');
    var nav = document.querySelector('.site-nav');
    var menuButton = document.querySelector('.menu-button');
    if (header) header.classList.remove('is-open');
    if (nav) nav.classList.remove('is-open');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
  }

  function setLayout(layout, persist) {
    var next = validLayouts.indexOf(layout) !== -1 ? layout : 'classic';
    root.dataset.layout = next;
    document.querySelectorAll('.layout-toggle').forEach(function (button) {
      updateToggle(button, next);
    });
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

  function switchLayout() {
    var next = root.dataset.layout === 'industrial' ? 'classic' : 'industrial';
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var apply = function () { setLayout(next, true); };

    if (!reducedMotion && document.startViewTransition) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }

//   function createInterface() {
//     var controls = document.querySelector('.site-header .header-controls');
//     if (controls && !controls.querySelector('.layout-toggle')) {
//       var button = document.createElement('button');
//       button.className = 'layout-toggle';
//       button.type = 'button';
//       var menuButton = controls.querySelector('.menu-button');
//       controls.insertBefore(button, menuButton || null);
//       updateToggle(button, root.dataset.layout);
//       button.addEventListener('click', switchLayout);
//     }

//     if (!document.querySelector('.industrial-hud')) {
//       var hud = document.createElement('div');
//       hud.className = 'industrial-hud';
//       hud.setAttribute('aria-hidden', 'true');
//       hud.innerHTML = [
//         '<span class="industrial-hud__corner industrial-hud__corner--tl"></span>',
//         '<span class="industrial-hud__corner industrial-hud__corner--tr"></span>',
//         '<span class="industrial-hud__corner industrial-hud__corner--bl"></span>',
//         '<span class="industrial-hud__corner industrial-hud__corner--br"></span>',
//         '<span class="industrial-hud__axis industrial-hud__axis--x"></span>',
//         '<span class="industrial-hud__axis industrial-hud__axis--y"></span>',
//         '<p class="industrial-hud__status"><span>IMASEPAN_OS</span><span>PORTFOLIO NODE / ONLINE</span><time></time></p>',
//         '<p class="industrial-hud__readout"><span>MEM 24</span><span>LAT 37.56</span><span>LON 126.97</span></p>'
//       ].join('');
//       document.body.appendChild(hud);

//       var clock = hud.querySelector('time');
//       var updateClock = function () {
//         if (!clock) return;
//         clock.textContent = new Date().toLocaleTimeString('en-GB', {
//           hour: '2-digit',
//           minute: '2-digit',
//           second: '2-digit',
//           hour12: false
//         });
//       };
//       updateClock();
//       window.setInterval(updateClock, 1000);
//     }

//     document.querySelectorAll('.layout-toggle').forEach(function (button) {
//       updateToggle(button, root.dataset.layout);
//     });

//     var projectList = document.querySelector('#project-list');
//     var labelProjects = function () {
//       if (!projectList) return;
//       projectList.querySelectorAll('.project-card').forEach(function (card, index) {
//         card.dataset.repoIndex = String(index + 1).padStart(2, '0');
//       });
//     };
//     labelProjects();
//     if (projectList && window.MutationObserver) {
//       new MutationObserver(labelProjects).observe(projectList, { childList: true });
//     }
//   }

//   var pointerFrame = 0;
//   document.addEventListener('pointermove', function (event) {
//     if (root.dataset.layout !== 'industrial' || pointerFrame) return;
//     pointerFrame = window.requestAnimationFrame(function () {
//       root.style.setProperty('--industrial-pointer-x', event.clientX + 'px');
//       root.style.setProperty('--industrial-pointer-y', event.clientY + 'px');
//       pointerFrame = 0;
//     });
//   }, { passive: true });

//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', createInterface, { once: true });
//   } else {
//     createInterface();
//   }
// })();

})();
