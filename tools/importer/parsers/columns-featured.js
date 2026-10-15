/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns. Source: https://wknd.site/us/en.html
 *
 * Source (verified in block-context/columns-featured/source.html):
 *   .teaser.cmp-teaser--featured > .cmp-teaser
 *     .cmp-teaser__content > p.cmp-teaser__pretitle, h2.cmp-teaser__title,
 *                            .cmp-teaser__description, .cmp-teaser__action-container a
 *     .cmp-teaser__image .cmp-image img  (may be lazy: data-cmp-src with {.width})
 *
 * Output (columns-featured): 1 row x 2 cells: [image] | [p pretitle, h2 title, description, CTA].
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
function resolveImage(container, document) {
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
  out.alt = (img && img.getAttribute('alt')) || '';
  const title = img && img.getAttribute('title');
  if (title) out.title = title;
  return out;
}

export default function parse(element, { document }) {
  const teaser = element.querySelector('.cmp-teaser') || element;

  const image = resolveImage(teaser.querySelector('.cmp-teaser__image') || teaser.querySelector('.cmp-image, img'), document);

  const content = [];

  // Eyebrow / pretitle ("Featured Article") as a plain paragraph preceding the heading.
  const pretitle = teaser.querySelector('.cmp-teaser__pretitle');
  if (pretitle && pretitle.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = pretitle.textContent.trim();
    content.push(p);
  }

  const title = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (title && title.textContent.trim()) {
    const h = document.createElement('h2');
    h.textContent = title.textContent.trim();
    content.push(h);
  }

  const desc = teaser.querySelector('.cmp-teaser__description');
  if (desc && desc.textContent.trim()) {
    const blockChildren = [...desc.children].filter((c) => /^(P|UL|OL)$/.test(c.tagName));
    if (blockChildren.length) {
      content.push(...blockChildren);
    } else {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      content.push(p);
    }
  }

  [...teaser.querySelectorAll('.cmp-teaser__action-container a, a.cmp-teaser__action-link')]
    .filter((a, i, arr) => arr.indexOf(a) === i && a.textContent.trim())
    .forEach((a) => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href') || '';
      link.textContent = a.textContent.trim();
      const p = document.createElement('p');
      p.append(link);
      content.push(p);
    });

  if (!image && !content.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Always 2 cells; pad with '' when one side is missing.
  const cells = [[image || '', content.length ? content : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
