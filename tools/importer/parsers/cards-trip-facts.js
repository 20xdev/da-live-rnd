/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-trip-facts. Base: cards. Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 *
 * Source (AEM Core content fragment, verified in block-context/cards-trip-facts/source.html):
 *   div.contentfragment.cmp-contentfragment--elements > article.cmp-contentfragment
 *     h3.cmp-contentfragment__title                  (hidden, skipped)
 *     dl.cmp-contentfragment__elements
 *       div.cmp-contentfragment__element             (one per fact)
 *         dt.cmp-contentfragment__element-title      (label)
 *         dd.cmp-contentfragment__element-value      (value)
 *
 * Output (blocks/cards-trip-facts decorator): one row per fact, single cell:
 *   <p>Label</p><p><strong>Value</strong></p>
 */
function clean(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  let facts = [...element.querySelectorAll('.cmp-contentfragment__element')];
  // Fallback: plain dt/dd pairs without the element wrapper.
  if (!facts.length) {
    facts = [...element.querySelectorAll('dt')].map((dt) => {
      const wrap = document.createElement('div');
      const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === 'DD' ? dt.nextElementSibling : null;
      wrap.append(dt.cloneNode(true));
      if (dd) wrap.append(dd.cloneNode(true));
      return wrap;
    });
  }

  const cells = [];
  facts.forEach((fact) => {
    const label = clean(fact.querySelector('.cmp-contentfragment__element-title, dt'));
    const value = clean(fact.querySelector('.cmp-contentfragment__element-value, dd'));
    if (!label && !value) return;
    const cell = [];
    if (label) {
      const p = document.createElement('p');
      p.textContent = label;
      cell.push(p);
    }
    if (value) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = value;
      p.append(strong);
      cell.push(p);
    }
    cells.push([cell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-trip-facts', cells });
  element.replaceWith(block);
}
