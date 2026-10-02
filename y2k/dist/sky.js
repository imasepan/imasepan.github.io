(async () => {
 const canvas=document.querySelector('canvas');
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false});
 if(!gl) throw new Error('WebGL is required for the sky shader.');
 const response=await fetch('./sky.frag');
 if(!response.ok) throw new Error('Unable to load sky shader.');
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,await response.text()));
 gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);
 gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'position');
 gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const resolution=gl.getUniformLocation(program,'iResolution');
 const time=gl.getUniformLocation(program,'iTime');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const start=performance.now();
 function draw(now){
  const ratio=Math.min(devicePixelRatio||1,1.5);
  const width=Math.round(innerWidth*ratio),height=Math.round(innerHeight*ratio);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
  gl.uniform2f(resolution,width,height);gl.uniform1f(time,reduced.matches?0:(now-start)/1000);
  gl.drawArrays(gl.TRIANGLES,0,6);
  canvas.dataset.ready='true';
  requestAnimationFrame(draw);
 }
 requestAnimationFrame(draw);
})().catch(error=>{document.querySelector('canvas').dataset.error=error.message;console.error(error);});
