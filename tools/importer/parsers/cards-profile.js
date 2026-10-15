/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-profile. Base: cards. Source: https://wknd.site/us/en/about-us.html
 *
 * Source (verified in block-context/cards-profile/source.html — 7 contributors, no wrapper):
 *   .aem-Grid > section.cmp-experience-fragment--contributor   (one per person, siblings)
 *     .cmp-image img.cmp-image__image                          portrait (may be lazy: data-cmp-src)
 *     .title:not(.cmp-title--black) h3.cmp-title__text         name
 *     .title.cmp-title--black h5.cmp-title__text               roles ("Artist | Photographer")
 *     .cmp-buildingblock--btn-list a.cmp-button                 social links
 *       span.cmp-button__icon--{facebook|twitter|instagram} + span.cmp-button__text
 *
 * The instance selector matches EACH contributor section. One block = a run of consecutive
 * sibling contributor sections. The import script calls the parser per matched element in
 * document order and skips elements whose parentNode is null, so on the first section of a
 * run we build the whole block, replace that section and remove the rest of the run.
 * Iteration is keyed on the block-level <section> (never on the inline social anchors).
 *
 * Output (cards-profile): one row per person, 2 cells:
 *   [portrait img] | [h3 name, p roles, one p per social link (text = network name)]
 */

const FALLBACK_ORIGIN = 'https://wknd.site';
const RUN_SELECTOR = 'section.cmp-experience-fragment--contributor';

const NETWORK_LABELS = {
  facebook: 'Facebook',
  twitter: 'Twitter',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
};
const NETWORK_MATCH = {
  facebook: ['facebook', 'fb.com', 'fb.me'],
  twitter: ['twitter', 'x.com'],
  instagram: ['instagram', 'insta'],
  linkedin: ['linkedin'],
  youtube: ['youtube', 'youtu.be'],
};

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
  return out;
}

const clean = (el) => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');

/** Network key from icon class first, then visible text, then href. */
function detectNetwork(a) {
  const icon = a.querySelector('[class*="cmp-button__icon--"]');
  if (icon) {
    const m = icon.className.match(/cmp-button__icon--([a-z0-9-]+)/i);
    if (m) {
      const key = m[1].toLowerCase();
      const found = Object.keys(NETWORK_MATCH).find((k) => k === key || NETWORK_MATCH[k].some((t) => !t.includes('.') && key.includes(t)));
      if (found) return found;
    }
  }
  const text = clean(a.querySelector('.cmp-button__text') || a).toLowerCase();
  const byText = Object.keys(NETWORK_MATCH).find((k) => NETWORK_MATCH[k].some((t) => !t.includes('.') && text.includes(t)));
  if (byText) return byText;
  const href = (a.getAttribute('href') || '').toLowerCase();
  return Object.keys(NETWORK_MATCH).find((k) => NETWORK_MATCH[k].some((t) => href.includes(t))) || null;
}

function buildRow(section, document) {
  const nameEl = section.querySelector('.title:not(.cmp-title--black) .cmp-title__text')
    || section.querySelector('h3')
    || section.querySelector('h1, h2, h4');
  const name = clean(nameEl);

  const rolesEl = section.querySelector('.cmp-title--black .cmp-title__text')
    || section.querySelector('h5, h6');
  const roles = rolesEl && rolesEl !== nameEl ? clean(rolesEl) : '';

  const image = resolveImage(section.querySelector('.cmp-image') || section.querySelector('img'), document, name);

  const body = [];
  if (name) {
    const h3 = document.createElement('h3');
    h3.textContent = name;
    body.push(h3);
  }
  if (roles) {
    const p = document.createElement('p');
    p.textContent = roles;
    body.push(p);
  }

  let anchors = [...section.querySelectorAll('.cmp-buildingblock--btn-list a.cmp-button')];
  if (!anchors.length) anchors = [...section.querySelectorAll('a.cmp-button, .cmp-buildingblock--btn-list a[href]')];
  const links = anchors
    .filter((a, i, arr) => arr.indexOf(a) === i && a.getAttribute('href'))
    .map((a) => {
      const network = detectNetwork(a);
      const label = network ? NETWORK_LABELS[network] : clean(a.querySelector('.cmp-button__text') || a);
      if (!label) return null;
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = label;
      return link;
    })
    .filter(Boolean);
  // One <p> per link. A shared paragraph is unsafe: several source profiles reuse the same
  // placeholder href ('#', '#selveraj'), and html2md preprocessing merges adjacent same-href
  // anchors into one. blocks/cards-profile collects every link-only paragraph (isLinkOnly).
  links.forEach((link) => {
    const p = document.createElement('p');
    p.append(link);
    body.push(p);
  });

  if (!image && !body.length) return null;
  return [image || '', body.length ? body : ''];
}

export default function parse(element, { document }) {
  if (!element.parentNode) return;

  // Collect this section plus its consecutive following sibling contributor sections.
  const run = [element];
  let next = element.nextElementSibling;
  while (next && next.matches(RUN_SELECTOR)) {
    run.push(next);
    next = next.nextElementSibling;
  }

  const cells = run.map((section) => buildRow(section, document)).filter(Boolean);

  // Remove the rest of the run (the import script skips detached elements).
  run.slice(1).forEach((section) => section.remove());

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-profile', cells });
  element.replaceWith(block);
}
