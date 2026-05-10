/**
 * Opens the Media/Links/Docs panel for the currently-active WhatsApp chat.
 *
 * Sequence:
 *   1. Click the conversation header's "Profile details" element (avatar + title)
 *   2. Wait for the Group Info side panel
 *   3. Click the "Media, links and docs" row
 *   4. Wait for the dialog
 *   5. Return the count of image listitems for sanity checking
 */
export function toScript() {
  return `
(async () => {
  const h = document.querySelector('header[data-testid="conversation-header"]');
  const profileBtn = h?.querySelector('[title="Profile details"]');
  if (!profileBtn) return { ok: false, error: 'no-profile-button' };
  profileBtn.click();

  await new Promise(r => setTimeout(r, 1500));

  const all = document.querySelectorAll('span, div');
  let mediaRow = null;
  for (const s of all) {
    if (s.children.length === 0 && s.textContent === 'Media, links and docs') {
      let p = s;
      while (p && p.getAttribute('role') !== 'button' && p.parentElement) p = p.parentElement;
      mediaRow = p;
      break;
    }
  }
  if (!mediaRow) return { ok: false, error: 'no-media-row' };
  mediaRow.click();

  await new Promise(r => setTimeout(r, 2500));

  const dialog = document.querySelector('div[role="dialog"]');
  if (!dialog) return { ok: false, error: 'no-dialog' };

  let imgCount = 0;
  for (const li of dialog.querySelectorAll('[role="listitem"]')) {
    if ((li.getAttribute('aria-label') || '').includes('Image')) imgCount++;
  }
  return { ok: true, listItems: dialog.querySelectorAll('[role="listitem"]').length, imageItems: imgCount };
})()
`;
}
