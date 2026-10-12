(() => {
  // Mouse users get it in place of the system cursor; on touch screens it follows the finger.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  try { if (localStorage.getItem('dridhLiteMode') === 'true') return; } catch (e) { /* storage blocked */ }

  const pointer = document.createElement('div');
  pointer.className = 'dridh-pointer';
  pointer.setAttribute('aria-hidden', 'true');
  // Stacked layers behind the face give the arrow real 3D depth.
  const depth = Array.from({ length: 10 }, (_, i) => `<b style="--i:${i}"></b>`).join('');
  pointer.innerHTML = '<span class="dridh-pointer-stage">'
    + '<span class="dridh-pointer-orbit"><i></i><i></i></span>'
    + `<span class="dridh-pointer-tilt"><span class="dridh-pointer-body">${depth}<b class="dridh-pointer-face"></b></span></span>`
    + '</span>';
  document.body.appendChild(pointer);
  if (finePointer) document.body.classList.add('has-dridh-pointer');

  let targetX = -40;
  let targetY = -40;
  let currentX = targetX;
  let currentY = targetY;
  let visible = false;
  let lastTrail = 0;
  let raf = 0;
  let hue = 190;

  const interactiveSelector = [
    'a[href]', 'button:not(:disabled)', '[role="button"]', 'input', 'select', 'textarea',
    '.choice-button', '.story-tab', '.book-story-card', '.story-card-large', '.story-panel',
    '.nav-page-card', '.read-book-section', '.download-legal-button', '.preview-button',
    '.mini-action', '.nav-cta'
  ].join(',');

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let sparks = 0;
  const burst = (x, y) => {
    for (let i = 0; i < 10 && sparks < 40; i += 1) {
      const spark = document.createElement('span');
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
      const distance = 28 + Math.random() * 34;
      spark.className = 'dridh-spark';
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      spark.style.setProperty('--h', String(Math.round((hue + i * 36) % 360)));
      document.body.appendChild(spark);
      sparks += 1;
      window.setTimeout(() => { spark.remove(); sparks -= 1; }, 650);
    }
  };

  const spawnTrail = (x, y) => {
    const now = performance.now();
    if (now - lastTrail < 34) return;
    lastTrail = now;
    const trail = document.createElement('span');
    trail.className = 'dridh-pointer-trail';
    trail.style.left = `${x}px`;
    trail.style.top = `${y}px`;
    trail.style.setProperty('--h', String(Math.round(hue)));
    trail.style.setProperty('--s', `${5 + Math.random() * 6}px`);
    document.body.appendChild(trail);
    window.setTimeout(() => trail.remove(), 520);
  };

  const animate = () => {
    currentX += (targetX - currentX) * 0.4;
    currentY += (targetY - currentY) * 0.4;
    const speed = Math.hypot(targetX - currentX, targetY - currentY);
    hue = (hue + 0.8 + Math.min(speed, 40) * 0.15) % 360;
    pointer.style.setProperty('--h', String(Math.round(hue)));
    pointer.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    // The arrow leans in the direction the pointer moves.
    pointer.style.setProperty('--ptilt-y', `${clamp((targetX - currentX) * 0.7, -38, 38)}deg`);
    pointer.style.setProperty('--ptilt-x', `${clamp(-(targetY - currentY) * 0.7, -38, 38)}deg`);
    raf = requestAnimationFrame(animate);
  };

  let hideTimer = 0;
  const move = (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    if (event.pointerType === 'touch') {
      window.clearTimeout(hideTimer);
      if (!visible) { currentX = targetX; currentY = targetY; }
    }
    if (!visible) {
      visible = true;
      pointer.classList.add('is-visible');
    }
    spawnTrail(targetX, targetY);
    const hit = event.target.closest?.(interactiveSelector);
    pointer.classList.toggle('is-hovering', Boolean(hit));
  };

  const press = (event) => {
    if (event.pointerType === 'touch') move(event);
    pointer.classList.add('is-pressed');
    burst(event.clientX, event.clientY);
  };
  const release = (event) => {
    pointer.classList.remove('is-pressed');
    // Touch has no hover, so fade the pointer out shortly after the finger lifts.
    if (event.pointerType === 'touch') hideTimer = window.setTimeout(leave, 700);
  };
  const leave = () => {
    visible = false;
    pointer.classList.remove('is-visible', 'is-hovering');
  };

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', press, { passive: true });
  window.addEventListener('pointerup', release, { passive: true });
  window.addEventListener('pointercancel', release, { passive: true });
  document.documentElement.addEventListener('mouseleave', leave, { passive: true });
  raf = requestAnimationFrame(animate);

  window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
})();
