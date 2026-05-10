/**
 * Switches the open WhatsApp Web chat to a target group.
 *
 * Returns a JS source string suitable for chrome-devtools `evaluate_script`.
 * The injected function:
 *   - Finds the search box (handles aria-label drift)
 *   - Types the query, waits for results
 *   - Clicks the matching span[title="..."] using a synthetic mouse-down/up/click
 *     sequence (a plain .click() is silently swallowed by WhatsApp Web)
 *   - Validates the conversation header text contains the expected name
 *
 * Inject by reading this file, calling toScript({ groupName: '...' }) and
 * passing the resulting string to evaluate_script.
 */
export function toScript({ groupName, query, headerMatch }) {
  // groupName: exact span[title] to click in the search results
  // query: text to type into the search box (defaults to groupName)
  // headerMatch: substring expected in the conversation-header text
  //              after the switch (defaults to groupName)
  const q = query ?? groupName;
  const hm = headerMatch ?? groupName;
  return `
(async () => {
  const groupName = ${JSON.stringify(groupName)};
  const query = ${JSON.stringify(q)};
  const headerMatch = ${JSON.stringify(hm)};

  function findSearchInput() {
    const candidates = document.querySelectorAll('input[type="text"]');
    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      if (r.left < 700 && r.top < 200 && r.width > 100) return el;
    }
    return null;
  }

  const input = findSearchInput();
  if (!input) return { ok: false, error: 'no-search-input' };

  input.focus();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, '');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  setter.call(input, query);
  input.dispatchEvent(new Event('input', { bubbles: true }));

  await new Promise(r => setTimeout(r, 1500));

  function clickResult() {
    const titles = document.querySelectorAll(\`span[title="\${groupName}"]\`);
    for (const el of titles) {
      const r = el.getBoundingClientRect();
      if (r.left < 650 && r.top > 100 && r.top < 600) {
        const target = el.closest('[role="listitem"]') || el.closest('[role="gridcell"]');
        if (!target) continue;
        const cr = target.getBoundingClientRect();
        const x = cr.left + cr.width / 2;
        const y = cr.top + cr.height / 2;
        const inner = document.elementFromPoint(x, y);
        if (!inner) continue;
        const mk = (t) => new MouseEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
        inner.dispatchEvent(mk('mousedown'));
        inner.dispatchEvent(mk('mouseup'));
        inner.dispatchEvent(mk('click'));
        return true;
      }
    }
    return false;
  }

  if (!clickResult()) return { ok: false, error: 'no-result' };

  // Validate switch by inspecting the conversation header
  for (let attempt = 0; attempt < 3; attempt++) {
    await new Promise(r => setTimeout(r, 1000));
    const h = document.querySelector('header[data-testid="conversation-header"]');
    const text = h?.textContent || '';
    if (text.includes(headerMatch)) return { ok: true, header: text.substring(0, 80) };
  }
  // Retry once
  if (clickResult()) {
    await new Promise(r => setTimeout(r, 1500));
    const h = document.querySelector('header[data-testid="conversation-header"]');
    const text = h?.textContent || '';
    if (text.includes(headerMatch)) return { ok: true, header: text.substring(0, 80), retried: true };
  }
  const h = document.querySelector('header[data-testid="conversation-header"]');
  return { ok: false, error: 'header-mismatch', header: (h?.textContent || '').substring(0, 80) };
})()
`;
}
