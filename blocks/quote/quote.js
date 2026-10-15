/*
 * Quote Block
 * Rows are rendered in authored order. Each cell is classified as:
 *  - image: a cell containing only a picture
 *  - quotation: the first text cell (wrapped in a <blockquote>)
 *  - attribution: any following text cell (wrapped in a <figcaption>)
 * Image, attribution and extra rows are all optional.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const figure = document.createElement('figure');
  figure.className = 'quote-figure';
  let hasQuotation = false;

  cells.forEach((cell) => {
    const hasText = cell.textContent.trim() !== '';
    const picture = cell.querySelector('picture');

    if (picture && !hasText) {
      const img = picture.querySelector('img');
      const wrapper = document.createElement('div');
      wrapper.className = 'quote-image';
      wrapper.append(img
        ? createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 600px)', width: '1200' }, { width: '750' }])
        : picture);
      figure.append(wrapper);
      return;
    }
    if (!hasText) return;

    if (!hasQuotation) {
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'quote-quotation';
      blockquote.append(...cell.childNodes);
      figure.append(blockquote);
      hasQuotation = true;
    } else {
      const caption = document.createElement('figcaption');
      caption.className = 'quote-attribution';
      caption.append(...cell.childNodes);
      figure.append(caption);
    }
  });

  if (figure.querySelector('.quote-image')) block.classList.add('quote-has-image');
  if (figure.querySelector('.quote-attribution')) block.classList.add('quote-has-attribution');
  block.replaceChildren(figure);
}
