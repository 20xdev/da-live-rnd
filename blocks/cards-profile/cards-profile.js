import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards (Profile) — a grid of person profiles.
 *
 * Authored content: one row per person.
 *   cell 1: portrait image
 *   cell 2: <h3>Name</h3><p>Roles</p> + social links (link text = network label,
 *           e.g. Facebook / Twitter / Instagram; href = profile URL)
 * Authors may omit the image, roles or links, put everything in one cell, or add
 * more networks. Known networks render as icon-only buttons (label kept as
 * accessible text); unknown networks fall back to a plain text link.
 */

const OPTION_CLASSES = [];

const svg = (path) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="${path}"/></svg>`;

const NETWORKS = {
  facebook: {
    match: ['facebook', 'fb.com', 'fb.me'],
    icon: svg('M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5V13h2.7v8z'),
  },
  twitter: {
    match: ['twitter', 'x.com'],
    icon: svg('M22 5.9c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1-.8-.8-1.9-1.3-3-1.3-2.3 0-4.1 1.8-4.1 4.1 0 .3 0 .6.1.9C8.4 8.8 5.4 7.2 3.4 4.7c-.4.6-.6 1.3-.6 2.1 0 1.4.7 2.7 1.8 3.4-.7 0-1.3-.2-1.9-.5 0 2 1.4 3.7 3.3 4.1-.6.2-1.2.2-1.9.1.5 1.6 2 2.8 3.9 2.9-1.4 1.1-3.2 1.8-5.1 1.8H2c1.8 1.2 4 1.8 6.3 1.8 7.5 0 11.7-6.2 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.2z'),
  },
  instagram: {
    match: ['instagram', 'insta'],
    icon: svg('M12 4.2c2.5 0 2.8 0 3.8.1 2.6.1 3.8 1.3 3.9 3.9.1 1 .1 1.3.1 3.8s0 2.8-.1 3.8c-.1 2.6-1.3 3.8-3.9 3.9-1 .1-1.3.1-3.8.1s-2.8 0-3.8-.1c-2.6-.1-3.8-1.3-3.9-3.9-.1-1-.1-1.3-.1-3.8s0-2.8.1-3.8C4.4 5.6 5.6 4.4 8.2 4.3c1-.1 1.3-.1 3.8-.1zM12 2.4c-2.6 0-2.9 0-3.9.1-3.5.2-5.4 2.1-5.6 5.6-.1 1-.1 1.3-.1 3.9s0 2.9.1 3.9c.2 3.5 2.1 5.4 5.6 5.6 1 .1 1.3.1 3.9.1s2.9 0 3.9-.1c3.5-.2 5.4-2.1 5.6-5.6.1-1 .1-1.3.1-3.9s0-2.9-.1-3.9c-.2-3.5-2.1-5.4-5.6-5.6-1-.1-1.3-.1-3.9-.1zm0 4.7a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.1-9.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z'),
  },
  linkedin: {
    match: ['linkedin'],
    icon: svg('M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z'),
  },
  youtube: {
    match: ['youtube', 'youtu.be'],
    icon: svg('M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2C.5 9.1.5 12 .5 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8zM9.7 15.5v-7l6 3.5z'),
  },
};

function textOf(el) {
  return (el?.textContent || '').trim();
}

/**
 * Detects the social network of a link from its text first, then its href.
 * @param {HTMLAnchorElement} a
 * @returns {string|null} network key
 */
function detectNetwork(a) {
  const text = textOf(a).toLowerCase();
  const href = (a.getAttribute('href') || '').toLowerCase();
  const byText = Object.keys(NETWORKS).find((key) => text === key
    || (key === 'twitter' && text === 'x')
    || NETWORKS[key].match.some((m) => !m.includes('.') && text.includes(m)));
  if (byText) return byText;
  return Object.keys(NETWORKS).find((key) => NETWORKS[key].match.some((m) => href.includes(m)))
    || null;
}

/** An element whose visible content is only links (e.g. a paragraph of social links). */
function isLinkOnly(el) {
  if (/^H[1-6]$/.test(el.tagName)) return false;
  const links = [...el.querySelectorAll('a')];
  if (!links.length) return false;
  const linkText = links.map(textOf).join('');
  return textOf(el).replace(/[\s|,•·/-]/g, '') === linkText.replace(/[\s|,•·/-]/g, '');
}

function buildSocialItem(a) {
  const li = document.createElement('li');
  const label = textOf(a);
  a.classList.remove('button', 'primary', 'secondary');
  const network = detectNetwork(a);
  if (network) {
    a.className = `cards-profile-social-link cards-profile-social-${network}`;
    a.setAttribute('aria-label', label || network);
    a.title = label || network;
    const hidden = document.createElement('span');
    hidden.className = 'cards-profile-social-label';
    hidden.textContent = label || network;
    a.innerHTML = NETWORKS[network].icon;
    a.append(hidden);
  } else {
    a.className = 'cards-profile-social-link cards-profile-social-text';
  }
  li.append(a);
  return li;
}

function buildCard(row) {
  const cells = [...row.children];
  const li = document.createElement('li');

  const imageWrap = document.createElement('div');
  imageWrap.className = 'cards-profile-image';
  const body = document.createElement('div');
  body.className = 'cards-profile-body';

  // Gather content from every cell so a merged or reordered row still works.
  cells.forEach((cell) => {
    const pictures = [...cell.querySelectorAll('picture')];
    if (!imageWrap.children.length && pictures[0]) {
      const pic = pictures[0];
      const holder = pic.parentElement;
      imageWrap.append(pic);
      if (holder !== cell && !textOf(holder) && !holder.querySelector('picture, img')) holder.remove();
    }
    body.append(...cell.childNodes);
  });

  // Bare text nodes directly in the cell: wrap so they can be laid out.
  [...body.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      if (!n.textContent.trim()) { n.remove(); return; }
      const p = document.createElement('p');
      n.replaceWith(p);
      p.append(n);
    }
  });

  // Social links: link-only blocks after the name.
  const social = document.createElement('ul');
  social.className = 'cards-profile-social';
  [...body.children].forEach((el) => {
    if (!isLinkOnly(el)) return;
    el.querySelectorAll('a').forEach((a) => social.append(buildSocialItem(a)));
    el.remove();
  });

  // Name + roles.
  const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('cards-profile-name');
  const roles = [...body.children].find((el) => el !== heading && el.tagName === 'P' && textOf(el));
  if (roles) roles.classList.add('cards-profile-roles');
  body.querySelectorAll('p').forEach((p) => {
    if (!textOf(p) && !p.querySelector('img, picture')) p.remove();
  });

  if (social.children.length) body.append(social);
  if (!imageWrap.children.length && !body.children.length) return null;

  if (imageWrap.children.length) li.append(imageWrap);
  if (body.children.length) li.append(body);
  return li;
}

export default function decorate(block) {
  // No options yet; collected once so future option branches have a single place to hook in.
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const card = buildCard(row);
    if (card) ul.append(card);
  });

  ul.querySelectorAll('.cards-profile-image picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });

  block.replaceChildren(ul);
}
