// Sankalp: one goal, one small daily step, a daily tick, a progress meter and a streak.
// Saved only in this browser (see profile.js).
(() => {
  const D = window.Dridh;
  const form = document.querySelector('#sankalp-form');
  const goal = document.querySelector('#sankalp-goal');
  const step = document.querySelector('#sankalp-step');
  const date = document.querySelector('#sankalp-date');
  const meter = document.querySelector('#sankalp-meter');
  const status = document.querySelector('#sankalp-status');
  const streakEl = document.querySelector('#sankalp-streak');
  const daysEl = document.querySelector('#sankalp-days');
  const tickButton = document.querySelector('#sankalp-tick');
  const badge = document.querySelector('#profile-badge');
  const person = D.current();
  if (badge) badge.textContent = person.guest ? 'Guest mode' : person.name;
  date.min = D.today();

  function render() {
    const data = D.sankalp.get();
    if (!data) { meter.style.width = '0%'; tickButton.hidden = true; return; }
    goal.value = data.goal || '';
    step.value = data.step || '';
    date.value = data.date || '';
    const p = D.sankalp.progress(data);
    const streak = D.sankalp.streak(data);
    meter.style.width = p.percent + '%';
    streakEl.textContent = `${streak}-day streak`;
    daysEl.textContent = `${p.done} of ${p.total} days done`;
    const doneToday = D.sankalp.tickedToday();
    tickButton.hidden = false;
    tickButton.textContent = doneToday ? '✓ Done for today (tap to undo)' : '✓ I did today’s small step';
    status.textContent = doneToday
      ? `Nice. Today’s step is done: ${data.step}. 1% is enough.`
      : `Today’s step: ${data.step}. Just one small thing.`;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!goal.value.trim() || !step.value.trim() || !date.value) return;
    D.sankalp.set(goal.value.trim(), step.value.trim(), date.value);
    render();
  });
  tickButton.addEventListener('click', () => { D.sankalp.toggleToday(); render(); });
  render();
})();
