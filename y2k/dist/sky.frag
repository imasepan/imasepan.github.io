precision highp float;
uniform vec2 iResolution;
uniform float iTime;
const float cloudscale = 1.1;
const vec2 flowDirection = vec2(-0.8, 0.6);
const float clouddark = 0.5;
const float cloudlight = 0.3;
const float cloudcover = 0.2;
const float cloudalpha = 8.0;
const float skytint = 0.5;
const vec3 skycolour1 = vec3(0.2, 0.4, 0.6);
const vec3 skycolour2 = vec3(0.4, 0.7, 1.0);
const mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
vec2 hash(vec2 p) {
 p = vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
 return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}
float noise(in vec2 p) {
 const float K1 = 0.366025404;
 const float K2 = 0.211324865;
 vec2 i = floor(p + (p.x+p.y)*K1);
 vec2 a = p - i + (i.x+i.y)*K2;
 vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
 vec2 b = a - o + K2;
 vec2 c = a - 1.0 + 2.0*K2;
 vec3 h = max(0.5-vec3(dot(a,a),dot(b,b),dot(c,c)),0.0);
 vec3 n = h*h*h*h*vec3(dot(a,hash(i+0.0)),dot(b,hash(i+o)),dot(c,hash(i+1.0)));
 return dot(n,vec3(70.0));
}
float fbm(vec2 n) {
 float total=0.0, amplitude=0.1;
 for(int i=0;i<7;i++) { total+=noise(n)*amplitude; n=m*n; amplitude*=0.4; }
 return total;
}
vec3 sky(vec2 p) {
 // Reflect the same world-space breeze used by the water.
 p-=vec2(flowDirection.x/(iResolution.x/iResolution.y),-flowDirection.y)*iTime*0.008;
 vec2 uv=p*vec2(iResolution.x/iResolution.y,1.0);
 float time=0.0;
 float q=fbm(uv*cloudscale*0.5);
 float r=0.0;
 uv*=cloudscale;
 uv-=q-time;
 float weight=0.8;
 for(int i=0;i<8;i++){ r+=abs(weight*noise(uv)); uv=m*uv+time; weight*=0.7; }
 float f=0.0;
 uv=p*vec2(iResolution.x/iResolution.y,1.0);
 uv*=cloudscale;
 uv-=q-time;
 weight=0.7;
 for(int i=0;i<8;i++){ f+=weight*noise(uv); uv=m*uv+time; weight*=0.6; }
 f*=r+f;
 float c=0.0;
 time=0.0;
 uv=p*vec2(iResolution.x/iResolution.y,1.0);
 uv*=cloudscale*2.0;
 uv-=q-time;
 weight=0.4;
 for(int i=0;i<7;i++){ c+=weight*noise(uv); uv=m*uv+time; weight*=0.6; }
 float c1=0.0;
 time=0.0;
 uv=p*vec2(iResolution.x/iResolution.y,1.0);
 uv*=cloudscale*3.0;
 uv-=q-time;
 weight=0.4;
 for(int i=0;i<7;i++){ c1+=abs(weight*noise(uv)); uv=m*uv+time; weight*=0.6; }
 c+=c1;
 vec3 skycolour=mix(skycolour2,skycolour1,p.y);
 vec3 cloudcolour=vec3(1.1,1.1,0.9)*clamp((clouddark+cloudlight*c),0.0,1.0);
 f=cloudcover+cloudalpha*f*r;
 vec3 result=mix(skycolour,clamp(skytint*skycolour+cloudcolour,0.0,1.0),clamp(f+c,0.0,1.0));
 return result;
}
// Analytic slopes of several crossing waves form the water surface normal.
vec2 waveSlope(vec2 p, float t) {
 p-=flowDirection*t*0.55;
 vec2 slope=vec2(0.0);
 float amplitude=0.48;
 float frequency=1.8;
 for(int i=0;i<7;i++) {
  float angle=float(i)*2.39996;
  vec2 direction=vec2(cos(angle),sin(angle));
  float phase=dot(p,direction)*frequency+float(i)*4.17;
  slope+=direction*cos(phase)*amplitude;
  amplitude*=0.59;
  frequency*=1.83;
 }
 return slope;
}
// Soft, warped cellular ridges suggest light focused by the moving water.
float caustics(vec2 p, float t) {
 p+=0.32*vec2(noise(p*0.7+t*0.12),noise(p*0.7-t*0.10+9.0));
 vec2 cell=floor(p), local=fract(p);
 float nearest=8.0, second=8.0;
 for(int y=-1;y<=1;y++) {
  for(int x=-1;x<=1;x++) {
   vec2 offset=vec2(float(x),float(y));
   vec2 seed=hash(cell+offset);
   vec2 point=0.5+0.34*sin(seed*6.28318+t*0.24);
   float distanceToPoint=length(offset+point-local);
   second=min(second,max(nearest,distanceToPoint));
   nearest=min(nearest,distanceToPoint);
  }
 }
 float ridge=1.0-smoothstep(0.015,0.12,second-nearest);
 return ridge*ridge;
}
void mainImage(out vec4 fragColor,in vec2 fragCoord) {
 vec2 screen=fragCoord/iResolution;
 float aspect=iResolution.x/iResolution.y;
 // A straight-down view keeps wave scale and distortion uniform across the surface.
 vec2 surface=vec2((screen.x-0.5)*aspect,screen.y-0.5)*8.0;
 vec2 flowingSurface=surface-flowDirection*iTime*0.20;
 vec2 slope=waveSlope(surface,iTime*0.38);
 slope+=0.12*vec2(noise(flowingSurface*3.0),noise(flowingSurface*3.0+17.0));
 vec2 reflected=vec2(screen.x,1.0-screen.y);
 reflected+=slope*vec2(0.025/aspect,0.025);
 vec3 reflectedSky=sky(reflected);
 // A small amount of water color and slope shading grounds the reflection.
 float reflectivity=0.90;
 vec3 water=mix(vec3(0.09,0.25,0.31),reflectedSky,reflectivity);
 water*=0.99+0.012*slope.y;
 // Keep the light veil faint, especially over the brightest cloud reflections.
 float light=caustics(flowingSurface*1.15+slope*0.16,iTime*0.3);
 float shimmer=0.75+0.25*sin(surface.x*0.6+surface.y*0.4+iTime*0.3);
 water+=vec3(0.65,0.92,1.0)*light*shimmer*0.025*(1.0-water*0.65);
 fragColor=vec4(water,1.0);
}
void main(){mainImage(gl_FragColor,gl_FragCoord.xy);}
