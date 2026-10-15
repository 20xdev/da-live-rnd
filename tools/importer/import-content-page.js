/* eslint-disable */
/* global WebImporter */

/**
 * Import script for template: content-page
 * Sample URL: https://wknd.site/us/en/about-us.html
 *
 * Heterogeneous general content pages (6 URLs):
 *  - about-us (us/ca): H1, "Our Contributors" / "WKND Guides" (underlined H2 + intro text) each
 *    followed by a run of contributor experience fragments -> cards-profile (one block per run).
 *  - magazine index (us/ca): H1 + featured teaser -> columns-featured; "All Articles" + image list
 *    -> cards; "Members Only" + intro + locked secure teasers -> cards (one block per run).
 *  - ai-powered-search (us): Content AI search component -> search block (STATIC content only:
 *    placeholder + toggle label, no search functionality migrated).
 *  - magazine/members-only (ca): H1 + image list -> cards (static public render).
 * Sections: page title / first underlined-title group / second underlined-title group; pages
 * without underlined titles stay single-section. Every block/section lookup is optional.
 */

// PARSER IMPORTS
import cardsProfileParser from './parsers/cards-profile.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import cardsParser from './parsers/cards.js';
import searchParser from './parsers/search.js';

// TRANSFORMER IMPORTS (order matters: cleanup -> sections)
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-profile': cardsProfileParser,
  'columns-featured': columnsFeaturedParser,
  cards: cardsParser,
  search: searchParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "content-page",
  "description": "General content page with page title followed by stacked sections of headings, intro text and image/card grids",
  "urls": [
    "https://wknd.site/ca/en/about-us.html",
    "https://wknd.site/ca/en/magazine.html",
    "https://wknd.site/ca/en/magazine/members-only.html",
    "https://wknd.site/us/en/about-us.html",
    "https://wknd.site/us/en/ai-powered-search.html",
    "https://wknd.site/us/en/magazine.html"
  ],
  "blocks": [
    {
      "name": "cards-profile",
      "instances": [
        "main.cmp-layout-container--fixed .aem-Grid > section.cmp-experience-fragment--contributor"
      ]
    },
    {
      "name": "columns-featured",
      "instances": [
        "main.cmp-layout-container--fixed .teaser.cmp-teaser--featured"
      ]
    },
    {
      "name": "cards",
      "instances": [
        "main.cmp-layout-container--fixed .image-list.list",
        "main.cmp-layout-container--fixed .teaser.cmp-teaser--secure"
      ]
    },
    {
      "name": "search",
      "instances": [
        "main.cmp-layout-container--fixed .contentaisearch"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Page title (+ featured article on magazine index; search form on AI search; image list on members-only)",
      "selector": [
        "main.cmp-layout-container--fixed .title"
      ],
      "style": null,
      "blocks": [
        "columns-featured",
        "search",
        "cards"
      ],
      "defaultContent": [
        "main.cmp-layout-container--fixed .title h1"
      ]
    },
    {
      "id": "2",
      "name": "First underlined-title group: \"Our Contributors\" profiles (about-us) / \"All Articles\" image list (magazine)",
      "selector": [
        "main.cmp-layout-container--fixed .aem-Grid > .title.cmp-title--underline"
      ],
      "style": "title-underline",
      "blocks": [
        "cards-profile",
        "cards"
      ],
      "defaultContent": [
        "main.cmp-layout-container--fixed .aem-Grid > .title.cmp-title--underline h2",
        "main.cmp-layout-container--fixed .aem-Grid > .text"
      ]
    },
    {
      "id": "3",
      "name": "Second underlined-title group: \"WKND Guides\" profiles (about-us) / \"Members Only\" intro + secure teasers (magazine)",
      "selector": [
        "main.cmp-layout-container--fixed .aem-Grid > .title.cmp-title--underline ~ .title.cmp-title--underline"
      ],
      "style": "title-underline",
      "blocks": [
        "cards-profile",
        "cards"
      ],
      "defaultContent": [
        "main.cmp-layout-container--fixed .aem-Grid > .title.cmp-title--underline ~ .title.cmp-title--underline h2",
        "main.cmp-layout-container--fixed .aem-Grid > .title.cmp-title--underline ~ .text"
      ]
    }
  ]
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

    // 3. Parse each block (skip elements already detached by an earlier parser — e.g. the
    //    cards-profile / secure-teaser cards parsers consume a whole run of sibling elements)
    const parsedBlocks = [];
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      parsedBlocks.push(block.name);
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
        blocks: parsedBlocks,
      },
    }];
  },
};
