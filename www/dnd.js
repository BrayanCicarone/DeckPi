/* dnd.js — arrastar para reordenar (qualquer lista) e redimensionar (macros).
   Usa Pointer Events (funciona com mouse E touch, inclusive iOS Safari). */

// Torna `itemEl` arrastável através de `handleEl` dentro de `containerEl`.
// Durante o arraste, o item vira um "clone flutuante" (position:fixed) e um
// placeholder tracejado marca o lugar; ao soltar, o item já fica na nova
// posição no DOM e onDrop() é chamado para persistir a nova ordem.
function makeDraggable(handleEl, itemEl, containerEl, onDrop) {
  handleEl.style.touchAction = 'none';
  handleEl.addEventListener('click', (e) => e.stopPropagation());
  handleEl.addEventListener('pointerdown', (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return; // só botão esquerdo
    ev.preventDefault();
    ev.stopPropagation();

    const rect = itemEl.getBoundingClientRect();
    const offsetX = ev.clientX - rect.left;
    const offsetY = ev.clientY - rect.top;

    const placeholder = document.createElement('div');
    placeholder.style.width = rect.width + 'px';
    placeholder.style.height = rect.height + 'px';
    if (itemEl.classList.contains('macro')) {
      placeholder.className = 'macro drag-placeholder';
      if (itemEl.dataset.size) placeholder.dataset.size = itemEl.dataset.size;
    } else {
      placeholder.className = 'drag-placeholder';
    }
    itemEl.parentNode.insertBefore(placeholder, itemEl.nextSibling);

    itemEl.classList.add('dragging');
    itemEl.style.position = 'fixed';
    itemEl.style.zIndex = '999';
    itemEl.style.width = rect.width + 'px';
    itemEl.style.height = rect.height + 'px';
    itemEl.style.left = rect.left + 'px';
    itemEl.style.top = rect.top + 'px';
    itemEl.style.pointerEvents = 'none';
    document.body.appendChild(itemEl);

    function reposition(x, y) {
      itemEl.style.left = (x - offsetX) + 'px';
      itemEl.style.top = (y - offsetY) + 'px';
      const siblings = [...containerEl.children].filter((c) => c !== placeholder);
      let closest = null;
      let closestDist = Infinity;
      siblings.forEach((sib) => {
        const r = sib.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < closestDist) { closestDist = dist; closest = { el: sib, rect: r, cx, cy }; }
      });
      if (closest) {
        const horizontal = closest.rect.width >= closest.rect.height;
        const before = horizontal ? x < closest.cx : y < closest.cy;
        containerEl.insertBefore(placeholder, before ? closest.el : closest.el.nextSibling);
      }
    }

    function onMove(e) { reposition(e.clientX, e.clientY); }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      placeholder.parentNode.insertBefore(itemEl, placeholder);
      placeholder.remove();
      itemEl.classList.remove('dragging');
      itemEl.style.position = '';
      itemEl.style.zIndex = '';
      itemEl.style.width = '';
      itemEl.style.height = '';
      itemEl.style.left = '';
      itemEl.style.top = '';
      itemEl.style.pointerEvents = '';
      onDrop();
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

// Reordena `arr` (itens com `.id`) conforme a ordem atual dos filhos de
// `containerEl` no DOM (via `dataset.id`). Filhos sem dataset.id são ignorados.
function reconcileOrder(containerEl, arr) {
  const ids = [...containerEl.children]
    .filter((el) => el.dataset && el.dataset.id)
    .map((el) => el.dataset.id);
  arr.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

// Torna uma macro redimensionável (sm/md/lg) arrastando a partir de `handleEl`
// (canto inferior direito do card). Chama onResize(newSize) ao soltar.
function makeResizable(handleEl, cardEl, onResize) {
  handleEl.style.touchAction = 'none';
  handleEl.addEventListener('click', (e) => e.stopPropagation());
  handleEl.addEventListener('pointerdown', (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    const startX = ev.clientX;
    const startY = ev.clientY;
    cardEl.classList.add('resizing');

    function apply(x, y) {
      const dx = x - startX;
      const dy = y - startY;
      let size = 'sm';
      if (dx > 60 && dy > 60) size = 'lg';
      else if (dx > 60) size = 'md';
      cardEl.dataset.size = size;
    }
    function onMove(e) { apply(e.clientX, e.clientY); }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      cardEl.classList.remove('resizing');
      onResize(cardEl.dataset.size);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}
