import * as THREE from 'three';

export function mountWireframe(canvas: HTMLCanvasElement) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  } catch {
    return;
  }
  // Keep the entire render, including the CRT pass, within a 720p frame.
  renderer.setPixelRatio(1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x09090d);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  const box = new THREE.Group();
  scene.add(box);

  // Build the twelve straight edges of the cube.
  const source = new THREE.BoxGeometry(2, 2, 2);
  const edges = new THREE.EdgesGeometry(source);
  const positions = edges.getAttribute('position');
  const ink = new THREE.MeshBasicMaterial({ color: 0xe8e5f2 });
  const rodGeometry = new THREE.CylinderGeometry(0.009, 0.009, 1, 6);
  const up = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3();
  for (let i = 0; i < positions.count; i += 2) {
    const start = new THREE.Vector3().fromBufferAttribute(positions, i);
    const end = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
    const mesh = new THREE.Mesh(rodGeometry, ink);
    direction.subVectors(end, start);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.scale.y = direction.length();
    mesh.quaternion.setFromUnitVectors(up, direction.normalize());
    box.add(mesh);
  }
  source.dispose();
  edges.dispose();

  const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
  const postScene = new THREE.Scene();
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      image: { value: target.texture },
      resolution: { value: new THREE.Vector2(1, 1) },
      time: { value: 0 },
      darkMode: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D image;
      uniform vec2 resolution;
      uniform float time;
      uniform float darkMode;
      varying vec2 vUv;
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      void main() {
        vec2 pixel = 1.0 / resolution;
        vec2 uv = vUv;
        // Restrained horizontal timebase wobble, without flashing or hard cuts.
        uv.x += (sin(uv.y * 71.0 + time * 1.3) * 0.45
          + sin(uv.y * 229.0 - time * 0.7) * 0.18) * pixel.x;
        float split = 0.85 + 0.25 * sin(time * 0.6);
        vec2 shift = vec2(split, 0.55) * pixel;
        vec3 color = vec3(
          texture2D(image, uv + shift).r,
          texture2D(image, uv - shift * 0.8).g,
          texture2D(image, uv + shift * 0.32).b
        );
        float ghost = texture2D(image, uv + vec2(1.8, 0.0) * pixel).r;
        float scanline = 0.5 + 0.5 * sin(vUv.y * resolution.y * 3.14159265);
        float grain = noise(floor(vUv * resolution) + floor(time * 18.0));
        if (darkMode > 0.5) {
          color += ghost * vec3(0.045, 0.15, 0.09);
          color *= 1.0 - scanline * 0.07;
          color += (grain - 0.5) * 0.012;
        } else {
          color -= (1.0 - ghost) * vec3(0.045, 0.15, 0.025);
          color -= scanline * 0.018 + grain * 0.022;
        }
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `,
  });
  const plane = new THREE.PlaneGeometry(2, 2);
  postScene.add(new THREE.Mesh(plane, material));
  // Reduced-motion handling is temporarily disabled to keep the cube animated.
  // const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let elapsed = 0;
  let previous = 0;
  let disposed = false;

  const themeToggle = document.querySelector<HTMLButtonElement>('#theme-toggle');
  function applyTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    (scene.background as THREE.Color).set(dark ? 0x09090d : 0xffffff);
    ink.color.set(dark ? 0xe8e5f2 : 0x16151d);
    material.uniforms.darkMode.value = dark ? 1 : 0;
    themeToggle?.setAttribute('aria-pressed', String(dark));
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = dark ? '#09090d' : '#ffffff';
    render();
  }

  function toggleTheme() {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('de-real-theme', theme); } catch {}
    applyTheme();
  }

  function render() {
    box.rotation.set(0.32 + elapsed * 0.105, 0.55 + elapsed * 0.18, -0.12 + Math.sin(elapsed * 0.12) * 0.1);
    material.uniforms.time.value = elapsed;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(1, 720 / Math.min(width, height), 1280 / Math.max(width, height));
    renderer.setSize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)), false);
    camera.aspect = width / height;
    // Fit the entire rotating cube, including its diagonal, on narrow screens.
    camera.position.z = 1.8 / (Math.tan(THREE.MathUtils.degToRad(19)) * Math.min(camera.aspect, 1)) + 1.1;
    camera.updateProjectionMatrix();
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    target.setSize(size.x, size.y);
    material.uniforms.resolution.value.copy(size);
    render();
  }

  function tick(now: number) {
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    elapsed += delta;
    previous = now;
    render();
  }

  function syncPlayback() {
    previous = 0;
    // renderer.setAnimationLoop(!document.hidden && !reducedMotion.matches ? tick : null);
    renderer.setAnimationLoop(!document.hidden ? tick : null);
    render();
  }

  function dispose(event?: PageTransitionEvent) {
    if (event?.persisted || disposed) return;
    disposed = true;
    renderer.setAnimationLoop(null);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pagehide', dispose);
    document.removeEventListener('visibilitychange', syncPlayback);
    // reducedMotion.removeEventListener('change', syncPlayback);
    themeToggle?.removeEventListener('click', toggleTheme);
    rodGeometry.dispose();
    ink.dispose();
    target.dispose();
    material.dispose();
    plane.dispose();
    renderer.dispose();
  }

  applyTheme();
  themeToggle?.addEventListener('click', toggleTheme);
  resize();
  syncPlayback();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', syncPlayback);
  // reducedMotion.addEventListener('change', syncPlayback);
  window.addEventListener('pagehide', dispose);
  if (import.meta.hot) import.meta.hot.dispose(() => dispose());
}
