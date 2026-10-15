/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks + Section Metadata.
 *
 * Reads sections from payload.template.sections (page-templates.json). Section boundary
 * selectors come from page analysis and were verified in migration-work/cleaned.html:
 *  - ".carousel.panelcontainer.cmp-carousel--hero" / "main > .cmp-container > .teaser.cmp-teaser--hero"
 *  - ".teaser.cmp-teaser--featured"
 *  - ".separator + .title.cmp-title--underline"
 *
 * AEM separator components (div.separator > div.cmp-separator > hr) that directly precede a
 * section boundary are consumed here (replaced by the section <hr>) so no duplicate break is
 * produced; any remaining .separator wrappers are removed by wknd-cleanup.js (afterTransform).
 *
 * Content-driven section style: a section whose source range (from its boundary element up to
 * the next section boundary) contains an AEM text component with the small-text style
 * (.text.cmp-text--font-small, 14px on the source: about-us intros, FAQ sidebar) additionally
 * gets the `font-small` section style (styles.css), e.g. "title-underline, font-small".
 *
 * Degrades gracefully: missing template/sections, unmatched selectors, or sections with no
 * preceding content (e.g. "Coming Soon" locale placeholder pages) never throw and never
 * produce empty sections or leading/duplicate <hr>.
 */
const SECTION_MARKER_ATTR = 'data-excat-section-id';
const SECTION_STYLE_ATTR = 'data-excat-section-style';
const FONT_SMALL_SELECTOR = '.text.cmp-text--font-small';
const FONT_SMALL_STYLE = 'font-small';
const CONTENT_SELECTOR = 'img, picture, video, iframe, table, h1, h2, h3, h4, h5, h6, p, a, li, blockquote';

// section.selector is an array (or string) of candidate selectors — first match wins.
function querySection(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector for this DOM engine — try next candidate
    }
  }
  return null;
}

function isSeparator(el) {
  return !!(el && el.classList && el.classList.contains('separator'));
}

function isHr(el) {
  return !!(el && el.tagName && el.tagName.toLowerCase() === 'hr');
}

// True when some authorable content precedes `target` in document order (prevents an
// empty leading section when earlier sections are absent on a page).
function hasContentBefore(root, target) {
  const candidates = root.querySelectorAll(CONTENT_SELECTOR);
  for (const node of candidates) {
    if (node === target || target.contains(node)) break;
    // eslint-disable-next-line no-bitwise
    const preceding = target.compareDocumentPosition(node) & 2; // DOCUMENT_POSITION_PRECEDING
    if (!preceding) continue;
    if (node.closest('.separator')) continue;
    if ((node.textContent || '').trim() || /^(img|picture|video|iframe)$/i.test(node.tagName)) {
      return true;
    }
  }
  return false;
}

// Index of the section a node belongs to: the last section whose boundary element exists and
// is (or contains, or precedes) the node; section 0 when no boundary precedes it.
function sectionIndexOf(node, starts) {
  let idx = 0;
  starts.forEach((start, i) => {
    if (!start) return;
    // eslint-disable-next-line no-bitwise
    if (start === node || start.contains(node) || (node.compareDocumentPosition(start) & 2)) idx = i;
  });
  return idx;
}

// Effective style per section: template style + content-driven extras (font-small).
function effectiveStyles(root, sections) {
  const styles = sections.map((s) => (s && s.style ? [s.style] : []));
  const starts = sections.map((s) => (s ? querySection(root, s.selector) : null));
  root.querySelectorAll(FONT_SMALL_SELECTOR).forEach((el) => {
    if (!(el.textContent || '').trim()) return;
    const list = styles[sectionIndexOf(el, starts)];
    if (list && !list.includes(FONT_SMALL_STYLE)) list.push(FONT_SMALL_STYLE);
  });
  return styles.map((list) => list.join(', ') || null);
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : [];
  if (sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    const styles = effectiveStyles(element, sections);
    // Insert breaks before parsers can replace section elements; reverse order keeps
    // not-yet-processed section elements at stable positions.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section) continue;
      const style = styles[i];
      if (i === 0 && !style) continue; // first section: no break, no metadata
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue;

      // Consume an AEM separator directly preceding the boundary.
      let prev = sectionEl.previousElementSibling;
      if (isSeparator(prev)) {
        prev.remove();
        prev = sectionEl.previousElementSibling;
      }

      if (i === 0) {
        // Styled first section: marker only (removed in afterTransform).
        const marker = document.createElement('hr');
        marker.setAttribute(SECTION_MARKER_ATTR, section.id);
        marker.setAttribute(SECTION_STYLE_ATTR, style);
        sectionEl.before(marker);
        continue;
      }

      if (isHr(prev)) {
        // A break already exists here — reuse it rather than duplicating.
        if (style) {
          prev.setAttribute(SECTION_MARKER_ATTR, section.id);
          prev.setAttribute(SECTION_STYLE_ATTR, style);
        }
        continue;
      }
      if (!hasContentBefore(element, sectionEl)) continue; // would create an empty section

      const hr = document.createElement('hr');
      if (style) {
        hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        hr.setAttribute(SECTION_STYLE_ATTR, style);
      }
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const style = (marker && marker.getAttribute(SECTION_STYLE_ATTR)) || section.style;
      if (!style) continue;
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue;

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        marker.removeAttribute(SECTION_STYLE_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }

    // Safety net: collapse consecutive <hr> breaks and drop leading/trailing ones.
    const hrs = Array.from(element.querySelectorAll('hr'));
    hrs.forEach((hr) => {
      if (!hr.isConnected) return;
      const next = hr.nextElementSibling;
      if (isHr(next)) next.remove();
    });
  }
}
