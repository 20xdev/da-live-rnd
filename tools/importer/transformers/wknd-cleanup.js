/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND (AEM Core Components) site-wide cleanup.
 *
 * All selectors verified in migration-work/cleaned.html (https://wknd.site/us/en.html):
 *  - header.experiencefragment.cmp-experiencefragment--header  (logo, nav, language nav, sign-in, search)
 *  - .sign-in-buttons / .wknd-sign-in-buttons                  (inside header utility bar)
 *  - .languagenavigation / nav.cmp-languagenavigation          (inside header utility bar)
 *  - .button.cmp-button--header-search                         (inside header)
 *  - footer.experiencefragment.cmp-experiencefragment--footer  (footer XF)
 *  - #toggleNav, #mobileNav.cmp-navigation--mobile             (mobile nav, outside main)
 *  - iframe[id^="destination_publishing_iframe"]               (Adobe ID sync / demdex tracking iframe)
 *  - .cmp-carousel__actions, .cmp-carousel__indicators         (carousel UI chrome, non-authorable)
 *  - .separator                                                (AEM separator components; section breaks
 *                                                               are inserted by wknd-sections.js instead)
 *  - .cmp-image meta                                           (stray <meta> after images)
 *  - data-cmp-* attributes                                     (data-layer / link-accessibility noise on body)
 *
 * Content containers (main, .cmp-container, .aem-Grid, main.cmp-layout-container--fixed) are NOT removed.
 * Every removal is a no-op when the selector is absent (e.g. "Coming Soon" locale placeholder pages).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Global site chrome - removed before parsing so no block parser can match inside it.
const CHROME_SELECTORS = [
  'header.experiencefragment',
  '.cmp-experiencefragment--header',
  'footer.experiencefragment',
  '.cmp-experiencefragment--footer',
  '#toggleNav',
  '#mobileNav',
  '.cmp-navigation--mobile',
  '.sign-in-buttons',
  '.wknd-sign-in-buttons',
  '.languagenavigation',
  '.button.cmp-button--header-search',
  'iframe[id^="destination_publishing_iframe"]',
];

// Adventure-detail non-authorable content (verified in adventure-detail cleaned.html,
// https://wknd.site/us/en/adventures/bali-surf-camp.html; none of these exist on the homepage):
//  - h3.cmp-contentfragment__title inside article.cmp-contentfragment: visually hidden duplicate
//    of the page title, repeated in the trip-facts sidebar and every tab panel.
//  - .sharing: empty Facebook/Pinterest share widgets.
//  - ".contentfragment.cmp-contentfragment--elements ~ .title": the "Share this Adventure" h5 title
//    in the 3-col sidebar. Scoped to siblings after the trip-facts CF so the page H1
//    (.title.cmp-title--underline, which precedes the sidebar <main>) and homepage .title
//    default content are never matched.
const ADVENTURE_SELECTORS = [
  'article.cmp-contentfragment > h3.cmp-contentfragment__title',
  '.contentfragment.cmp-contentfragment--elements ~ .title:not(.cmp-title--underline)',
  '.sharing',
];

// Removes empty AEM layout grids (div.aem-Grid with no element children and no text), plus the
// bare attribute-less <div> wrapper left empty by the removal. Homepage has no empty grids.
function removeEmptyGrids(root) {
  root.querySelectorAll('div.aem-Grid').forEach((grid) => {
    if (grid.children.length || (grid.textContent || '').trim()) return;
    const parent = grid.parentElement;
    grid.remove();
    if (parent && parent !== root && parent.tagName === 'DIV' && !parent.attributes.length
      && !parent.children.length && !(parent.textContent || '').trim()) {
      parent.remove();
    }
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);
    // Before parsing so the cards-trip-facts / tabs parsers and default-content selectors
    // (e.g. homepage's ".title:not(.cmp-title--underline)") never pick these up.
    WebImporter.DOMUtils.remove(element, ADVENTURE_SELECTORS);
    removeEmptyGrids(element);
  }

  if (hookName === TransformHook.afterTransform) {
    // Re-run chrome removal (idempotent) in case anything was re-introduced.
    WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);
    WebImporter.DOMUtils.remove(element, ADVENTURE_SELECTORS);
    removeEmptyGrids(element);

    // Leftover non-authorable widgets / noise.
    // NOTE: .separator is removed here (afterTransform), not in beforeTransform, because the
    // sections transformer uses ".separator + .title" as a boundary selector in beforeTransform.
    // Only the .separator wrapper is targeted - bare <hr> section breaks are preserved.
    WebImporter.DOMUtils.remove(element, [
      '.cmp-carousel__actions',
      '.cmp-carousel__indicators',
      '.separator',
      '.cmp-image meta',
      'script',
      'noscript',
      'style',
      'link',
    ]);

    // Strip AEM Core Components data-layer / accessibility attributes.
    const nodes = [element, ...element.querySelectorAll('*')];
    nodes.forEach((el) => {
      if (!el.attributes) return;
      Array.from(el.attributes)
        .map((attr) => attr.name)
        .filter((name) => name.startsWith('data-cmp-'))
        .forEach((name) => el.removeAttribute(name));
    });
  }
}
