/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND magazine-article template-specific normalization.
 *
 * REQUIRED ORDER in tools/importer/import-magazine-article.js:
 *   1. wknd-cleanup.js   (removes chrome, h3.cmp-contentfragment__title, .sharing, empty grids)
 *   2. wknd-magazine.js  (this file)
 *   3. wknd-sections.js  (inserts <hr> + Section Metadata from template.sections)
 * Why: this file must run in beforeTransform BEFORE wknd-sections so the byline / sidebar are
 * already rewritten when section breaks are placed (the byline rewrite keeps
 * `.experiencefragment > .cmp-byline` so the section-3 selector
 * `main.cmp-layout-container--fixed main.container .experiencefragment:has(.cmp-byline)` still
 * matches), and it must read data-cmp-src / data-cmp-widths BEFORE wknd-cleanup strips
 * data-cmp-* attributes (cleanup only does that in afterTransform, so cleanup-first is safe).
 *
 * Selectors verified in migration-work/cleaned.html (https://wknd.site/us/en/magazine/arctic-surfing.html)
 * and, for download/caption/empty-download variants, on the live magazine pages
 * (guide-la-skateparks, san-diego-surf, western-australia):
 *  - main.cmp-layout-container--fixed main.container         inner article column (CF body + byline XF)
 *  - .cmp-image / img.cmp-image__image / .cmp-image__title    AEM Core images (lazy: data-cmp-src/-widths)
 *  - .experiencefragment .cmp-byline (__image, __name, __occupations)
 *  - .cmp-buildingblock--btn-list a.cmp-button > .cmp-button__text   author social links
 *  - aside.cmp-layoutcontainer--sidebar .title                "SHARE THIS STORY" h5 (only .title in aside)
 *  - aside.cmp-layoutcontainer--sidebar .download .cmp-download (__title-link, __action, __description)
 *  - aside.cmp-layoutcontainer--sidebar .cmp-list--upnext ul.cmp-list > li (__item-link/-title/-date)
 *
 * The hero image (main.cmp-layout-container--fixed > .cmp-container > .aem-Grid > .image) lives
 * outside the inner main and is NOT touched (hero parser handles it). Every operation is a no-op
 * when its selector is absent.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const SOURCE_ORIGIN = 'https://wknd.site';
const INNER_MAIN = 'main.cmp-layout-container--fixed main.container';
const SIDEBAR = 'aside.cmp-layoutcontainer--sidebar';

function text(el) {
  return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
}

// Absolute URL against the source site. Scraper-local "./images/..." paths (offline cleaned.html
// only) are left for WebImporter.rules.adjustImageUrls.
function absolutize(url) {
  if (!url) return '';
  if (/^\.\//.test(url)) return url;
  try {
    return new URL(url, SOURCE_ORIGIN).href;
  } catch (e) {
    return url;
  }
}

function largestFromSrcset(srcset) {
  if (!srcset) return '';
  let best = '';
  let bestW = -1;
  srcset.split(',').forEach((part) => {
    const [u, d] = part.trim().split(/\s+/);
    const w = parseFloat(d) || 0;
    if (u && w > bestW) { best = u; bestW = w; }
  });
  return best;
}

// Resolve the best real src for an AEM Core (possibly lazy) image component.
function resolveImageSrc(cmpImage, img) {
  const dataSrc = cmpImage.getAttribute('data-cmp-src');
  if (dataSrc) {
    const widths = (cmpImage.getAttribute('data-cmp-widths') || '')
      .split(',').map((w) => parseInt(w, 10)).filter((w) => !Number.isNaN(w));
    const width = widths.length ? `.${Math.max(...widths)}` : '';
    return absolutize(dataSrc.replace('{.width}', width));
  }
  const src = img && img.getAttribute('src');
  if (src && !/^data:/i.test(src)) return absolutize(src);
  const srcset = img && (img.getAttribute('srcset') || img.getAttribute('data-srcset'));
  return absolutize(largestFromSrcset(srcset));
}

// Replace each .cmp-image in the inner article with a plain <img> (+ optional caption paragraph).
function normalizeImages(root, doc) {
  root.querySelectorAll(`${INNER_MAIN} .cmp-image`).forEach((cmpImage) => {
    const img = cmpImage.querySelector('img');
    const src = resolveImageSrc(cmpImage, img);
    if (!src) return;
    const newImg = doc.createElement('img');
    newImg.setAttribute('src', src);
    newImg.setAttribute('alt', (img && img.getAttribute('alt')) || '');

    const link = cmpImage.querySelector('a.cmp-image__link[href]');
    let media = newImg;
    if (link) {
      media = doc.createElement('a');
      media.setAttribute('href', link.getAttribute('href'));
      media.append(newImg);
    }

    const nodes = [media];
    const caption = text(cmpImage.querySelector('.cmp-image__title'));
    if (caption) {
      const p = doc.createElement('p');
      const em = doc.createElement('em');
      em.textContent = caption;
      p.append(em);
      nodes.push(p);
    }
    cmpImage.replaceWith(...nodes);
  });
}

// Rewrite the author byline XF into clean default content, keeping the .experiencefragment
// container and a .cmp-byline wrapper so the sections selector keeps matching.
function rewriteByline(root, doc) {
  root.querySelectorAll(`${INNER_MAIN} .cmp-byline`).forEach((byline) => {
    const xf = byline.closest('.experiencefragment');
    if (!xf || xf.getAttribute('data-wknd-byline') === 'done') return;

    const wrapper = doc.createElement('div');
    wrapper.className = 'cmp-byline';

    const portrait = byline.querySelector('.cmp-byline__image img');
    if (portrait && portrait.getAttribute('src')) {
      const p = doc.createElement('p');
      const img = doc.createElement('img');
      img.setAttribute('src', portrait.getAttribute('src'));
      img.setAttribute('alt', portrait.getAttribute('alt') || text(byline.querySelector('.cmp-byline__name')));
      p.append(img);
      wrapper.append(p);
    }

    const name = text(byline.querySelector('.cmp-byline__name'));
    if (name) {
      const h2 = doc.createElement('h2');
      h2.textContent = name;
      wrapper.append(h2);
    }

    const occupation = text(byline.querySelector('.cmp-byline__occupations'));
    if (occupation) {
      const p = doc.createElement('p');
      p.textContent = occupation;
      wrapper.append(p);
    }

    xf.querySelectorAll('.cmp-buildingblock--btn-list a.cmp-button').forEach((btn) => {
      const label = text(btn.querySelector('.cmp-button__text')) || (btn.getAttribute('aria-label') || '').trim();
      if (!label) return;
      const p = doc.createElement('p');
      const a = doc.createElement('a');
      a.setAttribute('href', btn.getAttribute('href') || '#');
      a.textContent = label;
      p.append(a);
      wrapper.append(p);
    });

    // Inner .separator is dropped: the section <hr> from wknd-sections replaces it.
    xf.replaceChildren(wrapper);
    xf.setAttribute('data-wknd-byline', 'done');
  });
}

// Up-next list: <li><a href>{title}</a><br>{date}</li>; hrefs kept as-is (root-relative, same
// as internal links in the other templates' imported content).
function rewriteUpNext(root, doc) {
  root.querySelectorAll(`${SIDEBAR} .cmp-list--upnext ul.cmp-list > li`).forEach((li) => {
    const link = li.querySelector('a.cmp-list__item-link') || li.querySelector('a[href]');
    const title = text(li.querySelector('.cmp-list__item-title')) || text(link);
    if (!title) return;
    const date = text(li.querySelector('.cmp-list__item-date'));

    const newLi = doc.createElement('li');
    if (link && link.getAttribute('href')) {
      const a = doc.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.textContent = title;
      newLi.append(a);
    } else {
      newLi.append(doc.createTextNode(title));
    }
    if (date) {
      newLi.append(doc.createElement('br'), doc.createTextNode(date));
    }
    li.replaceWith(newLi);
  });
}

// PDF download: <p><a href="{absolute pdf}">{title}</a></p><p>{description}</p>.
function rewriteDownloads(root, doc) {
  root.querySelectorAll(`${SIDEBAR} .download .cmp-download`).forEach((dl) => {
    const titleLink = dl.querySelector('.cmp-download__title-link');
    const action = dl.querySelector('a.cmp-download__action');
    const href = (titleLink && titleLink.getAttribute('href')) || (action && action.getAttribute('href'));
    const label = text(titleLink) || text(dl.querySelector('.cmp-download__title'))
      || text(action && action.querySelector('.cmp-download__action-text')) || text(action);
    const description = text(dl.querySelector('.cmp-download__description'));

    const nodes = [];
    if (href) {
      const p = doc.createElement('p');
      const a = doc.createElement('a');
      a.setAttribute('href', absolutize(href));
      a.textContent = label || 'Download';
      p.append(a);
      nodes.push(p);
    }
    if (description) {
      const p = doc.createElement('p');
      p.textContent = description;
      nodes.push(p);
    }
    if (nodes.length) dl.replaceWith(...nodes);
    else dl.remove();
  });
}

function removeEmptyDownloads(root) {
  root.querySelectorAll(`${SIDEBAR} .download`).forEach((d) => {
    if (!text(d) && !d.querySelector('a[href], img')) d.remove();
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const doc = element.ownerDocument || document;

    // "SHARE THIS STORY" title (its .sharing widget is removed by wknd-cleanup).
    WebImporter.DOMUtils.remove(element, [`${SIDEBAR} .title`]);

    normalizeImages(element, doc);
    rewriteByline(element, doc);
    rewriteUpNext(element, doc);
    rewriteDownloads(element, doc);
    removeEmptyDownloads(element);
  }

  if (hookName === TransformHook.afterTransform) {
    element.querySelectorAll('[data-wknd-byline]').forEach((el) => el.removeAttribute('data-wknd-byline'));
  }
}
