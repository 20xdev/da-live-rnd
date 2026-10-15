/* eslint-disable */
/* global WebImporter */

/**
 * Import script for template: faq-page
 * Sample URL: https://wknd.site/us/en/faqs.html
 *
 * FAQ pages (/us/en/faqs, /ca/en/faqs): main 8-col column with the 'FAQs' H1, an image-only
 * hero, an intro paragraph and an accordion of question/answer items; then a 3-col sidebar
 * ('Need more help?' heading + contact paragraph) as a second section.
 * Every block/section lookup is optional and degrades gracefully.
 */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS (order matters: cleanup runs before sections)
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  accordion: accordionParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "faq-page",
  "description": "Hero banner followed by an accordion of expandable question and answer items",
  "urls": [
    "https://wknd.site/ca/en/faqs.html",
    "https://wknd.site/us/en/faqs.html"
  ],
  "blocks": [
    {
      "name": "hero",
      "instances": [
        "main.cmp-layout-container--fixed .aem-GridColumn--default--8 .image"
      ]
    },
    {
      "name": "accordion",
      "instances": [
        "main.cmp-layout-container--fixed .accordion.panelcontainer"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Main content column: FAQs title, image, intro, FAQ accordion",
      "selector": [
        "main.cmp-layout-container--fixed > .cmp-container > .aem-Grid > .container.responsivegrid.aem-GridColumn--default--8"
      ],
      "style": null,
      "blocks": [
        "hero",
        "accordion"
      ],
      "defaultContent": [
        "main.cmp-layout-container--fixed .title.cmp-title--underline h1",
        "main.cmp-layout-container--fixed .aem-GridColumn--default--8 > .cmp-container > .aem-Grid > .text"
      ]
    },
    {
      "id": "2",
      "name": "Sidebar: Need more help? contact info",
      "selector": [
        "main.cmp-layout-container--fixed > .cmp-container > .aem-Grid > .container.responsivegrid.aem-GridColumn--default--3"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "main.cmp-layout-container--fixed .aem-GridColumn--default--3 .title h3",
        "main.cmp-layout-container--fixed .aem-GridColumn--default--3 .text"
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
