/** Low-resolution, single-scattering atmosphere, rendered only on resize.
 * Rayleigh + Henyey–Greenstein Mie approximation with Beer–Lambert extinction.
 * Reference: https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering
 * Distances are in kilometres; exposure/night fill are art-directed for blue hour.
 */
export function mountAtmosphere(canvas: HTMLCanvasElement, onRender?: () => void) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;
  const earth = 6371;
  const atmosphere = earth + 100;
  const observer = earth + .05;
  const betaR = [.0058, .0135, .0331];
  const betaM = .004;
  const sunElevation = .018;
  const sunY = Math.sin(sunElevation);
  // Lighting comes from outside the frame; there is no visible solar disc.
  const sunX = -Math.sqrt(3) / 2 * Math.cos(sunElevation);
  const sunZ = .5 * Math.cos(sunElevation);
  const g = .55;
  // Colour grade drawn from the supplied blue-hour photographs, in sRGB.
  const palette = [
    [0, 14, 44, 104], [.25, 44, 91, 173], [.48, 100, 151, 200],
    [.60, 166, 169, 205], [.69, 213, 154, 186], [.76, 245, 174, 153],
    [.84, 131, 124, 175], [1, 42, 69, 126],
  ];
  const toLinear = (value: number) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;

  function render() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const aspect = bounds.width / bounds.height;
    canvas.width = Math.round(Math.min(420, 240 * aspect));
    canvas.height = Math.round(canvas.width / aspect);
    const pixels = context!.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
      const screenHeight = (y + .5) / canvas.height;
      // Overlapping colour fields avoid a flat stripe at every palette stop.
      // Blend in linear light across the whole palette, not separate eased segments.
      const weights = palette.map(stop => Math.exp(-.5 * ((screenHeight - stop[0]) / .115) ** 2));
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      const sky = [1, 2, 3].map(channel => palette.reduce((sum, stop, index) =>
        sum + toLinear(stop[channel] / 255) * weights[index], 0) / totalWeight);
      for (let x = 0; x < canvas.width; x++) {
        const dx = ((x + .5) / canvas.width - .5) * aspect * 1.25;
        // Mirror the lower atmosphere as soft ground haze behind the terrain.
        const dy = Math.abs(.76 - screenHeight) * 1.25 + sunElevation;
        const length = Math.hypot(dx, dy, 1);
        const vx = dx / length, vy = dy / length, vz = 1 / length;
        const b = observer * vy;
        let distance = -b + Math.sqrt(b * b + atmosphere * atmosphere - observer * observer);
        const ground = b * b + earth * earth - observer * observer;
        if (vy < 0 && ground > 0) distance = Math.min(distance, -b - Math.sqrt(ground));
        const step = distance / 20;
        const mu = vx * sunX + vy * sunY + vz * sunZ;
        const rayleighPhase = 3 * (1 + mu * mu) / (16 * Math.PI);
        const miePhase = (1 - g * g) / (4 * Math.PI * (1 + g * g - 2 * g * mu) ** 1.5);
        let depthR = 0, depthM = 0;
        const radiance = [0, 0, 0];
        for (let sample = 0; sample < 20; sample++) {
          const t = (sample + .5) * step;
          const px = vx * t, py = observer + vy * t, pz = vz * t;
          const height = Math.max(0, Math.hypot(px, py, pz) - earth);
          const densityR = Math.exp(-height / 8) * step;
          const densityM = Math.exp(-height / 1.2) * step;
          depthR += densityR / 2;
          depthM += densityM / 2;
          const lightB = px * sunX + py * sunY + pz * sunZ;
          const lightDistance = -lightB + Math.sqrt(lightB * lightB + atmosphere * atmosphere - (px * px + py * py + pz * pz));
          const lightStep = lightDistance / 8;
          let lightR = 0, lightM = 0;
          for (let light = 0; light < 8; light++) {
            const lt = (light + .5) * lightStep;
            const altitude = Math.max(0, Math.hypot(px + sunX * lt, py + sunY * lt, pz + sunZ * lt) - earth);
            lightR += Math.exp(-altitude / 8) * lightStep;
            lightM += Math.exp(-altitude / 1.2) * lightStep;
          }
          for (let channel = 0; channel < 3; channel++) {
            const transmittance = Math.exp(-betaR[channel] * (depthR + lightR) - betaM * (depthM + lightM));
            radiance[channel] += transmittance * (densityR * betaR[channel] * rayleighPhase + densityM * betaM * miePhase);
          }
          depthR += densityR / 2;
          depthM += densityM / 2;
        }
        const offset = (y * canvas.width + x) * 4;
        const night = [.0018, .005, .023];
        const duskExposure = .18 + .82 * Math.exp(-(((screenHeight - .76) / .28) ** 2));
        const grade = [1.1, .72, 1.05];
        for (let channel = 0; channel < 3; channel++) {
          const scattered = 1 - Math.exp(-(radiance[channel] * 2.3 * duskExposure * grade[channel] + night[channel]));
          const linear = (sky[channel] * .88 + scattered * .12) * .28;
          pixels.data[offset + channel] = Math.round(255 * (linear <= .0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - .055));
        }
        pixels.data[offset + 3] = 255;
      }
    }
    context!.putImageData(pixels, 0, 0);
    onRender?.();
  }
  let resizeTimer: ReturnType<typeof setTimeout>;
  const observerResize = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 120);
  });
  observerResize.observe(canvas);
  render();
  window.addEventListener('pagehide', () => {
    observerResize.disconnect();
    clearTimeout(resizeTimer);
  }, { once: true });
}
