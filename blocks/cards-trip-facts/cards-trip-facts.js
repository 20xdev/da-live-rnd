/**
 * Cards (Trip Facts) — a no-image vertical list of label/value facts.
 *
 * Authored content: one row per fact. Either
 *   - one cell:  <p>Label</p><p><strong>Value</strong></p>
 *   - two cells: | Label | Value |
 * Authors may omit the value, add extra paragraphs, or leave rows empty.
 */

const OPTION_CLASSES = [];

function textOf(el) {
  return (el?.textContent || '').trim();
}

/**
 * Splits a row into label and value nodes.
 * @param {Element} row authored block row
 * @returns {{ label: Node[], value: Node[] }}
 */
function splitRow(row) {
  const cells = [...row.children].filter((c) => textOf(c) || c.querySelector('picture'));

  // Two (or more) cells: first is the label, the rest is the value.
  if (cells.length > 1) {
    return {
      label: [...cells[0].childNodes],
      value: cells.slice(1).flatMap((c) => [...c.childNodes]),
    };
  }

  const cell = cells[0];
  if (!cell) return { label: [], value: [] };

  const blocks = [...cell.children].filter((c) => textOf(c));
  if (blocks.length > 1) {
    // Prefer an explicitly emphasised paragraph as the value; otherwise the last one.
    let valueIdx = blocks.findIndex((b, i) => i > 0 && b.querySelector('strong, b'));
    if (valueIdx < 0) valueIdx = blocks.length - 1;
    return {
      label: blocks.slice(0, valueIdx),
      value: blocks.slice(valueIdx),
    };
  }

  // Single paragraph / bare text: a lone <strong> is a value, anything else a label.
  const only = blocks[0] || cell;
  const strong = only.querySelector?.('strong, b');
  const isValue = strong && textOf(strong) === textOf(only);
  const nodes = [...cell.childNodes];
  return isValue ? { label: [], value: nodes } : { label: nodes, value: [] };
}

function buildPart(className, nodes) {
  const part = document.createElement('div');
  part.className = className;
  part.append(...nodes);
  // Drop empty paragraphs left behind by authoring.
  part.querySelectorAll('p').forEach((p) => {
    if (!textOf(p)) p.remove();
  });
  return part;
}

export default function decorate(block) {
  // No options yet; collected once so future option branches have a single place to hook in.
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const { label, value } = splitRow(row);
    if (!label.length && !value.length) return;

    const li = document.createElement('li');
    li.className = 'cards-trip-facts-item';
    if (label.length) li.append(buildPart('cards-trip-facts-label', label));
    if (value.length) li.append(buildPart('cards-trip-facts-value', value));
    ul.append(li);
  });

  block.replaceChildren(ul);
}
