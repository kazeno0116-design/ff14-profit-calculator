(() => {
  const actionRows = document.getElementById('actionRows');
  const addActionRowButton = document.getElementById('addActionRow');
  const includeErrorOff = document.getElementById('includeErrorOff');
  const includeIcon = document.getElementById('includeIcon');
  const generateButton = document.getElementById('generateMacros');
  const selectAllButton = document.getElementById('selectAllSlots');
  const clearButton = document.getElementById('clearSlots');
  const message = document.getElementById('macroMessage');
  const results = document.getElementById('macroResults');
  const slotInputs = [...document.querySelectorAll('#partySlots input[type="checkbox"]')];

  if (!actionRows || !addActionRowButton || !generateButton || !results || !slotInputs.length) return;

  let rowId = 0;

  const cleanActionName = (value) => String(value || '')
    .replace(/[\r\n]/g, ' ')
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const createRow = ({ action = '', target = 'self', wait = '0' } = {}) => {
    rowId += 1;
    const row = document.createElement('div');
    row.className = 'party-action-row';
    row.dataset.rowId = String(rowId);
    row.innerHTML = `
      <div class="party-action-index" aria-hidden="true">${rowId}</div>
      <div class="tool-field party-action-name">
        <label>アクション名</label>
        <input type="text" class="action-name-input" autocomplete="off" placeholder="例：迅速魔 / レイズ / 救出" value="${escapeHtml(action)}"/>
      </div>
      <div class="tool-field party-action-target">
        <label>対象</label>
        <select class="action-target-select">
          <option value="self" ${target === 'self' ? 'selected' : ''}>自分に使用</option>
          <option value="party" ${target === 'party' ? 'selected' : ''}>選択したPT番号に使用</option>
        </select>
      </div>
      <div class="tool-field party-action-wait">
        <label>待機</label>
        <select class="action-wait-select">
          <option value="0" ${wait === '0' ? 'selected' : ''}>なし</option>
          <option value="1" ${wait === '1' ? 'selected' : ''}>1秒</option>
          <option value="2" ${wait === '2' ? 'selected' : ''}>2秒</option>
          <option value="3" ${wait === '3' ? 'selected' : ''}>3秒</option>
        </select>
      </div>
      <button class="party-action-remove" type="button" aria-label="このアクションを削除">削除</button>
    `;
    row.querySelector('.party-action-remove').addEventListener('click', () => {
      if (actionRows.children.length <= 1) {
        row.querySelector('.action-name-input').value = '';
        return;
      }
      row.remove();
      renumberRows();
    });
    row.querySelector('.action-name-input').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') generate();
    });
    actionRows.appendChild(row);
    renumberRows();
  };

  const renumberRows = () => {
    [...actionRows.querySelectorAll('.party-action-row')].forEach((row, index) => {
      const badge = row.querySelector('.party-action-index');
      if (badge) badge.textContent = String(index + 1);
    });
  };

  const getActions = () => [...actionRows.querySelectorAll('.party-action-row')]
    .map((row) => ({
      action: cleanActionName(row.querySelector('.action-name-input')?.value),
      target: row.querySelector('.action-target-select')?.value || 'self',
      wait: Math.max(0, Math.min(3, Number(row.querySelector('.action-wait-select')?.value) || 0))
    }))
    .filter((item) => item.action);

  const buildMacro = (actions, slot) => {
    const lines = [];
    if (includeErrorOff.checked) lines.push('/merror off');

    actions.forEach((item) => {
      const targetText = item.target === 'party' ? ` <${slot}>` : '';
      const waitText = item.wait > 0 ? ` <wait.${item.wait}>` : '';
      lines.push(`/ac "${item.action}"${targetText}${waitText}`);
    });

    if (includeIcon.checked && actions.length) {
      lines.push(`/micon "${actions[actions.length - 1].action}" action`);
    }

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
    const actions = getActions();
    const slots = slotInputs.filter((input) => input.checked).map((input) => input.value);

    if (!actions.length) {
      message.textContent = 'アクションを1つ以上入力してください。';
      actionRows.querySelector('.action-name-input')?.focus();
      results.innerHTML = '';
      return;
    }

    const hasPartyTarget = actions.some((item) => item.target === 'party');
    if (hasPartyTarget && !slots.length) {
      message.textContent = 'パーティー対象のアクションがあるため、対象番号を1つ以上選択してください。';
      results.innerHTML = '';
      return;
    }

    const reserved = (includeErrorOff.checked ? 1 : 0) + (includeIcon.checked ? 1 : 0);
    if (actions.length + reserved > 15) {
      message.textContent = `現在${actions.length + reserved}行です。FF14の15行制限以内になるようアクション数または追加設定を減らしてください。`;
      results.innerHTML = '';
      return;
    }

    const outputSlots = hasPartyTarget ? slots : ['1'];
    results.innerHTML = outputSlots.map((slot) => {
      const macro = buildMacro(actions, slot);
      const title = hasPartyTarget ? (slot === '1' ? '<1> 自分' : `<${slot}> パーティーメンバー${slot}`) : '対象指定なし';
      return `
        <article class="party-target-result-card">
          <header>
            <div>${hasPartyTarget ? `<span class="party-target-slot">&lt;${slot}&gt;</span>` : ''}<strong>${escapeHtml(title)}</strong></div>
            <button class="party-target-copy" type="button" data-copy-slot="${slot}">コピー</button>
          </header>
          <pre><code>${escapeHtml(macro)}</code></pre>
        </article>`;
    }).join('');

    results.querySelectorAll('[data-copy-slot]').forEach((button) => {
      button.addEventListener('click', () => {
        const slot = button.getAttribute('data-copy-slot');
        copyText(buildMacro(actions, slot), button);
      });
    });

    message.textContent = `${actions.length}種類のアクションを使ったマクロを${outputSlots.length}個生成しました。`;
  };

  addActionRowButton.addEventListener('click', () => createRow({ target: 'self' }));
  generateButton.addEventListener('click', generate);
  selectAllButton.addEventListener('click', () => {
    slotInputs.forEach((input) => { input.checked = true; });
  });
  clearButton.addEventListener('click', () => {
    slotInputs.forEach((input) => { input.checked = false; });
  });

  createRow({ target: 'self' });
  createRow({ target: 'party' });
})();
