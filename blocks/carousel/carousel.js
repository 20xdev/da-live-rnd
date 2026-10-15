/*
 * Carousel Block
 * One row per slide. A cell containing only an image is the slide image;
 * any other non-empty cell is the slide content (heading, text, CTA).
 * Controls (dot indicators + prev/next arrows) render below the slides.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

let carouselId = 0;

function isImageCell(cell) {
  const pic = cell.querySelector('picture');
  if (!pic) return false;
  return cell.textContent.trim() === '';
}

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;
  block.querySelectorAll('.carousel-slide').forEach((slide, idx) => {
    const active = idx === slideIndex;
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a, button').forEach((el) => {
      if (active) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });
  block.querySelectorAll('.carousel-slide-indicator button').forEach((button, idx) => {
    if (idx === slideIndex) {
      button.setAttribute('aria-current', 'true');
      button.disabled = true;
    } else {
      button.removeAttribute('aria-current');
      button.disabled = false;
    }
  });
}

function showSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.carousel-slide');
  if (!slides.length) return;
  let idx = slideIndex;
  if (idx < 0) idx = slides.length - 1;
  if (idx >= slides.length) idx = 0;
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: slides[idx].offsetLeft,
    behavior: 'smooth',
  });
  updateActiveSlide(block, idx);
}

function createSlide(row, idx, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-slide';
  slide.dataset.slideIndex = idx;
  slide.id = `carousel-${id}-slide-${idx}`;

  [...row.children].forEach((cell) => {
    if (isImageCell(cell)) {
      cell.className = 'carousel-slide-image';
      cell.querySelectorAll('picture > img').forEach((img) => {
        img.closest('picture').replaceWith(
          createOptimizedPicture(img.src, img.alt, idx === 0, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]),
        );
      });
      slide.append(cell);
    } else if (cell.textContent.trim() || cell.querySelector('picture')) {
      cell.className = 'carousel-slide-content';
      slide.append(cell);
    }
  });

  if (slide.querySelector('.carousel-slide-content')) slide.classList.add('carousel-slide-has-content');

  const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading && heading.id) slide.setAttribute('aria-labelledby', heading.id);
  return slide;
}

export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;
  block.id = `carousel-${id}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const rows = [...block.children].filter((row) => row.textContent.trim() || row.querySelector('picture'));

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.className = 'carousel-slides';
  rows.forEach((row, idx) => slidesWrapper.append(createSlide(row, idx, id)));

  const container = document.createElement('div');
  container.className = 'carousel-slides-container';
  container.append(slidesWrapper);

  block.replaceChildren(container);

  if (rows.length < 2) {
    block.classList.add('carousel-single');
    updateActiveSlide(block, 0);
    return;
  }

  const controls = document.createElement('div');
  controls.className = 'carousel-controls';

  const indicatorsNav = document.createElement('nav');
  indicatorsNav.setAttribute('aria-label', 'Carousel Slide Controls');
  const indicators = document.createElement('ol');
  indicators.className = 'carousel-slide-indicators';
  rows.forEach((_, idx) => {
    const li = document.createElement('li');
    li.className = 'carousel-slide-indicator';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show Slide ${idx + 1} of ${rows.length}`);
    button.addEventListener('click', () => showSlide(block, idx));
    li.append(button);
    indicators.append(li);
  });
  indicatorsNav.append(indicators);

  const nav = document.createElement('div');
  nav.className = 'carousel-navigation-buttons';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'slide-prev';
  prev.setAttribute('aria-label', 'Previous Slide');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'slide-next';
  next.setAttribute('aria-label', 'Next Slide');
  prev.addEventListener('click', () => showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1));
  next.addEventListener('click', () => showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1));
  nav.append(prev, next);

  controls.append(indicatorsNav, nav);
  block.append(controls);

  // keep state in sync with touch/trackpad scrolling
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
      }
    });
  }, { root: slidesWrapper, threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => observer.observe(slide));

  updateActiveSlide(block, 0);
}
