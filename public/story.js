// Story room: public-source author summary, book description cascade, legal reading links, and PDF study sheet.
(function () {
  const params = new URLSearchParams(location.search);
  const title = params.get('title') || 'Wings of Fire';
  const author = params.get('author') || 'A. P. J. Abdul Kalam';
  const category = params.get('category') || 'Motivation';
  const wikiTitle = params.get('wiki') || author;
  const coverUrl = params.get('cover') || '';
  const nickname = localStorage.getItem('dridhNickname') || 'Guest';
  const state = { authorSummary: null, authorStory: null, authorReady: false, bookDescription: null, googleVolumeId: '', googleViewability: '', authorCards: [], bookCards: [], currentAuthor: 0, currentBook: 0, legalUrl: '', legalLabel: '', legalSource: '' };
  const $ = (selector) => document.querySelector(selector);
  const els = { profile: $('#profile-badge'), authorPhoto: $('#author-photo'), avatar: $('#author-avatar'), authorHeading: $('#author-heading'), authorYears: $('#author-years'), authorDescription: $('#author-description'), category: $('#category-label'), bookHeading: $('#book-heading'), subtitle: $('#story-subtitle'), authorCard: $('#author-card'), authorProgressRow: $('#author-progress-row'), authorControls: $('#author-controls'), authorError: $('#author-error'), readAuthorCard: $('#read-author-card'), pickAnother: $('#pick-another-book'), authorLabel: $('#author-progress-label'), authorBar: $('#author-progress-bar'), authorTitle: $('#author-card-title'), bookTab: $('#book-tab'), authorTab: $('#author-tab'), authorPanel: $('#author-story'), bookPanel: $('#book-story'), bookCard: $('#book-card'), bookLabel: $('#book-progress-label'), bookBar: $('#book-progress-bar'), bookTitle: $('#book-card-title'), previewSection: $('#preview-section'), previewHook: $('#preview-hook'), previewCredit: $('#preview-credit'), previewButton: $('#preview-button'), previewFrame: $('#google-preview'), previewMessage: $('#preview-message'), readBook: $('#read-book'), readHeading: $('#read-book-heading'), readCopy: $('#read-book-copy'), legal: $('#download-legal'), borrow: $('#borrow-link'), library: $('#library-link'), buy: $('#buy-link'), actionHeading: $('#action-heading'), actionCopy: $('#action-copy'), message: $('#story-message'), pdf: $('#download-pdf') };
  els.profile.textContent = nickname === 'Guest' ? 'Guest mode' : nickname;
  els.category.textContent = `${category.toUpperCase()} / STORY ROOM`;
  els.bookHeading.textContent = title;
  els.subtitle.textContent = `Six author cards for ${author}, followed by a five-card book story.`;

  function logSource(source, url) { console.log('[Dridh Books] source used:', source, url); }
  async function fetchJson(url, source) { const response = await fetch(url); if (!response.ok) throw new Error(`${source} HTTP ${response.status}`); const data = await response.json(); logSource(source, url); return data; }
  function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'DB'; }
  function cleanText(text) { return String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  function sentences(text) { return cleanText(text).split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter((item) => item.length > 24); }
  function firstYear(text, marker) { const match = String(text || '').match(new RegExp(`${marker}[^0-9]{0,45}((?:1[5-9]|20)\\d{2})`, 'i')); return match ? match[1] : ''; }
  function authorYears(extract) { const born = firstYear(extract, 'born'); const died = firstYear(extract, 'died'); if (born || died) return `${born || '—'} – ${died || 'present'}`; return 'Years not stated in the Wikipedia summary'; }
  function descriptionText(data) { return cleanText(typeof data?.description === 'object' ? data.description.value : data?.description); }
  function descriptionFromWork(data) { return cleanText(typeof data?.description === 'object' ? data.description.value : data?.description); }
  function safeUrl(value) { try { return new URL(value).toString(); } catch { return ''; } }
  function setLegalDiscoveryLinks() {
    const query = encodeURIComponent(`${title} ${author}`);
    els.borrow.href = `https://openlibrary.org/search?q=${query}`;
    els.library.href = `https://www.worldcat.org/search?q=${query}`;
    els.buy.href = `https://books.google.com/books?q=${query}`;
  }
  function renderPreviewHook() {
    const source = state.bookDescription?.text;
    if (!source) { els.previewHook.textContent = 'The public book description is unavailable right now. Use the legal options below to decide where to explore this title.'; return; }
    const words = cleanText(source).replace(/[“”"']/g, '').split(/\s+/).filter(Boolean).slice(0, 16).join(' ').toLowerCase();
    els.previewHook.textContent = `The public description points toward ${words}. If that direction matches what you want to explore, start with the official preview and decide from there.`;
  }
  async function loadGooglePreview() {
    els.previewSection.hidden = false;
    renderPreviewHook();
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(`intitle:${title} inauthor:${author}`)}&maxResults=5`;
    try {
      const data = await fetchJson(url, 'Google Books preview lookup');
      const item = (data.items || []).find((candidate) => ['PARTIAL', 'ALL_PAGES'].includes(candidate.accessInfo?.viewability) && candidate.id);
      if (!item) { els.previewMessage.textContent = 'No Google Books preview is available for this title.'; return; }
      state.googleVolumeId = item.id;
      state.googleViewability = item.accessInfo.viewability;
      els.previewButton.hidden = false;
      els.previewCredit.hidden = false;
      console.log('[Dridh Books] Google Books preview volume:', item.id, 'viewability:', item.accessInfo.viewability);
    } catch (error) {
      console.warn('[Dridh Books] Google Books preview lookup failed:', error.message);
      els.previewMessage.textContent = 'The official preview is unavailable right now. The legal borrow, library, and buy options remain below.';
    }
  }
  function openGooglePreview() {
    if (!state.googleVolumeId) { els.previewMessage.textContent = 'No Google Books preview is available for this title.'; return; }
    els.previewButton.disabled = true;
    els.previewButton.textContent = 'Loading preview…';
    els.previewFrame.hidden = false;
    els.previewMessage.textContent = 'Opening the official Google Books viewer…';
    const loadViewer = () => {
      if (!window.google?.books) { els.previewMessage.textContent = 'The official Google Books viewer could not load. Try again in a moment.'; els.previewButton.disabled = false; els.previewButton.textContent = 'Read the beginning (free preview)'; return; }
      window.google.books.load();
      window.google.books.setOnLoadCallback(() => {
        const viewer = new window.google.books.DefaultViewer(els.previewFrame);
        viewer.load(state.googleVolumeId, () => { viewer.goToPage(0); els.previewMessage.textContent = `Preview opened at the beginning. Viewability: ${state.googleViewability}.`; els.previewButton.disabled = false; els.previewButton.textContent = 'Read the beginning (free preview)'; }, () => { els.previewMessage.textContent = 'Google Books could not open this preview. The legal options remain below.'; els.previewButton.disabled = false; els.previewButton.textContent = 'Read the beginning (free preview)'; });
      });
    };
    loadViewer();
  }

  async function loadAuthor() {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle.replace(/ /g, '_'))}`;
    try {
      const data = await fetchJson(url, 'Wikipedia REST author summary');
      const extract = cleanText(data.extract);
      state.authorSummary = { title: data.title || author, description: descriptionText(data), extract, thumbnail: data.thumbnail?.source || '', years: authorYears(extract) };
      els.authorHeading.textContent = state.authorSummary.title;
      els.authorYears.textContent = state.authorSummary.years;
      els.authorDescription.textContent = state.authorSummary.description || extract.slice(0, 260) || 'A public Wikipedia summary was found, but it has no short description.';
      if (state.authorSummary.thumbnail) { els.authorPhoto.src = state.authorSummary.thumbnail; els.authorPhoto.alt = `Photo of ${state.authorSummary.title}`; els.authorPhoto.hidden = false; els.avatar.hidden = true; } else { els.avatar.textContent = initials(state.authorSummary.title); }
      const article = await window.get_author_story(wikiTitle);
      if (!article) throw new Error('Wikipedia did not return a usable 600-character author article');
      state.authorStory = article;
      state.authorReady = true;
      buildAuthorCards(article.text);
      if (state.bookDescription) buildBookCards(state.bookDescription.text, state.bookDescription.source);
    } catch (error) {
      console.warn('[Dridh Books] Stage 3 author story failed:', error.message);
      els.authorHeading.textContent = author;
      els.authorYears.textContent = 'Author story unavailable';
      els.authorDescription.textContent = 'Wikipedia did not return enough full-article text to safely build the six story cards.';
      els.avatar.textContent = initials(author);
      showAuthorFailure('The author story could not be loaded from Wikipedia. Pick another book to try a different author.');
    }
  }

  function buildAuthorCards(extract) {
    const sourceSentences = sentences(extract);
    const evidence = (patterns, offset) => {
      const matches = sourceSentences.filter((sentence) => patterns.some((pattern) => sentence.toLowerCase().includes(pattern))).slice(0, 2);
      return matches.length ? matches : sourceSentences.slice(offset, offset + 2);
    };
    const evidenceText = (items) => (items.length ? items.join(' ') : 'The full article did not provide a reliable passage for this card.').slice(0, 520);
    const labels = ['The opening', 'The path', 'The work', 'The impact', 'The person', 'Your reflection'];
    state.authorCards = [
      { title: labels[0], text: `The article identifies ${author} through this sourced description: ${evidenceText(evidence(['was an', 'is an', 'known as', 'born'], 0))}` },
      { title: labels[1], text: `The article traces an early part of the journey through: ${evidenceText(evidence(['childhood', 'education', 'studied', 'early life', 'began', 'family'], 1))}` },
      { title: labels[2], text: `A challenge, pressure, or difficult context mentioned in the article is: ${evidenceText(evidence(['struggle', 'poverty', 'war', 'illness', 'imprison', 'opposition', 'failed', 'difficult'], 2))}` },
      { title: labels[3], text: `A change or turning point described by the article is: ${evidenceText(evidence(['appointed', 'published', 'founded', 'became', 'breakthrough', 'discovered', 'won', 'joined'], 3))}` },
      { title: labels[4], text: `The lasting work or contribution named in the article is: ${evidenceText(evidence(['work', 'legacy', 'influence', 'contribution', 'wrote', 'created', 'developed'], 4))}` },
      { title: labels[5], text: 'Choose one sourced idea from these cards, write it in your own words, and turn it into one small action for today.' }
    ];
    renderAuthorCard();
  }

  function showAuthorFailure(message) {
    state.authorReady = false;
    els.authorProgressRow.hidden = true;
    els.authorCard.hidden = true;
    els.authorControls.hidden = true;
    els.authorError.hidden = false;
    els.bookTab.hidden = true;
    els.bookPanel.hidden = true;
    els.subtitle.textContent = 'Choose another book to continue.';
    showMessage(message);
  }

  async function loadBookDescription() {
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(`intitle:${title} inauthor:${author}`)}&maxResults=5`;
    try {
      const google = await fetchJson(googleUrl, 'Google Books');
      const match = (google.items || []).find((item) => item.volumeInfo?.description);
      if (match?.volumeInfo?.description) { state.bookDescription = { text: cleanText(match.volumeInfo.description), source: 'Google Books' }; logSource('Google Books description', match.selfLink || googleUrl); }
    } catch (error) { console.warn('[Dridh Books] Google Books description failed:', error.message); }
    if (!state.bookDescription) {
      try {
        const search = await fetchJson(`https://openlibrary.org/search.json?q=${encodeURIComponent(`title:${title} author:${author}`)}&limit=5&fields=key,title,author_name`, 'Open Library book search');
        const workKey = search.docs?.map((doc) => doc.key).find((key) => key?.startsWith('/works/'));
        if (workKey) {
          const work = await fetchJson(`https://openlibrary.org${workKey}.json`, 'Open Library work description');
          const text = descriptionFromWork(work);
          if (text) state.bookDescription = { text, source: 'Open Library' };
        }
      } catch (error) { console.warn('[Dridh Books] Open Library work description failed:', error.message); }
    }
    if (!state.bookDescription) {
      try {
        const search = await fetchJson(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${title} ${author}`)}&srlimit=5&format=json&origin=*`, 'Wikipedia book search');
        const pageTitle = search.query?.search?.[0]?.title;
        if (pageTitle) {
          const summary = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`, 'Wikipedia REST book summary');
          if (summary.extract) state.bookDescription = { text: cleanText(summary.extract), source: 'Wikipedia' };
        }
      } catch (error) { console.warn('[Dridh Books] Wikipedia book description failed:', error.message); }
    }
    if (state.bookDescription) {
      buildBookCards(state.bookDescription.text, state.bookDescription.source);
      await loadLegalReadingLinks();
    } else {
      els.bookTab.hidden = true;
      els.bookPanel.hidden = true;
      els.subtitle.textContent = 'The book summary is unavailable from public descriptions right now.';
      els.previewSection.hidden = false;
      renderPreviewHook();
      els.readBook.hidden = false;
      els.readCopy.textContent = 'No book summary available. A book story tab cannot be safely generated without a public description.';
      showMessage('No book summary available. The author story remains visible.');
    }
  }

  function buildBookCards(description, source) {
    if (!state.authorReady) return;
    const sourceSentences = sentences(description);
    const fact = (index) => sourceSentences[index % Math.max(sourceSentences.length, 1)] || cleanText(description);
    state.bookCards = [
      { title: 'What it is about', text: `The public description presents this book through the following focus: ${fact(0)}` },
      { title: 'The main idea', text: `The central idea visible in the description is: ${fact(1)}` },
      { title: 'Key lessons', text: `The description points readers toward this lesson or theme: ${fact(2)}` },
      { title: 'Who should read it', text: `This is a useful fit for readers drawn to the subject and themes named in the public description: ${fact(0)}` },
      { title: 'One small action step', text: 'Write down one sentence from the description that matters to you, then choose one small action you can take today in response.' }
    ];
    els.bookTab.hidden = false;
    els.bookPanel.hidden = false;
    renderPreviewHook();
    els.readBook.hidden = false;
    els.readCopy.textContent = `Summary and cards based on ${source}. Checking for a legal public-domain edition.`;
    els.actionHeading.textContent = 'Start with one small action.';
    els.actionCopy.textContent = state.bookCards[4].text;
    renderBookCard();
  }

  function renderAuthorCard() {
    if (!state.authorReady || !state.authorCards.length) return;
    const card = state.authorCards[state.currentAuthor];
    els.authorLabel.textContent = `CARD ${state.currentAuthor + 1} OF 6`;
    els.authorBar.style.width = `${((state.currentAuthor + 1) / 6) * 100}%`;
    els.authorTitle.textContent = card.title;
    els.authorCard.querySelector('.card-number').textContent = String(state.currentAuthor + 1).padStart(2, '0');
    els.authorCard.querySelector('h3').textContent = card.title;
    els.authorCard.querySelector('p').textContent = card.text;
    els.authorCard.querySelector('.card-source').textContent = 'Wikipedia full article';
  }
  function renderBookCard() {
    if (!state.bookCards.length) return;
    const card = state.bookCards[state.currentBook];
    els.bookLabel.textContent = `CARD ${state.currentBook + 1} OF 5`;
    els.bookBar.style.width = `${((state.currentBook + 1) / 5) * 100}%`;
    els.bookTitle.textContent = card.title;
    els.bookCard.querySelector('.card-number').textContent = String(state.currentBook + 1).padStart(2, '0');
    els.bookCard.querySelector('h3').textContent = card.title;
    els.bookCard.querySelector('p').textContent = card.text;
    els.bookCard.querySelector('.card-source').textContent = `Summary based on ${state.bookDescription.source}`;
  }
  function showMessage(text) { els.message.textContent = text; }
  function activateTab(tab) { const isAuthor = tab === 'author'; els.authorTab.classList.toggle('active', isAuthor); els.bookTab.classList.toggle('active', !isAuthor); els.authorPanel.hidden = !isAuthor; els.bookPanel.hidden = isAuthor; }
  function readAuthorCard() {
    const card = state.authorCards[state.currentAuthor];
    if (!card || !('speechSynthesis' in window)) { showMessage('Read aloud is not supported in this browser.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${card.title}. ${card.text}`);
    utterance.rate = .96;
    utterance.pitch = 1.04;
    els.readAuthorCard.textContent = '◼ Stop reading';
    utterance.onend = () => { els.readAuthorCard.textContent = '♩ Read aloud'; };
    window.speechSynthesis.speak(utterance);
  }

  async function loadLegalReadingLinks() {
    const gutendexUrl = `https://gutendex.com/books/?search=${encodeURIComponent(`${title} ${author}`)}`;
    try {
      const data = await fetchJson(gutendexUrl, 'Gutendex public-domain catalog');
      const result = data.results?.find((book) => book.formats?.['application/epub+zip'] || book.formats?.['application/pdf']);
      if (result) {
        state.legalUrl = result.formats['application/epub+zip'] || result.formats['application/pdf'];
        state.legalLabel = result.formats['application/epub+zip'] ? 'Download EPUB/PDF' : 'Download PDF';
        state.legalSource = 'Gutendex';
        els.readHeading.textContent = 'Legal public-domain edition';
        els.legal.href = state.legalUrl; els.legal.textContent = state.legalLabel; els.legal.hidden = false; els.readCopy.textContent = 'A public-domain file is available through Gutendex. Downloading stays inside this website when the browser permits it.'; return;
      }
    } catch (error) { console.warn('[Dridh Books] Gutendex lookup failed:', error.message); }
    try {
      const data = await fetchJson(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(`title:"${title}" AND creator:"${author}" AND mediatype:texts`)}&fl[]=identifier&rows=5&output=json`, 'Internet Archive public-domain search');
      const identifier = data.response?.docs?.[0]?.identifier;
      if (identifier) { state.legalUrl = `https://archive.org/details/${encodeURIComponent(identifier)}`; state.legalLabel = 'Open legal edition ↗'; state.legalSource = 'Internet Archive'; els.readHeading.textContent = 'Legal public-domain edition'; els.legal.href = state.legalUrl; els.legal.textContent = state.legalLabel; els.legal.hidden = false; els.readCopy.textContent = 'A legal public-domain edition is available through Internet Archive.'; return; }
    } catch (error) { console.warn('[Dridh Books] Internet Archive lookup failed:', error.message); }
    els.readHeading.textContent = 'Explore a legal copy';
    els.readCopy.textContent = 'No public-domain EPUB/PDF was found. No unofficial download link is shown.';
  }

  async function downloadGutendexFile(event) {
    if (state.legalSource !== 'Gutendex' || !state.legalUrl) return;
    event.preventDefault();
    const originalLabel = els.legal.textContent;
    els.legal.textContent = 'Downloading…';
    els.legal.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(state.legalUrl, { mode: 'cors' });
      if (!response.ok) throw new Error(`Gutendex file HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'dridh-book'}.${state.legalUrl.toLowerCase().includes('.epub') ? 'epub' : 'pdf'}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      showMessage('Your legal public-domain file was downloaded.');
      console.log('[Dridh Books] legal file downloaded in website:', state.legalUrl);
    } catch (error) {
      console.warn('[Dridh Books] Gutendex blob download failed; opening legal file link:', error.message);
      window.open(state.legalUrl, '_blank', 'noopener');
      showMessage('Your browser opened the file. Use the download icon to save it.');
    } finally {
      els.legal.textContent = originalLabel;
      els.legal.removeAttribute('aria-busy');
    }
  }

  function compactPdfText(text, maxChars = 360) { const value = cleanText(text); if (value.length <= maxChars) return value; const shortened = value.slice(0, maxChars - 1); return `${shortened.slice(0, shortened.lastIndexOf(' '))}…`; }
  function addWrappedPdfText(pdf, text, x, y, width, lineHeight = 5, maxChars = 360) { const lines = pdf.splitTextToSize(compactPdfText(text, maxChars), width); lines.forEach((line) => { if (y > 274) { pdf.addPage(); y = 18; } pdf.text(line, x, y); y += lineHeight; }); return y; }
  function makeAvatarDataUrl() { const canvas = document.createElement('canvas'); canvas.width = 180; canvas.height = 180; const ctx = canvas.getContext('2d'); const gradient = ctx.createLinearGradient(0, 0, 180, 180); gradient.addColorStop(0, '#00dce6'); gradient.addColorStop(1, '#7928ca'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 180, 180); ctx.fillStyle = '#0b0d19'; ctx.font = '700 58px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(initials(author), 90, 94); return canvas.toDataURL('image/png'); }
  async function imageDataUrl(url) { if (!url) return makeAvatarDataUrl(); try { const response = await fetch(url, { mode: 'cors' }); const blob = await response.blob(); return await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(makeAvatarDataUrl()); reader.readAsDataURL(blob); }); } catch { return makeAvatarDataUrl(); } }
  async function downloadPdf() {
    if (!state.authorReady || state.authorCards.length < 6) { showMessage('The story pack is waiting for a verified author story. Pick another book if Wikipedia cannot provide enough text.'); return; }
    if (!window.jspdf?.jsPDF) { showMessage('PDF download is unavailable in this browser. Please use print-to-PDF instead.'); return; }
    els.pdf.disabled = true; els.pdf.textContent = 'Preparing PDF…';
    try {
      const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      const margin = 16; let y = 18;
      pdf.setFillColor(11, 13, 25); pdf.rect(0, 0, 210, 297, 'F'); pdf.setTextColor(225, 225, 243);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.text('DRIDH BOOKS', margin, y); y += 9;
      pdf.setFontSize(14); pdf.text(title, margin, y); y += 7; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(185, 202, 203); pdf.text(`Author: ${author}`, margin, y); y += 6;
      const photo = await imageDataUrl(state.authorSummary?.thumbnail || ''); try { pdf.addImage(photo, 'PNG', 164, 15, 28, 28); } catch (error) { console.warn('[Dridh Books] PDF author image fallback:', error.message); }
      pdf.setDrawColor(0, 220, 230); pdf.line(margin, y, 194, y); y += 9;
      pdf.setTextColor(225, 225, 243); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Meet the author', margin, y); y += 6; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); y = addWrappedPdfText(pdf, state.authorSummary?.description || state.authorSummary?.extract || 'Author summary unavailable.', margin, y, 174, 4.5, 420) + 5;
      const writeCards = (heading, cards) => { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(0, 242, 254); if (y > 265) { pdf.addPage(); y = 18; } pdf.text(heading, margin, y); y += 7; cards.forEach((card, index) => { if (y > 265) { pdf.addPage(); y = 18; } pdf.setTextColor(255, 207, 144); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text(`${String(index + 1).padStart(2, '0')}  ${card.title}`, margin, y); y += 5; pdf.setTextColor(225, 225, 243); pdf.setFont('helvetica', 'normal'); y = addWrappedPdfText(pdf, card.text, margin + 4, y, 170, 4.1, 300) + 3; }); };
      writeCards("Author's story", state.authorCards); if (state.bookCards.length) writeCards('Book story', state.bookCards);
      if (y > 264) { pdf.addPage(); y = 18; } pdf.setTextColor(255, 207, 144); pdf.setFont('helvetica', 'bold'); pdf.text("Today's small action", margin, y); y += 6; pdf.setTextColor(225, 225, 243); pdf.setFont('helvetica', 'normal'); y = addWrappedPdfText(pdf, state.bookCards[4]?.text || 'Choose one small step from today’s reading.', margin, y, 174, 4.5, 300) + 8;
      const pageCount = pdf.internal.getNumberOfPages(); for (let page = 1; page <= pageCount; page += 1) { pdf.setPage(page); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(132, 148, 149); pdf.text('Made with Dridh Books. Sources: Wikipedia, Open Library, Google Books.', margin, 288); pdf.text(`${page} / ${pageCount}`, 185, 288); }
      pdf.save(`${title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'dridh-books'}-story-pack.pdf`); showMessage('Your story pack PDF was downloaded.');
    } catch (error) { console.error('[Dridh Books] PDF generation failed:', error); showMessage('The story pack PDF could not be created safely. Please try again or use your browser’s print-to-PDF.'); } finally { els.pdf.disabled = false; els.pdf.textContent = '▣ Download story pack (PDF)'; }
  }

  $('#back-button').addEventListener('click', () => { location.href = 'chat.html'; });
  els.authorTab.addEventListener('click', () => activateTab('author'));
  els.bookTab.addEventListener('click', () => activateTab('book'));
  $('#author-back').addEventListener('click', () => { state.currentAuthor = (state.currentAuthor + 5) % 6; renderAuthorCard(); });
  $('#author-next').addEventListener('click', () => { state.currentAuthor = (state.currentAuthor + 1) % 6; renderAuthorCard(); });
  $('#book-back').addEventListener('click', () => { state.currentBook = (state.currentBook + 4) % 5; renderBookCard(); });
  $('#book-next').addEventListener('click', () => { state.currentBook = (state.currentBook + 1) % 5; renderBookCard(); });
  els.readAuthorCard.addEventListener('click', () => {
    if ('speechSynthesis' in window && els.readAuthorCard.textContent.includes('Stop')) { window.speechSynthesis.cancel(); els.readAuthorCard.textContent = '♩ Read aloud'; } else readAuthorCard();
  });
  els.pickAnother.addEventListener('click', () => { window.location.href = 'chat.html#books-section'; });
  els.previewButton.addEventListener('click', openGooglePreview);
  setLegalDiscoveryLinks();
  els.legal.addEventListener('click', downloadGutendexFile);
  els.pdf.addEventListener('click', downloadPdf);
  activateTab('author');
  loadAuthor();
  loadBookDescription();
  loadGooglePreview();
})();
