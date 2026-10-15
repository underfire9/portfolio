/* 動態封面：works.js 裡設定 motion 的作品，封面改用 canvas 動畫背景＋logo。
   畫面外或分頁隱藏時暫停；系統設定「減少動態效果」時只畫一張靜態畫面。 */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fireworker：從底部往上飄的火星（平面：實色、無光暈，越往上越小）
  function embers(cv) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, ps = [];
    const COLORS = ['#FBBF24', '#EF731C', '#EF731C', '#d9542b', '#eddec7'];
    function spawn(p, anywhere) {
      p.x = Math.random() * w;
      p.y = anywhere ? Math.random() * h : h + 10 * dpr;
      p.s = (2 + Math.random() * 4) * dpr;
      p.vy = (.3 + Math.random() * .6) * dpr;
      p.amp = (.3 + Math.random() * .7) * dpr;
      p.ph = Math.random() * 6.28;
      p.rot = Math.random() * 6.28; p.vr = (Math.random() - .5) * .04;
      p.diamond = Math.random() < .45;
      p.c = COLORS[Math.random() * COLORS.length | 0];
      return p;
    }
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.width = cv.clientWidth * dpr; h = cv.height = cv.clientHeight * dpr;
      const n = Math.max(28, Math.round(cv.clientWidth * cv.clientHeight / 9000));
      ps = Array.from({ length: n }, () => spawn({}, true));
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.y -= p.vy; p.x += Math.sin(t / 900 + p.ph) * p.amp * .5; p.rot += p.vr;
        const k = p.y / h;                              // 越往上越小，到頂消失
        if (k < .05) { spawn(p); continue; }
        const r = p.s * Math.min(1, k * 1.4);
        ctx.fillStyle = p.c;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.diamond) { ctx.beginPath(); ctx.moveTo(0, -r * 1.4); ctx.lineTo(r, 0); ctx.lineTo(0, r * 1.4); ctx.lineTo(-r, 0); ctx.fill(); }
        else { ctx.beginPath(); ctx.arc(0, 0, r * .8, 0, 6.29); ctx.fill(); }
        ctx.restore();
      }
    }
    return { resize, frame };
  }

  // Visual Dock：玻璃上的雨滴（呼應雨窗）慢慢滑落，logo 每隔一段時間向外擴散一圈細線
  function rings(cv, el) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, cx = 0, cy = 0, r0 = 0, drops = [];
    const COLORS = ['#2c3035', '#33393f', '#3b424a', '#465260'];
    function drop(d, anywhere) {
      d.x = Math.random() * w; d.y = anywhere ? Math.random() * h : -10 * dpr;
      d.r = (.6 + Math.random() * Math.random() * 2.6) * dpr;
      d.v = 0; d.hold = Math.random() * 400;        // 先停在玻璃上，再隨機往下滑
      d.c = COLORS[Math.random() * COLORS.length | 0];
      return d;
    }
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.width = cv.clientWidth * dpr; h = cv.height = cv.clientHeight * dpr;
      const n = Math.max(60, Math.round(cv.clientWidth * cv.clientHeight / 2600));
      drops = Array.from({ length: n }, () => drop({}, true));
      measure();
    }
    // logo 是非同步換成 SVG 的，每格重新量一次位置
    function measure() {
      const logo = el.querySelector('.cover-logo'), a = el.getBoundingClientRect();
      const b = logo ? logo.getBoundingClientRect() : { left: a.left + a.width / 2, top: a.top + a.height / 2, width: 0, height: 0 };
      cx = (b.left - a.left + b.width / 2) * dpr; cy = (b.top - a.top + b.height / 2) * dpr;
      r0 = b.width / 2 * .94 * dpr;
    }
    function frame(t) {
      measure();
      ctx.clearRect(0, 0, w, h);
      for (const d of drops) {
        if (d.hold > 0) d.hold--;
        else { d.v = Math.min(d.v + .02 * d.r, 1.6 * d.r); d.y += d.v; if (Math.random() < .01) { d.hold = 60 + Math.random() * 300; d.v = 0; } }
        if (d.y > h + 10 * dpr) drop(d);
        ctx.fillStyle = d.c;
        ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * (1 + d.v * .15 / dpr), 0, 0, 6.29); ctx.fill();
      }
      // 擴散圈：每 3 秒一圈，6 秒內往外擴到 2.4 倍並淡出
      const P = 3000, L = 6000;
      ctx.lineWidth = 1 * dpr;
      for (let k = 0; k < L / P; k++) {
        const p = ((t + k * P) % L) / L;
        ctx.strokeStyle = `rgba(85,126,146,${(1 - p) * .55})`;
        ctx.beginPath(); ctx.arc(cx, cy, r0 * (1 + p * 1.4), 0, 6.29); ctx.stroke();
      }
    }
    return { resize, frame };
  }

  const KINDS = { embers, rings };

  // rings 需要拆開 logo 的每一圈，所以把 <img> 換成內嵌 SVG
  document.querySelectorAll('.cover-live[data-motion=rings] img.cover-logo').forEach(img =>
    fetch(img.src).then(r => r.text()).then(t => {
      const box = document.createElement('div'); box.innerHTML = t;
      const svg = box.querySelector('svg'); if (!svg) return;
      svg.classList.add('cover-logo'); svg.setAttribute('aria-hidden', 'true'); img.replaceWith(svg);
    }).catch(() => {}));

  document.querySelectorAll('.cover-live').forEach(el => {
    const make = KINDS[el.dataset.motion]; if (!make) return;
    const cv = el.querySelector('canvas'), fx = make(cv, el);
    let raf = 0, seen = false;
    const loop = t => { fx.frame(t); raf = requestAnimationFrame(loop); };
    const play = () => { if (!raf && seen && !document.hidden && !reduce) raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    fx.resize();
    if (reduce) { for (let i = 0; i < 1; i++) fx.frame(0); }
    new ResizeObserver(() => { fx.resize(); if (reduce) fx.frame(0); }).observe(el);
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; seen ? play() : stop(); }).observe(el);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : play());
  });
})();
