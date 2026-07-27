#!/usr/bin/env node
/**
 * build.js — stitches the shared nav and footer partials into every page.
 *
 * Usage:
 *   node build.js            Rewrite the INCLUDE regions in every page.
 *   node build.js --dry-run  Print what would change without writing files.
 *
 * How it works: partials/nav.html and partials/footer.html are the single
 * source of truth for the header/nav and the footer/mobile-call-bar/modal.
 * This script reads them, fills in the handful of things that legitimately
 * differ per page (which nav link is "current", the logo link target, the
 * modal's form name, and which service is pre-selected in the modal), and
 * writes the result into the <!-- INCLUDE:nav --> / <!-- INCLUDE:footer -->
 * regions of every *.html page in the project root.
 *
 * It's safe to run repeatedly — it recognizes both the INCLUDE-marker form
 * (from a previous run) and the original hand-written block (on a page
 * that's never been built), so there's no separate one-time migration step.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DRY_RUN = process.argv.includes('--dry-run');

const CANONICAL_SERVICE_OPTIONS = [
  'Storm Damage Inspection',
  'Roof Replacement',
  'Roof Repair',
  'Gutters / Gutter Guards',
  'Fence',
  'Patio / Pergola',
  'Siding',
  'Insurance Claim',
  'General Contracting',
  'Other',
];

// ── Load partials + config ──────────────────────────────────────────────
const navPartial = fs.readFileSync(path.join(ROOT, 'partials/nav.html'), 'utf8');
const footerPartial = fs.readFileSync(path.join(ROOT, 'partials/footer.html'), 'utf8');
const pageConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'page-config.json'), 'utf8'));
const selectedServiceByPage = pageConfig.selectedService || {};

// ── Region boundaries ───────────────────────────────────────────────────
// Each matches either an already-templated INCLUDE block, or the original
// raw hand-written block (for a page that hasn't been built yet).
const NAV_REGION = /(?:<!-- INCLUDE:nav -->[\s\S]*?<!-- \/INCLUDE:nav -->\n)|(?:  <!-- ===================== NAV ===================== -->[\s\S]*?<button class="btn-cta btn-cta--mobile js-modal-trigger">Get a Free Estimate<\/button>\n {2}<\/div>\n)/;

const FOOTER_REGION = /(?:<!-- INCLUDE:footer -->[\s\S]*?<!-- \/INCLUDE:footer -->\n)|(?:  <!-- ===================== FOOTER ===================== -->[\s\S]*?<\/div>\n {2}<\/div>\n\n(?=  <script src="scripts\.js"))/;

// ── Helpers ──────────────────────────────────────────────────────────────
function injectCurrentPage(html, filename) {
  return html.replace(
    /<a href="([^"]+)"([^<>]*)data-nav-link>/g,
    (full, href, attrs) => (href === filename ? `<a href="${href}"${attrs}data-nav-link aria-current="page">` : full)
  );
}

function buildServiceOptions(selected) {
  const ordered = selected
    ? [selected, ...CANONICAL_SERVICE_OPTIONS.filter((o) => o !== selected)]
    : CANONICAL_SERVICE_OPTIONS;
  const lines = ['            <option value="">Select a service…</option>'];
  for (const opt of ordered) {
    lines.push(`            <option${opt === selected ? ' selected' : ''}>${opt}</option>`);
  }
  return lines.join('\n');
}

function buildNavForPage(filename) {
  const logoHref = filename === 'index.html' ? '#top' : 'index.html';
  let html = navPartial.replace(/__LOGO_HREF__/g, logoHref);
  html = injectCurrentPage(html, filename);
  return html.replace(/\n$/, '');
}

function buildFooterForPage(filename) {
  const logoHref = filename === 'index.html' ? '#top' : 'index.html';
  const slug = filename.replace(/\.html$/, '');
  const formName = `estimate-modal-${slug}`;
  const options = buildServiceOptions(selectedServiceByPage[filename] || null);

  let html = footerPartial.replace(/__LOGO_HREF__/g, logoHref);
  html = html.replace(/__MODAL_FORM_NAME__/g, formName);
  html = html.replace('__MODAL_OPTIONS__', options);
  return html.replace(/\n$/, '');
}

// ── Main ─────────────────────────────────────────────────────────────────
const SKIP = new Set(['Best Roofing Company in Coppell TX.html']);

const pages = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && !SKIP.has(f) && fs.statSync(path.join(ROOT, f)).isFile());

let changedCount = 0;

for (const file of pages) {
  const filePath = path.join(ROOT, file);
  const original = fs.readFileSync(filePath, 'utf8');

  const navBlock = `<!-- INCLUDE:nav -->\n${buildNavForPage(file)}\n<!-- /INCLUDE:nav -->\n`;
  const footerBlock = `<!-- INCLUDE:footer -->\n${buildFooterForPage(file)}\n<!-- /INCLUDE:footer -->\n`;

  let updated = original;

  if (NAV_REGION.test(updated)) {
    updated = updated.replace(NAV_REGION, navBlock);
  } else {
    console.warn(`WARN: ${file} — nav region not found, skipped`);
  }

  if (FOOTER_REGION.test(updated)) {
    updated = updated.replace(FOOTER_REGION, footerBlock);
  } else {
    console.warn(`WARN: ${file} — footer region not found, skipped`);
  }

  if (updated !== original) {
    changedCount++;
    if (DRY_RUN) {
      console.log(`would update: ${file}`);
    } else {
      fs.writeFileSync(filePath, updated);
      console.log(`updated: ${file}`);
    }
  } else {
    console.log(`unchanged: ${file}`);
  }
}

console.log(`\n${DRY_RUN ? 'Would rebuild' : 'Rebuilt'} nav/footer in ${changedCount} of ${pages.length} pages.`);
