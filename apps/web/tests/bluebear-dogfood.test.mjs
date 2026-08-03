import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const marketingRoot = join(webRoot, 'app', '(marketing)');

test('BlueBear tenant uses source-controlled product proof', () => {
  const page = readFileSync(join(marketingRoot, 'page.tsx'), 'utf8');
  const component = readFileSync(
    join(marketingRoot, '_components', 'bluebear-home.tsx'),
    'utf8',
  );

  assert.match(page, /tenant_slug\.toLowerCase\(\)\.startsWith\('bluebear'\)/);
  assert.match(component, /integration catalog/i);
  assert.match(component, /platform-overview\.webm/);
});

test('BlueBear dogfood assets and production guide are present', () => {
  const assetRoot = join(webRoot, 'public', 'images', 'bluebear');
  const expectedAssets = [
    'integrations-catalog.webp',
    'session-cost-overview.webp',
    'platform-overview.webm',
    'platform-overview-poster.webp',
  ];

  for (const asset of expectedAssets) {
    const path = join(assetRoot, asset);
    assert.equal(existsSync(path), true, `${asset} should exist`);
    assert.ok(
      statSync(path).size > 20_000,
      `${asset} should contain real media`,
    );
  }

  const article = join(
    marketingRoot,
    'articles',
    'governed-ai-agents-from-pilot-to-production',
    'page.tsx',
  );
  assert.equal(existsSync(article), true);
  assert.match(readFileSync(article, 'utf8'), /Start with the blast radius/);
});
