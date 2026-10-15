import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Links the card image to the card title link (WKND image list: image and title share a link).
 * The extra link is removed from the tab order and accessibility tree to avoid duplicates.
 * @param {Element} li The card
 */
function linkImage(li) {
  const image = li.querySelector('.cards-card-image');
  const link = li.querySelector('.cards-card-body :is(h2, h3, h4, h5, h6) a[href]');
  const picture = image && image.querySelector('picture');
  if (!picture || !link || picture.closest('a')) return;
  const a = document.createElement('a');
  a.href = link.getAttribute('href');
  a.tabIndex = -1;
  a.setAttribute('aria-hidden', 'true');
  picture.replaceWith(a);
  a.append(picture);
}

/**
 * Secure (members only) variant: marks the trailing call-to-action paragraph
 * (a link, or a plain label such as "Read More" after the description).
 * @param {Element} li The card
 */
function decorateSecureCta(li) {
  const paras = [...li.querySelectorAll('.cards-card-body > p')];
  const last = paras[paras.length - 1];
  if (!last) return;
  if (last.classList.contains('button-container') || last.querySelector('a') || paras.length > 1) {
    last.classList.add('cards-card-cta');
  }
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  ul.querySelectorAll(':scope > li').forEach((li) => {
    if (block.classList.contains('secure')) decorateSecureCta(li);
    else linkImage(li);
  });
  block.replaceChildren(ul);
}
