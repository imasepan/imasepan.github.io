// Lazy-load the water only when this layout is selected; keep one canvas alive.
const root = document.documentElement;
let scene;
let pending;
async function syncWater() {
  const enabled = root.dataset.appearance === 'frutiger';
  if (!enabled && !scene) return;
  if (!scene) {
    if (!pending) {
      pending = import('/frutiger/water.js').then(async ({ createWater }) => {
        const canvas = document.createElement('canvas');
        canvas.className = 'frutiger-water';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.prepend(canvas);
        scene = await createWater(canvas);
      }).catch(error => {
        // The CSS water-blue background remains usable without WebGL.
        console.warn('Water background unavailable:', error);
      });
    }
    await pending;
  }
  scene?.setActive(root.dataset.appearance === 'frutiger');
}
document.addEventListener('appearance-change', syncWater);
syncWater();
