/*
 * Breadcrumbs Block
 * Authored as a list of links (a single list, or one link per row/cell).
 * The last item is the current page; it may be plain text or a link.
 * If nothing is authored, the current page title is rendered as a single crumb.
 */

function collectCrumbs(block) {
  const crumbs = [];
  const listItems = block.querySelectorAll('li');
  if (listItems.length) {
    listItems.forEach((li) => {
      const a = li.querySelector('a');
      const text = (a || li).textContent.trim();
      if (text) crumbs.push({ text, href: a ? a.href : null });
    });
    return crumbs;
  }

  // one crumb per cell (or per paragraph within a cell)
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const parts = cell.querySelectorAll('p').length ? [...cell.querySelectorAll('p')] : [cell];
    parts.forEach((part) => {
      const links = part.querySelectorAll('a');
      if (links.length) {
        links.forEach((a) => {
          const text = a.textContent.trim();
          if (text) crumbs.push({ text, href: a.href });
        });
      } else {
        const text = part.textContent.trim();
        if (text) crumbs.push({ text, href: null });
      }
    });
  });
  return crumbs;
}

export default function decorate(block) {
  const crumbs = collectCrumbs(block);
  if (!crumbs.length && document.title) crumbs.push({ text: document.title, href: null });

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  ol.className = 'breadcrumbs-list';

  crumbs.forEach((crumb, i) => {
    const li = document.createElement('li');
    li.className = 'breadcrumbs-item';
    const isLast = i === crumbs.length - 1;
    if (crumb.href && !isLast) {
      const a = document.createElement('a');
      a.href = crumb.href;
      a.textContent = crumb.text;
      li.append(a);
    } else {
      const span = document.createElement('span');
      span.textContent = crumb.text;
      if (isLast) span.setAttribute('aria-current', 'page');
      li.append(span);
    }
    ol.append(li);
  });

  nav.append(ol);
  block.replaceChildren(nav);
}
