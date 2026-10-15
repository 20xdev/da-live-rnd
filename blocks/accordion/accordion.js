/*
 * Accordion Block
 * Each row is one item: cell 1 = question/label, cell 2 = answer/body.
 * Rows with a single cell become a label-only item with an empty body.
 */

export default function decorate(block) {
  [...block.children].forEach((row, index) => {
    const cells = [...row.children];
    if (!cells.length) {
      row.remove();
      return;
    }

    const [labelCell, ...bodyCells] = cells;

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...labelCell.childNodes);

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    bodyCells.forEach((cell) => body.append(...cell.childNodes));
    body.id = `accordion-item-body-${index}`;

    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
