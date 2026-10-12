// Dridh Books motion layer.
//  1. Page curtain (CSS) + smooth wipe when leaving for another page.
//  2. Split-letter headlines, word-by-word paragraphs and staggered scroll reveals.
//  3. Live entrances for chat messages, book cards, saved books and story cards.
//  4. Magnetic buttons, click shockwaves, confetti on wins, parallax nebulae, scroll progress.
// It only runs when html.m-on was set by the inline <head> check (no reduced motion, Effects on).
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('m-on')) return;

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var introMs = root.classList.contains('m-fast') ? 350 : 900;
  var start = performance.now();
  try { sessionStorage.setItem('dridhIntro', '1'); } catch (e) { /* storage blocked */ }

  function $all(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }
  function afterIntro(fn) { var wait = introMs - (performance.now() - start); wait > 0 ? setTimeout(fn, wait) : fn(); }

  // ---------- Text splitting ----------
  // Text nodes are split into <m-word>/<m-char>; child elements (e.g. #greeting-name) become
  // single animated units so scripts that update them keep working.
  function splitChars(el) {
    if (el.classList.contains('m-split')) return;
    var i = 0;
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.data.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var word = document.createElement('m-word');
          Array.from(part).forEach(function (ch) {
            var c = document.createElement('m-char');
            c.textContent = ch;
            c.style.setProperty('--m-d', 120 + i++ * 38);
            word.appendChild(c);
          });
          frag.appendChild(word);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1) {
        node.classList.add('m-unit');
        node.style.setProperty('--m-d', 120 + i++ * 38);
        i += 3;
      }
    });
    if (!el.id && !el.hasAttribute('aria-label') && !el.querySelector('[id]')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    el.classList.add('m-split');
  }

  function wrapWords(el, cls, step) {
    if (el.classList.contains(cls)) return;
    var i = 0;
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType !== 3 || !node.data.trim()) return;
      var frag = document.createDocumentFragment();
      node.data.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement('m-word');
        w.textContent = part;
        w.style.setProperty('--m-d', i++ * step);
        frag.appendChild(w);
      });
      node.replaceWith(frag);
    });
    el.classList.add(cls);
  }

  // ---------- Kicker text scramble ----------
  var GLYPHS = '01/\\<>*+=#%&?ΣΔπ∞';
  function scramble(el) {
    var node = Array.prototype.slice.call(el.childNodes).reverse().find(function (n) { return n.nodeType === 3 && n.data.trim(); });
    if (!node) return;
    var target = node.data, frame = 0, total = 22, last = target;
    (function tick() {
      if (node.data !== last) return; // the page's own script changed the text; stop.
      var out = '';
      for (var k = 0; k < target.length; k++) {
        var ch = target[k];
        out += (ch === ' ' || k < (frame / total) * target.length) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.data = last = out;
      if (frame++ < total) requestAnimationFrame(tick); else node.data = target;
    })();
  }

  // ---------- Scroll reveal ----------
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);
      afterIntro(function () {
        el.classList.add('is-in');
        if (el.matches('.section-kicker, .card-kicker, .status-pill, .assistant-kicker, .prompt-label')) scramble(el);
        if (el.classList.contains('m-reveal')) {
          // Hand control back to the page's own transitions once the entrance finishes.
          var d = parseFloat(el.style.getPropertyValue('--m-d')) || 0;
          setTimeout(function () { el.classList.remove('m-reveal', 'm-from-left', 'm-from-right', 'm-pop', 'is-in'); }, d + 1400);
        }
      });
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  function reveal(selector, opts) {
    opts = opts || {};
    $all(selector).forEach(function (el, i) {
      if (el.classList.contains('m-reveal')) return;
      el.classList.add('m-reveal');
      if (opts.cls) el.classList.add(opts.cls);
      el.style.setProperty('--m-d', (opts.base || 0) + i * (opts.step || 0));
      io.observe(el);
    });
  }
  function watch(selector, fn) { $all(selector).forEach(function (el) { fn(el); io.observe(el); }); }

  reveal('.sanctum-header h1', { cls: 'm-title' });
  watch('main h1:not(.sanctum-header h1), .books-heading h2, .thread-heading h2, .preview-copy h2, .read-book-section h2, .action-section h2, .story-heading-block h2', splitChars);
  watch('.sanctum-header p, .assistant-greeting p, .nav-page-card > p, .card-heading p', function (el) { wrapWords(el, 'm-words', 45); });
  $all('.section-kicker, .card-kicker, .status-pill, .assistant-kicker, .prompt-label').forEach(function (el) { io.observe(el); });

  reveal('.feature-ticker', { cls: 'm-pop', base: 350 });
  reveal('.login-showcase', { cls: 'm-pop', base: 250 });
  reveal('.login-card', { base: 200 });
  reveal('.login-card form > *', { base: 350, step: 60 });
  reveal('.orb-mode-bar .mode', { cls: 'm-pop', base: 150, step: 90 });
  reveal('.hero-orb-wrap', { cls: 'm-pop', base: 100 });
  reveal('.voice-control-bar, .voice-status', { base: 450, step: 120 });
  reveal('.prompt-section > *', { cls: 'm-pop', step: 70 });
  reveal('.thread-section, .story-toolbar, .story-tabs, .preview-section, .read-book-section, .action-section', { step: 0 });
  reveal('.author-spotlight', { cls: 'm-from-left' });
  reveal('.story-panel', { cls: 'm-from-right' });
  reveal('.nav-page-card', { base: 100 });
  reveal('.nav-form > *', { base: 250, step: 55 });
  reveal('.nav-progress', { base: 300 });
  reveal('.sanctum-footer, .chat-footer', {});

  // ---------- Live content ----------
  function animateMessage(article) {
    article.classList.add('m-msg-in');
    var p = article.querySelector('p');
    if (p && article.classList.contains('assistant-message')) wrapWords(p, 'm-stream', 28);
  }
  function deal(nodes) {
    nodes.forEach(function (el, i) { el.style.setProperty('--m-deal', i * 110); });
  }
  var conversation = document.querySelector('#conversation');
  if (conversation) {
    $all('.message', conversation).forEach(function (m) { m.classList.add('m-reveal', 'm-from-left'); io.observe(m); });
    new MutationObserver(function (list) {
      list.forEach(function (rec) { rec.addedNodes.forEach(function (n) { if (n.nodeType === 1 && n.matches('.message')) animateMessage(n); }); });
    }).observe(conversation, { childList: true });
  }
  ['#book-grid', '#saved-list'].forEach(function (sel) {
    var host = document.querySelector(sel);
    if (!host) return;
    var sync = function () { deal($all(':scope > *', host)); };
    sync();
    new MutationObserver(sync).observe(host, { childList: true });
  });

  // Story cards flip to the next card; direction follows the button pressed.
  var flipDir = 'm-flip';
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#author-back, #book-back, #author-next, #book-next');
    if (b) flipDir = /back/.test(b.id) ? 'm-flip-back' : 'm-flip';
  }, true);
  // Observe an element and run fn on content changes made by the page's scripts,
  // ignoring the mutations fn itself makes.
  function onContentChange(el, fn) {
    var pending = false;
    var obs = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        obs.disconnect();
        fn();
        obs.takeRecords();
        obs.observe(el, { childList: true, characterData: true, subtree: true });
      });
    });
    obs.observe(el, { childList: true, characterData: true, subtree: true });
  }
  function resplit(h) {
    if (h.querySelector('m-char')) return;
    h.classList.remove('m-split', 'is-in');
    splitChars(h);
    requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('is-in'); }); });
  }
  $all('.story-card-large').forEach(function (card) {
    onContentChange(card, function () {
      card.classList.remove('m-flip', 'm-flip-back');
      void card.offsetWidth;
      card.classList.add(flipDir);
      var h = card.querySelector('h3');
      if (h) resplit(h);
    });
  });
  // Headings filled in by scripts (author name, book title, shelf title) re-animate on change.
  $all('h1[id], h2[id]').forEach(function (h) {
    if (h.closest('.sanctum-header')) return;
    onContentChange(h, function () { resplit(h); });
  });

  // Counters / progress readouts bump when their numbers change.
  $all('#streak-text, #sankalp-streak, #sankalp-days, #author-progress-label, #book-progress-label').forEach(function (el) {
    new MutationObserver(function () {
      el.classList.remove('m-bump'); void el.offsetWidth; el.classList.add('m-bump');
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  // ---------- Celebrations ----------
  var COLORS = ['#00f2fe', '#ffaa00', '#7928ca', '#ff8b7d', '#e1e1f3'];
  function confetti(x, y, count) {
    for (var i = 0; i < count; i++) {
      var bit = document.createElement('i');
      bit.className = 'm-bit';
      bit.style.background = COLORS[i % COLORS.length];
      document.body.appendChild(bit);
      var angle = Math.random() * Math.PI * 2, speed = 120 + Math.random() * 260;
      var dx = Math.cos(angle) * speed, dy = Math.sin(angle) * speed - 160;
      bit.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + (x + dx) + 'px,' + (y + dy + 320) + 'px) rotate(' + (Math.random() * 900 - 450) + 'deg)', opacity: 0 }
      ], { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.15,.7,.3,1)' }).onfinish = bit.remove.bind(bit);
    }
  }
  function shock(x, y, color) {
    var ring = document.createElement('i');
    ring.className = 'm-shock';
    ring.style.left = x + 'px'; ring.style.top = y + 'px';
    ring.style.setProperty('--m-c', color);
    document.body.appendChild(ring);
    ring.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(5)', opacity: 0 }],
      { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = ring.remove.bind(ring);
  }
  var shockCount = 0;
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('button, a, .choice-button');
    if (!t) return;
    var x = e.clientX, y = e.clientY;
    if (!x && !y) { var r = t.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    shock(x, y, COLORS[shockCount++ % 4]);
    var label = (t.textContent || '').toLowerCase();
    if (t.id === 'sankalp-tick' || (t.classList.contains('story-button') && /save/.test(label)) || t.matches('#sankalp-form button[type=submit]')) confetti(x, y, 46);
  });

  // ---------- Magnetic buttons ----------
  if (finePointer) {
    $all('.button, .choice-button, .voice-button, .send-button, .mute-button, .story-control, .mini-action, .preview-button, .download-pdf-button, .fx-toggle').forEach(function (b) {
      b.classList.add('m-magnetic');
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--m-mx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
        b.style.setProperty('--m-my', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--m-mx', '0px'); b.style.setProperty('--m-my', '0px'); });
    });
  }

  // ---------- Scroll progress, header, parallax ----------
  var bar = document.createElement('div');
  bar.className = 'm-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var header = document.querySelector('.app-header');
  var nebulae = $all('.nebula');
  var px = 0, py = 0, ticking = false;
  function paint() {
    ticking = false;
    var max = document.documentElement.scrollHeight - innerHeight;
    var y = scrollY;
    bar.style.setProperty('--m-progress', max > 0 ? (y / max).toFixed(4) : 0);
    if (header) header.classList.toggle('m-scrolled', y > 12);
    nebulae.forEach(function (n, i) {
      var dir = i % 2 ? -1 : 1;
      n.style.setProperty('--m-px', (px * 40 * dir).toFixed(1) + 'px');
      n.style.setProperty('--m-py', (py * 30 * dir - y * 0.08 * dir).toFixed(1) + 'px');
    });
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  if (finePointer) addEventListener('pointermove', function (e) { px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; queue(); }, { passive: true });
  paint();

  // ---------- Page transitions ----------
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname.replace(/\.html$/, '') === location.pathname.replace(/\.html$/, '') && url.search === location.search) return; // same-page hash jumps
    e.preventDefault();
    root.classList.add('m-fast', 'm-leaving');
    setTimeout(function () { location.href = url.href; }, 420);
  });
  addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('m-leaving'); });
})();
