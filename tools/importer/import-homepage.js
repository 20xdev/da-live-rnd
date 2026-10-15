/* eslint-disable */
/* global WebImporter */

/**
 * Import script for template: homepage
 * Sample URL: https://wknd.site/us/en.html
 *
 * Placeholder "Coming Soon" locale homes (e.g. https://wknd.site/de/de.html) only contain a
 * single hero teaser; every block/section lookup below is optional and degrades gracefully.
 */

// PARSER IMPORTS
import carouselParser from './parsers/carousel.js';
import heroParser from './parsers/hero.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import cardsParser from './parsers/cards.js';

// TRANSFORMER IMPORTS (order matters: cleanup runs before sections)
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  carousel: carouselParser,
  hero: heroParser,
  'columns-featured': columnsFeaturedParser,
  cards: cardsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Locale home page: hero carousel, featured hero banners and card grids; non-English locales use a reduced single-hero placeholder variant',
  urls: [
    'https://wknd.site/ca/en.html',
    'https://wknd.site/ca/fr.html',
    'https://wknd.site/ch/de.html',
    'https://wknd.site/ch/fr.html',
    'https://wknd.site/ch/it.html',
    'https://wknd.site/de/de.html',
    'https://wknd.site/es/es.html',
    'https://wknd.site/fr/fr.html',
    'https://wknd.site/it/it.html',
    'https://wknd.site/us/en.html',
    'https://wknd.site/us/es.html',
  ],
  blocks: [
    {
      name: 'carousel',
      instances: ['.carousel.panelcontainer.cmp-carousel--hero'],
    },
    {
      name: 'hero',
      instances: [
        '.teaser.cmp-teaser--hero.cmp-teaser--imagebottom',
        'main > .cmp-container > .teaser.cmp-teaser--hero',
      ],
    },
    {
      name: 'columns-featured',
      instances: ['.teaser.cmp-teaser--featured'],
    },
    {
      name: 'cards',
      instances: ['main.cmp-layout-container--fixed .image-list.list'],
    },
  ],
  sections: [
    {
      id: '1',
      name: 'Hero carousel',
      selector: [
        '.carousel.panelcontainer.cmp-carousel--hero',
        'main > .cmp-container > .teaser.cmp-teaser--hero',
      ],
      style: null,
      blocks: ['carousel', 'hero'],
      defaultContent: [],
    },
    {
      id: '2',
      name: 'Featured article + Recent Articles',
      selector: ['.teaser.cmp-teaser--featured'],
      style: null,
      blocks: ['columns-featured', 'cards'],
      defaultContent: [
        'main.cmp-layout-container--fixed .teaser.cmp-teaser--featured + .title.cmp-title--underline',
        'main.cmp-layout-container--fixed .button.cmp-button--primary',
      ],
    },
    {
      id: '3',
      name: 'Next Adventures',
      selector: ['.separator + .title.cmp-title--underline'],
      style: null,
      blocks: ['hero', 'cards'],
      defaultContent: [
        '.separator + .title.cmp-title--underline',
        'main.cmp-layout-container--fixed .title:not(.cmp-title--underline)',
        'main.cmp-layout-container--fixed .button.cmp-button--primary',
      ],
    },
  ],
};

// TRANSFORMER REGISTRY (sections transformer only when the template has 2+ sections)
const transformers = [
  wkndCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [wkndSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document
 * @param {Object} template
 * @returns {Array} block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for block "${blockDef.name}": ${selector}`);
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform: site chrome cleanup + section break insertion
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already detached by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform: final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path; the root URL maps to the index document
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
