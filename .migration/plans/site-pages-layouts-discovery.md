# Plan: Migrate the WKND Site (All Locales)

## Status
**Phase 1 is still waiting on Execute mode.** You've asked me to start twice, but the chat is still in Plan mode. In Plan mode I can only write plans; I can't fetch the site, crawl pages or analyze them. Please switch the chat mode from **Plan** to **Execute**. You only need to do this once. Phase 1 then starts immediately, with no more questions, using the steps below.

## Goal
Move every page of the WKND website (`https://wknd.site/us/en.html` and all its other language and region versions) to this site. The migration includes design and styling, the header and navigation, the footer, and a validation pass afterwards. Everything stays in the local preview for you to review. Nothing gets uploaded to Document Authoring or committed until you approve it.

## Decisions so far
- **Source:** `https://wknd.site`, starting from `/us/en.html`
- **Page scope:** all locales (every language and region version)
- **Extras:** design and styling, header and navigation, footer, and validation after import
- **Publishing:** pages stay in the local preview only. No upload to Document Authoring, no git push, no PR.
- **Project:** Document Authoring site `20xdev/da-live-rnd`. The repo is a clean starter template, so all blocks and import tooling get built from scratch.

## First steps once Execute mode is on (Phase 1)
1. Check robots.txt and the sitemap(s) on `wknd.site`. If there's a sitemap index, follow all its child sitemaps.
2. Read the locale switcher on `/us/en.html` to list every language and region tree.
3. Crawl from each locale's home page to find any pages the sitemap misses.
4. Combine, remove duplicates and normalize the list. Drop non-page items like PDFs, images, redirects and error pages.
5. Group the pages into layouts and list the blocks each layout uses.
6. **Stop at the checkpoint** and show you:
   - page counts per locale and per section
   - the layout summary: layout name, page count, example URLs, main blocks
   - any locales that don't follow the US English layouts
   - outliers or dynamic features that need your decision

## Approach

### Phase 1: Find pages and layouts
1. Find every URL across all locales, starting from the sitemap(s) and robots.txt and falling back to a crawl from `/us/en.html`. Locale switcher links will be used to make sure no locale tree is missed.
2. Normalize the list: remove duplicates and drop non-page items.
3. Report the page count per locale and per section (for example, adventures, magazine articles, FAQs, about pages).
4. Group the pages into layouts (templates) such as homepage, adventure detail, article, listing and FAQ. I'll check that each locale uses the same layouts as US English, so the layouts and blocks only need to be defined once.
5. List the blocks and variants in each layout, and flag one-off or unclear components.
6. **Checkpoint:** I'll show you the layout summary with page counts before the build starts.

### Phase 2: Build blocks and import tooling
1. Analyze one representative page per layout in detail: its sections, blocks and the authoring choices behind them.
2. Map each block variant to the original page elements it replaces.
3. Generate the block code (JS/CSS) for each variant, reusing shared blocks across layouts.
4. Build the import tooling: one parser per block variant, plus cleanup and section transformers.
5. Test-import one page per layout and check it in the preview before the bulk run.

### Phase 3: Design and styling
1. Pull the site-wide design tokens from the original: fonts, colors, spacing and breakpoints.
2. Style each block to match the original, comparing the result against the source page.

### Phase 4: Header and footer
1. Migrate the header and navigation, including dropdowns or megamenu, the mobile menu and the locale switcher.
2. Migrate the footer.
3. Create a navigation and footer version for each locale, using the translated text from each locale's source pages.

### Phase 5: Bulk import all pages
1. Run the import for every URL in every locale, keeping the original path structure (for example `/us/en/...`, `/de/de/...`).
2. Use image references from the source pages.
3. Track failures and retry pages that failed.

### Phase 6: Validation
1. Score each imported page for content completeness against the original.
2. Compare flagged pages visually, fix block, parser or style problems, and re-import the affected pages.
3. Produce a final report: pages migrated per locale, problems fixed, and anything still needing your review.

## Notes and risks
- **Size:** migrating every locale can multiply the page count by many times. The full bulk import only starts after you've seen the layout summary at the Phase 1 checkpoint.
- **Locale differences:** if some locales use different layouts or content structures, I'll flag them rather than force them into the US English layouts.
- **Dynamic content:** dynamic or app-like content on the original site (filters, search, forms) may need a simplified approach. I'll flag it for your decision.
- **Access:** if the site blocks automated access or has no sitemap, I'll switch to crawling from the locale home pages and tell you if any section couldn't be reached.
- **Content creation:** all page content is produced by the import tooling. None of it is written by hand.

## Out of scope
- Uploading or publishing to Document Authoring
- Committing, pushing or opening a PR (when you're ready, this can be a follow-up)
- Migration effort estimate or scope report

## Checklist
- [ ] **You:** switch the chat from Plan mode to Execute mode
- [ ] Check robots.txt and the sitemap(s), including child sitemaps
- [ ] List all locales from the locale switcher
- [ ] Crawl each locale's home page to find pages the sitemap misses
- [ ] Normalize the URL list and report page counts per locale and section
- [ ] Group the pages into layouts and list the blocks in each one
- [ ] **Checkpoint:** show you the layout summary and page counts before building
- [ ] Analyze one representative page per layout
- [ ] Map block variants to the original page elements
- [ ] Generate the block code for every variant
- [ ] Build the import parsers and transformers
- [ ] Test-import one page per layout and check it in the preview
- [ ] Pull site-wide design tokens and apply the global styling
- [ ] Style each block to match the original
- [ ] Migrate the header and navigation (including mobile and locale switcher)
- [ ] Migrate the footer
- [ ] Create the navigation and footer for each locale
- [ ] Bulk-import all pages in all locales
- [ ] Retry failed imports and log any pages that still fail
- [ ] Score all imported pages for content completeness
- [ ] Compare flagged pages visually and fix the problems
- [ ] Re-import the affected pages after fixes
- [ ] Deliver the final report (pages per locale, fixes made, open items for review)

> **Note:** Running this plan requires Execute mode. The chat is still in Plan mode, so nothing has run yet. Switch to Execute mode and Phase 1 starts right away.
