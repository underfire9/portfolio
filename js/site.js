/* 網站互動：hero 文字色、亂碼換字、作品列表、進退場轉場、tabs、燈箱 */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const W = window.WORKS;
  const legacy = h => (h && h[0] === '@' ? (window.LEGACY_ROOT || '') + h.slice(1) : h);

  $$('[data-legacy]').forEach(a => a.setAttribute('href', legacy(a.getAttribute('href'))));
  $$('[data-count]').forEach(el => { el.textContent = String(W[el.dataset.count].length).padStart(2, '0'); });

  /* ---------- hero 文字色跟著背景 ----------
     背景在淺膚色與深髮色之間連續變化；文字取兩者中對比較高的一個，中段用 0.5 為界並以 CSS 過渡切換 */
  const TONE = ['#213354', '#545e71', '#87898e', '#bab3aa', '#eddec7'];
  let dark = null;
  function setTone(t, hex) {
    root.style.setProperty('--hero-bg', hex);
    const d = t > 0.5;
    if (d !== dark) {
      dark = d;
      root.style.setProperty('--hero-ink', d ? TONE[4] : TONE[0]);
      root.style.setProperty('--hero-muted', d ? TONE[3] : TONE[1]);
    }
  }
  if (window.Avatar) window.Avatar.onTone = setTone;

  /* ---------- 亂碼換字 ---------- */
  const titles = ['網頁設計師', '介面設計師', '視覺設計師'];
  // 隨機日文假名＋全形數字（全形才不會讓字寬跳動）
  const POOL = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほ０１２３４５６７８９';
  const sc = $('#scramble');
  let ti = 0, scTimer = 0;
  function scrambleTo(word) {
    if (reduce) { sc.textContent = word; return; }
    const from = sc.textContent, n = Math.max(from.length, word.length), dur = 720, t0 = performance.now();
    const at = [...Array(n)].map((_, i) => (0.25 + 0.75 * (i + 1) / n) * dur);
    let last = 0;
    (function tick(now) {
      const e = now - t0;
      if (now - last > 45 || e >= dur) {
        last = now;
        sc.innerHTML = [...Array(n)].map((_, i) => {
          if (e >= at[i]) return word[i] || '';
          return '<span class="g">' + POOL[(Math.random() * POOL.length) | 0] + '</span>';
        }).join('');
      }
      if (e < dur) requestAnimationFrame(tick); else sc.textContent = word;
    })(t0);
  }
  function cycle() {
    clearTimeout(scTimer);
    scTimer = setTimeout(() => {
      if (!document.hidden && !document.body.classList.contains('stage-open')) { ti = (ti + 1) % titles.length; scrambleTo(titles[ti]); }
      cycle();
    }, 2600);
  }
  cycle();

  /* ---------- 作品列表 ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isZh = s => /[㐀-鿿]/.test(s);
  const GEN = [
    ['var(--tone-3)', 'var(--tone-1)', '160deg'],
    ['var(--tone-4)', 'var(--tone-2)', '200deg'],
    ['var(--tone-2)', 'var(--tone-3)', '135deg']
  ];
  function card(w, i, kind) {
    const g = GEN[i % GEN.length];
    const cover = w.motion
      ? `<div class="cover-live${w.shot ? '' : ' solo'}" data-motion="${esc(w.motion)}"><canvas aria-hidden="true"></canvas>
          <div class="live-brand">${w.logo ? `<img class="cover-logo" src="${esc(w.logo)}" alt="">` : ''}${w.shot ? `<b>${esc(w.title)}</b>` : ''}${w.tagline ? `<span>${esc(w.tagline)}</span>` : ''}</div>
          ${w.shot ? `<div class="live-shot"><img src="${esc(w.shot)}" alt="${esc(w.title)} 截圖" loading="lazy"></div>` : ''}</div>`
      : w.cover
      ? `<img src="${esc(w.cover)}" alt="${esc(w.title)} 封面" loading="lazy" width="1200" height="675">`
      : `<div class="cover-gen" style="--c1:${g[0]};--c2:${g[1]};--ang:${g[2]};--d:${14 + (i % 3) * 4}px"><span>${esc(w.title)}</span></div>`;
    const links = (w.links || []).map(l =>
      `<a class="act" href="${esc(legacy(l.href))}" target="_blank" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`).join('');
    const gal = w.gallery && w.gallery.length
      ? `<button type="button" class="act" data-gallery="${kind}:${i}">Mockup <span aria-hidden="true">· ${w.gallery.length} 張</span></button>` : '';
    return `<article class="card">
      <div class="cover">${cover}</div>
      <div class="card-head">
        ${w.tag ? `<span class="tag">${esc(w.tag)}</span>` : ''}
        <h3${isZh(w.title) ? ' lang="zh"' : ''}>${esc(w.title)}</h3>
      </div>
      <div class="card-body">
        ${w.desc ? `<p>${esc(w.desc)}</p>` : ''}
        ${w.features && w.features.length ? `<ul class="feats">${w.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
        ${links || gal ? `<div class="actions">${links}${gal}</div>` : ''}
      </div>
    </article>`;
  }
  $('#list-ai').innerHTML = W.ai.map((w, i) => card(w, i, 'ai')).join('');
  $('#list-handmade').innerHTML = W.handmade.map((w, i) => card(w, i, 'handmade')).join('');

  /* ---------- 路由：# → hero，#works / #handmade → 作品舞台 ---------- */
  const stage = $('#stage'), wipe = $('.wipe'), bands = $$('.wipe i');
  const tabs = $$('[role="tab"]'), ink = $('.tab-ink');
  const ROUTES = ['works', 'handmade'];
  let current = null, busy = null;
  const panelOf = r => $('#panel-' + r);
  const routeFromHash = () => { const h = location.hash.slice(1); return ROUTES.includes(h) ? h : null; };

  function moveInk(r, instant) {
    const b = tabs.find(t => t.dataset.route === r); if (!b) return;
    const to = { x: b.offsetLeft, width: b.offsetWidth };
    if (instant || reduce) gsap.set(ink, to); else gsap.to(ink, { ...to, duration: .45, ease: 'power3.inOut' });
  }
  function selectTab(r) {
    tabs.forEach(t => { const on = t.dataset.route === r; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  }
  function revealCards(panel) {
    if (reduce) return;
    gsap.fromTo($$('.card, .panel-head', panel), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power3.out', stagger: .06, clearProps: 'transform,opacity' });
  }

  function openStage(r) {
    ROUTES.forEach(x => { panelOf(x).hidden = x !== r; });
    selectTab(r);
    const show = () => {
      stage.hidden = false; document.body.classList.add('stage-open'); stage.scrollTop = 0;
      if (window.Avatar) window.Avatar.paused = true;
      moveInk(r, true); revealCards(panelOf(r));
    };
    if (reduce) { show(); return Promise.resolve(); }
    // 五個色階由深到淺從底部往上蓋滿，最後一層是紙色，接著直接換成舞台
    return new Promise(done => {
      gsap.set(bands, { scaleY: 0, transformOrigin: '50% 100%' }); wipe.style.visibility = 'visible';
      gsap.timeline({ onComplete: () => { wipe.style.visibility = 'hidden'; done(); } })
        .to(bands, { scaleY: 1, duration: .6, ease: 'power3.inOut', stagger: .08 })
        .add(show)
        .set(bands, { scaleY: 0 });
    });
  }
  function closeStage() {
    const hide = () => {
      stage.hidden = true; document.body.classList.remove('stage-open');
      if (window.Avatar && window.Avatar.resume) window.Avatar.resume();
    };
    if (reduce) { hide(); return Promise.resolve(); }
    // 反向：色階整片蓋著，由淺到深依序往上收起，露出 hero
    return new Promise(done => {
      gsap.set(bands, { scaleY: 1, transformOrigin: '50% 0%' }); wipe.style.visibility = 'visible'; hide();
      gsap.timeline({ onComplete: () => { wipe.style.visibility = 'hidden'; gsap.set(bands, { scaleY: 0 }); done(); } })
        .to(bands.slice().reverse(), { scaleY: 0, duration: .55, ease: 'power3.inOut', stagger: .07 })
        .fromTo('.intro > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'power3.out', stagger: .05, clearProps: 'transform,opacity' }, '-=.35');
    });
  }
  function switchTab(from, to) {
    const dir = ROUTES.indexOf(to) > ROUTES.indexOf(from) ? 1 : -1, a = panelOf(from), b = panelOf(to);
    selectTab(to); moveInk(to);
    if (reduce) { a.hidden = true; b.hidden = false; return Promise.resolve(); }
    return new Promise(done => {
      gsap.timeline({ onComplete: done })
        .to(a, { x: -40 * dir, opacity: 0, duration: .25, ease: 'power2.in' })
        .add(() => { a.hidden = true; gsap.set(a, { clearProps: 'all' }); b.hidden = false; stage.scrollTo({ top: 0 }); })
        .fromTo(b, { x: 40 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
    });
  }

  async function route() {
    if (busy) await busy;
    const r = routeFromHash();
    if (r === current) return;
    const prev = current; current = r;
    if (r && !prev) busy = openStage(r);
    else if (!r && prev) busy = closeStage();
    else if (r && prev) busy = switchTab(prev, r);
    await busy; busy = null;
    if (r) panelOf(r).focus({ preventScroll: true });
    if (routeFromHash() !== current) route();
  }
  addEventListener('hashchange', route);
  // 初次載入帶著 hash 時直接顯示舞台，不播轉場
  if (routeFromHash()) {
    current = routeFromHash(); ROUTES.forEach(x => { panelOf(x).hidden = x !== current; }); selectTab(current);
    stage.hidden = false; document.body.classList.add('stage-open'); if (window.Avatar) window.Avatar.paused = true;
    requestAnimationFrame(() => moveInk(current, true));
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { location.hash = t.dataset.route; });
    t.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k) return;
      const n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); location.hash = n.dataset.route;
    });
  });
  $('.home').addEventListener('click', e => { e.preventDefault(); history.pushState(null, '', location.pathname + location.search); route(); });
  addEventListener('popstate', route);
  addEventListener('resize', () => current && moveInk(current, true));
  addEventListener('keydown', e => { if (e.key === 'Escape' && current && !lb.open) $('.home').click(); });

  /* ---------- 燈箱 ---------- */
  const lb = $('#lightbox'), lbImg = $('#lb-img'), lbBody = $('#lb-body');
  let gal = [], gi = 0;
  function showShot(i) {
    gi = i; const s = gal[i];
    lbImg.src = s.src; lbImg.alt = s.title; $('#lb-title').textContent = s.title;
    $('#lb-count').textContent = `${i + 1} / ${gal.length}`;
    $('#lb-prev').disabled = i === 0; $('#lb-next').disabled = i === gal.length - 1; lbBody.scrollTop = 0;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-gallery]'); if (!b) return;
    const [k, i] = b.dataset.gallery.split(':'); gal = W[k][+i].gallery; showShot(0); lb.showModal();
  });
  $('#lb-prev').addEventListener('click', () => gi > 0 && showShot(gi - 1));
  $('#lb-next').addEventListener('click', () => gi < gal.length - 1 && showShot(gi + 1));
  $('#lb-close').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && gi < gal.length - 1) showShot(gi + 1);
    if (e.key === 'ArrowLeft' && gi > 0) showShot(gi - 1);
  });

  /* ---------- 複製 email ---------- */
  $$('.copy').forEach(b => b.addEventListener('click', () => {
    const done = () => { b.classList.add('done'); b.setAttribute('aria-label', '已複製'); setTimeout(() => { b.classList.remove('done'); b.setAttribute('aria-label', '複製 email'); }, 1600); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(b.dataset.copy).then(done, fallback); } catch (e) { fallback(); }
  }));
})();
