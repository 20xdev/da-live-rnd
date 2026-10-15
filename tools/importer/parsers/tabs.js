/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs. Base: tabs. Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 *
 * Source (AEM Core tabs, verified in block-context/tabs/source.html):
 *   div.tabs.panelcontainer > div.cmp-tabs
 *     ol.cmp-tabs__tablist > li.cmp-tabs__tab            (labels; id "{x}-tab", may carry aria-controls)
 *     div.cmp-tabs__tabpanel                             (panels; id "{x}-tabpanel", aria-labelledby)
 *       div.contentfragment > article.cmp-contentfragment
 *         h3.cmp-contentfragment__title                  (hidden, dropped)
 *         div.cmp-contentfragment__elements              (p, ul/ol, nested AEM image components,
 *                                                        empty div.aem-Grid wrappers)
 *   AEM images: .image > .cmp-image > img (may be lazy: data-cmp-src with {.width} + data-cmp-widths),
 *   optional caption span.cmp-image__title[itemprop=caption].
 *
 * Output (blocks/tabs decorator): one row per tab, 2 cells: [label] | [panel content in source order].
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

function isImageComponent(el) {
  return el.matches('.cmp-image, .image, picture, img, [data-cmp-is="image"]');
}

/** Image + optional caption for an AEM image component. */
function imageNodes(el, document) {
  const host = el.matches('.image') ? (el.querySelector('.cmp-image') || el) : el;
  const nodes = [];
  const img = resolveImage(host, document);
  if (img) {
    const p = document.createElement('p');
    p.append(img);
    nodes.push(p);
  }
  const captionEl = host.querySelector && host.querySelector('.cmp-image__title, [itemprop="caption"]');
  const caption = captionEl ? captionEl.textContent.replace(/\s+/g, ' ').trim() : '';
  if (caption) {
    const p = document.createElement('p');
    const em = document.createElement('em');
    em.textContent = caption;
    p.append(em);
    nodes.push(p);
  }
  return nodes;
}

/** Fix relative/lazy images embedded inside rich-text blocks. */
function fixInlineImages(node, document) {
  node.querySelectorAll('img').forEach((img) => {
    const resolved = resolveImage(img, document);
    if (resolved) img.replaceWith(resolved);
    else img.remove();
  });
  return node;
}

/**
 * AEM Core image-list (adventures listing panels):
 *   div.image-list.list > ul.cmp-image-list > li.cmp-image-list__item > article.cmp-image-list__item-content
 *     a.cmp-image-list__item-image-link > .cmp-image-list__item-image .cmp-image img
 *     a.cmp-image-list__item-title-link > span.cmp-image-list__item-title
 *     span.cmp-image-list__item-description
 * Emits a clean <ul>; each <li> = <p><img></p>, <p><a href>Title</a></p>, <p>description</p>.
 * blocks/tabs decoratePanel turns a ul whose items contain a picture into a card grid.
 * Image is not wrapped in a link (tabs.css targets p:has(> picture)); the title is a plain
 * linked paragraph (no <strong>/<em>, which decorateButtons would turn into a button).
 * Iteration is keyed on block-level li items, never on the (adjacent, same-href) inline anchors.
 */
function isImageList(el) {
  return el.matches('.image-list, ul.cmp-image-list');
}

function imageListNodes(el, document) {
  let items = [...el.querySelectorAll('li.cmp-image-list__item')];
  if (!items.length) items = [...el.querySelectorAll('article.cmp-image-list__item-content')];
  if (!items.length) return [];

  const ul = document.createElement('ul');
  items.forEach((item) => {
    const titleEl = item.querySelector('.cmp-image-list__item-title');
    const titleLink = item.querySelector('a.cmp-image-list__item-title-link')
      || (titleEl && titleEl.closest('a'))
      || item.querySelector('a.cmp-image-list__item-image-link')
      || item.querySelector('a[href]');
    const titleText = ((titleEl || titleLink) && (titleEl || titleLink).textContent.replace(/\s+/g, ' ').trim()) || '';
    const href = titleLink ? titleLink.getAttribute('href') : '';

    const li = document.createElement('li');
    const image = resolveImage(
      item.querySelector('.cmp-image-list__item-image') || item.querySelector('.cmp-image, img'),
      document,
    );
    if (image) {
      if (!image.alt && titleText) image.alt = titleText;
      const p = document.createElement('p');
      p.append(image);
      li.append(p);
    }
    if (titleText) {
      const p = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        p.append(a);
      } else {
        p.textContent = titleText;
      }
      li.append(p);
    }
    const desc = item.querySelector('.cmp-image-list__item-description');
    const descText = desc ? desc.textContent.replace(/\s+/g, ' ').trim() : '';
    if (descText) {
      const p = document.createElement('p');
      p.textContent = descText;
      li.append(p);
    }
    if (li.childNodes.length) ul.append(li);
  });
  return ul.children.length ? [ul] : [];
}

/** Walk panel content in source order, flattening wrappers into a list of block-level nodes. */
function collectContent(root, document) {
  const out = [];
  let pending = null;
  const flush = () => {
    if (pending && pending.textContent.trim()) out.push(pending);
    pending = null;
  };

  const walk = (parent) => {
    [...parent.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        if (node.textContent.trim()) {
          if (!pending) pending = document.createElement('p');
          pending.append(node.textContent);
        }
        return;
      }
      if (node.nodeType !== 1) return;
      const el = node;
      if (SKIP_TAGS.has(el.tagName)) return;
      if (el.matches('.cmp-contentfragment__title, .cmp-tabs__tablist')) return;
      if (isImageList(el)) {
        const listNodes = imageListNodes(el, document);
        if (listNodes.length) {
          flush();
          out.push(...listNodes);
          return;
        }
      }
      if (isImageComponent(el)) {
        flush();
        out.push(...imageNodes(el, document));
        return;
      }
      if (BLOCK_TAGS.has(el.tagName)) {
        flush();
        if (el.tagName === 'HR' || el.textContent.trim() || el.querySelector('img')) {
          out.push(fixInlineImages(el.cloneNode(true), document));
        }
        return;
      }
      if (/^(DIV|SECTION|ARTICLE|ASIDE|MAIN|HEADER|FOOTER|NAV|FIGURE|DL)$/.test(el.tagName)) {
        flush();
        walk(el); // empty aem-Grid wrappers contribute nothing
        flush();
        return;
      }
      if (el.tagName === 'FIGCAPTION') {
        flush();
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        if (text) {
          const p = document.createElement('p');
          const em = document.createElement('em');
          em.textContent = text;
          p.append(em);
          out.push(p);
        }
        return;
      }
      // Inline content (b, a, span, ...) sitting directly in a wrapper.
      if (!el.textContent.trim()) return;
      if (!pending) pending = document.createElement('p');
      pending.append(el.cloneNode(true));
    });
  };

  walk(root);
  flush();
  return out;
}

export default function parse(element, { document }) {
  const tabsRoot = element.querySelector('.cmp-tabs') || element;
  let labels = [...tabsRoot.querySelectorAll('.cmp-tabs__tablist > .cmp-tabs__tab')];
  if (!labels.length) labels = [...tabsRoot.querySelectorAll('[role="tab"]')];
  let panels = [...tabsRoot.querySelectorAll('.cmp-tabs__tabpanel')]
    .filter((p) => p.closest('.cmp-tabs') === tabsRoot || tabsRoot === element);
  if (!panels.length) panels = [...tabsRoot.querySelectorAll('[role="tabpanel"]')];

  const findPanel = (label, idx) => {
    const controls = label.getAttribute('aria-controls');
    const id = label.id;
    let panel = null;
    if (controls) panel = panels.find((p) => p.id === controls);
    if (!panel && id) {
      panel = panels.find((p) => p.getAttribute('aria-labelledby') === id)
        || panels.find((p) => p.id === id.replace(/-tab$/, '-tabpanel'));
    }
    return panel || panels[idx] || null;
  };

  const cells = [];
  labels.forEach((label, idx) => {
    const text = label.textContent.replace(/\s+/g, ' ').trim() || `Tab ${idx + 1}`;
    const panel = findPanel(label, idx);
    const contentRoot = panel
      ? (panel.querySelector('.cmp-contentfragment__elements') || panel)
      : null;
    const content = contentRoot ? collectContent(contentRoot, document) : [];
    // Keep the tab even if its panel is empty-ish.
    cells.push([text, content.length ? content : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
