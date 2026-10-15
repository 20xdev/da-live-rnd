/* eslint-disable */
/* global WebImporter */
/**
 * Parser for quote. Base: quote (custom block, no library convention).
 * Source: https://wknd.site/us/en/magazine/arctic-surfing.html (+ the other magazine articles)
 *
 * Source (AEM Core text component inside the article content fragment,
 * verified in block-context/quote/source.html):
 *   div.text.aem-GridColumn > div.cmp-text
 *     <blockquote>…</blockquote>          quotation (inline formatting such as <b>, <br>)
 *     <p>…</p> (optional, 0..n)            attribution, e.g. <p><u>Jacob Wester - Pro Skater</u></p>
 *
 * Shapes seen across the magazine articles:
 *  - arctic-surfing:      blockquote only (no attribution)
 *  - guide-la-skateparks: blockquote + <p><u>name - role</u></p>
 *  - alaskan-adventure:   blockquote + <p><u>name</u></p>
 *  - ski-touring:         blockquote + <p><u>- name</u></p>
 *  - western-australia:   <blockquote><b>… <br> <b>…</b></b></blockquote> + <p><b><i><u>noun</u></i></b></p>
 *
 * Output (blocks/quote decorator, one cell per row; first text cell = quotation,
 * next text cell = attribution/figcaption):
 *   row 1 = [quotation paragraph(s)]
 *   row 2 = [attribution paragraph(s)] (only when present)
 * No image row: adjacent images remain default content by design.
 * If the blockquote has no text, the element is unwrapped instead of emitting an empty block.
 */

const BLOCK_TAGS = /^(P|UL|OL|H[1-6]|DIV|BLOCKQUOTE)$/;

function hasText(node) {
  return !!(node && node.textContent && node.textContent.trim());
}

/** Turn a list of nodes into block-level elements; loose inline runs are wrapped in <p>. */
function toParagraphs(nodes, document) {
  const out = [];
  let run = null;
  nodes.forEach((node) => {
    if (node.nodeType === 1 && BLOCK_TAGS.test(node.tagName)) {
      run = null;
      if (node.tagName === 'DIV' || node.tagName === 'BLOCKQUOTE') {
        out.push(...toParagraphs([...node.childNodes], document));
      } else if (hasText(node)) {
        out.push(node);
      }
      return;
    }
    if (node.nodeType === 3 && !hasText(node) && !run) return; // skip leading whitespace
    if (node.nodeType !== 1 && node.nodeType !== 3) return; // comments etc.
    if (!run) {
      run = document.createElement('p');
      out.push(run);
    }
    run.append(node);
  });
  return out.filter((el) => hasText(el));
}

export default function parse(element, { document }) {
  const root = element.querySelector('.cmp-text') || element;
  const blockquote = root.querySelector('blockquote');

  if (!blockquote || !hasText(blockquote)) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Siblings of the blockquote (within its parent) split into before/after.
  const container = blockquote.parentElement || root;
  const siblings = [...container.childNodes];
  const idx = siblings.indexOf(blockquote);
  const before = siblings.slice(0, idx).filter((n) => hasText(n) || (n.nodeType === 1 && n.querySelector('img, picture')));
  const after = siblings.slice(idx + 1);

  const quotation = toParagraphs([...blockquote.childNodes], document);
  const attribution = toParagraphs(after, document);

  if (!quotation.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[quotation]];
  if (attribution.length) cells.push([attribution]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote', cells });
  // Any unexpected content preceding the blockquote stays as default content.
  if (before.length) element.before(...before);
  element.replaceWith(block);
}
