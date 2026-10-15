/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-faq-page.js
  var import_faq_page_exports = {};
  __export(import_faq_page_exports, {
    default: () => import_faq_page_default
  });

  // tools/importer/parsers/hero.js
  var FALLBACK_ORIGIN = "https://wknd.site";
  function getOrigin(document2) {
    try {
      const canonical = document2.querySelector('link[rel="canonical"]');
      if (canonical && canonical.href && /^https?:/.test(canonical.href)) return new URL(canonical.href).origin;
    } catch (e) {
    }
    return FALLBACK_ORIGIN;
  }
  function absolutize(src, document2) {
    if (!src) return "";
    const s = src.trim();
    if (!s || s.startsWith("data:")) return "";
    try {
      if (/^https?:\/\//i.test(s)) return s;
      if (s.startsWith("//")) return `https:${s}`;
      return new URL(s, getOrigin(document2)).href;
    } catch (e) {
      return s;
    }
  }
  function largestFromSrcset(srcset) {
    if (!srcset) return "";
    let best = "";
    let bestW = -1;
    srcset.split(",").forEach((part) => {
      const [u, d] = part.trim().split(/\s+/);
      const w = parseInt(d, 10) || 0;
      if (u && w > bestW) {
        best = u;
        bestW = w;
      }
    });
    return best;
  }
  function resolveImage(container, document2) {
    if (!container) return null;
    const img = container.matches && container.matches("img") ? container : container.querySelector("img");
    const cmpHost = container.matches && container.matches("[data-cmp-src]") ? container : container.querySelector("[data-cmp-src]") || img && img.closest("[data-cmp-src]");
    let src = "";
    if (img) {
      const raw = img.getAttribute("src") || "";
      if (raw && !raw.startsWith("data:") && !raw.includes("{.width}")) src = raw;
      if (!src) src = img.getAttribute("data-src") || "";
      if (!src) src = largestFromSrcset(img.getAttribute("srcset") || img.getAttribute("data-srcset"));
    }
    if (!src && cmpHost) {
      const tpl = cmpHost.getAttribute("data-cmp-src") || "";
      const widths = (cmpHost.getAttribute("data-cmp-widths") || "").split(",").map((w) => parseInt(w, 10)).filter(Boolean);
      const width = widths.length ? Math.max(...widths) : "";
      src = width ? tpl.replace("{.width}", `.${width}`) : tpl.replace("{.width}", "");
    }
    src = absolutize(src, document2);
    if (!src) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = img && img.getAttribute("alt") || "";
    const title = img && img.getAttribute("title");
    if (title) out.title = title;
    return out;
  }
  function parse(element, { document: document2 }) {
    const teaser = element.querySelector(".cmp-teaser") || element;
    const image = resolveImage(teaser.querySelector(".cmp-teaser__image") || teaser.querySelector(".cmp-image, img"), document2);
    const content = [];
    const title = teaser.querySelector(".cmp-teaser__title, h1, h2, h3");
    if (title && title.textContent.trim()) {
      const h = document2.createElement("h2");
      h.textContent = title.textContent.trim();
      content.push(h);
    }
    const desc = teaser.querySelector(".cmp-teaser__description");
    if (desc && desc.textContent.trim()) {
      const blockChildren = [...desc.children].filter((c) => /^(P|UL|OL)$/.test(c.tagName));
      if (blockChildren.length) {
        content.push(...blockChildren);
      } else {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.trim();
        content.push(p);
      }
    }
    [...teaser.querySelectorAll(".cmp-teaser__action-container a, a.cmp-teaser__action-link")].filter((a, i, arr) => arr.indexOf(a) === i && a.textContent.trim()).forEach((a) => {
      const link = document2.createElement("a");
      link.href = a.getAttribute("href") || "";
      link.textContent = a.textContent.trim();
      const strong = document2.createElement("strong");
      strong.append(link);
      const p = document2.createElement("p");
      p.append(strong);
      content.push(p);
    });
    if (!image && !content.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) cells.push([image]);
    if (content.length) cells.push([content]);
    const IMAGE_BOTTOM = ".cmp-teaser--imagebottom";
    const imageBottom = element.matches && element.matches(IMAGE_BOTTOM) || !!(element.closest && element.closest(IMAGE_BOTTOM)) || !!element.querySelector(IMAGE_BOTTOM);
    const variants = imageBottom ? ["image-bottom"] : [];
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  var FALLBACK_ORIGIN2 = "https://wknd.site";
  function getOrigin2(document2) {
    try {
      const canonical = document2.querySelector('link[rel="canonical"]');
      if (canonical && canonical.href && /^https?:/.test(canonical.href)) return new URL(canonical.href).origin;
    } catch (e) {
    }
    return FALLBACK_ORIGIN2;
  }
  function absolutize2(src, document2) {
    if (!src) return "";
    const s = src.trim();
    if (!s || s.startsWith("data:")) return "";
    try {
      if (/^https?:\/\//i.test(s)) return s;
      if (s.startsWith("//")) return `https:${s}`;
      return new URL(s, getOrigin2(document2)).href;
    } catch (e) {
      return s;
    }
  }
  function largestFromSrcset2(srcset) {
    if (!srcset) return "";
    let best = "";
    let bestW = -1;
    srcset.split(",").forEach((part) => {
      const [u, d] = part.trim().split(/\s+/);
      const w = parseInt(d, 10) || 0;
      if (u && w > bestW) {
        best = u;
        bestW = w;
      }
    });
    return best;
  }
  function resolveImage2(container, document2) {
    if (!container) return null;
    const img = container.matches && container.matches("img") ? container : container.querySelector("img");
    const cmpHost = container.matches && container.matches("[data-cmp-src]") ? container : container.querySelector("[data-cmp-src]") || img && img.closest("[data-cmp-src]");
    let src = "";
    if (img) {
      const raw = img.getAttribute("src") || "";
      if (raw && !raw.startsWith("data:") && !raw.includes("{.width}")) src = raw;
      if (!src) src = img.getAttribute("data-src") || "";
      if (!src) src = largestFromSrcset2(img.getAttribute("srcset") || img.getAttribute("data-srcset"));
    }
    if (!src && cmpHost) {
      const tpl = cmpHost.getAttribute("data-cmp-src") || "";
      const widths = (cmpHost.getAttribute("data-cmp-widths") || "").split(",").map((w) => parseInt(w, 10)).filter(Boolean);
      const width = widths.length ? Math.max(...widths) : "";
      src = width ? tpl.replace("{.width}", `.${width}`) : tpl.replace("{.width}", "");
    }
    src = absolutize2(src, document2);
    if (!src) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = img && img.getAttribute("alt") || cmpHost && cmpHost.getAttribute("data-asset-alt") || "";
    const title = img && img.getAttribute("title");
    if (title) out.title = title;
    return out;
  }
  var BLOCK_TAGS = /* @__PURE__ */ new Set(["P", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "TABLE", "PRE", "HR"]);
  var SKIP_TAGS = /* @__PURE__ */ new Set(["META", "SCRIPT", "STYLE", "NOSCRIPT", "BUTTON", "TEMPLATE"]);
  var WRAPPER_RE = /^(DIV|SECTION|ARTICLE|ASIDE|MAIN|HEADER|FOOTER|NAV|FIGURE)$/;
  function isEmpty(el) {
    return !el.textContent.replace(/\u00a0/g, " ").trim() && !el.querySelector("img, picture, video, iframe");
  }
  function clean(node, document2) {
    node.querySelectorAll("img").forEach((img) => {
      const resolved = resolveImage2(img, document2);
      if (resolved) img.replaceWith(resolved);
      else img.remove();
    });
    [node, ...node.querySelectorAll("*")].forEach((el) => {
      if (el.id && /^(text|container|accordion|image)-/.test(el.id)) el.removeAttribute("id");
      if (el.classList && [...el.classList].some((c) => c.startsWith("cmp-"))) el.removeAttribute("class");
    });
    return node;
  }
  function collectContent(root, document2) {
    const out = [];
    let pending = null;
    const flush = () => {
      if (pending && !isEmpty(pending)) out.push(pending);
      pending = null;
    };
    const walk = (parent) => {
      [...parent.childNodes].forEach((node) => {
        if (node.nodeType === 3) {
          if (node.textContent.replace(/\u00a0/g, " ").trim()) {
            if (!pending) pending = document2.createElement("p");
            pending.append(node.textContent);
          }
          return;
        }
        if (node.nodeType !== 1) return;
        const el = node;
        if (SKIP_TAGS.has(el.tagName)) return;
        if (el.matches(".cmp-accordion__header")) return;
        if (el.matches(".cmp-image, .image, picture, img")) {
          flush();
          const img = resolveImage2(el.matches(".image") ? el.querySelector(".cmp-image") || el : el, document2);
          if (img) {
            const p = document2.createElement("p");
            p.append(img);
            out.push(p);
          }
          return;
        }
        if (BLOCK_TAGS.has(el.tagName)) {
          flush();
          if (el.tagName === "HR" || !isEmpty(el)) out.push(clean(el.cloneNode(true), document2));
          return;
        }
        if (WRAPPER_RE.test(el.tagName)) {
          flush();
          walk(el);
          flush();
          return;
        }
        if (isEmpty(el)) return;
        if (!pending) pending = document2.createElement("p");
        pending.append(clean(el.cloneNode(true), document2));
      });
    };
    walk(root);
    flush();
    return out;
  }
  function parse2(element, { document: document2 }) {
    const root = element.querySelector(".cmp-accordion") || element;
    const ownAccordion = (item) => !root.matches(".cmp-accordion") || item.parentElement.closest(".cmp-accordion") === root;
    let items = [...root.querySelectorAll(".cmp-accordion__item")].filter(ownAccordion).map((item) => ({
      header: item.querySelector(".cmp-accordion__header"),
      panel: item.querySelector('.cmp-accordion__panel, [role="region"]')
    }));
    if (!items.length) {
      items = [...root.querySelectorAll('.cmp-accordion__header, [data-cmp-hook-accordion="button"]')].map((header) => {
        const button = header.querySelector("button") || header;
        const controls = button.getAttribute("aria-controls");
        const panel = controls && root.querySelector(`[id="${controls}"]`) || (header.nextElementSibling && header.nextElementSibling.matches(".cmp-accordion__panel") ? header.nextElementSibling : null);
        return { header, panel };
      });
    }
    const cells = [];
    items.forEach(({ header, panel }) => {
      const titleEl = header && (header.querySelector(".cmp-accordion__title") || header.querySelector("button") || header);
      const question = titleEl ? titleEl.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim() : "";
      if (!question) return;
      const contentRoot = panel || null;
      const answer = contentRoot ? collectContent(contentRoot, document2) : [];
      cells.push([question, answer.length ? answer : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "accordion", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var CHROME_SELECTORS = [
    "header.experiencefragment",
    ".cmp-experiencefragment--header",
    "footer.experiencefragment",
    ".cmp-experiencefragment--footer",
    "#toggleNav",
    "#mobileNav",
    ".cmp-navigation--mobile",
    ".sign-in-buttons",
    ".wknd-sign-in-buttons",
    ".languagenavigation",
    ".button.cmp-button--header-search",
    'iframe[id^="destination_publishing_iframe"]'
  ];
  var ADVENTURE_SELECTORS = [
    "article.cmp-contentfragment > h3.cmp-contentfragment__title",
    ".contentfragment.cmp-contentfragment--elements ~ .title:not(.cmp-title--underline)",
    ".sharing"
  ];
  function removeEmptyGrids(root) {
    root.querySelectorAll("div.aem-Grid").forEach((grid) => {
      if (grid.children.length || (grid.textContent || "").trim()) return;
      const parent = grid.parentElement;
      grid.remove();
      if (parent && parent !== root && parent.tagName === "DIV" && !parent.attributes.length && !parent.children.length && !(parent.textContent || "").trim()) {
        parent.remove();
      }
    });
  }
  var PRIMARY_BUTTON_SELECTOR = ".button.cmp-button--primary:not(.cmp-button--icononly)";
  function convertPrimaryButtons(root) {
    const doc = root.ownerDocument || document;
    root.querySelectorAll(PRIMARY_BUTTON_SELECTOR).forEach((wrapper) => {
      if (wrapper.getAttribute("data-wknd-cta") === "done") return;
      const src = wrapper.querySelector("a[href]");
      if (!src) return;
      const label = ((src.querySelector(".cmp-button__text") || src).textContent || "").replace(/\s+/g, " ").trim() || (src.getAttribute("aria-label") || "").trim();
      if (!label) return;
      const p = doc.createElement("p");
      const strong = doc.createElement("strong");
      const a = doc.createElement("a");
      a.setAttribute("href", src.getAttribute("href"));
      a.textContent = label;
      strong.append(a);
      p.append(strong);
      wrapper.replaceChildren(p);
      wrapper.setAttribute("data-wknd-cta", "done");
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);
      convertPrimaryButtons(element);
      WebImporter.DOMUtils.remove(element, ADVENTURE_SELECTORS);
      removeEmptyGrids(element);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);
      WebImporter.DOMUtils.remove(element, ADVENTURE_SELECTORS);
      removeEmptyGrids(element);
      WebImporter.DOMUtils.remove(element, [
        ".cmp-carousel__actions",
        ".cmp-carousel__indicators",
        ".separator",
        ".cmp-image meta",
        "script",
        "noscript",
        "style",
        "link"
      ]);
      const nodes = [element, ...element.querySelectorAll("*")];
      nodes.forEach((el) => {
        if (!el.attributes) return;
        Array.from(el.attributes).map((attr) => attr.name).filter((name) => name.startsWith("data-cmp-") || name === "data-wknd-cta").forEach((name) => el.removeAttribute(name));
      });
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SECTION_STYLE_ATTR = "data-excat-section-style";
  var FONT_SMALL_SELECTOR = ".text.cmp-text--font-small";
  var FONT_SMALL_STYLE = "font-small";
  var CONTENT_SELECTOR = "img, picture, video, iframe, table, h1, h2, h3, h4, h5, h6, p, a, li, blockquote";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function isSeparator(el) {
    return !!(el && el.classList && el.classList.contains("separator"));
  }
  function isHr(el) {
    return !!(el && el.tagName && el.tagName.toLowerCase() === "hr");
  }
  function hasContentBefore(root, target) {
    const candidates = root.querySelectorAll(CONTENT_SELECTOR);
    for (const node of candidates) {
      if (node === target || target.contains(node)) break;
      const preceding = target.compareDocumentPosition(node) & 2;
      if (!preceding) continue;
      if (node.closest(".separator")) continue;
      if ((node.textContent || "").trim() || /^(img|picture|video|iframe)$/i.test(node.tagName)) {
        return true;
      }
    }
    return false;
  }
  function sectionIndexOf(node, starts) {
    let idx = 0;
    starts.forEach((start, i) => {
      if (!start) return;
      if (start === node || start.contains(node) || node.compareDocumentPosition(start) & 2) idx = i;
    });
    return idx;
  }
  function effectiveStyles(root, sections) {
    const styles = sections.map((s) => s && s.style ? [s.style] : []);
    const starts = sections.map((s) => s ? querySection(root, s.selector) : null);
    root.querySelectorAll(FONT_SMALL_SELECTOR).forEach((el) => {
      if (!(el.textContent || "").trim()) return;
      const list = styles[sectionIndexOf(el, starts)];
      if (list && !list.includes(FONT_SMALL_STYLE)) list.push(FONT_SMALL_STYLE);
    });
    return styles.map((list) => list.join(", ") || null);
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      const styles = effectiveStyles(element, sections);
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section) continue;
        const style = styles[i];
        if (i === 0 && !style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        let prev = sectionEl.previousElementSibling;
        if (isSeparator(prev)) {
          prev.remove();
          prev = sectionEl.previousElementSibling;
        }
        if (i === 0) {
          const marker = document.createElement("hr");
          marker.setAttribute(SECTION_MARKER_ATTR, section.id);
          marker.setAttribute(SECTION_STYLE_ATTR, style);
          sectionEl.before(marker);
          continue;
        }
        if (isHr(prev)) {
          if (style) {
            prev.setAttribute(SECTION_MARKER_ATTR, section.id);
            prev.setAttribute(SECTION_STYLE_ATTR, style);
          }
          continue;
        }
        if (!hasContentBefore(element, sectionEl)) continue;
        const hr = document.createElement("hr");
        if (style) {
          hr.setAttribute(SECTION_MARKER_ATTR, section.id);
          hr.setAttribute(SECTION_STYLE_ATTR, style);
        }
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const style = marker && marker.getAttribute(SECTION_STYLE_ATTR) || section.style;
        if (!style) continue;
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          marker.removeAttribute(SECTION_STYLE_ATTR);
          if (i === 0) marker.remove();
        }
      }
      const hrs = Array.from(element.querySelectorAll("hr"));
      hrs.forEach((hr) => {
        if (!hr.isConnected) return;
        const next = hr.nextElementSibling;
        if (isHr(next)) next.remove();
      });
    }
  }

  // tools/importer/import-faq-page.js
  var parsers = {
    hero: parse,
    accordion: parse2
  };
  var PAGE_TEMPLATE = {
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
        "style": "title-underline",
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
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements = [];
        try {
          elements = document2.querySelectorAll(selector);
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_faq_page_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document2) || {};
      meta.template = PAGE_TEMPLATE.name;
      main.append(WebImporter.Blocks.getMetadataBlock(document2, meta));
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_faq_page_exports);
})();
