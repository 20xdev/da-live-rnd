import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Columns Featured: a single-row, two-cell featured teaser.
 * Cell 1: image. Cell 2: eyebrow, heading, text, CTA.
 * Cell order is detected by content, so authors may swap or omit cells.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-featured-row');
    const cells = [...row.children];

    cells.forEach((cell) => {
      const pic = cell.querySelector('picture');
      const hasText = [...cell.children].some((el) => !el.querySelector('picture') && el.textContent.trim());

      if (pic && !hasText) {
        cell.classList.add('columns-featured-image');
        const img = pic.querySelector('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, true, [
            { media: '(min-width: 900px)', width: '1200' },
            { width: '750' },
          ]);
          pic.replaceWith(optimized);
        }
        return;
      }

      if (!cell.textContent.trim() && !pic) {
        cell.remove();
        return;
      }

      cell.classList.add('columns-featured-content');

      // Eyebrow: a short paragraph that precedes the heading.
      const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        const prev = heading.previousElementSibling;
        if (prev && prev.tagName === 'P' && !prev.querySelector('a, picture')) {
          prev.classList.add('columns-featured-eyebrow');
        }
      }
    });

    if (!row.querySelector('.columns-featured-image')) {
      row.classList.add('columns-featured-no-image');
    }
  });
}
