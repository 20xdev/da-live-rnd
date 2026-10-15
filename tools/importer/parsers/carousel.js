/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel. Base: carousel. Source: https://wknd.site/us/en.html
 *
 * Source (AEM Core Components carousel, verified in block-context/carousel/source.html):
 *   div.carousel.cmp-carousel--hero
 *     .cmp-carousel__content > .cmp-carousel__item  (one per slide)
 *       .teaser.cmp-teaser--hero > .cmp-teaser
 *         .cmp-teaser__content > h2.cmp-teaser__title, .cmp-teaser__description, .cmp-teaser__action-container a
 *         .cmp-teaser__image .cmp-image img  (may be lazy: data-cmp-src with {.width})
 *   .cmp-carousel__actions / .cmp-carousel__indicators are UI chrome and ignored.
 *
 * Output (carousel block): one row per slide, 2 cells: [image] | [h2 title, description, CTA].
 *   Image-only slides (adventure pages: .carousel.panelcontainer.cmp-carousel--mini,
 *   .cmp-carousel__item > .image > .cmp-image > img) produce a single image cell per row.
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
  const alt = (img && img.getAttribute('alt')) || (cmpHost && cmpHost.getAttribute('data-asset-alt')) || '';
  out.alt = alt;
  const title = img && img.getAttribute('title');
  if (title) out.title = title;
  return out;
}

function buildContent(teaser, document) {
  const content = [];
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
  const ctas = [...teaser.querySelectorAll('.cmp-teaser__action-container a, a.cmp-teaser__action-link')]
    .filter((a, i, arr) => arr.indexOf(a) === i && a.textContent.trim());
  ctas.forEach((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '';
    link.textContent = a.textContent.trim();
    const p = document.createElement('p');
    p.append(link);
    content.push(p);
  });
  return content;
}

export default function parse(element, { document }) {
  // Iterate slide wrappers (stable block-level divs); fall back to the teasers themselves.
  let slides = [...element.querySelectorAll('.cmp-carousel__item')];
  if (!slides.length) slides = [...element.querySelectorAll('.teaser, .cmp-teaser')].filter((t) => !t.parentElement.closest('.teaser, .cmp-teaser'));

  const slideData = [];
  slides.forEach((slide) => {
    const teaser = slide.querySelector('.cmp-teaser') || slide;
    const image = resolveImage(teaser.querySelector('.cmp-teaser__image') || teaser.querySelector('.cmp-image, img'), document);
    const content = buildContent(teaser, document);
    if (!image && !content.length) return;
    slideData.push({ image, content });
  });

  // Image-only carousels (adventure pages, .cmp-carousel--mini) emit one image cell per row;
  // as soon as any slide has text content, every row keeps the 2-cell [image | content] shape.
  const hasContent = slideData.some((s) => s.content.length);
  const cells = slideData.map(({ image, content }) => (hasContent
    ? [image || '', content.length ? content : '']
    : [image]));

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });
  element.replaceWith(block);
}
