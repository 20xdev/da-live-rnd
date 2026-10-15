/* eslint-disable */
/* global WebImporter */

/**
 * Import script for template: magazine-article
 * Sample URL: https://wknd.site/us/en/magazine/arctic-surfing.html
 *
 * Magazine articles (/us/en/magazine/*, /ca/en/magazine/* incl. members-only, migrated as the
 * statically rendered public page): image-only hero; breadcrumbs (own section: both span the
 * full width above the article/sidebar columns on the source); then the article section (
 * H1 title, "By <author>" H4, long-form content-fragment body with H2s, paragraphs, inline
 * images and an optional pull quote -> quote block); author byline (section style author-bio);
 * sidebar with optional PDF download link (kept pointing at the source PDF) and the up-next
 * related-articles list (section style up-next).
 * Every block/section lookup is optional and degrades gracefully.
 */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import breadcrumbsParser from './parsers/breadcrumbs.js';
import quoteParser from './parsers/quote.js';

// TRANSFORMER IMPORTS (order matters: cleanup -> magazine -> sections; see wknd-magazine.js header)
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndMagazineTransformer from './transformers/wknd-magazine.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  breadcrumbs: breadcrumbsParser,
  quote: quoteParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "magazine-article",
  "description": "Long-form article with hero image, breadcrumbs, title, rich text body, pull quotes and inline images",
  "urls": [
    "https://wknd.site/ca/en/magazine/arctic-surfing.html",
    "https://wknd.site/ca/en/magazine/guide-la-skateparks.html",
    "https://wknd.site/ca/en/magazine/members-only/alaskan-adventure.html",
    "https://wknd.site/ca/en/magazine/members-only/fly-fishing-the-amazon.html",
    "https://wknd.site/ca/en/magazine/san-diego-surf.html",
    "https://wknd.site/ca/en/magazine/ski-touring.html",
    "https://wknd.site/ca/en/magazine/western-australia.html",
    "https://wknd.site/us/en/magazine/arctic-surfing.html",
    "https://wknd.site/us/en/magazine/guide-la-skateparks.html",
    "https://wknd.site/us/en/magazine/san-diego-surf.html",
    "https://wknd.site/us/en/magazine/ski-touring.html",
    "https://wknd.site/us/en/magazine/western-australia.html"
  ],
  "blocks": [
    {
      "name": "hero",
      "instances": [
        "main.cmp-layout-container--fixed > .cmp-container > .aem-Grid > .image"
      ]
    },
    {
      "name": "breadcrumbs",
      "instances": [
        "main.cmp-layout-container--fixed > .cmp-container > .aem-Grid > .breadcrumb"
      ]
    },
    {
      "name": "quote",
      "instances": [
        "main.cmp-layout-container--fixed .cmp-contentfragment__elements .text:has(blockquote)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Article hero image",
      "selector": [
        "main.cmp-layout-container--fixed > .cmp-container > .aem-Grid > .image"
      ],
      "style": null,
      "blocks": [
        "hero"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "Breadcrumbs (full width, above the article and sidebar columns)",
      "selector": [
        "main.cmp-layout-container--fixed > .cmp-container > .aem-Grid > .breadcrumb"
      ],
      "style": null,
      "blocks": [
        "breadcrumbs"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "Article: title, byline, body (rich text, inline images, pull quote)",
      "selector": [
        "main.cmp-layout-container--fixed > .cmp-container > .aem-Grid > main.container"
      ],
      "style": "title-underline-h2",
      "blocks": [
        "quote"
      ],
      "defaultContent": [
        "main.cmp-layout-container--fixed main.container > .cmp-container > .title h1",
        "main.cmp-layout-container--fixed main.container > .cmp-container > .title h4",
        "main.cmp-layout-container--fixed .cmp-contentfragment__elements"
      ]
    },
    {
      "id": "4",
      "name": "Author byline (portrait, name, occupation, social links)",
      "selector": [
        "main.cmp-layout-container--fixed main.container .experiencefragment:has(.cmp-byline)"
      ],
      "style": "author-bio",
      "blocks": [],
      "defaultContent": [
        ".cmp-byline__image img",
        ".cmp-byline h2.cmp-byline__name",
        ".cmp-byline p.cmp-byline__occupations",
        "main.cmp-layout-container--fixed main.container .cmp-buildingblock--btn-list a.cmp-button"
      ]
    },
    {
      "id": "5",
      "name": "Sidebar: download (PDF) + up-next related articles",
      "selector": [
        "main.cmp-layout-container--fixed aside.cmp-layoutcontainer--sidebar"
      ],
      "style": "up-next",
      "blocks": [],
      "defaultContent": [
        "aside.cmp-layoutcontainer--sidebar .cmp-download",
        "aside.cmp-layoutcontainer--sidebar .cmp-list--upnext ul.cmp-list"
      ]
    }
  ]
};
// TRANSFORMER REGISTRY (sections transformer only when the template has 2+ sections)
const transformers = [
  wkndCleanupTransformer,
  wkndMagazineTransformer,
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
    // Page metadata + `Template` (aem.js decorateTemplateAndTheme adds it as a body class;
    // styles.css uses body.magazine-article for the main column + right sidebar layout).
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    // Lowercase key: the pipeline lowercases metadata names anyway (-> meta[name="template"]),
    // and the local html-folder preview does not, so `Template` would not reach getMetadata().
    meta.template = PAGE_TEMPLATE.name;
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
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
