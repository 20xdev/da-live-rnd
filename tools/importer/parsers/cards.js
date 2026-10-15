/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards. Base: cards. Source: https://wknd.site/us/en.html (2 instances per page)
 *
 * Source (AEM Core image-list, verified in block-context/cards/source.html + instances/01.html):
 *   .image-list.list > ul.cmp-image-list > li.cmp-image-list__item
 *     article.cmp-image-list__item-content
 *       a.cmp-image-list__item-image-link > .cmp-image-list__item-image .cmp-image img
 *       a.cmp-image-list__item-title-link > span.cmp-image-list__item-title
 *       span.cmp-image-list__item-description
 *
 * Iteration is keyed on the block-level li.cmp-image-list__item (never on the inline anchors,
 * which html2md preprocessing may merge when adjacent with equal hrefs).
 *
 * Output (cards): one row per item, 2 cells: [image] | [h3 > a title, p description].
 */

const FALLBACK_ORIGIN = 'https://wknd.site';

function getOrigin(document) {
  try {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href && /^https?:/.test(canonical.href)) return new URL(canonical.href).origin;
  } catch (e) { /* ignore */ }
  return FALLBACK_ORIGIN;
}

function absolutize(src, document) {
  if (!src) return '';
  const s = src.trim();
  if (!s || s.startsWith('data:')) return '';
  try {
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith('//')) return `https:${s}`;
    return new URL(s, getOrigin(document)).href;
  } catch (e) {
    return s;
  }
}

function largestFromSrcset(srcset) {
  if (!srcset) return '';
  let best = '';
  let bestW = -1;
  srcset.split(',').forEach((part) => {
    const [u, d] = part.trim().split(/\s+/);
    const w = parseInt(d, 10) || 0;
    if (u && w > bestW) { best = u; bestW = w; }
  });
  return best;
}

/** Resolve a usable absolute image for an AEM Core image container (handles lazy data-cmp-src). */
function resolveImage(container, document, fallbackAlt) {
  if (!container) return null;
  const img = container.matches && container.matches('img') ? container : container.querySelector('img');
  const cmpHost = container.matches && container.matches('[data-cmp-src]')
    ? container : container.querySelector('[data-cmp-src]') || (img && img.closest('[data-cmp-src]'));

  let src = '';
  if (img) {
    const raw = img.getAttribute('src') || '';
    if (raw && !raw.startsWith('data:') && !raw.includes('{.width}')) src = raw;
    if (!src) src = img.getAttribute('data-src') || '';
    if (!src) src = largestFromSrcset(img.getAttribute('srcset') || img.getAttribute('data-srcset'));
  }
  if (!src && cmpHost) {
    const tpl = cmpHost.getAttribute('data-cmp-src') || '';
    const widths = (cmpHost.getAttribute('data-cmp-widths') || '').split(',').map((w) => parseInt(w, 10)).filter(Boolean);
    const width = widths.length ? Math.max(...widths) : '';
    src = width ? tpl.replace('{.width}', `.${width}`) : tpl.replace('{.width}', '');
  }
  src = absolutize(src, document);
  if (!src) return null;

  const out = document.createElement('img');
  out.src = src;
  out.alt = (img && img.getAttribute('alt')) || fallbackAlt || '';
  const title = img && img.getAttribute('title');
  if (title) out.title = title;
  return out;
}

export default function parse(element, { document }) {
  // Primary: block-level list items. Fallbacks: article wrappers, then generic li.
  let items = [...element.querySelectorAll('li.cmp-image-list__item')];
  if (!items.length) items = [...element.querySelectorAll('article.cmp-image-list__item-content')];
  if (!items.length) items = [...element.querySelectorAll(':scope ul > li')];

  const cells = [];
  items.forEach((item) => {
    const titleEl = item.querySelector('.cmp-image-list__item-title');
    const titleLink = item.querySelector('a.cmp-image-list__item-title-link')
      || (titleEl && titleEl.closest('a'))
      || item.querySelector('a.cmp-image-list__item-image-link')
      || item.querySelector('a[href]');
    const titleText = ((titleEl || titleLink) && (titleEl || titleLink).textContent.trim()) || '';
    const href = titleLink ? titleLink.getAttribute('href') : '';

    const image = resolveImage(
      item.querySelector('.cmp-image-list__item-image') || item.querySelector('.cmp-image, img'),
      document,
      titleText,
    );

    const body = [];
    if (titleText) {
      const h = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        h.append(a);
      } else {
        h.textContent = titleText;
      }
      body.push(h);
    }
    const desc = item.querySelector('.cmp-image-list__item-description');
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      body.push(p);
    }

    if (!image && !body.length) return;
    cells.push([image || '', body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
