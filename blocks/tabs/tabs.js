/*
 * Tabs Block
 * One row per tab: cell 1 = tab label, remaining cells = tab panel content
 * (rich text, images, or a list of teaser items).
 * A list whose items contain images renders as a card grid inside the panel.
 */
import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';

let tabsId = 0;

function selectTab(block, button) {
  block.querySelectorAll('.tabs-tab').forEach((tab) => {
    const selected = tab === button;
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
  });
  block.querySelectorAll('.tabs-panel').forEach((panel) => {
    panel.hidden = panel.id !== button.getAttribute('aria-controls');
  });
}

/* card = image + linked title + description; any part may be missing */
function decorateCard(li) {
  li.classList.add('tabs-card');
  // wrap stray inline content so every part is a block we can classify
  [...li.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const p = document.createElement('p');
      node.replaceWith(p);
      p.append(node);
    } else if (node.nodeName === 'PICTURE' || node.nodeName === 'A') {
      const p = document.createElement('p');
      node.replaceWith(p);
      p.append(node);
    }
  });
  let link;
  [...li.children].forEach((part) => {
    if (part.querySelector('picture')) {
      part.classList.add('tabs-card-image');
    } else if (!link && part.querySelector('a') && part.textContent.trim() === part.querySelector('a').textContent.trim()) {
      part.classList.add('tabs-card-title');
      link = part.querySelector('a');
    } else {
      part.classList.add('tabs-card-description');
    }
  });
  // image links to the same page as the title (duplicate link hidden from AT)
  const picture = li.querySelector('.tabs-card-image picture');
  if (link && picture && !picture.closest('a')) {
    const a = document.createElement('a');
    a.href = link.href;
    a.tabIndex = -1;
    a.setAttribute('aria-hidden', 'true');
    picture.replaceWith(a);
    a.append(picture);
  }
}

function decoratePanel(panel) {
  panel.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }]),
    );
  });
  panel.querySelectorAll('ul').forEach((ul) => {
    const items = [...ul.children];
    if (items.length && items.some((li) => li.querySelector('picture'))) {
      ul.classList.add('tabs-cards');
      panel.classList.add('tabs-panel-cards');
      items.forEach(decorateCard);
    }
  });
}

export default function decorate(block) {
  tabsId += 1;
  const id = tabsId;
  const rows = [...block.children].filter((row) => row.children.length);

  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const panels = [];
  rows.forEach((row, idx) => {
    const [labelCell, ...contentCells] = [...row.children];
    const labelText = labelCell.textContent.trim() || `Tab ${idx + 1}`;
    const slug = toClassName(labelText) || `tab-${idx + 1}`;
    const panelId = `tabpanel-${id}-${slug}-${idx}`;
    const tabId = `tab-${id}-${slug}-${idx}`;

    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    contentCells.forEach((cell) => panel.append(...cell.childNodes));
    decoratePanel(panel);
    // text-only panels must still be reachable by keyboard (WAI-ARIA tabs pattern)
    if (!panel.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')) {
      panel.tabIndex = 0;
    }
    panels.push(panel);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-tab';
    button.id = tabId;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panelId);
    button.append(...labelCell.childNodes);
    if (!button.textContent.trim()) button.textContent = labelText;
    // unwrap a single paragraph so the button holds inline content only
    const p = button.querySelector(':scope > p:only-child');
    if (p) p.replaceWith(...p.childNodes);
    button.addEventListener('click', () => selectTab(block, button));
    tablist.append(button);
  });

  // arrow-key navigation between tabs
  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.querySelectorAll('.tabs-tab')];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      tabs[next].focus();
      selectTab(block, tabs[next]);
    }
  });

  block.replaceChildren(tablist, ...panels);
  const first = tablist.querySelector('.tabs-tab');
  if (first) selectTab(block, first);
}
