// Gradient Perlin noise with quintic interpolation. Summed octaves follow the
// fBm approach described at https://thebookofshaders.com/13/.
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const gradients = [[1, 0], [-1, 0], [0, 1], [0, -1], [.707, .707], [-.707, .707], [.707, -.707], [-.707, -.707]];
function gradient(x: number, y: number, dx: number, dy: number) {
  let hash = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  const g = gradients[(hash ^ (hash >>> 16)) & 7];
  return g[0] * dx + g[1] * dy;
}
function perlin(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const dx = x - ix, dy = y - iy;
  return mix(
    mix(gradient(ix, iy, dx, dy), gradient(ix + 1, iy, dx - 1, dy), fade(dx)),
    mix(gradient(ix, iy + 1, dx, dy - 1), gradient(ix + 1, iy + 1, dx - 1, dy - 1), fade(dx)),
    fade(dy),
  );
}
function fbm(x: number, y: number) {
  let sum = 0, amplitude = .57;
  for (let octave = 0; octave < 4; octave++) {
    sum += perlin(x, y) * amplitude;
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 9.2;
    amplitude *= .5;
  }
  return sum;
}

// Shared by twilight3's surf and twilight4's open-ocean ripples.
export const sampleTwilightWater = (x: number, y: number, time: number) => fbm(x * 7 + time * .055, y * 14 - time * .16);

export function mountTwilightWater(root: HTMLElement) {
  const waves = Array.from(root.querySelectorAll<SVGGElement>('.breaker'));
  const fronts = Array.from(root.querySelectorAll<SVGPathElement>('.wave-front'));
  const wash = root.querySelector<SVGPathElement>('.wash-edge');
  const ripples = Array.from(root.querySelectorAll<HTMLElement>('.ripples i'));
  const reflections = Array.from(root.querySelectorAll<HTMLElement>('.reflection')).map(node => ({
    node,
    x: parseFloat(node.style.getPropertyValue('--x')) / 100,
    length: parseFloat(node.style.getPropertyValue('--length')) / 100,
    strength: parseFloat(node.style.getPropertyValue('--strength')),
  }));
  let paused = true, frame = 0, last = 0, time = 12;
  // All surfaces sample one smoothly advecting field. High-frequency detail
  // travels with the broad swell instead of being randomized every frame.
  const field = (x: number, y: number) => sampleTwilightWater(x, y, time);
  function front(progress: number, washLine = false) {
    const depth = progress ** 1.65;
    let d = '';
    for (let i = 0; i <= 168; i++) {
      const x = -64 + i * 10.3, u = x / 1600;
      const shore = 958 - 245 * u - 85 * u * u;
      const broad = field(u, progress);
      const detail = perlin(u * 67 + time * .09, progress * 9 - time * .22);
      const y = 559 + (shore - 559) * depth + broad * (3 + depth * 24) + detail * depth * 4;
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(y + (washLine ? 9 : 0)).toFixed(2)} `;
    }
    return d;
  }
  function draw() {
    waves.forEach((wave, i) => {
      // Reset only beyond the fully faded edge; no visible loop discontinuity.
      const progress = ((time / 22 + i / waves.length) % 1);
      fronts[i]?.setAttribute('d', front(progress));
      wave.style.opacity = String(Math.sin(progress * Math.PI) ** 1.3 * .85);
      wave.style.setProperty('--depth', String(progress));
    });
    wash?.setAttribute('d', front(.98 + fbm(time * .045, 31) * .018, true));
    reflections.forEach(({ node, x, length, strength }) => {
      const sway = field(x, .7);
      const left: string[] = [], right: string[] = [];
      for (let j = 0; j < 32; j++) {
        const depth = j / 31;
        const noise = field(x, .521 + depth * length);
        const fine = perlin(x * 31 + depth * 21, time * .24) * 8;
        const center = 50 + noise * 45;
        const halfWidth = 19 + Math.abs(noise) * 43 + fine;
        left.push(`${(center - halfWidth).toFixed(1)}% ${(depth * 100).toFixed(2)}%`);
        right.unshift(`${(center + halfWidth).toFixed(1)}% ${(depth * 100).toFixed(2)}%`);
      }
      node.style.clipPath = `polygon(${left.concat(right).join(',')})`;
      node.style.transform = `translateX(${(sway * 8).toFixed(2)}px) skewX(${(sway * 2).toFixed(2)}deg)`;
      node.style.opacity = String(strength * (.83 + sway * .3));
      node.style.maskPosition = `0 ${(time * 1.8 + sway * 4).toFixed(2)}px, 0 0`;
    });
    ripples.forEach((node, i) => {
      const noise = field(i * .037, i * .071);
      node.style.transform = `translate(${(noise * 10).toFixed(2)}px, ${(noise * 4).toFixed(2)}px) scaleX(${(1 + noise * .5).toFixed(3)})`;
    });
  }
  function tick(now: number) {
    if (paused) return;
    if (!last) last = now;
    if (now - last >= 1000 / 30) {
      time += Math.min((now - last) / 1000, .1);
      last = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  root.classList.add('noise-ready');
  draw();
  return {
    setPaused(value: boolean) {
      if (paused === value) return;
      paused = value;
      cancelAnimationFrame(frame);
      last = 0;
      if (!paused) frame = requestAnimationFrame(tick);
    },
    destroy() { paused = true; cancelAnimationFrame(frame); },
  };
}
