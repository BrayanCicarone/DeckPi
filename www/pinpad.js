/* pinpad.js — teclado numérico estilo cofre/iPhone para PIN de 4 dígitos.
   Usado em login.html e no app.js (troca de PIN). */

function createPinPad(opts) {
  const length = (opts && opts.length) || 4;
  const onSubmit = opts && opts.onSubmit;
  let value = '';

  const wrap = document.createElement('div');
  wrap.className = 'pinpad';
  wrap.addEventListener('animationend', () => wrap.classList.remove('shake'));

  const dots = document.createElement('div');
  dots.className = 'pin-dots';
  const dotEls = [];
  for (let i = 0; i < length; i++) {
    const d = document.createElement('span');
    d.className = 'pin-dot';
    dots.appendChild(d);
    dotEls.push(d);
  }
  wrap.appendChild(dots);

  const keys = document.createElement('div');
  keys.className = 'pin-keys';
  const layout = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];
  layout.forEach((k) => {
    const b = document.createElement('button');
    b.type = 'button';
    if (k === '') {
      b.className = 'pin-key pin-key-empty';
      b.disabled = true;
      b.tabIndex = -1;
    } else if (k === 'back') {
      b.className = 'pin-key pin-key-back';
      b.setAttribute('aria-label', 'Apagar');
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 4H8l-7 8 7 8h13a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1Z"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
      b.onclick = () => backspace();
    } else {
      b.className = 'pin-key';
      b.textContent = k;
      b.onclick = () => press(k);
    }
    keys.appendChild(b);
  });
  wrap.appendChild(keys);

  function render() {
    dotEls.forEach((d, i) => d.classList.toggle('filled', i < value.length));
  }

  function press(digit) {
    if (value.length >= length) return;
    value += digit;
    render();
    if (value.length === length) {
      const v = value;
      setTimeout(() => { if (onSubmit) onSubmit(v); }, 120);
    }
  }

  function backspace() {
    value = value.slice(0, -1);
    render();
  }

  function reset() {
    value = '';
    render();
  }

  function shake() {
    wrap.classList.remove('shake');
    void wrap.offsetWidth; // reflow para reiniciar a animação
    wrap.classList.add('shake');
    reset();
  }

  return {
    el: wrap,
    reset,
    shake,
    get value() { return value; },
  };
}
