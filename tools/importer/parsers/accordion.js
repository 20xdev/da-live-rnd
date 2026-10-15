/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion. Base: accordion. Source: https://wknd.site/us/en/faqs.html (+ /ca/en/faqs.html)
 *
 * Source (AEM Core accordion, verified in block-context/accordion/source.html):
 *   div.accordion.panelcontainer > div.cmp-accordion
 *     div.cmp-accordion__item                                  (x7, iterationSafe)
 *       h3.cmp-accordion__header > button.cmp-accordion__button
 *         span.cmp-accordion__title                            (question)
 *         span.cmp-accordion__icon                             (dropped)
 *       div.cmp-accordion__panel[.cmp-accordion__panel--hidden] (answer; content is in the DOM even when hidden)
 *         div.container.responsivegrid > div.cmp-container > div.text > div.cmp-text
 *           p / ul / ol / h* (rich text, links, <b>), plus stray empty "<h3>&nbsp;</h3>" (dropped)
 *
 * Output (blocks/accordion decorator): one row per item, 2 cells: [question] | [answer content].
 * Items without a question are skipped; items with a question but no answer keep an empty answer cell.
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
  out.alt = (img && img.getAttribute('alt')) || (cmpHost && cmpHost.getAttribute('data-asset-alt')) || '';
  const title = img && img.getAttribute('title');
  if (title) out.title = title;
  return out;
}

const BLOCK_TAGS = new Set(['P', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TABLE', 'PRE', 'HR']);
const SKIP_TAGS = new Set(['META', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'BUTTON', 'TEMPLATE']);
const WRAPPER_RE = /^(DIV|SECTION|ARTICLE|ASIDE|MAIN|HEADER|FOOTER|NAV|FIGURE)$/;

/** True when the node has no visible text (treats &nbsp; as whitespace) and no media. */
function isEmpty(el) {
  return !el.textContent.replace(/\u00a0/g, ' ').trim() && !el.querySelector('img, picture, video, iframe');
}

/** Strip AEM component ids/classes from a cloned rich-text node; keep links, formatting, images. */
function clean(node, document) {
  node.querySelectorAll('img').forEach((img) => {
    const resolved = resolveImage(img, document);
    if (resolved) img.replaceWith(resolved);
    else img.remove();
  });
  [node, ...node.querySelectorAll('*')].forEach((el) => {
    if (el.id && /^(text|container|accordion|image)-/.test(el.id)) el.removeAttribute('id');
    if (el.classList && [...el.classList].some((c) => c.startsWith('cmp-'))) el.removeAttribute('class');
  });
  return node;
}

/** Walk answer panel content in source order, flattening AEM grid/container wrappers. */
function collectContent(root, document) {
  const out = [];
  let pending = null;
  const flush = () => {
    if (pending && !isEmpty(pending)) out.push(pending);
    pending = null;
  };

  const walk = (parent) => {
    [...parent.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        if (node.textContent.replace(/\u00a0/g, ' ').trim()) {
          if (!pending) pending = document.createElement('p');
          pending.append(node.textContent);
        }
        return;
      }
      if (node.nodeType !== 1) return;
      const el = node;
      if (SKIP_TAGS.has(el.tagName)) return;
      // Nested accordion headers (should not occur in a panel) — never leak them as answer text.
      if (el.matches('.cmp-accordion__header')) return;
      if (el.matches('.cmp-image, .image, picture, img')) {
        flush();
        const img = resolveImage(el.matches('.image') ? (el.querySelector('.cmp-image') || el) : el, document);
        if (img) {
          const p = document.createElement('p');
          p.append(img);
          out.push(p);
        }
        return;
      }
      if (BLOCK_TAGS.has(el.tagName)) {
        flush();
        // Drop empty spacer headings/paragraphs like <h3>&nbsp;</h3>.
        if (el.tagName === 'HR' || !isEmpty(el)) out.push(clean(el.cloneNode(true), document));
        return;
      }
      if (WRAPPER_RE.test(el.tagName)) {
        flush();
        walk(el);
        flush();
        return;
      }
      // Inline content (b, a, span, ...) sitting directly in a wrapper.
      if (isEmpty(el)) return;
      if (!pending) pending = document.createElement('p');
      pending.append(clean(el.cloneNode(true), document));
    });
  };

  walk(root);
  flush();
  return out;
}

export default function parse(element, { document }) {
  const root = element.querySelector('.cmp-accordion') || element;

  // Iterate block-level item wrappers (iterationSafe per structure.json); fallback to header/panel pairs.
  // Only this accordion's own items (ignore items of a nested accordion inside a panel).
  const ownAccordion = (item) => !root.matches('.cmp-accordion') || item.parentElement.closest('.cmp-accordion') === root;
  let items = [...root.querySelectorAll('.cmp-accordion__item')]
    .filter(ownAccordion)
    .map((item) => ({
      header: item.querySelector('.cmp-accordion__header'),
      panel: item.querySelector('.cmp-accordion__panel, [role="region"]'),
    }));
  if (!items.length) {
    items = [...root.querySelectorAll('.cmp-accordion__header, [data-cmp-hook-accordion="button"]')].map((header) => {
      const button = header.querySelector('button') || header;
      const controls = button.getAttribute('aria-controls');
      const panel = (controls && root.querySelector(`[id="${controls}"]`))
        || (header.nextElementSibling && header.nextElementSibling.matches('.cmp-accordion__panel') ? header.nextElementSibling : null);
      return { header, panel };
    });
  }

  const cells = [];
  items.forEach(({ header, panel }) => {
    const titleEl = header && (header.querySelector('.cmp-accordion__title') || header.querySelector('button') || header);
    const question = titleEl ? titleEl.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : '';
    if (!question) return; // skip items with no question

    // Walk the whole panel: the walker flattens container/text wrappers and handles multiple .cmp-text.
    const contentRoot = panel || null;
    const answer = contentRoot ? collectContent(contentRoot, document) : [];
    cells.push([question, answer.length ? answer : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
