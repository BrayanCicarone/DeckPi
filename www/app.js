/* app.js — Painel de Controle (SPA em JS puro). */

// ---------------------------------------------------------------------------
// Ícones SVG embutidos (sem CDN; funciona offline servido pelo Pico).
// ---------------------------------------------------------------------------
const ICONS = {
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="2.5" fill="currentColor" stroke="currentColor"/><circle cx="15" cy="12" r="2.5" fill="currentColor" stroke="currentColor"/><circle cx="8" cy="17" r="2.5" fill="currentColor" stroke="currentColor"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 8-8M16 5l3 3M14 7l3 3"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/></svg>',
};

const EMOJIS = ['⭐','🚀','💻','🧑‍💻','🪟','🍎','📋','📥','📝','🔧','⚙️','🎮','🎵','🔊','🔇','▶️','⏯️','📁','🌐','📧','🔍','💾','🖥️','⌨️','🖱️','🔑','🛠️','📌','✅','❌','🔥','⚡','🎯','💡','📞','📷','🎬','🖌️','📊','🗂️'];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = (p) => p + Math.random().toString(36).slice(2, 8);

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
let config = null;
let activeProfileId = null;
let editMode = false;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
async function api(path, opts = {}) {
  const r = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (r.status === 401) { location.href = '/'; throw new Error('unauthorized'); }
  return r;
}

async function loadConfig() {
  const r = await api('/api/config');
  config = await r.json();
  activeProfileId = config.activeProfile || (config.profiles[0] && config.profiles[0].id);
}

async function saveConfig() {
  config.activeProfile = activeProfileId;
  const r = await api('/api/config', { method: 'PUT', body: JSON.stringify(config) });
  const data = await r.json();
  if (r.ok && data.ok) toast('Salvo!', 'ok');
  else toast(data.error || 'Falha ao salvar', 'err');
  return r.ok;
}

async function executeButton(profileId, buttonId, cardEl) {
  try {
    const r = await api('/api/execute', {
      method: 'POST',
      body: JSON.stringify({ profileId, buttonId }),
    });
    const data = await r.json();
    flash(cardEl, r.ok && data.ok);
  } catch (e) { flash(cardEl, false); }
}

// ---------------------------------------------------------------------------
// Helpers de UI
// ---------------------------------------------------------------------------
function icon(name) { return ICONS[name] || ''; }

function injectIcons(root = document) {
  $$('[data-icon]', root).forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
    el.removeAttribute('data-icon');
  });
}

function toast(msg, kind = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + kind;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = 'toast ' + kind; }, 2200);
}

function flash(el, ok) {
  if (!el) return;
  el.classList.add(ok ? 'flash-ok' : 'flash-err');
  setTimeout(() => el.classList.remove('flash-ok', 'flash-err'), 500);
}

function activeProfile() {
  return config.profiles.find((p) => p.id === activeProfileId) || config.profiles[0];
}

function glyphHtml(item) {
  if (item.emoji) return `<span class="glyph">${item.emoji}</span>`;
  if (item.icon && ICONS[item.icon]) return `<span class="glyph">${icon(item.icon)}</span>`;
  return `<span class="glyph">${icon('grid')}</span>`;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function renderProfiles() {
  const nav = $('#profiles');
  nav.innerHTML = '';
  config.profiles.forEach((p) => {
    const tab = document.createElement('button');
    tab.className = 'profile-tab' + (p.id === activeProfileId ? ' active' : '');
    tab.innerHTML = `<span class="em">${p.icon || '📁'}</span><span>${p.name}</span>` +
      `<span class="os-badge">${p.os === 'mac' ? '🍎' : '🪟'}</span>`;
    tab.onclick = () => { activeProfileId = p.id; render(); };
    nav.appendChild(tab);
  });
  if (editMode) {
    const add = document.createElement('button');
    add.className = 'profile-tab';
    add.innerHTML = `<span class="em">${icon('plus')}</span><span>Perfil</span>`;
    add.onclick = () => editProfile(null);
    nav.appendChild(add);
  }
}

function render() {
  renderProfiles();
  const main = $('#content');
  main.innerHTML = '';
  const prof = activeProfile();
  if (!prof) { main.innerHTML = '<div class="empty"><span class="em">📭</span>Nenhum perfil.</div>'; return; }

  // Barra do perfil em modo edição
  if (editMode) {
    const bar = document.createElement('div');
    bar.className = 'group-head';
    bar.style.marginTop = '14px';
    bar.innerHTML = `<span class="em">${prof.icon || '📁'}</span><h2>${prof.name}</h2>` +
      `<span class="count">${prof.os.toUpperCase()}</span><div class="group-actions"></div>`;
    const acts = $('.group-actions', bar);
    acts.appendChild(mkMini('edit', () => editProfile(prof.id), 'Editar perfil'));
    acts.appendChild(mkMini('trash', () => deleteProfile(prof.id), 'Excluir perfil'));
    main.appendChild(bar);
  }

  (prof.groups || []).forEach((g) => main.appendChild(renderGroup(prof, g)));

  if (editMode) {
    const addG = document.createElement('button');
    addG.className = 'btn';
    addG.style.marginTop = '20px';
    addG.innerHTML = icon('plus') + ' Adicionar grupo';
    addG.onclick = () => editGroup(prof, null);
    main.appendChild(addG);
  }

  if (!editMode && (!prof.groups || prof.groups.every((g) => !g.buttons.length))) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = '<span class="em">✨</span>Sem macros ainda. Toque no lápis para entrar no modo edição.';
    main.appendChild(empty);
  }
}

function renderGroup(prof, g) {
  const sec = document.createElement('section');
  sec.className = 'group';
  const head = document.createElement('div');
  head.className = 'group-head';
  head.innerHTML = `<span class="em">${g.icon || '📂'}</span><h2>${g.name}</h2>` +
    `<span class="count">${g.buttons.length}</span>`;
  if (editMode) {
    const acts = document.createElement('div');
    acts.className = 'group-actions';
    acts.appendChild(mkMini('edit', () => editGroup(prof, g.id), 'Editar grupo'));
    acts.appendChild(mkMini('trash', () => deleteGroup(prof, g.id), 'Excluir grupo'));
    head.appendChild(acts);
  }
  sec.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'grid';
  g.buttons.forEach((b) => grid.appendChild(renderButton(prof, g, b)));
  if (editMode) {
    const add = document.createElement('button');
    add.className = 'macro add';
    add.innerHTML = `<span class="glyph">${icon('plus')}</span><span class="label">Nova macro</span>`;
    add.onclick = () => editButton(prof, g, null);
    grid.appendChild(add);
  }
  sec.appendChild(grid);
  return sec;
}

function renderButton(prof, g, b) {
  const card = document.createElement('button');
  card.className = 'macro';
  card.style.setProperty('--macro-color', b.color || 'var(--accent)');
  card.innerHTML = glyphHtml(b) + `<span class="label">${b.label || ''}</span>`;
  if (editMode) {
    const badges = document.createElement('div');
    badges.className = 'edit-badges';
    badges.appendChild(mkMini('edit', (e) => { e.stopPropagation(); editButton(prof, g, b.id); }, 'Editar'));
    badges.appendChild(mkMini('trash', (e) => { e.stopPropagation(); deleteButton(g, b.id); }, 'Excluir'));
    card.appendChild(badges);
    card.onclick = () => editButton(prof, g, b.id);
  } else {
    card.onclick = () => executeButton(prof.id, b.id, card);
  }
  return card;
}

function mkMini(ic, onclick, title) {
  const btn = document.createElement('button');
  btn.className = 'mini';
  btn.title = title || '';
  btn.innerHTML = icon(ic);
  btn.onclick = onclick;
  return btn;
}

// ---------------------------------------------------------------------------
// Modais
// ---------------------------------------------------------------------------
function openModal(title, bodyEl, onSave) {
  const root = $('#modal-root');
  root.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `<div class="modal-head"><h3>${title}</h3>` +
    `<button class="icon-btn" data-x>${icon('close')}</button></div>`;
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.appendChild(bodyEl);
  modal.appendChild(body);
  const foot = document.createElement('div');
  foot.className = 'modal-foot';
  const cancel = document.createElement('button');
  cancel.className = 'btn';
  cancel.textContent = 'Cancelar';
  cancel.onclick = closeModal;
  foot.appendChild(cancel);
  if (onSave) {
    const save = document.createElement('button');
    save.className = 'btn primary';
    save.innerHTML = icon('save') + ' Salvar';
    save.onclick = () => { if (onSave() !== false) closeModal(); };
    foot.appendChild(save);
  }
  modal.appendChild(foot);
  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  $('[data-x]', modal).onclick = closeModal;
  root.appendChild(overlay);
}

function closeModal() { $('#modal-root').innerHTML = ''; }

function field(label, inputEl) {
  const f = document.createElement('div');
  f.className = 'field';
  const l = document.createElement('label');
  l.textContent = label;
  f.appendChild(l);
  f.appendChild(inputEl);
  return f;
}

function emojiPicker(current, onPick) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const lab = document.createElement('label');
  lab.textContent = 'Emoji / ícone';
  wrap.appendChild(lab);
  const pick = document.createElement('div');
  pick.className = 'emoji-pick';
  const cur = document.createElement('div');
  cur.className = 'emoji-current';
  cur.textContent = current || '⭐';
  const input = document.createElement('input');
  input.type = 'text';
  input.value = current || '';
  input.placeholder = 'cole um emoji';
  input.style.maxWidth = '120px';
  input.oninput = () => { cur.textContent = input.value || '⭐'; onPick(input.value); };
  pick.appendChild(cur);
  pick.appendChild(input);
  const pal = document.createElement('div');
  pal.className = 'emoji-palette';
  EMOJIS.forEach((e) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = e;
    b.onclick = () => { input.value = e; cur.textContent = e; onPick(e); };
    pal.appendChild(b);
  });
  pick.appendChild(pal);
  wrap.appendChild(pick);
  return wrap;
}

// ---------- Editar perfil ----------
function editProfile(id) {
  const prof = id ? config.profiles.find((p) => p.id === id) : { id: uid('p'), name: '', os: 'windows', icon: '🗂️', groups: [] };
  const isNew = !id;
  const body = document.createElement('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '14px';

  const name = document.createElement('input');
  name.value = prof.name;
  name.placeholder = 'Ex.: Trabalho (Windows)';
  body.appendChild(field('Nome do perfil', name));

  const os = document.createElement('select');
  os.innerHTML = '<option value="windows">Windows</option><option value="mac">macOS</option>';
  os.value = prof.os || 'windows';
  body.appendChild(field('Sistema operacional', os));

  let emoji = prof.icon || '🗂️';
  body.appendChild(emojiPicker(emoji, (v) => { emoji = v; }));

  openModal(isNew ? 'Novo perfil' : 'Editar perfil', body, () => {
    if (!name.value.trim()) { toast('Dê um nome ao perfil', 'err'); return false; }
    prof.name = name.value.trim();
    prof.os = os.value;
    prof.icon = emoji;
    if (isNew) {
      prof.groups = prof.groups || [];
      config.profiles.push(prof);
      activeProfileId = prof.id;
    }
    saveConfig().then(render);
  });
}

function deleteProfile(id) {
  if (config.profiles.length <= 1) { toast('Mantenha ao menos um perfil', 'err'); return; }
  if (!confirm('Excluir este perfil e todas as suas macros?')) return;
  config.profiles = config.profiles.filter((p) => p.id !== id);
  activeProfileId = config.profiles[0].id;
  saveConfig().then(render);
}

// ---------- Editar grupo ----------
function editGroup(prof, id) {
  const g = id ? prof.groups.find((x) => x.id === id) : { id: uid('g'), name: '', icon: '📂', buttons: [] };
  const isNew = !id;
  const body = document.createElement('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '14px';
  const name = document.createElement('input');
  name.value = g.name;
  name.placeholder = 'Ex.: VS Code, Navegador, Mídia';
  body.appendChild(field('Nome do grupo', name));
  let emoji = g.icon || '📂';
  body.appendChild(emojiPicker(emoji, (v) => { emoji = v; }));

  openModal(isNew ? 'Novo grupo' : 'Editar grupo', body, () => {
    if (!name.value.trim()) { toast('Dê um nome ao grupo', 'err'); return false; }
    g.name = name.value.trim();
    g.icon = emoji;
    if (isNew) { prof.groups = prof.groups || []; prof.groups.push(g); }
    saveConfig().then(render);
  });
}

function deleteGroup(prof, id) {
  if (!confirm('Excluir este grupo e suas macros?')) return;
  prof.groups = prof.groups.filter((g) => g.id !== id);
  saveConfig().then(render);
}

// ---------- Editar botão / macro ----------
const STEP_TYPES = {
  text: 'Digitar texto',
  combo: 'Combo de teclas',
  delay: 'Delay (ms)',
  media: 'Tecla de mídia',
  launch: 'Abrir programa',
  macro: 'Chamar outra macro',
};
const MEDIA_KEYS = ['VOLUME_UP', 'VOLUME_DOWN', 'MUTE', 'PLAY_PAUSE', 'NEXT', 'PREVIOUS', 'STOP'];

function editButton(prof, g, id) {
  const b = id ? g.buttons.find((x) => x.id === id)
    : { id: uid('b'), label: '', emoji: '⭐', icon: '', color: '#6366f1', steps: [] };
  const isNew = !id;
  const steps = JSON.parse(JSON.stringify(b.steps || []));

  const body = document.createElement('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '14px';

  const label = document.createElement('input');
  label.value = b.label;
  label.placeholder = 'Ex.: Copiar, Abrir VS Code';
  body.appendChild(field('Nome da macro', label));

  let emoji = b.emoji || '⭐';
  body.appendChild(emojiPicker(emoji, (v) => { emoji = v; }));

  const color = document.createElement('input');
  color.type = 'color';
  color.value = b.color || '#6366f1';
  body.appendChild(field('Cor', color));

  // Editor de passos
  const stepsLabel = document.createElement('label');
  stepsLabel.textContent = 'Passos (executados em ordem)';
  stepsLabel.style.fontSize = '.8rem';
  stepsLabel.style.color = 'var(--text-dim)';
  stepsLabel.style.fontWeight = '600';
  body.appendChild(stepsLabel);

  const stepsBox = document.createElement('div');
  stepsBox.className = 'steps';
  body.appendChild(stepsBox);

  function renderSteps() {
    stepsBox.innerHTML = '';
    steps.forEach((st, i) => stepsBox.appendChild(renderStepEditor(st, i)));
  }

  function renderStepEditor(st, i) {
    const row = document.createElement('div');
    row.className = 'step';
    const top = document.createElement('div');
    top.className = 'step-top';
    const sel = document.createElement('select');
    Object.entries(STEP_TYPES).forEach(([k, v]) => {
      const o = document.createElement('option');
      o.value = k; o.textContent = v;
      if (k === st.type) o.selected = true;
      sel.appendChild(o);
    });
    sel.onchange = () => { steps[i] = { type: sel.value }; renderSteps(); };
    top.appendChild(sel);
    top.appendChild(miniBtn('up', () => { if (i > 0) { [steps[i-1], steps[i]] = [steps[i], steps[i-1]]; renderSteps(); } }));
    top.appendChild(miniBtn('down', () => { if (i < steps.length - 1) { [steps[i+1], steps[i]] = [steps[i], steps[i+1]]; renderSteps(); } }));
    const del = miniBtn('trash', () => { steps.splice(i, 1); renderSteps(); });
    del.classList.add('del');
    top.appendChild(del);
    row.appendChild(top);
    row.appendChild(stepFields(st, i));
    return row;
  }

  function stepFields(st, i) {
    const wrap = document.createElement('div');
    if (st.type === 'text') {
      const ta = document.createElement('textarea');
      ta.value = st.value || '';
      ta.placeholder = 'Texto a digitar';
      ta.oninput = () => { steps[i].value = ta.value; };
      wrap.appendChild(ta);
    } else if (st.type === 'combo') {
      const inp = document.createElement('input');
      inp.value = (st.keys || []).join('+');
      inp.placeholder = 'Ex.: CTRL+C  ou  ALT+TAB';
      const sync = () => { steps[i].keys = inp.value.split(/[+,\s]+/).filter(Boolean).map((k) => k.toUpperCase()); };
      inp.oninput = sync;
      wrap.appendChild(inp);
      // Paleta clicavel: concatena a tecla no campo
      const pal = document.createElement('div');
      pal.className = 'key-palette';
      const COMBO_KEYS = ['CTRL', 'ALT', 'SHIFT', 'WIN', 'ENTER', 'TAB', 'ESC', 'DELETE', 'UP', 'DOWN', 'LEFT', 'RIGHT'];
      COMBO_KEYS.forEach((k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = k;
        b.onclick = () => {
          const cur = inp.value.trim();
          inp.value = cur ? cur.replace(/[+\s]*$/, '') + '+' + k : k;
          sync();
        };
        pal.appendChild(b);
      });
      wrap.appendChild(pal);
      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.textContent = 'Clique nas teclas ou digite. Para letras/números, digite (ex.: CTRL+C).';
      wrap.appendChild(hint);
    } else if (st.type === 'delay') {
      const inp = document.createElement('input');
      inp.type = 'number'; inp.min = '0';
      inp.value = st.ms != null ? st.ms : 200;
      inp.oninput = () => { steps[i].ms = parseInt(inp.value || '0', 10); };
      steps[i].ms = steps[i].ms != null ? steps[i].ms : 200;
      wrap.appendChild(inp);
    } else if (st.type === 'media') {
      const sel = document.createElement('select');
      MEDIA_KEYS.forEach((k) => {
        const o = document.createElement('option');
        o.value = k; o.textContent = k.replace('_', ' ').toLowerCase();
        if (k === st.key) o.selected = true;
        sel.appendChild(o);
      });
      steps[i].key = steps[i].key || MEDIA_KEYS[0];
      sel.onchange = () => { steps[i].key = sel.value; };
      wrap.appendChild(sel);
    } else if (st.type === 'launch') {
      const inp = document.createElement('input');
      inp.value = st.target || '';
      inp.placeholder = prof.os === 'mac' ? 'Ex.: Safari, Terminal' : 'Ex.: notepad, chrome, C:\\app\\x.exe';
      inp.oninput = () => { steps[i].target = inp.value; };
      wrap.appendChild(inp);
      if (prof.os !== 'mac') {
        const sel = document.createElement('select');
        sel.style.marginTop = '8px';
        sel.innerHTML = '<option value="search">Busca (menu Iniciar)</option>' +
                        '<option value="run">Executar (Win+R)</option>';
        sel.value = st.method || 'search';
        steps[i].method = steps[i].method || 'search';
        sel.onchange = () => { steps[i].method = sel.value; };
        wrap.appendChild(sel);
        const hint = document.createElement('div');
        hint.className = 'hint';
        hint.textContent = 'Busca: abre apps instalados pelo nome. Executar: caminhos completos, comandos e URLs.';
        wrap.appendChild(hint);
      }
    } else if (st.type === 'macro') {
      const sel = document.createElement('select');
      const opts = [];
      (prof.groups || []).forEach((grp) => {
        grp.buttons.forEach((btn) => {
          if (btn.id === b.id) return; // evita auto-referência
          const o = document.createElement('option');
          o.value = btn.id;
          o.textContent = (grp.name ? grp.name + ' › ' : '') + (btn.emoji ? btn.emoji + ' ' : '') + (btn.label || '');
          sel.appendChild(o);
          opts.push(btn.id);
        });
      });
      if (!opts.length) {
        const hint = document.createElement('div');
        hint.className = 'hint';
        hint.textContent = 'Crie outras macros neste perfil para poder chamá-las aqui.';
        wrap.appendChild(hint);
      } else {
        if (!st.ref || !opts.includes(st.ref)) steps[i].ref = opts[0];
        sel.value = steps[i].ref;
        sel.onchange = () => { steps[i].ref = sel.value; };
        wrap.appendChild(sel);
        const hint = document.createElement('div');
        hint.className = 'hint';
        hint.textContent = 'Executa todos os passos da macro escolhida neste ponto.';
        wrap.appendChild(hint);
      }
    }
    return wrap;
  }

  renderSteps();

  const addStep = document.createElement('button');
  addStep.className = 'btn';
  addStep.innerHTML = icon('plus') + ' Adicionar passo';
  addStep.onclick = () => { steps.push({ type: 'text', value: '' }); renderSteps(); };
  body.appendChild(addStep);

  openModal(isNew ? 'Nova macro' : 'Editar macro', body, () => {
    if (!label.value.trim()) { toast('Dê um nome à macro', 'err'); return false; }
    b.label = label.value.trim();
    b.emoji = emoji;
    b.color = color.value;
    b.steps = steps;
    if (isNew) g.buttons.push(b);
    saveConfig().then(render);
  });
}

function miniBtn(ic, onclick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mini';
  btn.innerHTML = icon(ic);
  btn.onclick = onclick;
  return btn;
}

function deleteButton(g, id) {
  if (!confirm('Excluir esta macro?')) return;
  g.buttons = g.buttons.filter((b) => b.id !== id);
  saveConfig().then(render);
}

// ---------- Menu de opções ----------
function openMenu() {
  const body = document.createElement('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '10px';

  const pwd = document.createElement('button');
  pwd.className = 'btn';
  pwd.innerHTML = icon('key') + ' Trocar senha';
  pwd.onclick = changePassword;

  const out = document.createElement('button');
  out.className = 'btn';
  out.innerHTML = icon('logout') + ' Sair';
  out.onclick = async () => { await api('/api/logout', { method: 'POST' }); location.href = '/'; };

  body.appendChild(pwd);
  body.appendChild(out);
  openModal('Opções', body, null);
}

function changePassword() {
  const body = document.createElement('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '14px';
  const np = document.createElement('input');
  np.type = 'password';
  np.placeholder = 'Mínimo 4 caracteres';
  body.appendChild(field('Nova senha', np));
  openModal('Trocar senha', body, async () => {
    if (np.value.length < 4) { toast('Senha muito curta', 'err'); return false; }
    const r = await api('/api/password', { method: 'POST', body: JSON.stringify({ password: np.value }) });
    const d = await r.json();
    if (r.ok && d.ok) toast('Senha alterada', 'ok');
    else { toast(d.error || 'Falha', 'err'); return false; }
  });
}

// ---------------------------------------------------------------------------
// Tema
// ---------------------------------------------------------------------------
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('cp-theme', t);
  const btn = $('#btn-theme');
  btn.innerHTML = icon(t === 'dark' ? 'moon' : 'sun');
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
async function init() {
  injectIcons();
  applyTheme(localStorage.getItem('cp-theme') || 'dark');

  $('#btn-theme').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  $('#btn-edit').onclick = () => {
    editMode = !editMode;
    $('#btn-edit').classList.toggle('active', editMode);
    toast(editMode ? 'Modo edição ativado' : 'Modo edição desativado');
    render();
  };
  $('#btn-menu').onclick = openMenu;

  try {
    await loadConfig();
    render();
  } catch (e) {
    $('#content').innerHTML = '<div class="empty"><span class="em">⚠️</span>Erro ao carregar a configuração.</div>';
  }
}

init();
