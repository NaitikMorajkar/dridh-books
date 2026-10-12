// Saved books page: shows books saved from the shelf, with open-story and remove buttons.
(() => {
  const D = window.Dridh;
  const person = D.current();
  const badge = document.querySelector('#profile-badge');
  if (badge) badge.textContent = person.guest ? 'Guest mode' : person.name;
  const list = document.querySelector('#saved-list');
  const empty = document.querySelector('#saved-empty');
  const copy = document.querySelector('#saved-copy');
  if (person.guest && copy) copy.textContent = 'Books you save appear here. You are a guest, so this list stays only on this device and browser. Create a nickname on the first page to keep a separate list.';

  function makeCover(book) {
    const box = document.createElement('div');
    box.className = 'saved-cover';
    if (book.coverUrl) {
      const img = document.createElement('img');
      img.src = book.coverUrl; img.alt = `Cover of ${book.title}`; img.loading = 'lazy';
      img.addEventListener('error', () => { box.textContent = 'DRIDH'; });
      box.appendChild(img);
    } else { box.textContent = 'DRIDH'; }
    return box;
  }

  function render() {
    const books = D.saved.list();
    list.replaceChildren();
    empty.hidden = books.length > 0;
    books.forEach((book) => {
      const item = document.createElement('article');
      item.className = 'saved-item';
      const info = document.createElement('div');
      info.className = 'saved-info';
      const title = document.createElement('h3'); title.textContent = book.title;
      const author = document.createElement('p'); author.textContent = book.author + (book.category ? ' · ' + book.category : '');
      const actions = document.createElement('div'); actions.className = 'saved-actions';
      const open = document.createElement('a');
      open.className = 'button button-primary nav-cta';
      open.textContent = 'Open story →';
      open.href = 'story.html?' + new URLSearchParams({ title: book.title, author: book.author, wiki: book.wikipediaTitle || book.author, category: book.category || '', cover: book.coverUrl || '' }).toString();
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'button button-ghost'; remove.textContent = 'Remove';
      remove.addEventListener('click', () => { D.saved.remove(book); render(); });
      actions.append(open, remove);
      info.append(title, author, actions);
      item.append(makeCover(book), info);
      list.appendChild(item);
    });
  }
  render();
})();
