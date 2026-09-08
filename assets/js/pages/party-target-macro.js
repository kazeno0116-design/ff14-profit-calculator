(() => {
  const actionName = document.getElementById('actionName');
  const repeatCount = document.getElementById('repeatCount');
  const includeErrorOff = document.getElementById('includeErrorOff');
  const includeIcon = document.getElementById('includeIcon');
  const generateButton = document.getElementById('generateMacros');
  const selectAllButton = document.getElementById('selectAllSlots');
  const clearButton = document.getElementById('clearSlots');
  const message = document.getElementById('macroMessage');
  const results = document.getElementById('macroResults');
  const slotInputs = [...document.querySelectorAll('#partySlots input[type="checkbox"]')];

  if (!actionName || !repeatCount || !generateButton || !results || !slotInputs.length) return;

  const cleanActionName = (value) => String(value || '')
    .replace(/[\r\n]/g, ' ')
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const buildMacro = (action, slot) => {
    const lines = [];
    if (includeErrorOff.checked) lines.push('/merror off');
    const requested = Math.max(1, Math.min(13, Number(repeatCount.value) || 1));
    const reserved = (includeErrorOff.checked ? 1 : 0) + (includeIcon.checked ? 1 : 0);
    const maxActionLines = Math.max(1, 15 - reserved);
    const repeats = Math.min(requested, maxActionLines);
    for (let i = 0; i < repeats; i += 1) lines.push(`/ac "${action}" <${slot}>`);
    if (includeIcon.checked) lines.push(`/micon "${action}" action`);
    return lines.join('\n');
  };

  const copyText = async (text, button) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    const original = button.textContent;
    button.textContent = 'コピー済み';
    button.classList.add('is-copied');
    window.setTimeout(() => {
      button.textContent = original;
      button.classList.remove('is-copied');
    }, 1400);
  };

  const generate = () => {
    const action = cleanActionName(actionName.value);
    const slots = slotInputs.filter((input) => input.checked).map((input) => input.value);

    if (!action) {
      message.textContent = 'アクション名を入力してください。';
      actionName.focus();
      results.innerHTML = '';
      return;
    }
    if (!slots.length) {
      message.textContent = '生成するパーティーリスト番号を1つ以上選択してください。';
      results.innerHTML = '';
      return;
    }

    results.innerHTML = slots.map((slot) => {
      const macro = buildMacro(action, slot);
      const title = slot === '1' ? '<1> 自分' : `<${slot}> パーティーメンバー${slot}`;
      return `
        <article class="party-target-result-card">
          <header>
            <div><span class="party-target-slot">&lt;${slot}&gt;</span><strong>${escapeHtml(title)}</strong></div>
            <button class="party-target-copy" type="button" data-copy-slot="${slot}">コピー</button>
          </header>
          <pre><code>${escapeHtml(macro)}</code></pre>
        </article>`;
    }).join('');

    results.querySelectorAll('[data-copy-slot]').forEach((button) => {
      button.addEventListener('click', () => {
        const slot = button.getAttribute('data-copy-slot');
        copyText(buildMacro(action, slot), button);
      });
    });

    message.textContent = `${slots.length}個のマクロを生成しました。各カードから個別にコピーできます。`;
  };

  generateButton.addEventListener('click', generate);
  actionName.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') generate();
  });
  selectAllButton.addEventListener('click', () => {
    slotInputs.forEach((input) => { input.checked = true; });
  });
  clearButton.addEventListener('click', () => {
    slotInputs.forEach((input) => { input.checked = false; });
  });
})();
