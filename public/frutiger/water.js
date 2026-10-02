export async function createWater(canvas) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) throw new Error('WebGL is unavailable.');
  const response = await fetch('/frutiger/water.frag');
  if (!response.ok) throw new Error('Unable to load the water shader.');
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program = gl.createProgram();
  const vertex = compile(gl.VERTEX_SHADER, 'attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}');
  const fragment = compile(gl.FRAGMENT_SHADER, await response.text());
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, 'iResolution');
  const time = gl.getUniformLocation(program, 'iTime');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  function draw(now) {
    frame = 0;
    if (!active || document.hidden) return;
    if (previous && !reduced.matches) elapsed += Math.min((now - previous) / 1000, 0.1);
    previous = now;
    // Limit the expensive water shader's pixel count on large or Retina displays.
    const ratio = Math.min(devicePixelRatio || 1, 1.5, 1600 / innerWidth, 1100 / innerHeight);
    const width = Math.max(1, Math.round(innerWidth * ratio));
    const height = Math.max(1, Math.round(innerHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    gl.uniform2f(resolution, width, height);
    gl.uniform1f(time, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    canvas.dataset.ready = 'true';
    canvas.dataset.time = String(elapsed);
    if (!reduced.matches) frame = requestAnimationFrame(draw);
  }
  function sync() {
    cancelAnimationFrame(frame);
    previous = 0;
    canvas.dataset.active = String(active && !document.hidden);
    if (active && !document.hidden) frame = requestAnimationFrame(draw);
  }
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', sync);
  reduced.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); });
  window.addEventListener('pageshow', sync);
  return { setActive(value) { active = value; sync(); } };
}
