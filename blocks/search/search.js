/*
 * Search Block
 * Authored content (all optional):
 *  - a link to the index to search (defaults to /query-index.json)
 *  - plain text: the first becomes the input placeholder,
 *    a second becomes the label of an on/off summary toggle
 * Results are filtered client-side from the index and rendered as a list.
 */
import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

const MIN_QUERY_LENGTH = 3;
const searchParams = new URLSearchParams(window.location.search);

function findNextHeading(el) {
  let preceding = el.parentElement?.previousElementSibling || el.parentElement?.parentElement;
  while (preceding) {
    const lastHeading = [...preceding.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop();
    if (lastHeading) {
      const level = parseInt(lastHeading.nodeName[1], 10);
      return level < 6 ? `H${level + 1}` : 'H6';
    }
    preceding = preceding.previousElementSibling || preceding.parentElement;
  }
  return 'H2';
}

function highlight(terms, element) {
  const { textContent } = element;
  if (!textContent) return;
  const matches = [];
  terms.forEach((term) => {
    let offset = textContent.toLowerCase().indexOf(term);
    while (offset >= 0) {
      matches.push({ offset, length: term.length });
      offset = textContent.toLowerCase().indexOf(term, offset + term.length);
    }
  });
  if (!matches.length) return;
  matches.sort((a, b) => a.offset - b.offset);
  const fragment = document.createDocumentFragment();
  let current = 0;
  matches.forEach(({ offset, length }) => {
    if (offset < current) return;
    if (offset > current) fragment.append(textContent.substring(current, offset));
    const mark = document.createElement('mark');
    mark.textContent = textContent.substring(offset, offset + length);
    fragment.append(mark);
    current = offset + length;
  });
  if (current < textContent.length) fragment.append(textContent.substring(current));
  element.replaceChildren(fragment);
}

let indexCache;
async function fetchIndex(source) {
  if (indexCache) return indexCache;
  try {
    const resp = await fetch(source);
    if (!resp.ok) return [];
    const json = await resp.json();
    indexCache = json?.data || [];
  } catch {
    indexCache = [];
  }
  return indexCache;
}

function filterData(terms, data) {
  const inTitle = [];
  const inMeta = [];
  data.forEach((result) => {
    const title = `${result.header || result.title || ''}`.toLowerCase();
    if (terms.every((t) => title.includes(t))) {
      inTitle.push(result);
      return;
    }
    const meta = `${result.title || ''} ${result.description || ''} ${(result.path || '').split('/').pop()}`.toLowerCase();
    if (terms.some((t) => meta.includes(t))) inMeta.push(result);
  });
  return [...inTitle, ...inMeta];
}

function renderResult(result, terms, titleTag) {
  const li = document.createElement('li');
  li.className = 'search-result';
  const a = document.createElement('a');
  a.href = result.path;
  if (result.image) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-result-image';
    wrapper.append(createOptimizedPicture(result.image, '', false, [{ width: '375' }]));
    a.append(wrapper);
  }
  const body = document.createElement('div');
  body.className = 'search-result-body';
  if (result.title) {
    const title = document.createElement(titleTag);
    title.className = 'search-result-title';
    title.textContent = result.title;
    highlight(terms, title);
    body.append(title);
  }
  if (result.description) {
    const p = document.createElement('p');
    p.textContent = result.description;
    highlight(terms, p);
    body.append(p);
  }
  a.append(body);
  li.append(a);
  return li;
}

function updateUrl(value) {
  if (!window.history.replaceState) return;
  const url = new URL(window.location.href);
  if (value) url.searchParams.set('q', value);
  else url.searchParams.delete('q');
  window.history.replaceState({}, '', url.toString());
}

async function handleSearch(value, block, config) {
  const results = block.querySelector('.search-results');
  updateUrl(value);
  if (value.trim().length < MIN_QUERY_LENGTH) {
    results.replaceChildren();
    results.classList.remove('no-results');
    return;
  }
  const terms = value.toLowerCase().split(/\s+/).filter(Boolean);
  const data = await fetchIndex(config.source);
  const filtered = filterData(terms, data);
  results.replaceChildren();
  if (filtered.length) {
    results.classList.remove('no-results');
    filtered.forEach((r) => results.append(renderResult(r, terms, results.dataset.h)));
  } else {
    results.classList.add('no-results');
    const li = document.createElement('li');
    li.textContent = 'No results found.';
    results.append(li);
  }
}

function buildToggle(label, block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'search-toggle';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'search-toggle-switch';
  button.setAttribute('role', 'switch');
  button.setAttribute('aria-checked', 'true');
  const id = `search-toggle-${Math.random().toString(36).slice(2, 8)}`;
  const text = document.createElement('span');
  text.className = 'search-toggle-label';
  text.id = id;
  text.textContent = label;
  button.setAttribute('aria-labelledby', id);
  block.classList.add('search-summary-on');
  button.addEventListener('click', () => {
    const on = button.getAttribute('aria-checked') !== 'true';
    button.setAttribute('aria-checked', on);
    block.classList.toggle('search-summary-on', on);
  });
  wrapper.append(button, text);
  return wrapper;
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const source = link?.href || `${window.hlx?.codeBasePath || ''}/query-index.json`;
  const texts = [...block.querySelectorAll(':scope > div > div')]
    .flatMap((cell) => (cell.querySelectorAll('p').length ? [...cell.querySelectorAll('p')] : [cell]))
    .filter((el) => !el.querySelector('a') && el.textContent.trim())
    .map((el) => el.textContent.trim());
  const [placeholder = 'Search...', toggleLabel] = texts;

  const box = document.createElement('div');
  box.className = 'search-box';
  const icon = document.createElement('span');
  icon.className = 'icon icon-search';
  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'search-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  box.append(icon, input);

  const results = document.createElement('ul');
  results.className = 'search-results';
  results.dataset.h = findNextHeading(block);
  results.setAttribute('role', 'status');
  results.setAttribute('aria-live', 'polite');

  block.replaceChildren(box);
  if (toggleLabel) block.append(buildToggle(toggleLabel, block));
  block.append(results);

  const config = { source };
  input.addEventListener('input', (e) => handleSearch(e.target.value, block, config));
  input.addEventListener('keyup', (e) => {
    if (e.code === 'Escape') {
      input.value = '';
      handleSearch('', block, config);
    }
  });

  const q = searchParams.get('q');
  if (q) {
    input.value = q;
    handleSearch(q, block, config);
  }

  decorateIcons(block);
}
