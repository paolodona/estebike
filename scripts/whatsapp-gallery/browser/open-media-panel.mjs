/**
 * Opens the Media/Links/Docs panel for the currently-active WhatsApp chat.
 *
 * Sequence:
 *   1. Click the conversation header's "Profile details" element (avatar + title)
 *   2. Wait for the Group Info side panel
 *   3. Click the "Media, links and docs" row
 *   4. Dismiss promo popovers (e.g. "New: Calling on web"). These are also
 *      div[role="dialog"] and render *before* the media panel in the DOM, so a
 *      plain querySelector('div[role="dialog"]') picks the popover and every
 *      later step sees zero list items.
 *   5. Wait for the media list to populate, then report counts per month
 *      section — `loaded` items carry a full-res blob URL, `notLoaded` ones
 *      still show WhatsApp's download arrow (typical right after a device is
 *      freshly linked: only the newest media is synced to it).
 *
 * The per-month breakdown tells the orchestrator which `--month` the new
 * images belong to.
 */
export function toScript() {
  return `async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Media panel = the dialog holding the most list items.
  function findMediaDialog() {
    let best = null, bestN = -1;
    for (const d of document.querySelectorAll('div[role="dialog"]')) {
      const n = d.querySelectorAll('[role="listitem"]').length;
      if (n > bestN) { best = d; bestN = n; }
    }
    return best;
  }

  // Close promo/tip popovers: small dialogs with no list items that are not
  // the media panel itself (which is empty for a moment while it loads, and
  // always shows its "Media / Docs / Links" tabs).
  function dismissPopovers() {
    let n = 0;
    for (const d of document.querySelectorAll('div[role="dialog"]')) {
      if (d.querySelector('[role="listitem"]')) continue;
      const text = d.innerText || '';
      if (/\\bDocs\\b/.test(text) || text.length > 300) continue;
      const btn = d.querySelector('button, [role="button"]');
      if (btn) { btn.click(); n++; }
    }
    return n;
  }

  const h = document.querySelector('header[data-testid="conversation-header"]');
  const profileBtn = h?.querySelector('[title="Profile details"]');
  if (!profileBtn) return { ok: false, error: 'no-profile-button' };
  profileBtn.click();

  await sleep(1500);

  let mediaRow = null;
  for (const s of document.querySelectorAll('span, div')) {
    if (s.children.length === 0 && s.textContent === 'Media, links and docs') {
      let p = s;
      while (p && p.getAttribute('role') !== 'button' && p.parentElement) p = p.parentElement;
      mediaRow = p;
      break;
    }
  }
  if (!mediaRow) return { ok: false, error: 'no-media-row' };
  mediaRow.click();

  let dismissed = 0, dialog = null;
  for (let i = 0; i < 10; i++) {
    await sleep(1000);
    dismissed += dismissPopovers();
    dialog = findMediaDialog();
    if (dialog && dialog.querySelector('[role="listitem"]')) break;
  }
  if (!dialog) return { ok: false, error: 'no-dialog', dismissed };

  const MONTH = /^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)( \\d{4})?$/i;
  const months = {};
  let month = 'unknown', imageItems = 0;
  const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    const e = walker.currentNode;
    if (e.children.length === 0 && MONTH.test(e.textContent.trim())) month = e.textContent.trim();
    if (e.getAttribute('role') !== 'listitem') continue;
    if (!(e.getAttribute('aria-label') || '').includes('Image')) continue;
    imageItems++;
    const loaded = [...e.querySelectorAll('div')].some(dv => /blob:/.test(getComputedStyle(dv).backgroundImage));
    months[month] = months[month] || { loaded: 0, notLoaded: 0 };
    months[month][loaded ? 'loaded' : 'notLoaded']++;
  }
  return {
    ok: true,
    listItems: dialog.querySelectorAll('[role="listitem"]').length,
    imageItems,
    months,
    dismissed,
  };
}
`;
}
