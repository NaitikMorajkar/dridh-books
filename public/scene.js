// Lightweight Three.js login showcase. It pauses when hidden and falls back to Lite mode.
(function () {
  const canvas = document.querySelector('#hero-canvas');
  if (!canvas || !window.THREE) return;
  const liteKey = 'dridhLiteMode';
  const prefersLite = window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.hardwareConcurrency <= 2;
  if (prefersLite) localStorage.setItem(liteKey, 'true');
  if (localStorage.getItem(liteKey) === 'true') { canvas.style.display = 'none'; return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); } catch (error) { localStorage.setItem(liteKey, 'true'); canvas.style.display = 'none'; return; }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 11);
  const group = new THREE.Group(); scene.add(group);
  scene.add(new THREE.AmbientLight(0x9aa8ff, 1.35));
  const cyanLight = new THREE.PointLight(0x00f2fe, 2.1, 30); cyanLight.position.set(-4, 2, 5); scene.add(cyanLight);
  const amberLight = new THREE.PointLight(0xffaa00, 1.8, 30); amberLight.position.set(4, -2, 4); scene.add(amberLight);
  const bookColors = [0x00dce6, 0xffaa00, 0x7928ca, 0x4facfe];
  for (let i = 0; i < 4; i += 1) {
    const book = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.22, 1.55), new THREE.MeshStandardMaterial({ color: bookColors[i], roughness: .55, metalness: .18 }));
    book.position.set((i - 1.5) * .55, Math.sin(i) * .5, -i * .35);
    book.rotation.set(.15 + i * .08, -.25 + i * .12, -.12 + i * .1);
    book.userData.baseY = book.position.y; book.userData.phase = i * .9; group.add(book);
  }
  const starGeometry = new THREE.BufferGeometry(); const positions = [];
  for (let i = 0; i < 70; i += 1) positions.push((Math.random() - .5) * 18, (Math.random() - .5) * 8, (Math.random() - .5) * 8);
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xe1e1f3, size: .035, transparent: true, opacity: .7 })));
  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (event) => { pointer.x = (event.clientX / window.innerWidth - .5) * .35; pointer.y = (event.clientY / window.innerHeight - .5) * .2; }, { passive: true });
  function resize() { const width = canvas.clientWidth || 720; const height = canvas.clientHeight || 340; renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }
  resize(); window.addEventListener('resize', resize);
  let frame = 0;
  function animate() { if (document.hidden) { frame = 0; return; } frame = requestAnimationFrame(animate); const time = performance.now() * .00035; group.rotation.y += (pointer.x - group.rotation.y) * .02; group.rotation.x += (-pointer.y - group.rotation.x) * .02; group.children.forEach((book) => { book.position.y = book.userData.baseY + Math.sin(time * 7 + book.userData.phase) * .08; }); renderer.render(scene, camera); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !frame) animate(); }); animate();
})();
