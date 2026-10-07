import { sampleTwilightWater } from './twilight-water';
// One shared clock keeps the light and lanterns still when paused or hidden.
// Every layer loses luminance through the same dusk: peach, dusty rose, cobalt, navy.
// Monotone cubic interpolation avoids both mid-cycle brightening and pauses at each stop.
const palettes = [
  ['#416482', '#778b9d', '#bbaeb0', '#edb397', '#3d586e', '#35516b', '#273d56', '#3b5067'],
  ['#2d5578', '#626f89', '#a58b9e', '#d99589', '#31485f', '#2b425a', '#20334b', '#30435b'],
  ['#1b4268', '#4b5777', '#796b88', '#b87981', '#243850', '#22344a', '#19293e', '#25364d'],
  ['#112c4c', '#303e60', '#4d5173', '#755e7b', '#16263e', '#192a40', '#111f31', '#1b2940'],
  ['#080f22', '#142540', '#2b3e5b', '#46516a', '#0b162c', '#132239', '#080f1f', '#121e32'],
].map(palette => palette.map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))));
const properties = ['sky-top', 'sky-mid', 'sky-low', 'horizon', 'sea-top', 'sea-mid', 'sea-bottom', 'mountain'];
const smooth = (t: number) => t * t * (3 - 2 * t);
function duskChannel(layer: number, channel: number, position: number) {
  const index = Math.min(palettes.length - 2, Math.floor(position));
  const t = position - index;
  const value = (i: number) => palettes[i][layer][channel];
  const slope = (i: number) => {
    if (i === 0 || i === palettes.length - 1) return 0;
    const before = value(i) - value(i - 1), after = value(i + 1) - value(i);
    return before * after <= 0 ? 0 : 2 * before * after / (before + after);
  };
  return (2 * t ** 3 - 3 * t ** 2 + 1) * value(index)
    + (t ** 3 - 2 * t ** 2 + t) * slope(index)
    + (-2 * t ** 3 + 3 * t ** 2) * value(index + 1)
    + (t ** 3 - t ** 2) * slope(index + 1);
}
const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
type Lantern = { age: number; x: number; y: number; drift: number; phase: number; size: number };

export function mountTwilight4() {
  const main = document.querySelector<HTMLElement>('main')!;
  const lanternCanvas = document.querySelector<HTMLCanvasElement>('#lanterns')!;
  const light = lanternCanvas.getContext('2d')!;
  const shoreCanvas = document.querySelector<HTMLCanvasElement>('#shore-lights')!;
  const shore = shoreCanvas.getContext('2d')!;
  const mountain = document.querySelector<SVGSVGElement>('.mountains')!;
  let mountainBounds = mountain.getBoundingClientRect();
  const release = document.querySelector<HTMLButtonElement>('.release-area')!;
  const announcement = document.querySelector<HTMLElement>('#announcement')!;
  const hourSlider = document.querySelector<HTMLInputElement>('#blue-hour')!;
  const autoCycle = document.querySelector<HTMLButtonElement>('#auto-cycle')!;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let width = innerWidth, height = innerHeight, time = 0, last = 0, frame = 0;
  let paused = preference.matches, hidden = document.hidden, disposed = false, dirty = true;
  let lanterns: Lantern[] = [];
  let count = 0;
  let lightTime = 0, manualHour: number | null = null;
  const shoreline = Array.from({ length: 44 }, (_, i) => ({
    x: [780, 865, 998, 1135, 1245, 1340][i % 6] + (seeded(i * 9 + 3) - .5) * 64,
    y: 525 + seeded(i * 9 + 4) * 9,
    size: .65 + seeded(i * 9 + 5) * .8,
    strength: .4 + seeded(i * 9 + 6) * .6,
    length: .10 + seeded(i * 9 + 7) * .21,
  }));
  function resize() {
    width = innerWidth; height = innerHeight;
    mountainBounds = mountain.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    for (const canvas of [lanternCanvas, shoreCanvas]) {
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      canvas.getContext('2d')!.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    dirty = true;
  }
  function atmosphere() {
    // Three minutes outward, three minutes back; easing rests at both ends.
    const phase = (lightTime % 360) / 180;
    const hour = manualHour ?? (phase <= 1 ? phase : 2 - phase);
    const position = hour * (palettes.length - 1);
    properties.forEach((name, i) => {
      const color = [0, 1, 2].map(c => Number(duskChannel(i, c, position).toFixed(3)));
      main.style.setProperty(`--${name}`, `rgb(${color.join(',')})`);
    });
    const night = smooth(hour);
    // The remaining warm band retreats toward the horizon as the sun sinks.
    main.style.setProperty('--afterglow', String(.7 * (1 - night) + .06 * night));
    main.style.setProperty('--glow-peak', `${84 + night * 12}%`);
    if (manualHour === null) hourSlider.value = (hour * 100).toFixed(1);
    const description = hour <= .01 ? 'Start of blue hour' : hour >= .99 ? 'End of blue hour' : hour < .4 ? 'Early blue hour' : hour <= .6 ? 'Blue hour with a fading rose horizon' : 'Late blue hour';
    hourSlider.setAttribute('aria-valuetext', `${description}, ${Math.round(hour * 100)} percent`);
    main.style.setProperty('--blue-hour', String(hour));
    main.style.setProperty('--night', String(night));
    return night;
  }
  function drawShoreLights(night: number) {
    shore.clearRect(0, 0, width, height);
    const horizon = height * .537;
    for (let i = 0; i < shoreline.length; i++) {
      const lamp = shoreline[i];
      const x = mountainBounds.left + lamp.x / 1600 * mountainBounds.width;
      const y = lamp.y / 1000 * height;
      if (x < -30 || x > width + 30) continue;
      const strength = lamp.strength * (.76 + night * .24);
      const radius = Math.max(.6, lamp.size * Math.min(width / 1440, 1.2));
      const halo = shore.createRadialGradient(x, y, 0, x, y, radius * 8);
      halo.addColorStop(0, `rgba(255,189,92,${strength * .45})`);
      halo.addColorStop(.28, `rgba(255,145,42,${strength * .13})`);
      halo.addColorStop(1, 'rgba(255,126,28,0)');
      shore.fillStyle = halo; shore.fillRect(x - radius * 8, y - radius * 8, radius * 16, radius * 16);
      shore.fillStyle = `rgba(255,221,156,${strength})`;
      shore.beginPath(); shore.ellipse(x, y, radius, radius * .62, 0, 0, Math.PI * 2); shore.fill();
      for (let row = 0; row < 42; row++) {
        const depth = row / 41;
        const noise = sampleTwilightWater(lamp.x / 1600, depth, time + 12);
        const seed = seeded(i * 43 + row);
        const falloff = (1 - depth) ** 1.65;
        const flicker = .6 + .4 * Math.sin(row * 2.1 + noise * 5) ** 2;
        const glintWidth = (.55 + seed * 2 + depth * (3 + seed * 8)) * Math.max(.55, width / 1440);
        const glintX = x + noise * (2 + depth * 20) + (seed - .5) * depth * 5;
        const glintY = horizon + depth ** 1.25 * lamp.length * height;
        shore.fillStyle = `rgba(242,161,73,${strength * falloff * flicker * .38})`;
        shore.fillRect(glintX - glintWidth / 2, glintY, glintWidth, .65 + depth * .85);
        if (seed > .62) {
          shore.fillStyle = `rgba(255,216,140,${strength * falloff * flicker * .42})`;
          shore.fillRect(glintX - glintWidth * .22, glintY, glintWidth * .44, .55);
        }
      }
    }
  }
  function drawLanterns() {
    light.clearRect(0, 0, width, height);
    for (const lantern of lanterns) {
      const progress = lantern.age / 72;
      const x = width * (lantern.x + lantern.drift * progress) + (Math.sin(lantern.age * .23 + lantern.phase) - Math.sin(lantern.phase)) * (4 + progress * 11);
      const y = height * (lantern.y - progress * (lantern.y + .12));
      const size = lantern.size * (1 - progress * .76);
      const alpha = Math.min(1, (1 - progress) * 7);
      light.save(); light.translate(x, y); light.rotate(Math.sin(lantern.age * .4 + lantern.phase) * .065); light.globalAlpha = alpha;
      const halo = light.createRadialGradient(0, 0, 0, 0, 0, size * 3.2);
      halo.addColorStop(0, '#ffb45455'); halo.addColorStop(.3, '#ff9d2820'); halo.addColorStop(1, '#f99b2800');
      light.fillStyle = halo; light.fillRect(-size * 3.2, -size * 3.2, size * 6.4, size * 6.4);
      light.fillStyle = '#ffc16c';
      light.beginPath(); light.moveTo(-size * .39, size * .47);
      light.bezierCurveTo(-size * .56, size * .06, -size * .57, -size * .48, -size * .4, -size * .61);
      light.quadraticCurveTo(0, -size * .76, size * .4, -size * .61);
      light.bezierCurveTo(size * .57, -size * .48, size * .56, size * .06, size * .39, size * .47);
      light.quadraticCurveTo(0, size * .62, -size * .39, size * .47); light.fill();
      light.restore();
    }
  }
  function setPaused(value: boolean) {
    paused = value; main.dataset.paused = String(paused); last = 0;
  }
  function emit(event: MouseEvent) {
    // Pointer clicks (including taps) use their exact position. Keyboard activation
    // has no pointer coordinates, so it releases from the open center of the view.
    const bounds = release.getBoundingClientRect();
    const x = event.detail > 0 ? (event.clientX - bounds.left) / bounds.width : .58;
    const y = event.detail > 0 ? (event.clientY - bounds.top) / bounds.height : .65;
    count++;
    // Keep memory and rendering bounded even during rapid repeated clicks.
    if (lanterns.length >= 60) lanterns.shift();
    lanterns.push({ age: 0, x, y, drift: .06 + Math.random() * .13, phase: Math.random() * Math.PI * 2, size: Math.min(24, Math.max(16, width * .018)) });
    main.dataset.lanternCount = String(count);
    announcement.textContent = `Lantern ${count} released${paused ? '. Motion is paused.' : '.'}`;
    dirty = true;
  }
  function tick(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    if (hidden) { last = 0; return; }
    if (last && now - last < 1000 / 30) return;
    const delta = last ? Math.min((now - last) / 1000, .1) : 0; last = now;
    if (!paused) { time += delta; if (manualHour === null) lightTime += delta; for (const lantern of lanterns) lantern.age += delta; lanterns = lanterns.filter(lantern => lantern.age < 72); }
    if (paused && !dirty) return;
    const night = atmosphere(); drawShoreLights(night); drawLanterns(); dirty = false;
  }
  const selectHour = () => {
    manualHour = Math.max(0, Math.min(1, Number(hourSlider.value) / 100));
    autoCycle.setAttribute('aria-pressed', 'false');
    dirty = true;
  };
  const toggleCycle = () => {
    if (manualHour === null) {
      selectHour();
    } else {
      // Resume the original slow loop from this exact light, without a jump.
      lightTime = manualHour * 180;
      manualHour = null;
      autoCycle.setAttribute('aria-pressed', 'true');
      dirty = true;
    }
  };
  const togglePause = (event: KeyboardEvent) => {
    if (event.code !== 'KeyP' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    setPaused(!paused);
    announcement.textContent = paused ? 'Motion paused.' : 'Motion resumed.';
  };
  const visibility = () => { hidden = document.hidden; last = 0; };
  const preferenceChange = () => setPaused(preference.matches);
  const pageHide = () => { hidden = true; last = 0; };
  const pageShow = () => { hidden = document.hidden; last = 0; };
  function dispose() {
    disposed = true; cancelAnimationFrame(frame);
    hourSlider.removeEventListener('input', selectHour); autoCycle.removeEventListener('click', toggleCycle);
    window.removeEventListener('resize', resize); window.removeEventListener('pagehide', pageHide); window.removeEventListener('pageshow', pageShow);
    document.removeEventListener('visibilitychange', visibility); document.removeEventListener('astro:before-swap', dispose);
    preference.removeEventListener('change', preferenceChange); window.removeEventListener('keydown', togglePause); release.removeEventListener('click', emit);
  }
  resize(); setPaused(paused);
  hourSlider.addEventListener('input', selectHour); autoCycle.addEventListener('click', toggleCycle);
  release.addEventListener('click', emit); window.addEventListener('keydown', togglePause);
  window.addEventListener('resize', resize); window.addEventListener('pagehide', pageHide); window.addEventListener('pageshow', pageShow);
  document.addEventListener('visibilitychange', visibility); preference.addEventListener('change', preferenceChange);
  document.addEventListener('astro:before-swap', dispose);
  frame = requestAnimationFrame(tick);
}
