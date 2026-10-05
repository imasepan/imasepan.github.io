import { fbm, noise } from './twilight-clouds';

/** Anisotropic six-octave fBm, lit with a single-scattering approximation.
 * Rayleigh phase: 3(1 + cos²θ)/(16π), wavelength-dependent betaR (km⁻¹).
 * Mie uses the Henyey–Greenstein phase, g=.65, with positive forward cosine.
 * Beer–Lambert attenuation models the long sunset light path and cloud depth.
 * This is an art-directed thin cloud sheet, not a full volumetric Mie solver.
 * https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering
 */
export function createTwilight2Clouds() {
  const canvas = document.createElement('canvas');
  canvas.width = 1440;
  canvas.height = 780;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const pixels = ctx.createImageData(canvas.width, canvas.height);
  const smooth = (a: number, b: number, x: number) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  // Broad, staggered banks with smaller, flatter strands near the horizon.
  const banks = [
    [.08, .19, .42, .038, 1], [.78, .12, .49, .03, .9],
    [.22, .38, .43, .045, 1.1], [.8, .34, .4, .042, 1],
    [.1, .64, .36, .024, .95], [.62, .60, .42, .028, 1.1],
    [.9, .73, .27, .022, .9], [.37, .83, .35, .014, .8],
  ];
  const betaR = [.0058, .0135, .0331];
  const betaM = .004;
  const g = .65;
  for (let y = 0; y < canvas.height; y++) {
    const v = y / canvas.height;
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width;
      const warp = fbm(u * 18 + 12, v * 15 + 3) - .5;
      const cloudY = v + warp * .09;
      let envelope = 0;
      for (const [cx, cy, radius, thickness, strength] of banks) {
        const taper = 1 - smooth(.25, 1, Math.abs(u - cx) / radius);
        envelope += Math.exp(-(((cloudY - cy) / thickness) ** 2)) * taper * strength;
      }
      if (envelope < .015) continue;
      const field = fbm(u * 18 + 21 + warp, v * 65);
      const detail = noise(u * 50, v * 220);
      const density = smooth(.12, .62, envelope * (.12 + field * 1.15) - (1 - field) * .3);
      if (density < .002) continue;
      const opticalDepth = density * 2.7;
      const transmission = Math.exp(-opticalDepth);
      const alpha = (1 - transmission) * (1 - smooth(.91, .98, v));

      // View and sun directions: sunlight grazes the sheet from the low right.
      const dx = (u - .5) * 1.6, dy = (1 - v) * .95;
      const norm = Math.hypot(dx, dy, 1);
      const mu = (dx * .35 + dy * .025 + .9364) / norm;
      const phaseR = 3 * (1 + mu * mu) / (16 * Math.PI);
      const phaseM = (1 - g * g) / (4 * Math.PI * (1 + g * g - 2 * g * mu) ** 1.5);
      const solarDepth = 75 + v * 65;
      const viewDepth = 5 + v * 18;
      const lowerField = fbm(u * 18 + 21 + warp, (v + .004) * 65);
      const rim = smooth(.015, .15, field - lowerField) * (1 - density * .6);
      for (let c = 0; c < 3; c++) {
        const sunlight = Math.exp(-(betaR[c] + betaM) * solarDepth);
        const viewTransmission = Math.exp(-(betaR[c] + betaM) * viewDepth);
        const rayleigh = betaR[c] * phaseR * 22;
        const mie = sunlight * phaseM * (1 - transmission) * (.08 + rim * .7);
        const ambient = [.027, .035, .075][c] + rayleigh * .65;
        const linear = (ambient * (.75 + detail * .15) + mie) * viewTransmission;
        const mapped = 1 - Math.exp(-linear * 1.65);
        pixels.data[(y * canvas.width + x) * 4 + c] = 255 * (mapped <= .0031308 ? mapped * 12.92 : 1.055 * mapped ** (1 / 2.4) - .055);
      }
      pixels.data[(y * canvas.width + x) * 4 + 3] = alpha * 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas.toDataURL();
}
