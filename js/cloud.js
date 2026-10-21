/* Cloud on the lake：一朵積雲浮在近乎鏡面的湖上，整個畫面在一個 fragment shader 裡 raymarch。
   移植自 Visual Dock 的 cloud-reflection.js；封面用輕量版（低解析度、少步數、低幀率），
   右下角按鈕開全螢幕看原始版本。雲的形狀與噪聲在第一次顯示時烘成 3D 貼圖，之後共用。 */
(() => {
const PRESETS = {
  lite: { pixelRatioCap: 1, fps: 24, quality: [.35, .55, .75], steps: 56, reflSteps: 22 },
  full: { pixelRatioCap: 1.5, fps: 30, quality: [.4, .75, 1], steps: 96, reflSteps: 40 }
};

const CLOUD_Y = 5.6;
const CLOUD_R = 8.0;
const CORE = [4.6, 2.4, 3.2];
const B_MIN = [-8, -3.6, -6], B_SIZE = [16, 8.6, 12], BN = [112, 60, 84];
const NOISE_SIZE = 64;

function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

// Tileable 3D value noise, three octaves.
function bakeNoise(size, rand) {
  const data = new Uint8Array(size * size * size);
  const octaves = [[4, .55], [8, .28], [16, .17]];
  const lattice = octaves.map(([cells]) => { const a = new Float32Array(cells ** 3); for (let i = 0; i < a.length; i++) a[i] = rand(); return a; });
  const fade = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
  for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    octaves.forEach(([cells, amp], o) => {
      const L = lattice[o], fx = x / size * cells, fy = y / size * cells, fz = z / size * cells;
      const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz);
      const tx = fade(fx - ix), ty = fade(fy - iy), tz = fade(fz - iz);
      const at = (i, j, k) => L[(i % cells) + (j % cells) * cells + (k % cells) * cells * cells];
      v += amp * lerp(lerp(lerp(at(ix, iy, iz), at(ix + 1, iy, iz), tx), lerp(at(ix, iy + 1, iz), at(ix + 1, iy + 1, iz), tx), ty),
        lerp(lerp(at(ix, iy, iz + 1), at(ix + 1, iy, iz + 1), tx), lerp(at(ix, iy + 1, iz + 1), at(ix + 1, iy + 1, iz + 1), tx), ty), tz);
    });
    data[x + y * size + z * size * size] = Math.round(v * 255);
  }
  return data;
}

// Core ellipsoid with 22 puffs melted onto its upper surface, plus a noise warp.
function bakeShape(noise) {
  const rand = rng(11), lobes = [];
  for (let i = 0; i < 22; i++) {
    const th = rand() * Math.PI * 2, ph = Math.acos(rand() * 1.25 - .25), r = .9 + rand();
    lobes.push([Math.sin(ph) * Math.cos(th) * CORE[0] * .85, Math.cos(ph) * CORE[1] * .85, Math.sin(ph) * Math.sin(th) * CORE[2] * .85, r]);
  }
  const N = NOISE_SIZE, wrap = i => ((i % N) + N) % N, l = (a, b, t) => a + (b - a) * t;
  const sample = (x, y, z) => {
    x = x * N - .5; y = y * N - .5; z = z * N - .5;
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
    const at = (i, j, k) => noise[wrap(i) + wrap(j) * N + wrap(k) * N * N] / 255;
    return l(l(l(at(ix, iy, iz), at(ix + 1, iy, iz), fx), l(at(ix, iy + 1, iz), at(ix + 1, iy + 1, iz), fx), fy),
      l(l(at(ix, iy, iz + 1), at(ix + 1, iy, iz + 1), fx), l(at(ix, iy + 1, iz + 1), at(ix + 1, iy + 1, iz + 1), fx), fy), fz);
  };
  const smooth = (e0, e1, x) => { const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1); return t * t * (3 - 2 * t); };
  const data = new Uint8Array(BN[0] * BN[1] * BN[2]);
  let o = 0;
  for (let k = 0; k < BN[2]; k++) for (let j = 0; j < BN[1]; j++) for (let i = 0; i < BN[0]; i++, o++) {
    let lx = B_MIN[0] + (i + .5) / BN[0] * B_SIZE[0], ly = B_MIN[1] + (j + .5) / BN[1] * B_SIZE[1], lz = B_MIN[2] + (k + .5) / BN[2] * B_SIZE[2];
    const px = lx * .09, py = (ly + CLOUD_Y) * .09, pz = lz * .09;
    lx += (sample(px, py, pz) - .5) * 1.6; ly += (sample(px + .37, py + .37, pz + .37) - .5) * 1.6; lz += (sample(px + .71, py + .71, pz + .71) - .5) * 1.6;
    let s = 1 - Math.hypot(lx / CORE[0], ly / CORE[1], lz / CORE[2]);
    for (const [cx, cy, cz, r] of lobes) {
      const b = 1 - Math.hypot(lx - cx, ly - cy, lz - cz) / r, h = Math.min(Math.max(.5 + .5 * (b - s) / .35, 0), 1);
      s = s + (b - s) * h + .35 * h * (1 - h);
    }
    s *= smooth(-2.9, -1.5, ly);
    data[o] = Math.round(Math.min(Math.max((s + .5) / 1.5, 0), 1) * 255);
  }
  return data;
}

let baked;
function bakedVolumes() {
  if (!baked) { const noise = bakeNoise(NOISE_SIZE, rng(3)); baked = { noise, shape: bakeShape(noise) }; }
  return baked;
}

const FULLSCREEN_VERTEX = `out vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;

const cloudFragment = (steps, reflSteps) => `
    precision highp float;
    precision highp sampler3D;
    in vec2 vUv;
    out vec4 fragColor;

    uniform vec2 uRes;
    uniform float uTime;
    uniform sampler3D uNoise;
    uniform vec3 uCamPos;
    uniform vec3 uCamTarget;
    uniform sampler3D uShape;
    const vec3 B_MIN = vec3(${B_MIN.join(', ')});
    const vec3 B_SIZE = vec3(${B_SIZE.join(', ')});
    uniform vec4 uFlash;   // xyz = position inside the cloud, w = intensity
    const vec3 CORE = vec3(${CORE.join(', ')});

    const vec3 CLOUD_C = vec3(0.0, ${CLOUD_Y.toFixed(2)}, 0.0);
    const float CLOUD_R = ${CLOUD_R.toFixed(2)};
    const vec3 LIGHT = normalize(vec3(0.35, 0.8, 0.45));

    float noise(vec3 p) { return texture(uNoise, p).r; }
    float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

    // ---------------- cloud ----------------
    float shape(vec3 p) {
      // slow rolling deformation of the whole body (pure math, no texture reads)
      p += vec3(sin(p.y * 0.55 + uTime * 0.35 + 1.0),
                sin(p.z * 0.5 + uTime * 0.28),
                sin(p.x * 0.45 + uTime * 0.31 + 2.0)) * 0.35;
      vec3 u = (p - CLOUD_C - B_MIN) / B_SIZE;
      if (any(lessThan(u, vec3(0.0))) || any(greaterThan(u, vec3(1.0)))) return -1.0;
      return texture(uShape, u).r * 1.5 - 0.5;
    }

    float density(vec3 p, bool hi) {
      float s = shape(p);
      if (s <= 0.0) return 0.0;
      // billowing detail: many small puffs on top of the lobes; the octaves
      // drift in different directions so the puffs boil rather than slide
      vec3 w = p * 0.6;
      float n = noise(w * 0.5 + vec3(0.02, -0.05, 0.015) * uTime) * 0.40
              + noise(w * 1.3 + 0.31 + vec3(-0.04, -0.07, 0.03) * uTime) * 0.30;
      n += hi ? noise(w * 3.1 + 0.77 + vec3(0.06, -0.1, -0.05) * uTime) * 0.18
             + noise(w * 7.3 + 0.13 + vec3(-0.1, -0.16, 0.08) * uTime) * 0.12 : 0.15;
      return clamp((s + 0.2 - (1.0 - n) * 0.95) * 6.5, 0.0, 1.0);
    }

    float hg(float c, float g) { float g2 = g * g; return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * c, 1.5) / 12.566; }

    // rgb = in-scattered light, a = transmittance
    vec4 cloud(vec3 ro, vec3 rd, int steps, bool hi) {
      vec3 oc = ro - CLOUD_C;
      float b = dot(oc, rd), h = b * b - dot(oc, oc) + CLOUD_R * CLOUD_R;
      if (h < 0.0) return vec4(0.0, 0.0, 0.0, 1.0);
      h = sqrt(h);
      float t0 = max(-b - h, 0.0), t1 = -b + h;
      if (t1 <= t0) return vec4(0.0, 0.0, 0.0, 1.0);

      float dt = (t1 - t0) / float(steps);
      float t = t0 + dt * ign(gl_FragCoord.xy);
      vec3 acc = vec3(0.0);
      float T = 1.0;
      float cosA = dot(rd, LIGHT);
      float phase = mix(hg(cosA, 0.6), hg(cosA, -0.2), 0.5) * 12.566;
      for (int i = 0; i < 128; i++) {
        if (i >= steps || T < 0.01) break;
        vec3 p = ro + rd * t;
        float sh = shape(p);
        // far outside the cloud: stride ahead without paying for noise
        if (sh < -0.12) { t += dt * clamp(-sh * 8.0, 1.0, 4.0); continue; }
        float d = density(p, hi);
        if (d > 0.002) {
          float ld = 0.0;
          for (int j = 1; j <= 3; j++) ld += density(p + LIGHT * float(j * j) * 0.32, false) * float(j);
          // direct light plus a cheap multiple-scattering term: light that
          // leaks through the body is what gives the translucent glow
          float lightT = exp(-ld * 0.7) + 0.35 * exp(-ld * 0.15);
          float powder = 1.0 - exp(-d * 4.0);
          float hgt = clamp((p.y - CLOUD_C.y + 3.0) / 6.5, 0.0, 1.0);
          vec3 L = vec3(1.0, 0.965, 0.92) * lightT * phase * mix(0.35, 1.0, powder) * 0.85 * mix(0.95, 1.75, smoothstep(0.35, 1.0, hgt))
                 + vec3(0.16, 0.16, 0.17) * (0.6 + 0.4 * hgt)
                 + vec3(0.26, 0.26, 0.26) * pow(1.0 - hgt, 2.0);
          // lightning flicker deep inside, softened by the surrounding vapour
          L += vec3(0.86, 0.9, 1.0) * uFlash.w * exp(-length(p - CLOUD_C - uFlash.xyz) * 0.85) * 1.6;
          float a = exp(-d * 1.5 * dt);
          acc += T * L * (1.0 - a);
          T *= a;
        }
        t += dt;
      }
      return vec4(acc, T);
    }

    // ---------------- backdrop ----------------
    // White glow hugging the horizon, falling to black above.
    float glow(float e) {
      return 0.9 * exp(-pow(max(e, 0.0) / 0.105, 1.35));
    }
    float gArc;   // extra lift of the glow toward the screen edges (set in main)

    // Banks of low mist rolling on the far water, far = bright, near = dark.
    vec3 mist(vec3 rd) {
      float e = asin(clamp(rd.y, -1.0, 1.0));
      float az = atan(rd.z, rd.x);
      vec3 col = vec3(glow(e - gArc));
      for (int k = 0; k < 7; k++) {
        float fk = float(k);
        float R = 1.6 + fk * 0.55;
        vec3 q = vec3(cos(az) * R, sin(az) * R, fk * 0.173 + uTime * 0.0025);
        float ridge = (noise(q * 0.32) - 0.5) * (0.018 + fk * 0.006) + (noise(q * 0.9 + 0.4) - 0.5) * 0.008;
        float top = -0.004 - fk * 0.019 + ridge;
        float below = top - e;
        float m = smoothstep(-0.003, 0.012, below);
        float lum = mix(0.88, 0.2, pow(fk / 6.0, 0.9));
        vec3 layer = vec3(lum * (0.6 + 0.4 * exp(-below * 30.0)));
        col = mix(col, layer, m * mix(0.85, 0.55, fk / 6.0));
      }
      return col;
    }

    void main() {
      // 直式螢幕（手機全螢幕）放寬視角，雲不會大到塞滿畫面
      vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.y, uRes.x * 1.3);

      vec3 ro = uCamPos;
      vec3 fw = normalize(uCamTarget - ro);
      vec3 rt = normalize(cross(fw, vec3(0, 1, 0)));
      vec3 up = cross(rt, fw);
      vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * 0.9);
      // gentle curvature: the horizon bows down toward the edges, and the
      // black above sweeps up into an arc as the glow climbs at the sides
      rd = normalize(rd + vec3(0.0, 0.009 * uv.x * uv.x, 0.0));
      gArc = 0.035 * uv.x * uv.x;

      vec3 col = mist(rd);
      if (rd.y >= 0.0) {
        vec4 c = cloud(ro, rd, ${steps}, true);
        col = col * c.a + c.rgb;
      } else {
        float e = asin(-rd.y);
        // the lowest, nearest water reads as pure black
        col *= smoothstep(0.32, 0.08, e) * 0.95 + 0.05;

        float t = -ro.y / rd.y;
        vec3 p = ro + rd * t;
        // ripples in view-aligned coordinates: long ridges across the view
        // tilt the reflection up and down, stretching it into vertical streaks
        vec3 f2 = normalize(vec3(fw.x, 0.0, fw.z));
        vec3 r2 = vec3(-f2.z, 0.0, f2.x);
        float across = dot(p, r2), along = dot(p, f2);
        // almost a mirror: a slow swell plus faint streaky ripples
        float calm = 1.0 / (1.0 + t * 0.02);
        // speeds follow deep-water dispersion (c = sqrt(g / k)), so short
        // ripples scurry and long swells roll, as real waves do
        float tt = uTime;
        float sf = ((noise(vec3(across * 0.12, along * 0.04 - tt * 0.125, tt * 0.03)) - 0.5) * 0.05
                 + (noise(vec3(across * 1.6, along * 0.06 - tt * 0.153, tt * 0.05 + 0.5)) - 0.5) * 0.022 / (1.0 + t * 0.03)
                 + (noise(vec3(across * 4.2 + 0.3, along * 0.16 - tt * 0.25, tt * 0.1 + 0.2)) - 0.5) * 0.014 / (1.0 + t * 0.05)
                 + sin(along * 0.35 - tt * 1.85) * 0.004
                 + sin(along * 1.1 + across * 0.15 - tt * 3.28) * 0.0025) * calm;
        float sa = ((noise(vec3(across * 0.2 + 0.2, along * 0.05 - tt * 0.14, tt * 0.05)) - 0.5) * 0.02
                 + (noise(vec3(across * 2.5, along * 0.2 - tt * 0.28, tt * 0.08 + 0.8)) - 0.5) * 0.012) * calm;
        vec3 n = normalize(vec3(0.0, 1.0, 0.0) + f2 * sf + r2 * sa);
        vec3 r = reflect(rd, n);
        r.y = abs(r.y);
        vec4 c = cloud(p, r, ${reflSteps}, false);
        float fres = 0.55 + 0.45 * pow(1.0 - max(dot(-rd, n), 0.0), 4.0);
        float k = fres * 0.85;
        col = col * mix(1.0, c.a, k) + c.rgb * vec3(1.0, 0.97, 0.93) * k * 1.15;
      }

      col = pow(clamp(col, 0.0, 1.0), vec3(1.05));
      vec2 q = vUv - 0.5;
      col *= 1.0 - dot(q, q) * 0.35;
      col += (ign(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0 * 2.5;
      fragColor = vec4(col, 1.0);
    }
  `;

// Camera distance eases between random stops (near, middle or far).
function distanceKeys(rand) {
  const keys = [[0, 40]];
  for (let k = 0, t = 0; k < 400; k++) { t += 14 + rand() * 16; keys.push([t, 22 + rand() * 36]); }
  return keys;
}
function distanceAt(keys, t) {
  let i = 1;
  while (i < keys.length - 1 && keys[i][0] < t) i++;
  const [t0, d0] = keys[i - 1], [t1, d1] = keys[i];
  const x = Math.min(Math.max((t - t0) / (t1 - t0), 0), 1);
  return d0 + (d1 - d0) * x * x * x * (x * (x * 6 - 15) + 10);
}

function mountCloud(host, { preset = 'lite', time: startTime = null } = {}) {
  const cfg = PRESETS[preset], THREE = window.THREE;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const resources = new Set(), keep = item => { resources.add(item); return item; };
  let renderer, observer, frame, draw, disposed = false, paused = false, last = 0;
  let time = startTime ?? Math.random() * 600, quality = cfg.quality[1], frameAcc = 0, frameCount = 0;
  let nextFlash = time + 3, flashStart = -99, flashPulses = [];
  const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0; frameAcc = frameCount = 0; };
  const schedule = () => { stop(); if (!disposed && !paused && !document.hidden && draw) frame = requestAnimationFrame(draw); };
  document.addEventListener('visibilitychange', schedule);

  function init() {
    if (!THREE) throw new Error('three.js 未載入');
    const { noise, shape } = bakedVolumes();
    const Tex3D = THREE.Data3DTexture || THREE.DataTexture3D;
    const volume = (data, [x, y, z], wrapping) => {
      const texture = keep(new Tex3D(data, x, y, z));
      texture.format = THREE.RedFormat; texture.type = THREE.UnsignedByteType;
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
      texture.wrapS = texture.wrapT = texture.wrapR = wrapping; texture.unpackAlignment = 1; texture.needsUpdate = true;
      return texture;
    };
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: preset === 'lite' ? 'low-power' : 'high-performance', alpha: false });
    if (!renderer.capabilities.isWebGL2) throw new Error('需要 WebGL2');
    renderer.domElement.setAttribute('aria-hidden', 'true'); host.prepend(renderer.domElement);
    const uniforms = {
      uRes: { value: new THREE.Vector2() }, uTime: { value: 0 },
      uNoise: { value: volume(noise, [NOISE_SIZE, NOISE_SIZE, NOISE_SIZE], THREE.RepeatWrapping) },
      uShape: { value: volume(shape, BN, THREE.ClampToEdgeWrapping) },
      uCamPos: { value: new THREE.Vector3() }, uCamTarget: { value: new THREE.Vector3() }, uFlash: { value: new THREE.Vector4() },
    };
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(keep(new THREE.PlaneGeometry(2, 2)), keep(new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, uniforms, vertexShader: FULLSCREEN_VERTEX, fragmentShader: cloudFragment(cfg.steps, cfg.reflSteps), depthTest: false, depthWrite: false,
    })));
    quad.frustumCulled = false; scene.add(quad);
    const distances = distanceKeys(rng(29)), flashPos = new THREE.Vector3();

    function apply() {
      uniforms.uTime.value = time;
      if (time > nextFlash) {
        flashStart = time;
        flashPos.set((Math.random() - .5) * 5, (Math.random() - .4) * 1.6, (Math.random() - .5) * 2.5);
        flashPulses = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, (_, i) => [i * (.08 + Math.random() * .1), .35 + Math.random() * .65]);
        nextFlash = time + 5 + Math.random() * 10;
      }
      let flash = 0;
      for (const [offset, amp] of flashPulses) { const x = time - flashStart - offset; if (x > 0) flash += amp * Math.exp(-x * 12); }
      uniforms.uFlash.value.set(flashPos.x, flashPos.y, flashPos.z, flash);
      const orbit = time * .04, dist = distanceAt(distances, time), height = .8 + Math.sin(time * .043 + .8) * .3;
      uniforms.uCamPos.value.set(Math.cos(orbit) * dist, height, Math.sin(orbit) * dist);
      uniforms.uCamTarget.value.set(0, height + 1.2, 0);
    }
    function resize() {
      const width = host.clientWidth, height = host.clientHeight; if (!width || !height) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, cfg.pixelRatioCap) * quality); renderer.setSize(width, height, false);
      renderer.getDrawingBufferSize(uniforms.uRes.value);
      apply(); renderer.render(scene, camera);
    }
    observer = new ResizeObserver(resize); observer.observe(host); resize();
    draw = now => {
      if (disposed || paused || document.hidden) return;
      if (last && now - last < 1000 / cfg.fps - 1) { frame = requestAnimationFrame(draw); return; }
      const dt = last ? Math.min((now - last) / 1000, .1) : 0; last = now;
      // raymarch 很吃 GPU：幀率不夠時降解析度，有餘裕再慢慢調回來
      if (dt) { frameAcc += dt; frameCount++; }
      if (frameAcc > 2) {
        const average = frameAcc / frameCount, [low, , high] = cfg.quality;
        const next = Math.min(Math.max(average > 1.2 / cfg.fps ? quality * .85 : average < 1.05 / cfg.fps ? quality * 1.05 : quality, low), high);
        frameAcc = frameCount = 0;
        if (Math.abs(next - quality) > .01) { quality = next; resize(); }
      }
      if (!reduced.matches) time += dt;
      apply(); renderer.render(scene, camera);
      if (!reduced.matches) frame = requestAnimationFrame(draw);
    };
    host.dataset.ready = 'true'; schedule();
  }

  function release() { stop(); observer?.disconnect(); resources.forEach(resource => resource.dispose()); resources.clear(); renderer?.dispose(); renderer?.domElement.remove(); }
  try { init(); } catch (error) {
    release(); host.dataset.failed = 'true'; console.error('Cloud:', error);
  }
  return {
    get time() { return time; },
    pause() { paused = true; stop(); },
    play() { paused = false; schedule(); },
    destroy() { disposed = true; release(); document.removeEventListener('visibilitychange', schedule); }
  };
}

/* 封面：進到畫面才烘貼圖並開始動，離開畫面就停 */
document.querySelectorAll('.cover-live[data-motion=cloud]').forEach(el => {
  let cover = null, seen = false, full = null;
  const sync = () => { if (!cover) return; seen && !full ? cover.play() : cover.pause(); };
  new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    if (seen && !cover) {
      // 讓卡片先畫出來，再在空檔烘 3D 貼圖
      const start = () => { cover = mountCloud(el, { preset: 'lite' }); sync(); };
      (window.requestIdleCallback || setTimeout)(start, { timeout: 600 });
    } else sync();
  }).observe(el);

  /* 全螢幕：開一個 dialog 掛原始版本，能用 Fullscreen API 就真的全螢幕 */
  const btn = el.parentElement.querySelector('.cover-full');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const dlg = document.createElement('dialog');
    dlg.className = 'cloud-full';
    dlg.setAttribute('aria-label', 'Cloud on the lake 全螢幕');
    dlg.innerHTML = `<button type="button" class="cloud-close" aria-label="關閉全螢幕">✕</button>`;
    document.body.append(dlg);
    dlg.showModal();
    full = mountCloud(dlg, { preset: 'full', time: cover?.time });
    sync();
    const close = () => {
      if (!full) return;
      full.destroy(); full = null;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      dlg.close(); dlg.remove(); sync(); btn.focus();
    };
    dlg.querySelector('.cloud-close').addEventListener('click', close);
    dlg.addEventListener('close', close);
    dlg.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) close(); });
    dlg.requestFullscreen?.().catch(() => {});
  });
});
})();
