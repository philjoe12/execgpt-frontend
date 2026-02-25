#!/usr/bin/env node
/**
 * ExecGPT Website Update Tests
 * Run: node tests/website-updates.test.mjs
 *
 * Verifies all 8 website update items are correctly implemented.
 */
import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, '..');
const PUBLIC = join(WEB_ROOT, 'public');
const MARKETING = join(WEB_ROOT, 'app', '(marketing)');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL  ${name}`);
  }
}

function readFile(path) {
  return readFileSync(path, 'utf-8');
}

function fileExists(path) {
  return existsSync(path);
}

function fileSize(path) {
  return statSync(path).size;
}

// ============================================================
// 1. Logo - Transparent Background
// ============================================================
console.log('\n--- #1: Logo (Transparent Background) ---');

assert(
  fileExists(join(PUBLIC, 'images/execgpt-logo.png')),
  'Logo file exists at public/images/execgpt-logo.png'
);

assert(
  fileSize(join(PUBLIC, 'images/execgpt-logo.png')) > 10000,
  'Logo file is a reasonable size (>10KB)'
);

// ============================================================
// 2. Header Line Moved Down
// ============================================================
console.log('\n--- #2: Header Line Moved Down ---');

const pageContent = readFile(join(MARKETING, 'page.tsx'));

assert(
  !pageContent.includes("className={'mt-4 flex flex-col"),
  'Old mt-4 margin removed from hero section'
);

assert(
  /mt-1[26]|mt-20|pt-1[26]|pt-20/.test(pageContent),
  'Hero section has increased top margin (mt-12/16/20 or pt-12/16/20)'
);

// ============================================================
// 3. Animated AI Background on Hero Section
// ============================================================
console.log('\n--- #3: Animated AI Background ---');

assert(
  fileExists(join(MARKETING, '_components/animated-background.tsx')) ||
  fileExists(join(MARKETING, '_components/neural-network-bg.tsx')) ||
  fileExists(join(WEB_ROOT, 'components/animated-background.tsx')),
  'Animated background component file exists'
);

assert(
  pageContent.includes('AnimatedBackground') ||
  pageContent.includes('NeuralNetworkBg') ||
  pageContent.includes('animated-background') ||
  pageContent.includes('neural-network'),
  'Landing page imports/uses animated background component'
);

// ============================================================
// 4. Ask/Answer/Action Graphic (Transparent)
// ============================================================
console.log('\n--- #4: Ask/Answer/Action Graphic ---');

assert(
  fileExists(join(PUBLIC, 'images/ask-answer-action.png')),
  'Ask/Answer/Action graphic exists'
);

assert(
  fileSize(join(PUBLIC, 'images/ask-answer-action.png')) > 50000,
  'Ask/Answer/Action graphic is reasonable size (>50KB)'
);

// ============================================================
// 5. CTA Button Links
// ============================================================
console.log('\n--- #5: CTA Button Links ---');

// Request Demo should have a dedicated demo path or env var
assert(
  pageContent.includes('NEXT_PUBLIC_DEMO_URL') ||
  pageContent.includes('/demo') ||
  pageContent.includes('mode=demo'),
  'Request Demo button references demo URL (env var or /demo path)'
);

// Join Waitlist should link to waitlist
assert(
  pageContent.includes('waitlist') || pageContent.includes('WAITLIST'),
  'Waitlist button references waitlist path'
);

// ============================================================
// 6. Legal Pages (Terms, Privacy, Cookie)
// ============================================================
console.log('\n--- #6: Legal Pages ---');

const tosFile = join(MARKETING, '(legal)/terms-of-service/page.tsx');
const privacyFile = join(MARKETING, '(legal)/privacy-policy/page.tsx');
const cookieFile = join(MARKETING, '(legal)/cookie-policy/page.tsx');

assert(fileExists(tosFile), 'Terms of Service page exists');
assert(fileExists(privacyFile), 'Privacy Policy page exists');
assert(fileExists(cookieFile), 'Cookie Policy page exists');

const tosContent = readFile(tosFile);
const privacyContent = readFile(privacyFile);
const cookieContent = readFile(cookieFile);

assert(
  !tosContent.includes('Your terms of service content here'),
  'Terms of Service has real content (not placeholder)'
);

assert(
  !privacyContent.includes('Your terms of service content here'),
  'Privacy Policy has real content (not placeholder)'
);

assert(
  !cookieContent.includes('Your terms of service content here'),
  'Cookie Policy has real content (not placeholder)'
);

assert(
  tosContent.includes('ExecGPT') || tosContent.includes('EXECGPT') || tosContent.includes('execgpt'),
  'Terms of Service references ExecGPT'
);

assert(
  privacyContent.includes('ExecGPT') || privacyContent.includes('EXECGPT') || privacyContent.includes('execgpt'),
  'Privacy Policy references ExecGPT'
);

assert(
  cookieContent.includes('cookie') || cookieContent.includes('Cookie'),
  'Cookie Policy references cookies'
);

// ============================================================
// 7. Footer Icon Quality
// ============================================================
console.log('\n--- #7: Footer Icon Quality ---');

assert(
  fileExists(join(PUBLIC, 'images/iconforurl.png')),
  'Footer icon exists at public/images/iconforurl.png'
);

assert(
  fileSize(join(PUBLIC, 'images/iconforurl.png')) > 30000,
  'Footer icon is high quality (>30KB - was 23KB before)'
);

// ============================================================
// 8. Favicon Transparent Background
// ============================================================
console.log('\n--- #8: Favicon (Transparent Background) ---');

const faviconFiles = [
  'favicon/favicon-16x16.png',
  'favicon/favicon-32x32.png',
  'favicon/apple-touch-icon.png',
  'favicon/android-chrome-192x192.png',
  'favicon/android-chrome-512x512.png',
  'favicon/mstile-150x150.png',
  'favicon/favicon.ico',
];

for (const f of faviconFiles) {
  assert(
    fileExists(join(PUBLIC, 'images', f)),
    `Favicon file exists: ${f}`
  );
}

assert(
  fileSize(join(PUBLIC, 'images/favicon/android-chrome-512x512.png')) > 50000,
  'Favicon 512x512 is reasonable quality (>50KB)'
);

// ============================================================
// Summary
// ============================================================
console.log('\n============================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  - ${f}`));
}
console.log('============================================\n');

process.exit(failed > 0 ? 1 : 0);
