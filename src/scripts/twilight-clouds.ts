/** Seeded, anisotropic fractal Brownian motion for thin sunset cloud sheets.
 * Generate once; SVG drifts the sheets and reuses them in the water reflection.
 */
const smooth = (a: number, b: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function hash(x: number, y: number) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
export function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(0, 1, x - ix), fy = smooth(0, 1, y - iy);
  const a = hash(ix, iy), b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
export function fbm(x: number, y: number) {
  let value = 0, amplitude = .5, total = 0;
  for (let octave = 0; octave < 6; octave++) {
    value += amplitude * noise(x, y);
    total += amplitude;
    x = x * 2.03 + 17.1;
    y = y * 2.01 + 9.2;
    amplitude *= .5;
  }
  return value / total;
}

export function createCloudTexture(layer: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const context = canvas.getContext('2d');
  if (!context) return '';
  const pixels = context.createImageData(canvas.width, canvas.height);
  // Each wisp has its own x/y center, horizontal radius, thickness and strength.
  // Keep the total coverage sparse while avoiding a shared horizontal baseline.
  const wisps = layer === 0
    ? [[.2, .36, .14, .012, .8], [.5, .445, .16, .014, .8], [.81, .53, .14, .011, .75]]
    : [[.3, .605, .18, .007, .48], [.72, .685, .17, .007, .48]];
  for (let y = 0; y < canvas.height; y++) {
    const v = y / canvas.height;
    // Clouds stop above the shore; the reflected copy is handled by the scene.
    if (v > .76) continue;
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width;
      const warp = noise(u * 3 + 43 + layer * 17, v * 8) - .5;
      const height = v + warp * .012;
      let envelope = 0;
      for (const [centerX, centerY, radius, spread, strength] of wisps) {
        const horizontal = 1 - smooth(.35, 1, Math.abs(u - centerX) / radius);
        envelope += Math.exp(-(((height - centerY) / spread) ** 2)) * horizontal * strength;
      }
      if (envelope < .003) continue;
      // Very different horizontal / vertical scales create long, broken strands.
      const field = fbm(u * 3.4 + layer * 31, v * 155 + warp * 1.2);
      const body = smooth(.29, .69, field);
      const breakup = smooth(.22, .7, noise(u * 4.5 + 7, v * 19 + layer * 23));
      // Transparent tile edges keep the continuously drifting copies seamless.
      const edgeFade = smooth(0, .12, u) * (1 - smooth(.88, 1, u));
      const opacity = Math.min(.7, envelope * body * breakup * edgeFade * .94);
      // Light grazing the lower edge produces peach filaments under mauve shade.
      const below = fbm(u * 3.4 + layer * 31, (v + .0025) * 155 + warp * 1.2);
      const rim = smooth(.01, .16, field - below);
      const warmth = smooth(.32, .73, v);
      const shadow = [62 + warmth * 24, 58 + warmth * 8, 91 + warmth * 7];
      const light = [139 + warmth * 36, 100 + warmth * 13, 133 + warmth * 4];
      const offset = (y * canvas.width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        pixels.data[offset + channel] = shadow[channel] + (light[channel] - shadow[channel]) * rim;
      }
      pixels.data[offset + 3] = Math.round(opacity * 255);
    }
  }
  context.putImageData(pixels, 0, 0);
  return canvas.toDataURL();
}
