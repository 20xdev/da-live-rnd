/* eslint-disable */
/* global WebImporter */
/**
 * Parser for breadcrumbs. Base: breadcrumbs (custom block, no library convention).
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 *
 * Source (AEM Core breadcrumb, verified in block-context/breadcrumbs/source.html):
 *   div.breadcrumb.cmp-breadcrumb--fixed > nav.cmp-breadcrumb > ol.cmp-breadcrumb__list
 *     li.cmp-breadcrumb__item > a.cmp-breadcrumb__item-link > span   (ancestor pages)
 *     li.cmp-breadcrumb__item.cmp-breadcrumb__item--active > span     (current page)
 *
 * Output (blocks/breadcrumbs decorator reads every <li>): one row, one cell holding a <ul>;
 * ancestor items are links, the last item (current page) is plain text.
 */
export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('li.cmp-breadcrumb__item')];
  if (!items.length) items = [...element.querySelectorAll('ol > li, ul > li')];

  const ul = document.createElement('ul');
  items.forEach((item, i) => {
    const link = item.querySelector('a[href]');
    const text = (link || item).textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const isCurrent = item.classList.contains('cmp-breadcrumb__item--active') || i === items.length - 1;
    const li = document.createElement('li');
    if (link && !isCurrent) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = text;
      li.append(a);
    } else {
      li.textContent = text;
    }
    ul.append(li);
  });

  if (!ul.children.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[ul]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'breadcrumbs', cells });
  element.replaceWith(block);
}
