// Login: nickname + optional passcode, or continue as guest.
// Data stays in this browser. The passcode is stored only as a one-way hash (see profile.js).
(function () {
  const form = document.querySelector('#profile-form');
  const guestButton = document.querySelector('#guest-button');
  const nicknameInput = document.querySelector('#nickname');
  const passcodeInput = document.querySelector('#passcode');
  const message = document.querySelector('#form-message');

  function enterRoom(nickname, isGuest) {
    localStorage.setItem('dridhNickname', nickname);
    localStorage.setItem('dridhGuest', String(isGuest));
    window.location.href = 'chat.html';
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    message.textContent = '';
    const nickname = nicknameInput.value.trim();
    const passcode = passcodeInput.value;
    if (!nickname) {
      message.textContent = 'Add a nickname so Dridh knows what to call you.';
      nicknameInput.focus();
      return;
    }
    const key = nickname.toLowerCase();
    const map = window.Dridh.profiles();
    const existing = Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;

    if (existing) {
      // This nickname already has a passcode on this device: it must match.
      const attempt = await window.Dridh.hashPass(nickname, passcode);
      if (attempt !== existing) {
        message.textContent = 'This nickname is protected on this device. Enter its passcode, or pick another nickname.';
        passcodeInput.focus();
        return;
      }
    } else {
      map[key] = passcode ? await window.Dridh.hashPass(nickname, passcode) : '';
      window.Dridh.saveProfiles(map);
    }
    enterRoom(nickname, false);
  });

  guestButton.addEventListener('click', function () {
    enterRoom('Guest', true);
  });
})();
