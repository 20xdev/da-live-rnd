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

  // tools/importer/import-content-page.js
  var import_content_page_exports = {};
  __export(import_content_page_exports, {
    default: () => import_content_page_default
  });

  // tools/importer/parsers/cards-profile.js
  var FALLBACK_ORIGIN = "https://wknd.site";
  var RUN_SELECTOR = "section.cmp-experience-fragment--contributor";
  var NETWORK_LABELS = {
    facebook: "Facebook",
    twitter: "Twitter",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    youtube: "YouTube"
  };
  var NETWORK_MATCH = {
    facebook: ["facebook", "fb.com", "fb.me"],
    twitter: ["twitter", "x.com"],
    instagram: ["instagram", "insta"],
    linkedin: ["linkedin"],
    youtube: ["youtube", "youtu.be"]
  };
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
  function resolveImage(container, document2, fallbackAlt) {
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
    out.alt = img && img.getAttribute("alt") || fallbackAlt || "";
    return out;
  }
  var clean = (el) => el && el.textContent ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function detectNetwork(a) {
    const icon = a.querySelector('[class*="cmp-button__icon--"]');
    if (icon) {
      const m = icon.className.match(/cmp-button__icon--([a-z0-9-]+)/i);
      if (m) {
        const key = m[1].toLowerCase();
        const found = Object.keys(NETWORK_MATCH).find((k) => k === key || NETWORK_MATCH[k].some((t) => !t.includes(".") && key.includes(t)));
        if (found) return found;
      }
    }
    const text = clean(a.querySelector(".cmp-button__text") || a).toLowerCase();
    const byText = Object.keys(NETWORK_MATCH).find((k) => NETWORK_MATCH[k].some((t) => !t.includes(".") && text.includes(t)));
    if (byText) return byText;
    const href = (a.getAttribute("href") || "").toLowerCase();
    return Object.keys(NETWORK_MATCH).find((k) => NETWORK_MATCH[k].some((t) => href.includes(t))) || null;
  }
  function buildRow(section, document2) {
    const nameEl = section.querySelector(".title:not(.cmp-title--black) .cmp-title__text") || section.querySelector("h3") || section.querySelector("h1, h2, h4");
    const name = clean(nameEl);
    const rolesEl = section.querySelector(".cmp-title--black .cmp-title__text") || section.querySelector("h5, h6");
    const roles = rolesEl && rolesEl !== nameEl ? clean(rolesEl) : "";
    const image = resolveImage(section.querySelector(".cmp-image") || section.querySelector("img"), document2, name);
    const body = [];
    if (name) {
      const h3 = document2.createElement("h3");
      h3.textContent = name;
      body.push(h3);
    }
    if (roles) {
      const p = document2.createElement("p");
      p.textContent = roles;
      body.push(p);
    }
    let anchors = [...section.querySelectorAll(".cmp-buildingblock--btn-list a.cmp-button")];
    if (!anchors.length) anchors = [...section.querySelectorAll("a.cmp-button, .cmp-buildingblock--btn-list a[href]")];
    const links = anchors.filter((a, i, arr) => arr.indexOf(a) === i && a.getAttribute("href")).map((a) => {
      const network = detectNetwork(a);
      const label = network ? NETWORK_LABELS[network] : clean(a.querySelector(".cmp-button__text") || a);
      if (!label) return null;
      const link = document2.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = label;
      return link;
    }).filter(Boolean);
    links.forEach((link) => {
      const p = document2.createElement("p");
      p.append(link);
      body.push(p);
    });
    if (!image && !body.length) return null;
    return [image || "", body.length ? body : ""];
  }
  function parse(element, { document: document2 }) {
    if (!element.parentNode) return;
    const run = [element];
    let next = element.nextElementSibling;
    while (next && next.matches(RUN_SELECTOR)) {
      run.push(next);
      next = next.nextElementSibling;
    }
    const cells = run.map((section) => buildRow(section, document2)).filter(Boolean);
    run.slice(1).forEach((section) => section.remove());
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-profile", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-featured.js
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
    out.alt = img && img.getAttribute("alt") || "";
    const title = img && img.getAttribute("title");
    if (title) out.title = title;
    return out;
  }
  function parse2(element, { document: document2 }) {
    const teaser = element.querySelector(".cmp-teaser") || element;
    const image = resolveImage2(teaser.querySelector(".cmp-teaser__image") || teaser.querySelector(".cmp-image, img"), document2);
    const content = [];
    const pretitle = teaser.querySelector(".cmp-teaser__pretitle");
    if (pretitle && pretitle.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = pretitle.textContent.trim();
      content.push(p);
    }
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
    const cells = [[image || "", content.length ? content : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-featured", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  var FALLBACK_ORIGIN3 = "https://wknd.site";
  function getOrigin3(document2) {
    try {
      const canonical = document2.querySelector('link[rel="canonical"]');
      if (canonical && canonical.href && /^https?:/.test(canonical.href)) return new URL(canonical.href).origin;
    } catch (e) {
    }
    return FALLBACK_ORIGIN3;
  }
  function absolutize3(src, document2) {
    if (!src) return "";
    const s = src.trim();
    if (!s || s.startsWith("data:")) return "";
    try {
      if (/^https?:\/\//i.test(s)) return s;
      if (s.startsWith("//")) return `https:${s}`;
      return new URL(s, getOrigin3(document2)).href;
    } catch (e) {
      return s;
    }
  }
  function largestFromSrcset3(srcset) {
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
  function resolveImage3(container, document2, fallbackAlt) {
    if (!container) return null;
    const img = container.matches && container.matches("img") ? container : container.querySelector("img");
    const cmpHost = container.matches && container.matches("[data-cmp-src]") ? container : container.querySelector("[data-cmp-src]") || img && img.closest("[data-cmp-src]");
    let src = "";
    if (img) {
      const raw = img.getAttribute("src") || "";
      if (raw && !raw.startsWith("data:") && !raw.includes("{.width}")) src = raw;
      if (!src) src = img.getAttribute("data-src") || "";
      if (!src) src = largestFromSrcset3(img.getAttribute("srcset") || img.getAttribute("data-srcset"));
    }
    if (!src && cmpHost) {
      const tpl = cmpHost.getAttribute("data-cmp-src") || "";
      const widths = (cmpHost.getAttribute("data-cmp-widths") || "").split(",").map((w) => parseInt(w, 10)).filter(Boolean);
      const width = widths.length ? Math.max(...widths) : "";
      src = width ? tpl.replace("{.width}", `.${width}`) : tpl.replace("{.width}", "");
    }
    src = absolutize3(src, document2);
    if (!src) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = img && img.getAttribute("alt") || fallbackAlt || "";
    const title = img && img.getAttribute("title");
    if (title) out.title = title;
    return out;
  }
  var TEASER_RUN_SELECTOR = ".teaser.cmp-teaser--secure";
  function teaserRow(teaserEl, document2) {
    const teaser = teaserEl.querySelector(".cmp-teaser") || teaserEl;
    const titleEl = teaser.querySelector(".cmp-teaser__title") || teaser.querySelector("h1, h2, h3, h4");
    const titleText = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
    const actions = [...teaser.querySelectorAll(".cmp-teaser__action-container a[href], a.cmp-teaser__action-link[href]")].filter((a, i, arr) => arr.indexOf(a) === i);
    const titleLinkEl = titleEl && (titleEl.querySelector("a[href]") || titleEl.closest("a[href]")) || teaser.querySelector("a.cmp-teaser__title-link[href]") || actions[0];
    const href = titleLinkEl ? titleLinkEl.getAttribute("href") : "";
    const image = resolveImage3(
      teaser.querySelector(".cmp-teaser__image") || teaser.querySelector(".cmp-image, img"),
      document2,
      titleText
    );
    const body = [];
    if (titleText) {
      const h = document2.createElement("h3");
      if (href) {
        const a = document2.createElement("a");
        a.href = href;
        a.textContent = titleText;
        h.append(a);
      } else {
        h.textContent = titleText;
      }
      body.push(h);
    }
    const desc = teaser.querySelector(".cmp-teaser__description");
    if (desc && desc.textContent.trim()) {
      const paras = [...desc.querySelectorAll(":scope > p")].map((p) => p.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
      (paras.length ? paras : [desc.textContent.replace(/\s+/g, " ").trim()]).forEach((t) => {
        const p = document2.createElement("p");
        p.textContent = t;
        body.push(p);
      });
    }
    actions.forEach((a) => {
      const text = a.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      const link = document2.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = text;
      const p = document2.createElement("p");
      p.append(link);
      body.push(p);
    });
    [...teaser.querySelectorAll(".cmp-teaser__action-container")].filter((c) => !c.querySelector("a[href]")).forEach((c) => {
      const label = c.textContent.replace(/\s+/g, " ").trim();
      if (!label) return;
      const p = document2.createElement("p");
      p.textContent = label;
      body.push(p);
    });
    if (!image && !body.length) return null;
    return [image || "", body.length ? body : ""];
  }
  function parse3(element, { document: document2 }) {
    if (element.matches(TEASER_RUN_SELECTOR) && !element.querySelector("li.cmp-image-list__item")) {
      if (!element.parentNode) return;
      const run = [element];
      let next = element.nextElementSibling;
      while (next && next.matches(TEASER_RUN_SELECTOR)) {
        run.push(next);
        next = next.nextElementSibling;
      }
      const teaserCells = run.map((t) => teaserRow(t, document2)).filter(Boolean);
      run.slice(1).forEach((t) => t.remove());
      if (!teaserCells.length) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document2, { name: "cards", variants: ["secure"], cells: teaserCells });
      element.replaceWith(block2);
      return;
    }
    let items = [...element.querySelectorAll("li.cmp-image-list__item")];
    if (!items.length) items = [...element.querySelectorAll("article.cmp-image-list__item-content")];
    if (!items.length) items = [...element.querySelectorAll(":scope ul > li")];
    const cells = [];
    items.forEach((item) => {
      const titleEl = item.querySelector(".cmp-image-list__item-title");
      const titleLink = item.querySelector("a.cmp-image-list__item-title-link") || titleEl && titleEl.closest("a") || item.querySelector("a.cmp-image-list__item-image-link") || item.querySelector("a[href]");
      const titleText = (titleEl || titleLink) && (titleEl || titleLink).textContent.trim() || "";
      const href = titleLink ? titleLink.getAttribute("href") : "";
      const image = resolveImage3(
        item.querySelector(".cmp-image-list__item-image") || item.querySelector(".cmp-image, img"),
        document2,
        titleText
      );
      const body = [];
      if (titleText) {
        const h = document2.createElement("h3");
        if (href) {
          const a = document2.createElement("a");
          a.href = href;
          a.textContent = titleText;
          h.append(a);
        } else {
          h.textContent = titleText;
        }
        body.push(h);
      }
      const desc = item.querySelector(".cmp-image-list__item-description");
      if (desc && desc.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.trim();
        body.push(p);
      }
      if (!image && !body.length) return;
      cells.push([image || "", body.length ? body : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/search.js
  var clean2 = (s) => (s || "").replace(/\s+/g, " ").trim();
  function parse4(element, { document: document2 }) {
    var _a;
    const input = element.querySelector("input.cmp-contentaisearch__input") || element.querySelector('input[type="search"], input[type="text"], input[name="q"]');
    const placeholder = clean2(input && input.getAttribute("placeholder"));
    let toggleLabel = "";
    const toggle = element.querySelector("label.cmp-contentaisearch__ai-toggle") || ((_a = element.querySelector('input[type="checkbox"]')) == null ? void 0 : _a.closest("label"));
    if (toggle) {
      toggleLabel = clean2(toggle.textContent);
      if (!toggleLabel) {
        const box = toggle.querySelector('input[type="checkbox"]');
        toggleLabel = clean2(box && box.getAttribute("aria-label"));
      }
    }
    const contentCell = [];
    if (placeholder) {
      const p = document2.createElement("p");
      p.textContent = placeholder;
      contentCell.push(p);
      if (toggleLabel) {
        const p2 = document2.createElement("p");
        p2.textContent = toggleLabel;
        contentCell.push(p2);
      }
    }
    const cells = [[contentCell.length ? contentCell : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "search", cells });
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

  // tools/importer/import-content-page.js
  var parsers = {
    "cards-profile": parse,
    "columns-featured": parse2,
    cards: parse3,
    search: parse4
  };
  var PAGE_TEMPLATE = {
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
        "name": 'First underlined-title group: "Our Contributors" profiles (about-us) / "All Articles" image list (magazine)',
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
        "name": 'Second underlined-title group: "WKND Guides" profiles (about-us) / "Members Only" intro + secure teasers (magazine)',
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
  var import_content_page_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      const parsedBlocks = [];
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        parsedBlocks.push(block.name);
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
          blocks: parsedBlocks
        }
      }];
    }
  };
  return __toCommonJS(import_content_page_exports);
})();
