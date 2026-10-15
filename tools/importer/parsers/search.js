/* eslint-disable */
/* global WebImporter */
/**
 * Parser for search. Base: search. Source: https://wknd.site/us/en/ai-powered-search.html
 *
 * Source (verified in block-context/search/source.html):
 *   .contentaisearch > section.cmp-contentaisearch > form.cmp-contentaisearch__form
 *     input.cmp-contentaisearch__input[placeholder]            -> placeholder text
 *     label.cmp-contentaisearch__ai-toggle (text + input[aria-label]) -> toggle label
 *   Hidden summary / error / results containers and <script type="x-template"> item
 *   templates are runtime-only UI and are ignored.
 *
 * Static content only (blocks/search/search.js: authored content is optional plain text;
 * the first text becomes the input placeholder, a second becomes the summary-toggle label).
 * No index link is emitted (block defaults to /query-index.json).
 *
 * Output (search): one row, one cell: [p placeholder, p toggle label].
 */

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  const input = element.querySelector('input.cmp-contentaisearch__input')
    || element.querySelector('input[type="search"], input[type="text"], input[name="q"]');
  const placeholder = clean(input && input.getAttribute('placeholder'));

  let toggleLabel = '';
  const toggle = element.querySelector('label.cmp-contentaisearch__ai-toggle')
    || element.querySelector('input[type="checkbox"]')?.closest('label');
  if (toggle) {
    toggleLabel = clean(toggle.textContent);
    if (!toggleLabel) {
      const box = toggle.querySelector('input[type="checkbox"]');
      toggleLabel = clean(box && box.getAttribute('aria-label'));
    }
  }

  const contentCell = [];
  // The block takes texts positionally; a toggle label without a placeholder would be read
  // as the placeholder, so only emit the toggle label when a placeholder exists.
  if (placeholder) {
    const p = document.createElement('p');
    p.textContent = placeholder;
    contentCell.push(p);
    if (toggleLabel) {
      const p2 = document.createElement('p');
      p2.textContent = toggleLabel;
      contentCell.push(p2);
    }
  }

  const cells = [[contentCell.length ? contentCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'search', cells });
  element.replaceWith(block);
}
