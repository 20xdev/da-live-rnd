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

  // tools/importer/import-magazine-article.js
  var import_magazine_article_exports = {};
  __export(import_magazine_article_exports, {
    default: () => import_magazine_article_default
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
      const p = document2.createElement("p");
      p.append(link);
      content.push(p);
    });
    if (!image && !content.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) cells.push([image]);
    if (content.length) cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/breadcrumbs.js
  function parse2(element, { document: document2 }) {
    let items = [...element.querySelectorAll("li.cmp-breadcrumb__item")];
    if (!items.length) items = [...element.querySelectorAll("ol > li, ul > li")];
    const ul = document2.createElement("ul");
    items.forEach((item, i) => {
      const link = item.querySelector("a[href]");
      const text2 = (link || item).textContent.replace(/\s+/g, " ").trim();
      if (!text2) return;
      const isCurrent = item.classList.contains("cmp-breadcrumb__item--active") || i === items.length - 1;
      const li = document2.createElement("li");
      if (link && !isCurrent) {
        const a = document2.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = text2;
        li.append(a);
      } else {
        li.textContent = text2;
      }
      ul.append(li);
    });
    if (!ul.children.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[ul]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "breadcrumbs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote.js
  var BLOCK_TAGS = /^(P|UL|OL|H[1-6]|DIV|BLOCKQUOTE)$/;
  function hasText(node) {
    return !!(node && node.textContent && node.textContent.trim());
  }
  function toParagraphs(nodes, document2) {
    const out = [];
    let run = null;
    nodes.forEach((node) => {
      if (node.nodeType === 1 && BLOCK_TAGS.test(node.tagName)) {
        run = null;
        if (node.tagName === "DIV" || node.tagName === "BLOCKQUOTE") {
          out.push(...toParagraphs([...node.childNodes], document2));
        } else if (hasText(node)) {
          out.push(node);
        }
        return;
      }
      if (node.nodeType === 3 && !hasText(node) && !run) return;
      if (node.nodeType !== 1 && node.nodeType !== 3) return;
      if (!run) {
        run = document2.createElement("p");
        out.push(run);
      }
      run.append(node);
    });
    return out.filter((el) => hasText(el));
  }
  function parse3(element, { document: document2 }) {
    const root = element.querySelector(".cmp-text") || element;
    const blockquote = root.querySelector("blockquote");
    if (!blockquote || !hasText(blockquote)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const container = blockquote.parentElement || root;
    const siblings = [...container.childNodes];
    const idx = siblings.indexOf(blockquote);
    const before = siblings.slice(0, idx).filter((n) => hasText(n) || n.nodeType === 1 && n.querySelector("img, picture"));
    const after = siblings.slice(idx + 1);
    const quotation = toParagraphs([...blockquote.childNodes], document2);
    const attribution = toParagraphs(after, document2);
    if (!quotation.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[quotation]];
    if (attribution.length) cells.push([attribution]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "quote", cells });
    if (before.length) element.before(...before);
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
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);
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
        Array.from(el.attributes).map((attr) => attr.name).filter((name) => name.startsWith("data-cmp-")).forEach((name) => el.removeAttribute(name));
      });
    }
  }

  // tools/importer/transformers/wknd-magazine.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SOURCE_ORIGIN = "https://wknd.site";
  var INNER_MAIN = "main.cmp-layout-container--fixed main.container";
  var SIDEBAR = "aside.cmp-layoutcontainer--sidebar";
  function text(el) {
    return el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "";
  }
  function absolutize2(url) {
    if (!url) return "";
    if (/^\.\//.test(url)) return url;
    try {
      return new URL(url, SOURCE_ORIGIN).href;
    } catch (e) {
      return url;
    }
  }
  function largestFromSrcset2(srcset) {
    if (!srcset) return "";
    let best = "";
    let bestW = -1;
    srcset.split(",").forEach((part) => {
      const [u, d] = part.trim().split(/\s+/);
      const w = parseFloat(d) || 0;
      if (u && w > bestW) {
        best = u;
        bestW = w;
      }
    });
    return best;
  }
  function resolveImageSrc(cmpImage, img) {
    const dataSrc = cmpImage.getAttribute("data-cmp-src");
    if (dataSrc) {
      const widths = (cmpImage.getAttribute("data-cmp-widths") || "").split(",").map((w) => parseInt(w, 10)).filter((w) => !Number.isNaN(w));
      const width = widths.length ? `.${Math.max(...widths)}` : "";
      return absolutize2(dataSrc.replace("{.width}", width));
    }
    const src = img && img.getAttribute("src");
    if (src && !/^data:/i.test(src)) return absolutize2(src);
    const srcset = img && (img.getAttribute("srcset") || img.getAttribute("data-srcset"));
    return absolutize2(largestFromSrcset2(srcset));
  }
  function normalizeImages(root, doc) {
    root.querySelectorAll(`${INNER_MAIN} .cmp-image`).forEach((cmpImage) => {
      const img = cmpImage.querySelector("img");
      const src = resolveImageSrc(cmpImage, img);
      if (!src) return;
      const newImg = doc.createElement("img");
      newImg.setAttribute("src", src);
      newImg.setAttribute("alt", img && img.getAttribute("alt") || "");
      const link = cmpImage.querySelector("a.cmp-image__link[href]");
      let media = newImg;
      if (link) {
        media = doc.createElement("a");
        media.setAttribute("href", link.getAttribute("href"));
        media.append(newImg);
      }
      const nodes = [media];
      const caption = text(cmpImage.querySelector(".cmp-image__title"));
      if (caption) {
        const p = doc.createElement("p");
        const em = doc.createElement("em");
        em.textContent = caption;
        p.append(em);
        nodes.push(p);
      }
      cmpImage.replaceWith(...nodes);
    });
  }
  function rewriteByline(root, doc) {
    root.querySelectorAll(`${INNER_MAIN} .cmp-byline`).forEach((byline) => {
      const xf = byline.closest(".experiencefragment");
      if (!xf || xf.getAttribute("data-wknd-byline") === "done") return;
      const wrapper = doc.createElement("div");
      wrapper.className = "cmp-byline";
      const portrait = byline.querySelector(".cmp-byline__image img");
      if (portrait && portrait.getAttribute("src")) {
        const p = doc.createElement("p");
        const img = doc.createElement("img");
        img.setAttribute("src", portrait.getAttribute("src"));
        img.setAttribute("alt", portrait.getAttribute("alt") || text(byline.querySelector(".cmp-byline__name")));
        p.append(img);
        wrapper.append(p);
      }
      const name = text(byline.querySelector(".cmp-byline__name"));
      if (name) {
        const h2 = doc.createElement("h2");
        h2.textContent = name;
        wrapper.append(h2);
      }
      const occupation = text(byline.querySelector(".cmp-byline__occupations"));
      if (occupation) {
        const p = doc.createElement("p");
        p.textContent = occupation;
        wrapper.append(p);
      }
      xf.querySelectorAll(".cmp-buildingblock--btn-list a.cmp-button").forEach((btn) => {
        const label = text(btn.querySelector(".cmp-button__text")) || (btn.getAttribute("aria-label") || "").trim();
        if (!label) return;
        const p = doc.createElement("p");
        const a = doc.createElement("a");
        a.setAttribute("href", btn.getAttribute("href") || "#");
        a.textContent = label;
        p.append(a);
        wrapper.append(p);
      });
      xf.replaceChildren(wrapper);
      xf.setAttribute("data-wknd-byline", "done");
    });
  }
  function rewriteUpNext(root, doc) {
    root.querySelectorAll(`${SIDEBAR} .cmp-list--upnext ul.cmp-list > li`).forEach((li) => {
      const link = li.querySelector("a.cmp-list__item-link") || li.querySelector("a[href]");
      const title = text(li.querySelector(".cmp-list__item-title")) || text(link);
      if (!title) return;
      const date = text(li.querySelector(".cmp-list__item-date"));
      const newLi = doc.createElement("li");
      if (link && link.getAttribute("href")) {
        const a = doc.createElement("a");
        a.setAttribute("href", link.getAttribute("href"));
        a.textContent = title;
        newLi.append(a);
      } else {
        newLi.append(doc.createTextNode(title));
      }
      if (date) {
        newLi.append(doc.createElement("br"), doc.createTextNode(date));
      }
      li.replaceWith(newLi);
    });
  }
  function rewriteDownloads(root, doc) {
    root.querySelectorAll(`${SIDEBAR} .download .cmp-download`).forEach((dl) => {
      const titleLink = dl.querySelector(".cmp-download__title-link");
      const action = dl.querySelector("a.cmp-download__action");
      const href = titleLink && titleLink.getAttribute("href") || action && action.getAttribute("href");
      const label = text(titleLink) || text(dl.querySelector(".cmp-download__title")) || text(action && action.querySelector(".cmp-download__action-text")) || text(action);
      const description = text(dl.querySelector(".cmp-download__description"));
      const nodes = [];
      if (href) {
        const p = doc.createElement("p");
        const a = doc.createElement("a");
        a.setAttribute("href", absolutize2(href));
        a.textContent = label || "Download";
        p.append(a);
        nodes.push(p);
      }
      if (description) {
        const p = doc.createElement("p");
        p.textContent = description;
        nodes.push(p);
      }
      if (nodes.length) dl.replaceWith(...nodes);
      else dl.remove();
    });
  }
  function removeEmptyDownloads(root) {
    root.querySelectorAll(`${SIDEBAR} .download`).forEach((d) => {
      if (!text(d) && !d.querySelector("a[href], img")) d.remove();
    });
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      const doc = element.ownerDocument || document;
      WebImporter.DOMUtils.remove(element, [`${SIDEBAR} .title`]);
      normalizeImages(element, doc);
      rewriteByline(element, doc);
      rewriteUpNext(element, doc);
      rewriteDownloads(element, doc);
      removeEmptyDownloads(element);
    }
    if (hookName === TransformHook2.afterTransform) {
      element.querySelectorAll("[data-wknd-byline]").forEach((el) => el.removeAttribute("data-wknd-byline"));
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
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
  function transform3(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section) continue;
        if (i === 0 && !section.style) continue;
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
          sectionEl.before(marker);
          continue;
        }
        if (isHr(prev)) {
          if (section.style) prev.setAttribute(SECTION_MARKER_ATTR, section.id);
          continue;
        }
        if (!hasContentBefore(element, sectionEl)) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section || !section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
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

  // tools/importer/import-magazine-article.js
  var parsers = {
    hero: parse,
    breadcrumbs: parse2,
    quote: parse3
  };
  var PAGE_TEMPLATE = {
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
        "name": "Article: breadcrumbs, title, byline, body (rich text, inline images, pull quote)",
        "selector": [
          "main.cmp-layout-container--fixed > .cmp-container > .aem-Grid > .breadcrumb"
        ],
        "style": null,
        "blocks": [
          "breadcrumbs",
          "quote"
        ],
        "defaultContent": [
          "main.cmp-layout-container--fixed main.container > .cmp-container > .title h1",
          "main.cmp-layout-container--fixed main.container > .cmp-container > .title h4",
          "main.cmp-layout-container--fixed .cmp-contentfragment__elements"
        ]
      },
      {
        "id": "3",
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
        "id": "4",
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
  var transformers = [
    transform,
    transform2,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform3] : []
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
  var import_magazine_article_default = {
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
      WebImporter.rules.createMetadata(main, document2);
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
  return __toCommonJS(import_magazine_article_exports);
})();
