// Shared helpers: local profile, optional passcode, saved books, Sankalp streak.
// Everything is stored only in this browser (localStorage). Nothing is sent to a server.
// The passcode is saved as a one-way SHA-256 hash (never as plain text). This is
// demo-level protection for a device, not a real account system.
(function () {
  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage may be blocked */ } }
  function readJson(key, fallback) { try { const raw = safeGet(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }

  // ---- dates (local time) ----
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dateKey(new Date()); }
  function addDays(key, delta) {
    const p = key.split('-').map(Number);
    const d = new Date(p[0], p[1] - 1, p[2] + delta);
    return dateKey(d);
  }
  function daysBetween(a, b) {
    const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    return Math.round((new Date(pb[0], pb[1] - 1, pb[2]) - new Date(pa[0], pa[1] - 1, pa[2])) / 86400000);
  }

  // ---- current person ----
  function current() {
    const name = safeGet('dridhNickname') || 'Guest';
    const guest = safeGet('dridhGuest') === 'true' || !safeGet('dridhNickname');
    return { name: name, guest: guest, key: guest ? 'guest' : name.trim().toLowerCase() };
  }

  // ---- passcode (hashed) ----
  async function hashPass(name, pass) {
    const text = name.trim().toLowerCase() + ':' + pass;
    if (window.crypto && window.crypto.subtle) {
      const bytes = new TextEncoder().encode(text);
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      return 's256:' + Array.from(new Uint8Array(digest)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }
    // Fallback for very old browsers or non-secure pages: simple, weaker hash.
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    return 'dj:' + h.toString(16);
  }
  function profiles() { return readJson('dridhProfiles', {}); }
  function saveProfiles(map) { safeSet('dridhProfiles', JSON.stringify(map)); }

  // ---- saved books ----
  function savedKey() { return 'dridhSaved:' + current().key; }
  function bookId(b) { return (b.title + '|' + b.author).toLowerCase(); }
  const saved = {
    list: function () { return readJson(savedKey(), []); },
    has: function (b) { return saved.list().some(function (x) { return bookId(x) === bookId(b); }); },
    toggle: function (b) {
      let list = saved.list();
      const exists = list.some(function (x) { return bookId(x) === bookId(b); });
      if (exists) list = list.filter(function (x) { return bookId(x) !== bookId(b); });
      else list.push({ title: b.title, author: b.author, wikipediaTitle: b.wikipediaTitle || b.author, category: b.category || '', coverUrl: b.coverUrl || '' });
      safeSet(savedKey(), JSON.stringify(list));
      return !exists; // true = now saved
    },
    remove: function (b) {
      safeSet(savedKey(), JSON.stringify(saved.list().filter(function (x) { return bookId(x) !== bookId(b); })));
    }
  };

  // ---- Sankalp (goal, daily tick, streak) ----
  function sankalpKey() { return 'dridhSankalp:' + current().key; }
  const sankalp = {
    get: function () { return readJson(sankalpKey(), null); },
    set: function (goal, step, targetDate) {
      const old = sankalp.get();
      const data = { goal: goal, step: step, date: targetDate, start: old && old.start ? old.start : today(), ticks: old && old.ticks ? old.ticks : [] };
      safeSet(sankalpKey(), JSON.stringify(data));
      return data;
    },
    tickedToday: function () { const s = sankalp.get(); return !!(s && s.ticks.indexOf(today()) !== -1); },
    toggleToday: function () {
      const s = sankalp.get();
      if (!s) return null;
      const t = today();
      const i = s.ticks.indexOf(t);
      if (i === -1) s.ticks.push(t); else s.ticks.splice(i, 1);
      safeSet(sankalpKey(), JSON.stringify(s));
      return s;
    },
    streak: function (data) {
      const s = data || sankalp.get();
      if (!s || !s.ticks.length) return 0;
      let day = s.ticks.indexOf(today()) !== -1 ? today() : addDays(today(), -1);
      let count = 0;
      while (s.ticks.indexOf(day) !== -1) { count++; day = addDays(day, -1); }
      return count;
    },
    progress: function (data) {
      const s = data || sankalp.get();
      if (!s) return { percent: 0, done: 0, total: 0 };
      const total = Math.max(1, daysBetween(s.start, s.date) + 1);
      const done = s.ticks.length;
      return { percent: Math.min(100, Math.round((done / total) * 100)), done: done, total: total };
    }
  };

  window.Dridh = { today: today, addDays: addDays, daysBetween: daysBetween, current: current, hashPass: hashPass, profiles: profiles, saveProfiles: saveProfiles, saved: saved, sankalp: sankalp };
})();
