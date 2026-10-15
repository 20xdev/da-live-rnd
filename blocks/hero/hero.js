/**
 * Hero
 *
 * One block, several looks, chosen by content shape (not by page):
 *  - image + text (heading / text / CTA) -> `hero-teaser`: full-bleed image with a
 *    white text panel overlapping its lower edge on wide screens
 *  - image only                        -> `hero-image-only`: plain image in the content column
 *  - text only                         -> `hero-text-only`: text in the content column
 *
 * Authors may put the image and the text in separate rows/cells or in one cell;
 * the block is normalised to `.hero-media` + `.hero-content`.
 * Optional variant: `Hero (image-bottom)` anchors the cropped teaser image to its bottom edge.
 *
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');

  const media = document.createElement('div');
  media.className = 'hero-media';
  if (picture) {
    const holder = picture.parentElement;
    media.append(picture);
    // decorateMain may have wrapped the picture in a <p>; drop it once empty
    if (holder && holder.tagName === 'P' && !holder.children.length && !holder.textContent.trim()) {
      holder.remove();
    }
  }

  const content = document.createElement('div');
  content.className = 'hero-content';
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    content.append(...cell.childNodes);
  });

  const hasContent = !!content.textContent.trim()
    || !!content.querySelector('picture, img, video, iframe');

  let shape = 'hero-text-only';
  if (picture) shape = hasContent ? 'hero-teaser' : 'hero-image-only';
  block.classList.add(shape);

  const parts = [];
  if (picture) parts.push(media);
  if (hasContent) parts.push(content);
  block.replaceChildren(...parts);
}
