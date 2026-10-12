// 3D effects for Dridh Books:
//  1. A background of floating 3D books lit by a colourful "pointer light" that follows the mouse.
//  2. 3D tilt on cards (they lean toward the pointer and glow in the pointer's colour).
//  3. An "Effects on/off" switch (Lite mode) for slow phones and people who prefer less motion.
// Everything pauses when the tab is hidden. If WebGL or Three.js is missing, the page still works.
(function () {
  'use strict';
  var LITE_KEY = 'dridhLiteMode';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var stored = null;
  try { stored = localStorage.getItem(LITE_KEY); } catch (e) { /* storage blocked */ }
  var lite = stored === 'true' || reduce;

  function hue() { return (performance.now() / 25) % 360; }

  // ---- Effects switch (always available) ----
  function addToggle() {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'fx-toggle';
    button.textContent = lite ? '✨ Effects: off' : '✨ Effects: on';
    button.setAttribute('aria-pressed', String(!lite));
    button.setAttribute('aria-label', 'Turn 3D effects on or off');
    button.addEventListener('click', function () {
      try { localStorage.setItem(LITE_KEY, lite ? 'false' : 'true'); } catch (e) { /* ignore */ }
      window.location.reload();
    });
    document.body.appendChild(button);
  }
  addToggle();
  if (lite) return;

  // ---- 1. Floating 3D books background ----
  function startBackground() {
    if (!window.THREE || document.querySelector('#hero-canvas')) return; // login page already has its own 3D hero
    var canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false }); }
    catch (error) { canvas.remove(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 14);
    scene.add(new THREE.AmbientLight(0x8890ff, 0.8));
    var pointerLight = new THREE.PointLight(0x00f2fe, 3.2, 28);
    pointerLight.position.set(0, 0, 4);
    scene.add(pointerLight);

    var small = window.innerWidth < 700 || !finePointer;
    var count = small ? 8 : 16;
    var colors = [0x00f2fe, 0x7b61ff, 0xffaa00, 0xff4fd8, 0x4de4cf];
    var books = [];
    for (var i = 0; i < count; i++) {
      var color = colors[i % colors.length];
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.22, 1.05),
        new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.18, roughness: 0.45, metalness: 0.2, transparent: true, opacity: 0.88 })
      );
      mesh.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 15, -2 - Math.random() * 7);
      mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      mesh.userData = { sx: (Math.random() - 0.5) * 0.5, sy: (Math.random() - 0.5) * 0.5, baseY: mesh.position.y, phase: Math.random() * 6 };
      scene.add(mesh);
      books.push(mesh);
    }
    var starPositions = [];
    for (var s = 0; s < 120; s++) starPositions.push((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 24, -4 - Math.random() * 10);
    var starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xe1e1f3, size: 0.06, transparent: true, opacity: 0.6 })));

    var pointer = { x: 0.5, y: 0.5, last: 0 };
    window.addEventListener('pointermove', function (event) {
      pointer.x = event.clientX / window.innerWidth;
      pointer.y = event.clientY / window.innerHeight;
      pointer.last = performance.now();
    }, { passive: true });

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    var frame = 0, previous = performance.now();
    function animate(now) {
      if (document.hidden) { frame = 0; return; }
      frame = requestAnimationFrame(animate);
      var dt = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      var t = now / 1000;
      var idle = now - pointer.last > 3000;
      var tx = idle ? Math.sin(t * 0.5) * 0.35 + 0.5 : pointer.x;
      var ty = idle ? Math.cos(t * 0.4) * 0.25 + 0.5 : pointer.y;
      pointerLight.position.x += ((tx - 0.5) * 26 - pointerLight.position.x) * 0.12;
      pointerLight.position.y += (-(ty - 0.5) * 15 - pointerLight.position.y) * 0.12;
      pointerLight.color.setHSL(((now / 25) % 360) / 360, 1, 0.6);
      camera.position.x += ((tx - 0.5) * 2.2 - camera.position.x) * 0.04;
      camera.position.y += (-(ty - 0.5) * 1.4 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      for (var k = 0; k < books.length; k++) {
        var b = books[k];
        b.rotation.x += b.userData.sx * dt;
        b.rotation.y += b.userData.sy * dt;
        b.position.y = b.userData.baseY + Math.sin(t * 0.8 + b.userData.phase) * 0.35;
      }
      renderer.render(scene, camera);
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && !frame) { previous = performance.now(); frame = requestAnimationFrame(animate); }
    });
    frame = requestAnimationFrame(animate);
  }
  try { startBackground(); } catch (error) { console.warn('[Dridh Books] 3D background skipped:', error.message); }

  // ---- 2. 3D tilt on cards ----
  if (!finePointer) return;
  var tiltRules = [['.book-card', 9], ['.saved-item', 6], ['.story-card-large', 5], ['.login-card', 3], ['.nav-page-card', 2]];
  var selector = tiltRules.map(function (r) { return r[0]; }).join(',');
  var active = null;
  function maxFor(el) {
    for (var i = 0; i < tiltRules.length; i++) if (el.matches(tiltRules[i][0])) return tiltRules[i][1];
    return 4;
  }
  function reset(el) {
    el.style.rotate = 'none';
    el.style.removeProperty('--fx-glow');
    el.classList.remove('fx-tilt');
  }
  document.addEventListener('pointermove', function (event) {
    var el = event.target.closest ? event.target.closest(selector) : null;
    if (active && active !== el) reset(active);
    active = el;
    if (!el) return;
    var r = el.getBoundingClientRect();
    var px = (event.clientX - r.left) / r.width - 0.5;
    var py = (event.clientY - r.top) / r.height - 0.5;
    var magnitude = Math.min(1, Math.hypot(px, py) * 2);
    if (el.parentElement) el.parentElement.style.perspective = '1000px';
    el.classList.add('fx-tilt');
    el.style.setProperty('--fx-glow', 'hsl(' + Math.round(hue()) + ' 100% 62% / .5)');
    el.style.rotate = magnitude < 0.01 ? 'none' : (-py) + ' ' + px + ' 0 ' + (magnitude * maxFor(el)) + 'deg';
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { if (active) { reset(active); active = null; } });
})();
