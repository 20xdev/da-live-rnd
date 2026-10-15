/* eslint-disable */
/* global WebImporter */

/**
 * Import script for template: adventure-detail
 * Sample URL: https://wknd.site/us/en/adventures/bali-surf-camp.html
 *
 * Adventure detail pages (/us/en/adventures/*, /ca/en/adventures/*): breadcrumbs, image-only
 * mini carousel, H1 title, trip-facts sidebar + tabbed details (Overview / Itinerary / What to Bring).
 * Every block/section lookup is optional and degrades gracefully.
 */

// PARSER IMPORTS
import breadcrumbsParser from './parsers/breadcrumbs.js';
import carouselParser from './parsers/carousel.js';
import cardsTripFactsParser from './parsers/cards-trip-facts.js';
import tabsParser from './parsers/tabs.js';

// TRANSFORMER IMPORTS (order matters: cleanup runs before sections)
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  breadcrumbs: breadcrumbsParser,
  carousel: carouselParser,
  'cards-trip-facts': cardsTripFactsParser,
  tabs: tabsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "adventure-detail",
  "description": "Detail page with breadcrumbs, full-width image carousel and tabbed content (overview, itinerary, what to bring, meet the guide)",
  "urls": [
    "https://wknd.site/ca/en/adventures/bali-surf-camp.html",
    "https://wknd.site/ca/en/adventures/beervana-portland.html",
    "https://wknd.site/ca/en/adventures/climbing-new-zealand.html",
    "https://wknd.site/ca/en/adventures/colorado-rock-climbing.html",
    "https://wknd.site/ca/en/adventures/cycling-southern-utah.html",
    "https://wknd.site/ca/en/adventures/cycling-tuscany.html",
    "https://wknd.site/ca/en/adventures/downhill-skiing-wyoming.html",
    "https://wknd.site/ca/en/adventures/gastronomic-marais-tour.html",
    "https://wknd.site/ca/en/adventures/napa-wine-tasting.html",
    "https://wknd.site/ca/en/adventures/riverside-camping-australia.html",
    "https://wknd.site/ca/en/adventures/ski-touring-mont-blanc.html",
    "https://wknd.site/ca/en/adventures/surf-camp-costa-rica.html",
    "https://wknd.site/ca/en/adventures/tahoe-skiing.html",
    "https://wknd.site/ca/en/adventures/west-coast-cycling.html",
    "https://wknd.site/ca/en/adventures/whistler-mountain-biking.html",
    "https://wknd.site/ca/en/adventures/yosemite-backpacking.html",
    "https://wknd.site/us/en/adventures/bali-surf-camp.html",
    "https://wknd.site/us/en/adventures/beervana-portland.html",
    "https://wknd.site/us/en/adventures/climbing-new-zealand.html",
    "https://wknd.site/us/en/adventures/colorado-rock-climbing.html",
    "https://wknd.site/us/en/adventures/cycling-southern-utah.html",
    "https://wknd.site/us/en/adventures/cycling-tuscany.html",
    "https://wknd.site/us/en/adventures/downhill-skiing-wyoming.html",
    "https://wknd.site/us/en/adventures/gastronomic-marais-tour.html",
    "https://wknd.site/us/en/adventures/napa-wine-tasting.html",
    "https://wknd.site/us/en/adventures/riverside-camping-australia.html",
    "https://wknd.site/us/en/adventures/ski-touring-mont-blanc.html",
    "https://wknd.site/us/en/adventures/surf-camp-costa-rica.html",
    "https://wknd.site/us/en/adventures/tahoe-skiing.html",
    "https://wknd.site/us/en/adventures/west-coast-cycling.html",
    "https://wknd.site/us/en/adventures/whistler-mountain-biking.html",
    "https://wknd.site/us/en/adventures/yosemite-backpacking.html"
  ],
  "blocks": [
    {
      "name": "breadcrumbs",
      "instances": [
        ".breadcrumb.cmp-breadcrumb--fixed"
      ]
    },
    {
      "name": "carousel",
      "instances": [
        ".carousel.panelcontainer.cmp-carousel--mini"
      ]
    },
    {
      "name": "cards-trip-facts",
      "instances": [
        ".contentfragment.cmp-contentfragment--elements"
      ]
    },
    {
      "name": "tabs",
      "instances": [
        "main.cmp-layout-container--fixed .tabs.panelcontainer"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Breadcrumbs",
      "selector": [
        ".breadcrumb.cmp-breadcrumb--fixed"
      ],
      "style": null,
      "blocks": [
        "breadcrumbs"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "Image carousel",
      "selector": [
        ".carousel.panelcontainer.cmp-carousel--mini"
      ],
      "style": null,
      "blocks": [
        "carousel"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "Page title",
      "selector": [
        "main.cmp-layout-container--fixed .title.cmp-title--underline"
      ],
      "style": "title-underline",
      "blocks": [],
      "defaultContent": [
        "main.cmp-layout-container--fixed .title.cmp-title--underline h1"
      ]
    },
    {
      "id": "4",
      "name": "Trip facts sidebar + tabbed details",
      "selector": [
        ".title.cmp-title--underline + main.container.responsivegrid",
        "main.cmp-layout-container--fixed main.container.aem-GridColumn--default--3",
        ".contentfragment.cmp-contentfragment--elements"
      ],
      "style": "sidebar",
      "blocks": [
        "cards-trip-facts",
        "tabs"
      ],
      "defaultContent": []
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
