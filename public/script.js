const wordmark = document.querySelector('.wordmark');
const nav = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');
const brandControls = document.querySelector('.brand-controls');
const headerControls = document.querySelector('.header-controls');
const isKorean = document.documentElement.lang === 'ko';
const themeToggle = document.querySelector('.theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const appearanceButtons = document.querySelectorAll('[data-appearance-mode]');
const hasAppearanceControls = appearanceButtons.length > 0;
const appearanceModes = ['default', 'light', 'dark', 'rain', 'frutiger'];
const readAppearance = () => {
  try {
    const requested = new URLSearchParams(location.search).get('layout');
    if (appearanceModes.includes(requested)) return requested;
    const saved = localStorage.getItem('imasepan-appearance');
    if (appearanceModes.includes(saved)) return saved;
    if (localStorage.getItem('weather') === 'rain') return 'rain';
    const theme = localStorage.getItem('theme');
    if (theme === 'light' || theme === 'dark') return theme;
  } catch { /* The buttons also work without storage. */ }
  return 'default';
};

const readSavedTheme = () => {
  try {
    const savedTheme = window.localStorage.getItem('theme');
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
  } catch {
    return null;
  }
};

const defaultHomeSpotifySource = document.querySelector('.music-dock .spotify-player')?.getAttribute('src');
const frutigerSpotifySource = 'https://open.spotify.com/embed/album/07NVjt98kIbx7SKynHNrFr?utm_source=generator';

const syncSpotifyTheme = (theme = document.documentElement.dataset.theme) => {
  document.querySelectorAll('iframe.spotify-player, iframe.post-spotify-player').forEach((player) => {
    const homeDock = player.closest('.music-dock');
    const isFrutiger = document.documentElement.dataset.appearance === 'frutiger';
    const source = new URL(homeDock ? (isFrutiger ? frutigerSpotifySource : defaultHomeSpotifySource) : player.src);
    if (homeDock) {
      player.title = isFrutiger ? 'Spotify album' : 'Spotify playlist';
      homeDock.setAttribute('aria-label', isFrutiger ? 'Featured Spotify album' : 'Featured Spotify playlist');
    }
    // Preserve Spotify’s artwork palette except in dark mode or the Frutiger dock.
    if (theme === 'dark' || (isFrutiger && homeDock)) source.searchParams.set('theme', '0');
    else source.searchParams.delete('theme');
    if (player.src !== source.href) player.src = source.href;
  });
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  syncSpotifyTheme(theme);

  if (themeToggle) {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    themeToggle.textContent = nextTheme === 'dark' ? 'Dark' : 'Light';
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }
};

const applyAppearance = (mode) => {
  const next = appearanceModes.includes(mode) ? mode : 'default';
  document.documentElement.dataset.appearance = next;
  const homeMenu = document.querySelector('.home-menu');
  const musicDock = document.querySelector('.music-dock');
  const webring = document.querySelector('.home-webring');
  const musicParent = next === 'frutiger' ? homeMenu : document.querySelector('.guestbook-menu-item');
  const ringParent = next === 'frutiger' ? homeMenu : document.querySelector('.home-screen');
  // Move the existing elements so the default layout retains its original anchors.
  if (musicDock && musicParent && musicDock.parentElement !== musicParent) musicParent.append(musicDock);
  if (webring && ringParent && webring.parentElement !== ringParent) ringParent.append(webring);
  document.documentElement.dataset.weather = next === 'rain' ? 'rain' : 'clear';
  applyTheme(next === 'dark' ? 'dark' : next === 'light' || next === 'frutiger' ? 'light' : readSavedTheme() || (systemTheme.matches ? 'dark' : 'light'));
  if (themeToggle) themeToggle.hidden = next === 'frutiger';
  const rainButton = document.querySelector('.rain-toggle');
  if (rainButton) rainButton.hidden = next === 'frutiger';
  appearanceButtons.forEach(button => {
    const selected = button.dataset.appearanceMode === (next === 'light' || next === 'dark' ? 'default' : next);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.dispatchEvent(new CustomEvent('appearance-change', { detail: { mode: next } }));
};
if (hasAppearanceControls) applyAppearance(readAppearance());
else applyTheme(readSavedTheme() || (systemTheme.matches ? 'dark' : 'light'));

let activeThemeTransition = null;

const transitionAppearance = (update) => {
  if (activeThemeTransition) return;
  /* Reduced-motion handling temporarily disabled.
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }
    */

  const controls = document.querySelectorAll('.theme-toggle, .rain-toggle, [data-appearance-mode]');
  controls.forEach((control) => { control.disabled = true; });
  document.dispatchEvent(new Event('weather-transition-start'));
  document.documentElement.classList.add('theme-is-transitioning');
  // Interpolate the existing palette directly, as in the original transition.
  void document.body.offsetWidth;
  update();
  activeThemeTransition = window.setTimeout(() => {
    document.documentElement.classList.remove('theme-is-transitioning');
    controls.forEach((control) => { control.disabled = false; });
    activeThemeTransition = null;
    document.dispatchEvent(new Event('weather-transition-end'));
  }, 750);
};

const transitionTheme = (theme) => {
  if (theme === document.documentElement.dataset.theme) return;
  transitionAppearance(() => applyTheme(theme));
};
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    if (hasAppearanceControls) {
      const mode = document.documentElement.dataset.appearance === 'rain' ? 'rain' : nextTheme;
      transitionAppearance(() => {
        applyAppearance(mode);
        applyTheme(nextTheme);
      });
      persistAppearance(mode);
    } else transitionTheme(nextTheme);

    try {
      window.localStorage.setItem('theme', nextTheme);
    } catch {
      // The selected theme still applies for this page when storage is unavailable.
    }
  });
}

systemTheme.addEventListener('change', (event) => {
  if (hasAppearanceControls) {
    const mode = document.documentElement.dataset.appearance;
    if ((mode === 'default' || mode === 'rain') && !readSavedTheme()) transitionAppearance(() => applyAppearance(mode));
  } else if (!readSavedTheme()) transitionTheme(event.matches ? 'dark' : 'light');
});

function persistAppearance(mode) {
  try {
    localStorage.setItem('imasepan-appearance', mode);
    // Explicit choices supersede a URL preview of a layout.
    const url = new URL(location.href);
    url.searchParams.delete('layout');
    history.replaceState(history.state, '', url);
  } catch { /* Keep the selection for this page. */ }
}
appearanceButtons.forEach(button => button.addEventListener('click', () => {
  const requested = button.dataset.appearanceMode;
  const mode = requested !== 'default' && document.documentElement.dataset.appearance === requested ? 'default' : requested;
  transitionAppearance(() => applyAppearance(mode));
  persistAppearance(mode);
}));

// const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const portraitPointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

const rainToggle = document.querySelector('.rain-toggle');
const createRainField = () => {
  if (!rainToggle && !hasAppearanceControls) return;
  const rainField = document.createElement('div');
  rainField.className = 'rain-field';
  rainField.setAttribute('aria-hidden', 'true');
  // Adapted from https://codepen.io/arickle/pen/XKjMZY:
  // Repeat a fixed five-drop rhythm across two evenly spaced rows.
  rainField.innerHTML = ['front', 'back'].map((layer, row) => {
    const drops = Array.from({ length: 90 }, (_, index) => {
      const beat = index % 5;
      const position = (index + .5 + row * .5) * 100 / 90;
      const duration = .32 + beat * .02;
      const delay = -((index * 7 + row * 3) % 19) / 19 * duration;
      return `<span class="raindrop" data-rain-batch="${beat}" style="--rain-x:${position}%;--rain-duration:${duration}s;--rain-delay:${delay}s;--rain-start:${1 + beat * .4}%"><span class="rain-stem"></span></span>`;
    });
    return `<div class="rain-row rain-row--${layer}">${drops.join('')}</div>`;
  }).join('');
  document.querySelector('.sunlit-shadows').appendChild(rainField);
  // Droplet silhouettes share the rainfall and window shadows blur and palette.
  const glass = document.createElement('div');
  glass.className = 'rain-glass';
  glass.setAttribute('aria-hidden', 'true');
  let seed = 7919;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const bead = 'M0 -1 C.48 -1.16 .83 -.54 .92 .02 C1.08 .69 .55 1.08 -.04 1 C-.78 1.1 -1.02 .56 -.86 -.07 C-.76 -.57 -.4 -.79 0 -1Z';
  const beads = Array.from({ length: 680 }, (_, index) => {
    const x = random() * 1440;
    const y = random() * 1000;
    const radius = 1.5 + Math.pow(random(), 2.4) * 6.75;
    const stretch = .85 + random() * .8;
    const motion = index % 4 === 0 ? `class="glass-droplet" style="--glass-duration:${14 + random() * 22}s;--glass-delay:${-random() * 40}s"` : '';
    return `<g ${motion}><g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(random() * 50 - 25).toFixed(1)}) scale(${radius.toFixed(2)} ${(radius * stretch).toFixed(2)})" opacity="${(.35 + random() * .55).toFixed(2)}"><path d="${bead}" fill="currentColor"/></g></g>`;
  }).join('');
  const trails = Array.from({ length: 16 }, (_, index) => {
    const x = 20 + random() * 1400;
    const y = random() * 950 - 120;
    const length = 50 + random() * 115;
    const bend = random() * 16 - 8;
    const path = `M0 0 C-4 ${length * .24} 5 ${length * .3} 1 ${length * .46} S${bend} ${length * .76} ${bend} ${length}`;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="glass-rivulet" style="--glass-duration:${10 + index * .9}s;--glass-delay:${-index * 3.7}s"><path class="glass-trail" d="${path}" pathLength="1" fill="none" stroke="currentColor" stroke-opacity=".65" stroke-width="3.5" stroke-linecap="round"/><g class="glass-runner" style="offset-path:path('${path}')"><path d="${bead}" transform="scale(3.4 6)" fill="currentColor"/></g></g></g>`;
  }).join('');
  glass.innerHTML = `<svg viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" focusable="false">${trails}${beads}</svg>`;
  document.querySelector('.sunlit-shadows').appendChild(glass);
  const lightning = document.createElement('div');
  lightning.className = 'rain-lightning';
  document.querySelector('.sunlit-shadows').prepend(lightning);

  const applyRain = (enabled) => {
    document.documentElement.dataset.weather = enabled ? 'rain' : 'clear';
    rainToggle?.setAttribute('aria-pressed', String(enabled));
    /* Reduced-motion handling temporarily disabled.
if (reducedMotionQuery.matches) {
      rainField.querySelectorAll('.raindrop').forEach(drop => { drop.hidden = false; });
    }
    */
  };
  let savedRain = false;
  try {
    savedRain = window.localStorage.getItem('weather') === 'rain';
  } catch {
    // Weather controls also work when browser storage is unavailable.
  }
  applyRain(hasAppearanceControls ? document.documentElement.dataset.appearance === 'rain' : savedRain);
  document.addEventListener('appearance-change', event => applyRain(event.detail.mode === 'rain'));
  if (!hasAppearanceControls) rainToggle?.addEventListener('click', () => {
    const enabled = document.documentElement.dataset.weather !== 'rain';
    transitionAppearance(() => applyRain(enabled));
    try {
      window.localStorage.setItem('weather', enabled ? 'rain' : 'clear');
    } catch {
      // Keep this page's selection even when it cannot be saved.
    }
  });
  // Remove falling-drop animations during palette interpolation, then bring
  // back evenly distributed batches at increasing playback rates.
  let rampTimer;
  const batches = Array.from({ length: 5 }, (_, batch) =>
    [...rainField.querySelectorAll(`[data-rain-batch="${batch}"]`)]);
  const suspendRain = () => {
    window.clearTimeout(rampTimer);
    batches.flat().forEach(drop => { drop.hidden = true; });
  };
  const resumeRain = () => {
    suspendRain();
    if (document.hidden || document.documentElement.dataset.weather !== 'rain') return;
    /* Reduced-motion handling temporarily disabled.
if (reducedMotionQuery.matches) {
      batches.flat().forEach(drop => { drop.hidden = false; });
      return;
    }
    */
    let stage = 0;
    const rates = [.3, .45, .65, .85, 1];
    const reveal = () => {
      batches[stage].forEach(drop => { drop.hidden = false; });
      rainField.getAnimations({ subtree: true }).forEach(animation => {
        animation.updatePlaybackRate(rates[stage]);
      });
      stage += 1;
      if (stage < batches.length) rampTimer = window.setTimeout(reveal, 250);
    };
    reveal();
  };
  document.addEventListener('weather-transition-start', suspendRain);
  document.addEventListener('weather-transition-end', resumeRain);
  const updateWeatherVisibility = () => {
    glass.classList.toggle('is-paused', document.hidden);
    lightning.style.animationPlayState = document.hidden ? 'paused' : 'running';
    if (document.hidden || document.documentElement.classList.contains('theme-is-transitioning')) suspendRain();
    else resumeRain();
  };
  document.addEventListener('visibilitychange', updateWeatherVisibility);
  // reducedMotionQuery.addEventListener('change', updateWeatherVisibility);
  updateWeatherVisibility();

};

const createSunlitField = () => {
  if (document.querySelector('.sunlit-field')) return;
  const field = document.createElement('div');
  field.className = 'sunlit-field';
  field.setAttribute('aria-hidden', 'true');
  field.innerHTML = `<div class="sunlit-glow"></div><div class="sunlit-bounce"></div><div class="sky-reflection"></div><div class="sunlit-shadows"><div class="sunlit-perspective"><div class="sunlit-blinds"><div class="sunlit-shutters">${'<span class="sunlit-shutter"></span>'.repeat(18)}</div><div class="sunlit-bars"><span class="sunlit-bar"></span><span class="sunlit-bar"></span></div></div></div></div>`;
  document.body.prepend(field);
};

// Original vector silhouette: each hanging part pivots at its own attachment.
const createWindchime = () => {
  if (document.querySelector('.windchime-field')) return;
  const field = document.createElement('div');
  field.className = 'windchime-field';
  field.setAttribute('aria-hidden', 'true');
  const tubes = [
    { x: 66, y: 180, length: 251, duration: 6.1, delay: -1.8 },
    { x: 90, y: 178, length: 282, duration: 7.3, delay: -4.2 },
    { x: 114, y: 181, length: 246, duration: 5.8, delay: -2.7 },
    { x: 138, y: 179, length: 284, duration: 6.7, delay: -.6 },
    { x: 162, y: 177, length: 251, duration: 7.7, delay: -3.5 },
  ];
  field.innerHTML = `<svg class="windchime" viewBox="0 0 240 680" fill="currentColor" xmlns="http://www.w3.org/2000/svg" focusable="false">
    <g class="windchime-body">
      <path d="M124 -18 C132 5 110 17 119 36" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <rect x="114" y="33" width="12" height="16" rx="3"/>
      <path d="M120 46 L57 129 M120 46 L79 128 M120 46 L120 137 M120 46 L161 128 M120 46 L183 129" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <ellipse cx="120" cy="132" rx="64" ry="8" fill="none" stroke="currentColor" stroke-width="3"/>
      <g class="windchime-sail">
        <path d="M120 137 V585" fill="none" stroke="currentColor" stroke-width="2.8"/>
        <ellipse cx="120" cy="310" rx="28" ry="7"/>
        <ellipse cx="120" cy="614" rx="36" ry="42"/>
      </g>
      ${tubes.map(({ x, y, length, duration, delay }) => `<g class="windchime-tube" style="transform-origin:${x + 9}px 134px;--chime-duration:${duration}s;--chime-delay:${delay}s">
        <path d="M${x + 9} 134 L${x + 1} ${y + 5} M${x + 9} 134 L${x + 17} ${y + 5}" fill="none" stroke="currentColor" stroke-width="1.7"/>
        <rect x="${x}" y="${y}" width="18" height="${length}" rx="7"/>
      </g>`).join('')}
    </g>
  </svg>`;
  document.querySelector('.sunlit-shadows').appendChild(field);
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
  // if (reducedMotionQuery.matches) return;
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

createSunlitField();
createWindchime();
createRainField();
createAnalogField();
createFilmGrain();
startAnalogParallax();


// Render standalone Obsidian image embeds from the site's assets directory.
// Jekyll leaves `![[photo.webp]]` as text, so this keeps post source
// compatible with Obsidian without requiring a custom GitHub Pages plugin.
function enhanceObsidianImageEmbeds() {
  const postContent = document.querySelector('.post-content');
  if (!postContent) return;

  const embedPattern = /^!\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]$/;
  [...postContent.querySelectorAll('p')].forEach((paragraph) => {
    if (paragraph.dataset.obsidianEmbed === 'true') return;

    const match = paragraph.textContent.trim().match(embedPattern);
    if (!match) return;

    const source = match[1].trim();
    // Attachments are intentionally scoped to /assets. Nested asset folders
    // are allowed, but paths cannot traverse outside that directory.
    if (!source || source.startsWith('/') || source.split('/').some((part) => part === '..')) return;

    let filename;
    try {
      filename = decodeURIComponent(source);
    } catch {
      return;
    }

    const image = document.createElement('img');
    image.className = 'obsidian-image-embed';
    image.src = `/assets/${filename.split('/').map((part) => encodeURIComponent(part)).join('/')}`;
    image.alt = filename.split('/').at(-1).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    image.loading = 'lazy';
    image.decoding = 'async';

    const option = match[2]?.trim();
    if (option && /^\d+$/.test(option)) {
      image.width = Number(option);
    } else if (option) {
      image.alt = option;
    }

    paragraph.textContent = '';
    paragraph.dataset.obsidianEmbed = 'true';
    paragraph.append(image);
  });
}

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
  let latestImageParagraph = null;

  // Walk the post in source order so a caption is always paired with the
  // image paragraph immediately before it. This also works after Obsidian
  // embeds have been converted into images.
  [...postContent.children].forEach((element) => {
    if (element.matches("p") && element.querySelector("img")) {
      latestImageParagraph = element;
      return;
    }

    if (!element.matches("p")) return;

    const paragraph = element;
    const match = paragraph.textContent.trim().match(captionPattern);
    if (!match) return;

    const imageParagraph = latestImageParagraph;
    if (!imageParagraph || imageParagraph.parentElement !== postContent) return;

    const image = imageParagraph.querySelector("img");
    if (!image) return;

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
    latestImageParagraph = null;
  });
}

enhanceObsidianImageEmbeds();
enhancePostFigureCaptions();

// Give blog-image captions the same cursor-following treatment as the about
// portrait on precise pointers. The figcaption remains in the document for
// semantics and as the readable fallback on touch devices.
let disposePostFigureCaptions = () => {};

function initialisePostFigureCaptions() {
  disposePostFigureCaptions();

  const figures = [...document.querySelectorAll(".post-figure")];
  if (!figures.length) return;

  const tooltips = [];
  figures.forEach((figure) => {
    const caption = figure.querySelector("figcaption");
    if (!caption) return;

    const tooltip = document.createElement("span");
    tooltip.className = "post-caption-tooltip";
    tooltip.textContent = caption.textContent;
    tooltip.setAttribute("aria-hidden", "true");
    (document.querySelector('.page-overlay') || document.body).append(tooltip);
    let pointerFrame = null;
    let pointerX = 0;
    let pointerY = 0;
    const positionTooltip = (event) => {
      if (!portraitPointerQuery.matches) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (pointerFrame !== null) return;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = null;
        const inset = 8;
        const x = Math.min(pointerX + 14, window.innerWidth - tooltip.offsetWidth - inset);
        const y = Math.min(pointerY + 18, window.innerHeight - tooltip.offsetHeight - inset);
        tooltip.style.translate = `${Math.max(inset, x)}px ${Math.max(inset, y)}px`;
      });
    };
    const cancelPosition = () => {
      if (pointerFrame !== null) window.cancelAnimationFrame(pointerFrame);
      pointerFrame = null;
    };

    const enter = (event) => {
      if (!portraitPointerQuery.matches) return;
      positionTooltip(event);
      tooltip.classList.remove("is-exiting");
      tooltip.classList.add("is-entering");
    };
    const leave = () => {
      cancelPosition();
      tooltip.classList.remove("is-entering");
      tooltip.classList.add("is-exiting");
    };
    const pointerModeChanged = () => {
      figure.classList.toggle("has-pointer-caption", portraitPointerQuery.matches);
      if (portraitPointerQuery.matches) return;
      cancelPosition();
      tooltip.classList.remove("is-entering", "is-exiting");
      tooltip.removeAttribute("style");
    };

    figure.addEventListener("pointerenter", enter, { passive: true });
    figure.addEventListener("pointermove", positionTooltip, { passive: true });
    figure.addEventListener("pointerleave", leave, { passive: true });
    figure.addEventListener("pointercancel", leave, { passive: true });
    portraitPointerQuery.addEventListener("change", pointerModeChanged);
    pointerModeChanged();
    tooltips.push({ figure, tooltip, enter, leave, positionTooltip, pointerModeChanged, cancelPosition });
  });

  disposePostFigureCaptions = () => {
    tooltips.forEach(({ figure, tooltip, enter, leave, positionTooltip, pointerModeChanged, cancelPosition }) => {
      cancelPosition();
      figure.classList.remove("has-pointer-caption");
      figure.removeEventListener("pointerenter", enter);
      figure.removeEventListener("pointermove", positionTooltip);
      figure.removeEventListener("pointerleave", leave);
      figure.removeEventListener("pointercancel", leave);
      portraitPointerQuery.removeEventListener("change", pointerModeChanged);
      tooltip.remove();
    });
    disposePostFigureCaptions = () => {};
  };
}

initialisePostFigureCaptions();



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
  (document.querySelector('.page-overlay') || document.body).append(portraitTooltip);

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

    if (previousPointerX !== null /* && !reducedMotionQuery.matches */) {
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
  if (document.documentElement.dataset.theme === 'dark') iframe.src += '&theme=0';
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
