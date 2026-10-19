/* Hero 頭像（avatar-v2.1）：three.js 圓點轉頭。
   九宮格九張頭像的色塊網格依滑鼠位置混合，片段著色器把色塊轉成蜂巢排列的圓點；
   背景是純色。點 hero 空白處顆粒大小依序 12 → 16 → 20 px。
   彩蛋：滑鼠依序移到視窗的上 → 下 → 左 → 右邊緣，輪流播放炸散重組、彩色顆粒、轉一圈、脈動。
   背景：游標在臉附近時是最淺膚色，越往外越接近最深髮色；文字色由 site.js 依 --bg-t 切換。 */
(function () {
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('face-canvas');
  const faceBox = document.querySelector('.face');
  const HAIR = [0.13, 0.2, 0.33], SKIN = [0.93, 0.87, 0.78];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const api = { paused: false, onTone: null };
  window.Avatar = api;

  let gl;
  try { gl = window.THREE && new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false }); } catch (e) { gl = null; }
  if (!gl) { hero.classList.add('no-webgl'); return; }
  gl.setPixelRatio(Math.min(devicePixelRatio, 2));

  Promise.all([
    fetch('avatar/meta.json').then(r => r.json()),
    fetch('avatar/d.bin').then(r => r.arrayBuffer()),
    load('avatar/a.png'), load('avatar/b.png')
  ]).then(([M, buf, At, Bt]) => init(M, new Int16Array(buf), At, Bt))
    .catch(() => hero.classList.add('no-webgl'));

  function load(src) {
    return new Promise((ok, no) => new THREE.TextureLoader().load(src, t => {
      t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; ok(t);
    }, undefined, no));
  }

  function init(M, dv, At, Bt) {
    const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const U = {
      At: { value: At }, Bt: { value: Bt }, w: { value: new Array(9).fill(0) },
      wA: { value: new THREE.Vector4(1, 0, 0, 0) }, wB: { value: new THREE.Vector4() }, w8: { value: 0 },
      box: { value: new THREE.Vector4() }, res: { value: new THREE.Vector2(1, 1) }, cell: { value: 8 },
      rb: { value: 0 }, pu: { value: 0 }, tm: { value: 0 }
    };
    U.w.value[0] = 1;

    // 標準網格；每個頂點帶著往九張照片各自的位移（臉部特徵點對齊）
    const GV = M.GV, nv = GV * GV, pos = new Float32Array(nv * 3), uvs = new Float32Array(nv * 2);
    const at = [0, 1, 2, 3].map(() => new Float32Array(nv * 4)), at8 = new Float32Array(nv * 2);
    for (let j = 0; j < GV; j++) for (let i = 0; i < GV; i++) {
      const v = j * GV + i; uvs[v * 2] = i / (GV - 1); uvs[v * 2 + 1] = j / (GV - 1);
      for (let k = 0; k < 9; k++) {
        const dx = dv[(v * 9 + k) * 2] / 30000, dy = dv[(v * 9 + k) * 2 + 1] / 30000;
        if (k < 8) { const a = at[k >> 1], o = v * 4 + (k & 1) * 2; a[o] = dx; a[o + 1] = dy; }
        else { at8[v * 2] = dx; at8[v * 2 + 1] = dy; }
      }
    }
    const idx = [];
    for (let j = 0; j < GV - 1; j++) for (let i = 0; i < GV - 1; i++) { const v = j * GV + i; idx.push(v, v + 1, v + GV, v + 1, v + GV + 1, v + GV); }
    const geo = new THREE.BufferGeometry();
    geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('cuv', new THREE.BufferAttribute(uvs, 2));
    at.forEach((a, k) => geo.setAttribute('d' + k, new THREE.BufferAttribute(a, 4))); geo.setAttribute('d4', new THREE.BufferAttribute(at8, 2));

    const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: U, extensions: { derivatives: true }, transparent: true, depthTest: false, side: THREE.DoubleSide,
      vertexShader: `attribute vec2 cuv;attribute vec4 d0,d1,d2,d3;attribute vec2 d4;
uniform vec4 wA,wB,box;uniform float w8;uniform vec2 res;varying vec2 vx;
void main(){vx=cuv;
  vec2 p=cuv+wA.x*d0.xy+wA.y*d0.zw+wA.z*d1.xy+wA.w*d1.zw+wB.x*d2.xy+wB.y*d2.zw+wB.z*d3.xy+wB.w*d3.zw+w8*d4;
  vec2 px=box.xy+vec2(p.x,1.-p.y)*box.zw; gl_Position=vec4(px/res*2.-1.,0.,1.);}`,
      fragmentShader: `precision highp float;
uniform sampler2D At,Bt;uniform float w[9];uniform float cell,rb,pu,tm;uniform vec2 res;uniform vec4 box;varying vec2 vx;
const vec3 DARK=vec3(.13,.2,.33),LIGHT=vec3(.93,.87,.78);
vec2 at(int i,vec2 q){float tx=mod(float(i),3.),ty=floor(float(i)/3.);q=clamp(q,.002,.998);return vec2((tx+q.x)/3.,1.-(ty+q.y)/3.);}
void main(){
  vec2 fc=gl_FragCoord.xy,g=vec2(cell,cell*1.732);
  vec2 a=(floor(fc/g)+.5)*g,b=(floor((fc-g*.5)/g)+.5)*g+g*.5;
  vec2 c=distance(fc,a)<distance(fc,b)?a:b;
  vec2 q=vx+dFdx(vx)*(c.x-fc.x)+dFdy(vx)*(c.y-fc.y);
  vec4 s=vec4(0.);float ms=0.;
  for(int i=0;i<9;i++){if(w[i]>.002){vec2 t=at(i,q);s+=w[i]*texture2D(At,t);ms+=w[i]*texture2D(Bt,t).r;}}
  s-=.5;ms-=.5; if(ms<0.)discard;
  float lv=4.-dot(step(0.,s),vec4(1.));
  float r=cell*.42*mix(.55,1.,smoothstep(0.,.03,ms))*(1.+pu*.4*sin(tm*7.-distance(c,box.xy+box.zw*.5)/cell*.5)), d=distance(fc,c);
  float al=clamp(r-d+.5,0.,1.); if(al<.01)discard;
  vec3 base=mix(DARK,LIGHT,lv/3.);
  vec3 hue=clamp(abs(mod(fract(tm*.25+(c.x+c.y)/(res.x+res.y)*1.5)*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
  gl_FragColor=vec4(mix(base,mix(DARK,mix(hue,LIGHT,.3),.12+.88*lv/3.),rb),al);
}`
    }));
    mesh.frustumCulled = false; mesh.renderOrder = 1; scene.add(mesh);


    // 顆粒大小（CSS px）：點 hero 空白處依序 12 → 16 → 20 → 12
    const SIZES = [12, 16, 20]; let si = 0;
    hero.addEventListener('click', e => {
      if (e.target.closest('a, button, .intro, .hero-foot')) return;
      si = (si + 1) % SIZES.length; size();
    });

    // 頭像畫在 .face 元素的位置；網格貼圖本身含留白，所以放大一些
    const PAD = 1.42;
    let cx = 0, cy = 0;
    function size() {
      const r = hero.getBoundingClientRect(), f = faceBox.getBoundingClientRect(), pr = gl.getPixelRatio();
      gl.setSize(r.width, r.height, false);
      const s = Math.min(f.width, f.height) * PAD;
      cx = f.left + f.width / 2; cy = f.top + f.height / 2;
      const lx = cx - r.left - s / 2, ly = r.bottom - (cy + s / 2);
      U.box.value.set(lx * pr, ly * pr, s * pr, s * pr); U.res.value.set(r.width * pr, r.height * pr);
      U.cell.value = SIZES[si] * pr; draw();
    }

    const bg = new THREE.Color(), cHair = new THREE.Color(...HAIR), cSkin = new THREE.Color(...SKIN);
    const m = { x: 0, y: 0 };
    let raf = 0, tone = -1;
    // 彩蛋播放中頭像改看 sv（轉一圈、炸散時凍結），結束後再緩回游標位置
    const sv = { x: 0, y: 0 }, shown = { x: 0, y: 0 }; let spinOn = false;
    function draw() {
      if (raf || api.paused) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        // 雙重 smoothstep：少停留在中間灰階，文字較容易保持對比
        const g = spinOn ? sv : m; let t = Math.min(1, Math.hypot(g.x, g.y) / 0.85); t = t * t * (3 - 2 * t); t = t * t * (3 - 2 * t);
        bg.copy(cSkin).lerp(cHair, t);
        gl.setClearColor(bg, 1);
        if (Math.abs(t - tone) > 0.002) { tone = t; api.onTone && api.onTone(t, '#' + bg.getHexString()); }
        gl.render(scene, cam);
      });
    }
    api.redraw = () => { size(); };

    // 游標 → 九宮格位置（橫 -1..1 左到右、縱 -1..1 上到下），以高斯權重混合九張
    const sig = 0.36;
    function weights() {
      const g = spinOn ? sv : m, gx = g.x, gy = g.y; let tot = 0; shown.x = gx; shown.y = gy;
      const W = M.grid.map(([x, y]) => { const v = Math.exp(-((gx - x) ** 2 + (gy - y) ** 2) / (2 * sig * sig)); tot += v; return v; });
      W.forEach((v, i) => { U.w.value[i] = v / tot; });
      const q = U.w.value; U.wA.value.set(q[0], q[1], q[2], q[3]); U.wB.value.set(q[4], q[5], q[6], q[7]); U.w8.value = q[8];
      draw();
    }
    const qx = gsap.quickTo(m, 'x', { duration: reduce ? 0 : 0.9, ease: 'power3.out', onUpdate: weights });
    const qy = gsap.quickTo(m, 'y', { duration: reduce ? 0 : 0.9, ease: 'power3.out', onUpdate: weights });
    const clamp = v => Math.max(-1, Math.min(1, v));
    function look(x, y) {
      // 以臉的中心為原點，距離用視窗寬高的一半換算（每次重新量，頁面捲動後也準）
      const f = faceBox.getBoundingClientRect(); cx = f.left + f.width / 2; cy = f.top + f.height / 2;
      qx(clamp((x - cx) / (innerWidth / 2) * 1.15)); qy(clamp((y - cy) / (innerHeight / 2) * 1.2));
    }

    // ---------- 彩蛋：滑鼠依序移到視窗的上、下、左、右邊緣 ----------
    let busy = false, ticks = 0, ei = 0;
    const tick = () => { U.tm.value = performance.now() / 1000; draw(); };
    function tickOn() { if (!ticks++) gsap.ticker.add(tick); }
    function tickOff() { if (!--ticks) gsap.ticker.remove(tick); }
    const done = () => { busy = false; };
    // 凍結的頭像緩回目前游標的位置
    function release() {
      gsap.to(sv, { x: () => m.x, y: () => m.y, duration: 0.5, ease: 'power2.out', onUpdate: weights,
        onComplete: () => { spinOn = false; weights(); done(); } });
    }
    function rainbow() {
      tickOn();
      gsap.timeline({ onComplete: () => { tickOff(); done(); } })
        .to(U.rb, { value: 1, duration: 0.5, ease: 'power2.out' }).to(U.rb, { value: 0, duration: 0.8, ease: 'power2.in' }, '+=2.8');
    }
    function pulse() {
      tickOn();
      gsap.timeline({ onComplete: () => { tickOff(); done(); } })
        .to(U.pu, { value: 1, duration: 0.4, ease: 'power2.out' }).to(U.pu, { value: 0, duration: 0.7, ease: 'power2.in' }, '+=1.8');
    }
    function spin() {
      sv.x = m.x; sv.y = m.y; spinOn = true;
      const P = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]], tl = gsap.timeline({ onComplete: release });
      P.forEach(([x, y], i) => tl.to(sv, { x, y, duration: i ? 0.15 : 0.3, ease: i ? 'none' : 'power2.in', onUpdate: weights }));
    }
    // 炸散：先把頭像畫進貼圖，再切成每顆圓點一個 sprite 飛出去；每個 sprite 取自己圓點周圍的畫面，靜止時和原圖完全一樣
    let rt = null;
    const PU = { res: U.res, T: { value: null }, cell: U.cell, k: { value: 0 } };
    const pmat = new THREE.ShaderMaterial({
      uniforms: PU, transparent: true, depthTest: false,
      vertexShader: `attribute vec4 fly;attribute float dl;uniform vec2 res;uniform float k,cell;varying vec2 hm,off;
void main(){vec2 n=vec2(-fly.y,fly.x);
  float e=clamp((k-dl*.5)/.5,0.,1.);e=1.-(1.-e)*(1.-e)*(1.-e);
  vec2 p=position.xy+fly.xy*e+n*fly.z*e*(1.-e)*4.;hm=position.xy;off=position.xy-p;
  gl_Position=vec4(p/res*2.-1.,0.,1.);gl_PointSize=cell+2.;}`,
      fragmentShader: `precision highp float;uniform sampler2D T;uniform vec2 res;uniform float cell;varying vec2 hm,off;
void main(){vec2 src=gl_FragCoord.xy+off;if(distance(src,hm)>cell*.5)discard;
  vec4 t=texture2D(T,src/res);if(t.a<.01)discard;gl_FragColor=vec4(t.rgb/t.a,t.a);}`
    });
    function scatter() {
      const w = U.res.value.x, h = U.res.value.y;
      if (!rt || rt.width !== w || rt.height !== h) {
        if (rt) rt.dispose();
        rt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
      }
      sv.x = shown.x; sv.y = shown.y; spinOn = true;
      gl.setRenderTarget(rt); gl.setClearColor(0, 0); gl.clear(); gl.render(scene, cam); gl.setRenderTarget(null);
      PU.T.value = rt.texture;
      const cell = U.cell.value, gx = cell, gy = cell * 1.732, b = U.box.value, cx = b.x + b.z / 2, cy = b.y + b.w / 2, R = b.z * 0.42;
      const P = [], F = [], DL = [];
      for (let lat = 0; lat < 2; lat++) for (let y = lat ? gy : gy / 2; y < h; y += gy) for (let x = lat ? gx : gx / 2; x < w; x += gx) {
        if (x < b.x || x > b.x + b.z || y < b.y || y > b.y + b.w) continue;
        const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5, q = Math.min(1, l / R);
        const s = R * (0.1 + 0.45 * q) * (0.5 + Math.random() * 0.6);
        P.push(x, y, 0); DL.push(1 - q); F.push(Math.cos(a) * s, Math.sin(a) * s, (Math.random() - 0.5) * 0.6, 0);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('fly', new THREE.Float32BufferAttribute(F, 4)); geo.setAttribute('dl', new THREE.Float32BufferAttribute(DL, 1));
      PU.k.value = 0; const pts = new THREE.Points(geo, pmat); pts.frustumCulled = false; pts.renderOrder = 2;
      mesh.visible = false; scene.add(pts); draw();
      gsap.timeline({ onUpdate: draw, onComplete: () => { scene.remove(pts); geo.dispose(); mesh.visible = true; release(); } })
        .to(PU.k, { value: 1, duration: 1.1, ease: 'none' }).to(PU.k, { value: 0, duration: 1.3, ease: 'power1.inOut' }, '+=.3');
    }
    const FX = [scatter, rainbow, spin, pulse];
    function play(i) { if (busy || api.paused) return; busy = true; FX[i](); }
    const SEQ = ['up', 'down', 'left', 'right']; let seq = [], t0 = 0, zone = null;
    function zoneOf(x, y) { if (Math.max(Math.abs(x), Math.abs(y)) < 0.6) return null; return Math.abs(y) > Math.abs(x) ? (y < 0 ? 'up' : 'down') : (x < 0 ? 'left' : 'right'); }
    // 每一步要在前一步 2.5 秒內到達下一個邊緣
    function egg(x, y) {
      const z = zoneOf(x, y); if (z === zone) return; zone = z; if (!z) return;
      const now = performance.now(); if (seq.length && now - t0 > 2500) seq = []; t0 = now;
      if (z === seq[seq.length - 1]) return;
      if (z === SEQ[seq.length]) { seq.push(z); if (seq.length === 4) { seq = []; play(ei); ei = (ei + 1) % FX.length; } }
      else seq = z === 'up' ? ['up'] : [];
    }
    api.egg = play;

    // 一段時間沒有游標（或在手機上）時，頭像自己緩慢張望，範圍小到不會讓背景轉深
    let lastMove = -1e9, wanderT = 0, wanderRaf = 0;
    function wander(ts) {
      wanderRaf = requestAnimationFrame(wander);
      if (api.paused || reduce || performance.now() - lastMove < 4000) return;
      wanderT += 1 / 60;
      qx(Math.sin(wanderT * 0.53) * 0.32); qy(Math.sin(wanderT * 0.81 + 1) * 0.22);
    }
    wanderRaf = requestAnimationFrame(wander);

    addEventListener('pointermove', e => {
      if (api.paused) return; lastMove = performance.now();
      egg(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); look(e.clientX, e.clientY);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { qx(0); qy(0); });

    // 手機傾斜：左右傾 (gamma) 控制橫向、前後傾 (beta) 相對於拿手機的自然角度控制縱向，
    // 頭像跟著轉、背景隨傾斜幅度轉深。iOS 要在使用者第一次點擊時要權限。
    if (!reduce && 'DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches) {
      let base = null;
      const tilt = e => {
        if (api.paused || e.beta == null || e.gamma == null) return;
        const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
        let b = e.beta, g = e.gamma;
        if (ang === 90) [b, g] = [-g, b]; else if (ang === -90 || ang === 270) [b, g] = [g, -b];
        if (base === null) base = b;
        base += (b - base) * 0.004; // 慢慢跟上姿勢改變，躺著或坐著拿都以當下角度為中心
        lastMove = performance.now();
        qx(clamp(g / 28)); qy(clamp((b - base) / 22));
      };
      const listen = () => addEventListener('deviceorientation', tilt, { passive: true });
      const D = window.DeviceOrientationEvent;
      if (typeof D.requestPermission === 'function') {
        const ask = () => { D.requestPermission().then(s => { if (s === 'granted') listen(); }).catch(() => {}); };
        addEventListener('touchend', ask, { once: true, passive: true });
      } else listen();
    }
    addEventListener('resize', size);
    new ResizeObserver(size).observe(faceBox);
    size(); weights();
    hero.classList.add('face-ready');
    api.resume = () => { api.paused = false; size(); };
  }
})();
