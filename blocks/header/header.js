// Desktop layout breakpoint (source shows the full navigation row from 1200px).
const isDesktop = window.matchMedia('(width >= 1200px)');

// Scroll distance after which the main bar compacts and gains a shadow.
const SCROLL_COMPACT_OFFSET = 10;

const NAV_SECTIONS = ['utility', 'brand', 'sections', 'tools'];

/**
 * Normalizes a URL path for comparison: drops a leading /content (local preview),
 * a trailing .html and trailing slashes.
 * @param {string} pathname
 * @returns {string}
 */
function normalizePath(pathname) {
  const path = pathname
    .replace(/^\/content(?=\/)/, '')
    .replace(/\.html?$/, '')
    .replace(/\/+$/, '');
  return path || '/';
}

/**
 * Returns the /<country>/<lang> prefix of a page path (also when served under /content),
 * or null when the path does not start with two locale-like segments.
 * @param {string} pathname
 * @returns {string|null}
 */
function getLocalePrefix(pathname) {
  const parts = normalizePath(pathname).split('/').filter(Boolean);
  if (parts.length >= 2 && /^[a-z]{2}$/i.test(parts[0]) && /^[a-z]{2}$/i.test(parts[1])) {
    return `/${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`;
  }
  return null;
}

/**
 * Fetches the first URL that responds OK.
 * @param {string[]} urls
 * @returns {Promise<{resp: Response, url: string}|null>}
 */
async function fetchFirst(urls) {
  // eslint-disable-next-line no-restricted-syntax
  for (const url of urls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch(url);
      if (resp.ok) return { resp, url };
    } catch (e) {
      // try the next candidate
    }
  }
  return null;
}

/**
 * Loads the nav fragment: per-locale fragment first (derived from the page path), then the
 * metadata-independent fixed paths (/content first for local preview, root for DA/EDS).
 * @returns {Promise<{html: string, url: string}|null>}
 */
async function fetchNavFragment() {
  const prefix = getLocalePrefix(window.location.pathname);
  if (prefix) {
    const localized = await fetchFirst([
      ['/content', prefix, '/nav.plain.html'].join(''),
      [prefix, '/nav.plain.html'].join(''),
    ]);
    if (localized) return { html: await localized.resp.text(), url: localized.url };
  }
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let url = '/content/nav.plain.html';
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) {
    url = '/nav.plain.html';
    resp = await fetch('/nav.plain.html');
  }
  return resp.ok ? { html: await resp.text(), url } : null;
}

/**
 * Resolves relative media references (e.g. images/logo.svg) against the fragment URL,
 * so they work regardless of the page that embeds the header.
 * @param {Element} root
 * @param {string} fragmentUrl
 */
function resolveMedia(root, fragmentUrl) {
  const base = new URL(fragmentUrl, window.location.href);
  const isRelative = (value) => value && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(value);
  root.querySelectorAll('img[src], source[srcset]').forEach((media) => {
    const attr = media.hasAttribute('srcset') ? 'srcset' : 'src';
    const value = media.getAttribute(attr);
    if (attr === 'src' && isRelative(value)) media.setAttribute('src', new URL(value, base).href);
    if (attr === 'srcset') {
      media.setAttribute('srcset', value.split(',').map((part) => {
        const [src, ...rest] = part.trim().split(/\s+/);
        return isRelative(src) ? [new URL(src, base).href, ...rest].join(' ') : part.trim();
      }).join(', '));
    }
  });
}

/**
 * Replaces <p> wrappers inside list items with their children (authoring/markdown adds them).
 * @param {Element} root
 */
function unwrapListParagraphs(root) {
  root.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
}

/**
 * Returns the direct text of an element, ignoring nested lists.
 * @param {Element} parent
 * @returns {string}
 */
function ownText(parent) {
  return [...parent.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && !n.matches('ul, ol, picture, img')))
    .map((n) => n.textContent)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalized path of a link, or null for non-path links (#hash, external).
 * @param {HTMLAnchorElement} a
 * @returns {string|null}
 */
function linkPath(a) {
  const href = a.getAttribute('href') || '';
  if (!href || href.startsWith('#')) return null;
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  return normalizePath(url.pathname);
}

/**
 * Creates an element with a class name.
 * @param {string} tag
 * @param {string} className
 * @returns {HTMLElement}
 */
function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

let openDropdownToggle = null;

/**
 * Opens or closes a dropdown controlled by a toggle (aria-controls).
 * @param {Element} toggle
 * @param {boolean} open
 */
function setDropdown(toggle, open) {
  const panel = document.getElementById(toggle.getAttribute('aria-controls'));
  if (!panel) return;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  panel.hidden = !open;
  toggle.closest('.nav-dropdown-host')?.classList.toggle('is-open', open);
  openDropdownToggle = open ? toggle : null;
}

function closeOpenDropdown() {
  if (openDropdownToggle) setDropdown(openDropdownToggle, false);
}

function onDocumentClick(e) {
  if (!openDropdownToggle) return;
  const host = openDropdownToggle.closest('.nav-dropdown-host');
  if (host && !host.contains(e.target)) closeOpenDropdown();
}

function onDocumentKeydown(e) {
  if (e.key === 'Escape' && openDropdownToggle) {
    const toggle = openDropdownToggle;
    closeOpenDropdown();
    toggle.focus();
  }
}

/**
 * Builds a dropdown selector from a nested list of groups:
 * li (optional image + label) > ul > li > a. The current entry (matching the page path)
 * becomes the toggle label.
 * @param {HTMLUListElement} list
 * @param {string} id
 * @returns {HTMLElement}
 */
function buildGroupedDropdown(list, id) {
  const host = el('div', 'nav-locale nav-dropdown-host');
  const pagePath = normalizePath(window.location.pathname);
  const pagePrefix = getLocalePrefix(window.location.pathname);
  const links = [...list.querySelectorAll('a[href]')];
  const current = links.find((a) => linkPath(a) === pagePath)
    || links.find((a) => pagePrefix && linkPath(a) === pagePrefix)
    || links.find((a) => {
      const p = linkPath(a);
      return p && p !== '/' && pagePath.startsWith(`${p}/`);
    })
    || links[0];

  const panel = el('nav', 'nav-locale-dropdown');
  panel.id = id;
  panel.setAttribute('aria-label', 'Language');
  panel.hidden = true;
  const groups = el('ul', 'nav-locale-groups');
  [...list.children].forEach((item) => {
    const group = el('li', 'nav-locale-group');
    const img = item.querySelector(':scope > picture, :scope > img');
    if (img) {
      const flag = el('span', 'nav-locale-flag');
      flag.append(img);
      group.append(flag);
    }
    const label = ownText(item);
    if (label) {
      const title = el('span', 'nav-locale-country');
      title.textContent = label;
      group.append(title);
    }
    const sub = item.querySelector(':scope > ul');
    if (sub) {
      sub.className = 'nav-locale-links';
      sub.querySelectorAll('a').forEach((a) => {
        if (a === current) {
          a.setAttribute('aria-current', 'true');
          a.closest('li').classList.add('active');
        }
        const code = a.textContent.trim();
        if (code) a.setAttribute('lang', code);
      });
      group.append(sub);
    }
    groups.append(group);
  });
  panel.append(groups);

  const toggle = el('a', 'nav-locale-toggle');
  toggle.href = `#${id}`;
  toggle.setAttribute('role', 'button');
  toggle.setAttribute('aria-controls', id);
  toggle.setAttribute('aria-expanded', 'false');
  if (current) {
    const currentFlag = current.closest('.nav-locale-group')?.querySelector('.nav-locale-flag img');
    if (currentFlag) {
      const flagClone = currentFlag.cloneNode(true);
      flagClone.alt = '';
      toggle.append(flagClone);
    }
    toggle.append(document.createTextNode(current.textContent.trim()));
    toggle.setAttribute('aria-label', `Toggle Language ${current.textContent.trim()}`);
  }
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    // the panel's hidden state is the single source of truth
    setDropdown(toggle, panel.hidden);
  });

  host.append(toggle, panel);
  return host;
}

/**
 * Utility bar: plain links/paragraphs + optional grouped dropdown (nested list).
 * @param {Element} section
 */
function decorateUtility(section) {
  const inner = el('div', 'nav-utility-inner');
  const linksWrap = el('div', 'nav-utility-links');
  [...section.children].forEach((child) => {
    if (child.matches('ul') && child.querySelector(':scope > li > ul')) {
      inner.append(buildGroupedDropdown(child, 'nav-locale-dropdown'));
    } else {
      linksWrap.append(child);
    }
  });
  if (linksWrap.children.length) inner.prepend(linksWrap);
  section.replaceChildren(inner);
}

/**
 * Brand: logo link.
 * @param {Element} section
 */
function decorateBrand(section) {
  const link = section.querySelector('a');
  if (link) {
    link.classList.add('nav-brand-link');
    if (!link.getAttribute('aria-label')) {
      const alt = link.querySelector('img')?.alt;
      if (alt) link.setAttribute('aria-label', alt);
    }
  }
}

/**
 * Navigation tree: the root item (locale home) keeps its children as the visible row.
 * Marks the item matching the current page section as active.
 * @param {Element} section
 */
function decorateSections(section) {
  const list = section.querySelector(':scope > ul');
  if (!list) return;
  const nav = el('nav', 'nav-sections-nav');
  nav.setAttribute('aria-label', 'Main navigation');
  nav.append(list);
  section.replaceChildren(nav);
  list.classList.add('nav-root-list');

  const pagePath = normalizePath(window.location.pathname);
  list.querySelectorAll(':scope > li').forEach((root) => {
    root.classList.add('nav-root');
    const children = root.querySelector(':scope > ul');
    if (children) children.classList.add('nav-items');
  });
  list.querySelectorAll('li').forEach((item) => {
    const a = item.querySelector(':scope > a');
    if (!a) return;
    a.classList.add('nav-link');
    const p = linkPath(a);
    if (!p) return;
    if (p === pagePath) a.setAttribute('aria-current', 'page');
    const isRoot = item.classList.contains('nav-root');
    if (p === pagePath || (!isRoot && p !== '/' && pagePath.startsWith(`${p}/`))) {
      item.classList.add('active');
    }
  });
}

/**
 * Tools: icon links.
 * @param {Element} section
 */
function decorateTools(section) {
  section.querySelectorAll('a').forEach((a) => {
    a.classList.add('nav-tool');
    const img = a.querySelector('img');
    const label = a.getAttribute('title') || img?.alt;
    if (label && !a.getAttribute('aria-label')) a.setAttribute('aria-label', label);
    if (img) img.alt = '';
  });
}

const DECORATORS = {
  utility: decorateUtility,
  brand: decorateBrand,
  sections: decorateSections,
  tools: decorateTools,
};

/**
 * Assigns fragment sections to header areas by their content (authors may omit or reorder
 * sections): grouped list with images = utility, list = sections, image link before the
 * list = brand, image link after it = tools, text-only links = utility.
 * Sections mapped to the same area are merged.
 * @param {Element[]} candidates
 * @returns {Object<string, Element>}
 */
function classifySections(candidates) {
  const result = {};
  candidates.forEach((section) => {
    const hasGroupedList = !!section.querySelector(':scope > ul > li > ul')
      && !!section.querySelector(':scope > ul > li > picture, :scope > ul > li > img');
    const hasList = !!section.querySelector(':scope > ul');
    const hasImage = !!section.querySelector('img');
    let name;
    if (hasGroupedList || (!hasList && !hasImage)) name = 'utility';
    else if (hasList) name = 'sections';
    else if (!result.brand && !result.sections) name = 'brand';
    else name = 'tools';
    if (result[name]) result[name].append(...section.childNodes);
    else result[name] = section;
  });
  return result;
}

function updateScrolled(wrapper) {
  wrapper.classList.toggle('is-scrolled', window.scrollY > SCROLL_COMPACT_OFFSET);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  if (!fragment) return;

  const content = document.createElement('div');
  content.innerHTML = fragment.html;
  resolveMedia(content, fragment.url);
  unwrapListParagraphs(content);

  const sections = classifySections([...content.children].filter((child) => child.tagName === 'DIV'));
  const header = el('div', 'nav');
  header.id = 'nav';
  const main = el('div', 'nav-main');
  const mainInner = el('div', 'nav-main-inner');
  main.append(mainInner);

  NAV_SECTIONS.forEach((name) => {
    const section = sections[name];
    if (!section) return;
    section.classList.add(`nav-${name}`);
    DECORATORS[name](section);
    if (name === 'utility') header.append(section);
    else mainInner.append(section);
  });
  header.append(main);

  const wrapper = el('div', 'nav-wrapper');
  wrapper.append(header);
  block.replaceChildren(wrapper);

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
  window.addEventListener('scroll', () => updateScrolled(wrapper), { passive: true });
  updateScrolled(wrapper);
  // close open dropdowns when crossing the desktop breakpoint
  isDesktop.addEventListener('change', closeOpenDropdown);
}
