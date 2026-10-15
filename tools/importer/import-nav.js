/* eslint-disable */
/* global WebImporter */

/**
 * Import script: header navigation fragment (nav.plain.html)
 * Sample URLs: https://wknd.site/ (site default -> /nav), https://wknd.site/us/en.html (-> /us/en/nav)
 *
 * Unlike the page templates, this transform does NOT import the page body. It reads the
 * WKND header experience fragment (AEM Core Components) of any locale home page and emits
 * ONLY the nav fragment, as flat semantic sections (no class/id/style/data-*, no form
 * controls) that blocks/header/header.js decorates:
 *
 *   section 1 - utility bar : Sign In link + locale list (flag image + country, nested locale links)
 *   section 2 - brand       : logo image linked to the locale home
 *   section 3 - sections    : navigation tree (root "Home" item + its child section links)
 *   section 4 - tools       : search icon link
 *
 * Selectors verified on https://wknd.site/us/en.html and https://wknd.site/us/es.html
 * (placeholder locale: same header, navigation tree has only the root item, no children).
 * Every lookup is optional; a missing element simply drops that piece.
 *
 * Images are referenced as relative `images/<file>` paths (files live in content/images/):
 *  - logo  -> basename of the source image (e.g. wknd-logo-dk.svg)
 *  - flags -> flag-<countrycode>.svg (country code from cmp-languagenavigation__item--countrycode-XX)
 *  - icons -> icon-<name>.svg (name from cmp-button__icon--<name>; source renders an icon font glyph)
 *
 * Output path: the locale prefix of the URL (/<country>/<lang>) + /nav, or /nav when the URL
 * has no locale prefix (e.g. the site root, which redirects to the default locale home).
 */

const SELECTORS = {
  header: 'header.cmp-experiencefragment--header, header.experiencefragment, header',
  signIn: '.wknd-sign-in-buttons__button--sign-in, .sign-in-buttons a[href="#sign-in"]',
  langNav: '.languagenavigation nav.cmp-languagenavigation, nav.cmp-languagenavigation',
  logo: '.cmp-image--logo',
  nav: '.cmp-navigation--header nav.cmp-navigation, .navigation nav.cmp-navigation',
  search: '.cmp-button--header-search a',
};

const IMAGE_DIR = 'images';

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

function fileName(src) {
  if (!src) return '';
  const clean = src.split('#')[0].split('?')[0];
  return clean.substring(clean.lastIndexOf('/') + 1).toLowerCase().replace(/[^a-z0-9._-]/g, '-');
}

function image(document, file, alt) {
  const img = document.createElement('img');
  img.setAttribute('src', `${IMAGE_DIR}/${file}`);
  img.setAttribute('alt', alt || '');
  return img;
}

function link(document, source, content) {
  const a = document.createElement('a');
  a.setAttribute('href', source.getAttribute('href') || '#');
  const title = source.getAttribute('title');
  if (title) a.setAttribute('title', title);
  if (typeof content === 'string') a.textContent = content;
  else if (content) a.append(content);
  return a;
}

function para(document, ...children) {
  const p = document.createElement('p');
  p.append(...children);
  return p;
}

// Section 1: Sign In + locale list
function buildUtility(document, header) {
  const nodes = [];
  const signIn = header.querySelector(SELECTORS.signIn);
  if (signIn && text(signIn)) nodes.push(para(document, link(document, signIn, text(signIn))));

  const langNav = header.querySelector(SELECTORS.langNav);
  const countries = langNav ? [...langNav.querySelectorAll(':scope > ul > li')] : [];
  if (countries.length) {
    const ul = document.createElement('ul');
    countries.forEach((country) => {
      const li = document.createElement('li');
      const title = country.querySelector(':scope > .cmp-languagenavigation__item-title');
      const ccMatch = country.className.match(/--countrycode-([a-z]{2})\b/i);
      const label = para(document);
      if (ccMatch) label.append(image(document, `flag-${ccMatch[1].toLowerCase()}.svg`, ccMatch[1].toUpperCase()));
      label.append(text(title));
      li.append(label);
      const links = [...country.querySelectorAll('.cmp-languagenavigation__item-link')];
      if (links.length) {
        const sub = document.createElement('ul');
        links.forEach((a) => {
          const sli = document.createElement('li');
          sli.append(link(document, a, text(a)));
          sub.append(sli);
        });
        li.append(sub);
      }
      ul.append(li);
    });
    nodes.push(ul);
  }
  return nodes;
}

// Section 2: logo
function buildBrand(document, header) {
  const logo = header.querySelector(SELECTORS.logo);
  const img = logo && logo.querySelector('img');
  if (!img) return [];
  const file = fileName(img.getAttribute('src') || img.getAttribute('data-src'));
  if (!file) return [];
  const pic = image(document, file, img.getAttribute('alt') || 'Logo');
  const a = logo.querySelector('a[href]');
  return [para(document, a ? link(document, a, pic) : pic)];
}

// Section 3: navigation tree (keeps the source nesting: root item > section items)
function buildList(document, group) {
  const items = [...group.querySelectorAll(':scope > li')];
  if (!items.length) return null;
  const ul = document.createElement('ul');
  items.forEach((item) => {
    const a = item.querySelector(':scope > a');
    if (!a || !text(a)) return;
    const li = document.createElement('li');
    li.append(link(document, a, text(a)));
    const child = item.querySelector(':scope > ul');
    const sub = child && buildList(document, child);
    if (sub) li.append(sub);
    ul.append(li);
  });
  return ul.children.length ? ul : null;
}

function buildSections(document, header) {
  const nav = header.querySelector(SELECTORS.nav);
  const group = nav && nav.querySelector(':scope > ul');
  const list = group && buildList(document, group);
  return list ? [list] : [];
}

// Section 4: tools (search icon link)
function buildTools(document, header) {
  return [...header.querySelectorAll(SELECTORS.search)].map((a) => {
    const icon = a.querySelector('[class*="cmp-button__icon--"]');
    const nameMatch = icon && icon.className.match(/cmp-button__icon--([a-z0-9-]+)/i);
    const label = a.getAttribute('aria-label') || a.getAttribute('title') || text(a) || 'Search';
    const content = nameMatch ? image(document, `icon-${nameMatch[1].toLowerCase()}.svg`, label) : label;
    const out = link(document, a, content);
    if (!out.getAttribute('title')) out.setAttribute('title', label);
    return para(document, out);
  });
}

function navPath(originalURL) {
  const { pathname } = new URL(originalURL);
  const m = pathname.match(/^\/([a-z]{2})\/([a-z]{2})(?:\.html?|\/|$)/i);
  return m ? `/${m[1].toLowerCase()}/${m[2].toLowerCase()}/nav` : '/nav';
}

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const header = document.querySelector(SELECTORS.header) || document.body;

    const sections = [
      buildUtility(document, header),
      buildBrand(document, header),
      buildSections(document, header),
      buildTools(document, header),
    ].filter((nodes) => nodes.length);

    // Sections are separated by <hr> (section breaks) -> one top-level <div> each.
    const main = document.createElement('div');
    sections.forEach((nodes, i) => {
      if (i > 0) main.append(document.createElement('hr'));
      main.append(...nodes);
    });

    const path = WebImporter.FileUtils.sanitizePath(navPath(params.originalURL));
    return [{
      element: main,
      path,
      report: {
        title: 'nav',
        template: 'nav',
        sections: sections.length,
      },
    }];
  },
};
