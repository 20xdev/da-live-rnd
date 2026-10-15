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

/**
 * Secure ("members only") teasers (verified in block-context/cards/source.html, magazine.html):
 *   .teaser.cmp-teaser--secure > .cmp-teaser
 *     .cmp-teaser__content > h2.cmp-teaser__title, .cmp-teaser__description,
 *                            .cmp-teaser__action-container (plain "Read More", usually no link)
 *     .cmp-teaser__image .cmp-image img
 * The instance selector matches EACH teaser (no wrapper); one block = a run of consecutive
 * sibling secure teasers. Built on the first teaser of the run; the rest are removed (the import
 * script skips detached elements). Iteration is keyed on the block-level .teaser wrappers.
 * Output: `Cards (secure)`, one row per teaser, 2 cells:
 *   [image] | [h3 title, p description, (p > a CTA | p plain unlinked action text, e.g. "Read More")].
 */
const TEASER_RUN_SELECTOR = '.teaser.cmp-teaser--secure';

function teaserRow(teaserEl, document) {
  const teaser = teaserEl.querySelector('.cmp-teaser') || teaserEl;
  const titleEl = teaser.querySelector('.cmp-teaser__title') || teaser.querySelector('h1, h2, h3, h4');
  const titleText = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';

  // Real links become link paragraphs; unlinked action text is kept as plain text (below).
  const actions = [...teaser.querySelectorAll('.cmp-teaser__action-container a[href], a.cmp-teaser__action-link[href]')]
    .filter((a, i, arr) => arr.indexOf(a) === i);
  const titleLinkEl = (titleEl && (titleEl.querySelector('a[href]') || titleEl.closest('a[href]')))
    || teaser.querySelector('a.cmp-teaser__title-link[href]')
    || actions[0];
  const href = titleLinkEl ? titleLinkEl.getAttribute('href') : '';

  const image = resolveImage(
    teaser.querySelector('.cmp-teaser__image') || teaser.querySelector('.cmp-image, img'),
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
  const desc = teaser.querySelector('.cmp-teaser__description');
  if (desc && desc.textContent.trim()) {
    const paras = [...desc.querySelectorAll(':scope > p')].map((p) => p.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
    (paras.length ? paras : [desc.textContent.replace(/\s+/g, ' ').trim()]).forEach((t) => {
      const p = document.createElement('p');
      p.textContent = t;
      body.push(p);
    });
  }
  actions.forEach((a) => {
    const text = a.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = text;
    const p = document.createElement('p');
    p.append(link);
    body.push(p);
  });
  // Unlinked action container (locked teaser, e.g. plain "Read More"): keep its label as a
  // final plain paragraph (the cards (secure) variant styles it as the locked CTA).
  [...teaser.querySelectorAll('.cmp-teaser__action-container')]
    .filter((c) => !c.querySelector('a[href]'))
    .forEach((c) => {
      const label = c.textContent.replace(/\s+/g, ' ').trim();
      if (!label) return;
      const p = document.createElement('p');
      p.textContent = label;
      body.push(p);
    });

  if (!image && !body.length) return null;
  return [image || '', body.length ? body : ''];
}

export default function parse(element, { document }) {
  // Secure teaser run (magazine). Image-list elements never take this branch.
  if (element.matches(TEASER_RUN_SELECTOR) && !element.querySelector('li.cmp-image-list__item')) {
    if (!element.parentNode) return;
    const run = [element];
    let next = element.nextElementSibling;
    while (next && next.matches(TEASER_RUN_SELECTOR)) {
      run.push(next);
      next = next.nextElementSibling;
    }
    const teaserCells = run.map((t) => teaserRow(t, document)).filter(Boolean);
    run.slice(1).forEach((t) => t.remove());
    if (!teaserCells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards', variants: ['secure'], cells: teaserCells });
    element.replaceWith(block);
    return;
  }

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
