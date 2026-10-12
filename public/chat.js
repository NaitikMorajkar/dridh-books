// Assistant chat (keyword matching), voice, and the book shelf.
(function () {
  const nickname = localStorage.getItem('dridhNickname') || 'Guest';
  const isGuest = localStorage.getItem('dridhGuest') === 'true';
  const profileBadge = document.querySelector('#profile-badge');
  const greetingName = document.querySelector('#greeting-name');
  const welcomeCopy = document.querySelector('#welcome-copy');
  const greeting = document.querySelector('#greeting-message');
  const conversation = document.querySelector('#conversation');
  const form = document.querySelector('#chat-form');
  const input = document.querySelector('#chat-input');
  const micButton = document.querySelector('#mic-button');
  const voiceStatus = document.querySelector('#voice-status');
  const muteButton = document.querySelector('#mute-button');
  const orb = document.querySelector('#assistant-orb');
  const orbStatus = document.querySelector('#orb-status');
  const booksSection = document.querySelector('#books-section');
  const bookGrid = document.querySelector('#book-grid');
  const booksTitle = document.querySelector('#books-title');
  const booksSubtitle = document.querySelector('#books-subtitle');
  let muted = false;
  let currentCategory = '';

  const streakText = document.querySelector('#streak-text');
  if (streakText) { const n = window.Dridh.sankalp.streak(); streakText.textContent = `${n}-DAY STREAK`; }
  profileBadge.textContent = isGuest ? 'Guest mode' : nickname;
  greetingName.textContent = isGuest ? 'there' : nickname;
  welcomeCopy.textContent = isGuest ? 'You’re exploring as a guest. Tell me what you’re going through, or tell me what you want to learn right now.' : `Tell me what you’re going through, ${nickname}, or tell me what you want to learn right now.`;
  greeting.textContent = isGuest ? 'Hi there. I’m Dridh — a little reading room for busy days. What would you like to read into?' : `Hi ${nickname}. I’m Dridh — a little reading room for busy days. What would you like to read into?`;

  const keywords = {
    'Exam stress': ['exam', 'test', 'scared', 'stress', 'anxious', 'anxiety', 'panic', 'revision', 'study'],
    Physics: ['physics', 'space', 'energy', 'motion', 'science', 'quantum'],
    Maths: ['math', 'maths', 'algebra', 'number', 'geometry', 'calculus'],
    Career: ['career', 'job', 'future', 'work', 'profession', 'college'],
    Biography: ['biography', 'life story', 'person', 'scientist', 'leader', 'author'],
    Motivation: ['motivat', 'tired', 'stuck', 'hope', 'confidence', 'discipline', 'inspire']
  };

  function setOrbState(state) {
    orb.classList.toggle('is-listening', state === 'listening');
    orb.classList.toggle('is-speaking', state === 'speaking');
    orbStatus.textContent = state === 'listening' ? 'LISTENING…' : state === 'speaking' ? 'VOICE RESPONDING' : 'WEB SPEECH API READY';
  }

  function speak(text) {
    if (muted || !('speechSynthesis' in window)) return;
    setOrbState('speaking');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = .96;
    utterance.pitch = 1.04;
    utterance.onend = () => setOrbState('idle');
    window.speechSynthesis.speak(utterance);
  }

  function findCategory(text) {
    const normalized = text.toLowerCase();
    let best = { category: 'Motivation', score: 0 };
    Object.entries(keywords).forEach(([category, words]) => {
      const score = words.reduce((count, word) => count + (normalized.includes(word) ? 1 : 0), 0);
      if (score > best.score) best = { category, score };
    });
    return best.category;
  }

  function addMessage(text, type) {
    const article = document.createElement('article');
    article.className = `message ${type}-message`;
    const label = document.createElement('span');
    label.className = 'message-label';
    label.textContent = type === 'user' ? 'YOU' : '◉ DRIDH ASSISTANT';
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    article.append(label, paragraph);
    conversation.appendChild(article);
    article.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function makePlaceholder(title, author) {
    const placeholder = document.createElement('div');
    placeholder.className = 'cover-placeholder';
    placeholder.innerHTML = '<span>DRIDH</span><strong></strong><small>60 SEC STORY</small>';
    placeholder.title = `${title} by ${author}`;
    return placeholder;
  }

  function showBooksFromNav() {
    booksSection.hidden = false;
    if (!currentCategory) {
      booksTitle.textContent = 'Book shelf';
      booksSubtitle.textContent = 'Choose a quick prompt above to load 2–3 verified books.';
      bookGrid.innerHTML = '<div class="books-empty"><p>Your shelf is ready. Pick Motivation, Exam stress, Physics, Maths, Career, or Biography to begin.</p></div>';
    }
    booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderBooks(books, category) {
    booksSection.hidden = false;
    booksTitle.textContent = `${category} / choose a small spark`;
    booksSubtitle.textContent = 'These suggestions passed an author Wikipedia check. Covers come from Open Library when available.';
    bookGrid.replaceChildren();
    books.forEach((book, index) => {
      const card = document.createElement('article');
      card.className = 'book-card';
      card.style.setProperty('--card-delay', `${index * 90}ms`);
      const stage = document.createElement('div');
      stage.className = 'book-card-stage';
      const cover = document.createElement('div');
      cover.className = 'book-cover-3d';
      if (book.coverUrl) {
        const image = document.createElement('img');
        image.src = book.coverUrl;
        image.alt = `Cover of ${book.title}`;
        image.loading = 'lazy';
        image.addEventListener('error', () => { cover.replaceChildren(makePlaceholder(book.title, book.author)); });
        cover.appendChild(image);
      } else {
        cover.appendChild(makePlaceholder(book.title, book.author));
      }
      stage.appendChild(cover);
      const meta = document.createElement('div');
      meta.className = 'book-meta';
      const tag = document.createElement('span');
      tag.className = 'book-tag';
      tag.textContent = `${category} • 60s story`;
      const title = document.createElement('h3');
      title.textContent = book.title;
      const author = document.createElement('p');
      author.textContent = book.author;
      const links = document.createElement('div');
      links.className = 'book-links';
      const wiki = document.createElement('a');
      wiki.href = book.wikipediaUrl;
      wiki.target = '_blank';
      wiki.rel = 'noopener';
      wiki.textContent = 'Author on Wikipedia ↗';
      const storyButton = document.createElement('button');
      storyButton.type = 'button';
      storyButton.className = 'story-button';
      storyButton.textContent = 'Meet the author →';
      storyButton.addEventListener('click', () => {
        const storyParams = new URLSearchParams({ title: book.title, author: book.author, wiki: book.wikipediaTitle, category, cover: book.coverUrl || '' });
        window.location.href = `story.html?${storyParams.toString()}`;
      });
      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.className = 'story-button';
      const refreshSave = () => { saveButton.textContent = window.Dridh.saved.has(book) ? '✓ Saved (tap to remove)' : '♡ Save book'; };
      refreshSave();
      saveButton.addEventListener('click', () => {
        const nowSaved = window.Dridh.saved.toggle({ title: book.title, author: book.author, wikipediaTitle: book.wikipediaTitle, category, coverUrl: book.coverUrl || '' });
        refreshSave();
        voiceStatus.textContent = nowSaved ? `Saved “${book.title}” to your list on this device.` : `Removed “${book.title}” from your list.`;
      });
      links.append(wiki, storyButton, saveButton);
      meta.append(tag, title, author, links);
      card.append(stage, meta);
      bookGrid.appendChild(card);
    });
    booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function loadBooks(category) {
    currentCategory = category;
    booksSection.hidden = false;
    booksTitle.textContent = `Finding ${category.toLowerCase()} stories…`;
    booksSubtitle.textContent = 'Checking curated authors against Wikipedia, then looking up covers in Open Library.';
    bookGrid.innerHTML = '<div class="books-loading"><span class="loading-orb"></span><p>Validating authors and gathering 2–3 good books…</p></div>';
    try {
      const books = await window.search_books(category);
      if (!books.length) {
        booksTitle.textContent = 'No verified books yet';
        booksSubtitle.textContent = 'The public sources did not return enough usable results. Try another category.';
        bookGrid.innerHTML = '<div class="books-empty"><p>I couldn’t find enough books with a usable author page right now.</p><button class="mini-action" id="empty-category-button" type="button">Pick another category</button></div>';
        document.querySelector('#empty-category-button').addEventListener('click', () => document.querySelector('.prompt-section').scrollIntoView({ behavior: 'smooth' }));
        return;
      }
      renderBooks(books, category);
      voiceStatus.textContent = `${books.length} verified book suggestions ready for ${category}.`;
    } catch (error) {
      console.warn('[Dridh Books] search_books failed:', error);
      booksTitle.textContent = 'The shelf is taking a breath';
      booksSubtitle.textContent = 'The public book sources are unavailable. Try again or pick another category.';
      bookGrid.innerHTML = '<div class="books-empty"><p>No blank cards here — please try another category in a moment.</p></div>';
    }
  }

  function respond(text) {
    const category = findCategory(text);
    const reply = `I hear you. I’m placing “${category}” on your reading path. I’ll bring you 2–3 verified books first, then we can open an author story. Anything else I can help with?`;
    addMessage(reply, 'assistant');
    speak(reply);
    voiceStatus.textContent = `Mapped to ${category}. Checking the public shelf…`;
    loadBooks(category);
  }

  function submitText(text) {
    const cleanText = text.trim();
    if (!cleanText) {
      voiceStatus.textContent = 'Tell me a little more, or choose a category.';
      input.focus();
      return;
    }
    addMessage(cleanText, 'user');
    input.value = '';
    respond(cleanText);
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); submitText(input.value); });
  document.querySelectorAll('.choice-button').forEach((button) => button.addEventListener('click', () => submitText(`I want something about ${button.dataset.category}.`)));
  document.querySelector('#another-category').addEventListener('click', () => document.querySelector('.prompt-section').scrollIntoView({ behavior: 'smooth' }));
  document.querySelector('#another-book').addEventListener('click', () => { if (currentCategory) loadBooks(currentCategory); });
  document.querySelector('#done-button').addEventListener('click', () => { booksSection.hidden = true; addMessage('A good small step for today is saved. Come back whenever you want another story.', 'assistant'); });
  document.querySelectorAll('a[href*="#books-section"]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showBooksFromNav(); }));
  if (location.hash === '#books-section') showBooksFromNav();

  muteButton.addEventListener('click', () => {
    muted = !muted;
    muteButton.textContent = muted ? '◌' : '◖';
    muteButton.setAttribute('aria-pressed', String(muted));
    if (muted && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    voiceStatus.textContent = muted ? 'Replies will stay silent.' : 'Replies can be read aloud.';
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micButton.disabled = true;
    micButton.title = 'Voice input is not supported in this browser';
    voiceStatus.textContent = 'Voice input is not supported here, so typing is ready for you.';
  } else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setOrbState('listening'); micButton.classList.add('listening'); voiceStatus.textContent = 'Listening — tell me what is on your mind.'; };
    recognition.onresult = (event) => { input.value = event.results[0][0].transcript; submitText(input.value); };
    recognition.onerror = () => { setOrbState('idle'); micButton.classList.remove('listening'); voiceStatus.textContent = 'I couldn’t catch that. You can try again or type instead.'; };
    recognition.onend = () => { setOrbState('idle'); micButton.classList.remove('listening'); };
    micButton.addEventListener('click', () => { if (micButton.classList.contains('listening')) recognition.stop(); else recognition.start(); });
  }

  document.querySelector('#logout-button').addEventListener('click', () => {
    localStorage.removeItem('dridhNickname');
    localStorage.removeItem('dridhGuest');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    window.location.href = 'index.html';
  });
})();
