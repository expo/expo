/* oxlint-disable no-console */
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';

const PORT = 8788;
const BASE_URL = `http://localhost:${PORT}`;

const TEST_DIR = '.worker-test';

let wranglerProcess: ChildProcess | null = null;

function waitForReady(process: ChildProcess, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    let output = '';

    const timeout = setTimeout(() => {
      reject(new Error(`Wrangler did not start within ${timeoutMs / 1000}s\n${output}`));
    }, timeoutMs);

    const onData = (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;

      // Wrangler prints "Ready on http://localhost:PORT" when ready
      if (chunk.includes('Ready on')) {
        clearTimeout(timeout);
        process.stdout?.off('data', onData);
        process.stderr?.off('data', onData);
        resolve();
      }
    };

    process.stdout?.on('data', onData);
    process.stderr?.on('data', onData);

    process.on('exit', code => {
      clearTimeout(timeout);
      reject(new Error(`Wrangler exited with code ${code}\n${output}`));
    });
  });
}

async function cleanupAsync(): Promise<void> {
  if (wranglerProcess) {
    wranglerProcess.kill();
    wranglerProcess = null;
  }
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

function setupTestDirectory(): void {
  console.log('\n--- Setting up test directory ---');

  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.mkdirSync(`${TEST_DIR}/test-page`, { recursive: true });
  fs.mkdirSync(`${TEST_DIR}/html-only-page`, { recursive: true });
  fs.mkdirSync(`${TEST_DIR}/bare/upgrade/52-to-57`, { recursive: true });

  // Copy worker files, including the real _redirects: its /*.md wildcard
  // rewrite shapes how .md URLs resolve, so tests must run against it
  const routesContent = fs.readFileSync('public/_routes.json', 'utf8');
  const workerContent = fs.readFileSync('public/_worker.js', 'utf8');
  const redirectsContent = fs.readFileSync('public/_redirects', 'utf8');

  fs.writeFileSync(`${TEST_DIR}/_routes.json`, routesContent);
  fs.writeFileSync(`${TEST_DIR}/_worker.js`, workerContent);
  fs.writeFileSync(`${TEST_DIR}/_redirects`, redirectsContent);
  fs.writeFileSync(`${TEST_DIR}/index.html`, '<html><body><h1>Test Page</h1></body></html>');
  fs.writeFileSync(
    `${TEST_DIR}/test-page/index.html`,
    '<html><body><h1>Test Page HTML</h1></body></html>'
  );
  fs.writeFileSync(
    `${TEST_DIR}/test-page/index.md`,
    '# Test Markdown Content\n\nThis is test content.'
  );
  // Page with HTML but no .md — for fallback testing
  fs.writeFileSync(
    `${TEST_DIR}/html-only-page/index.html`,
    '<html><body><h1>HTML Only Page</h1></body></html>'
  );
  // Upgrade helper page with a default index.md and one version-pair file
  fs.writeFileSync(
    `${TEST_DIR}/bare/upgrade/index.html`,
    '<html><body><h1>Upgrade Helper HTML</h1></body></html>'
  );
  fs.writeFileSync(`${TEST_DIR}/bare/upgrade/index.md`, '# Default Upgrade Markdown');
  fs.writeFileSync(`${TEST_DIR}/bare/upgrade/52-to-57/index.md`, '# Upgrade Pair 52 To 57');

  console.log('✓ Test directory created');
}

async function startWranglerAsync(): Promise<void> {
  console.log('\n--- Starting wrangler pages dev ---');

  wranglerProcess = spawn('wrangler', ['pages', 'dev', TEST_DIR, '--port', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Wait for "Ready on" message in stdout/stderr
  await waitForReady(wranglerProcess);

  console.log('✓ Wrangler started');
}

async function testHttpResponseAsync(): Promise<void> {
  console.log('\n--- Testing HTTP responses ---');

  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw new Error(`Server not responding: HTTP ${response.status}`);
  }
  console.log(`✓ Server responds with HTTP ${response.status}`);
}

async function testDirectMarkdownAccessAsync(): Promise<void> {
  console.log('\n--- Testing direct .md file access (bypasses worker) ---');

  const response = await fetch(`${BASE_URL}/test-page/index.md`);

  if (!response.ok) {
    throw new Error(`Direct .md request failed: HTTP ${response.status}`);
  }

  const body = await response.text();

  if (!body.includes('Test Markdown Content')) {
    throw new Error('Direct .md request did not return markdown content');
  }
  console.log('✓ Direct .md file request serves content correctly');
}

async function testMarkdownContentNegotiationAsync(): Promise<void> {
  console.log('\n--- Testing markdown content negotiation ---');

  // Without Accept: text/markdown, should serve HTML
  const htmlResponse = await fetch(`${BASE_URL}/test-page`);
  const htmlBody = await htmlResponse.text();

  if (!htmlBody.includes('Test Page HTML')) {
    throw new Error('Expected HTML content for normal request, got: ' + htmlBody.slice(0, 200));
  }
  console.log('✓ Normal request serves HTML');

  // With Accept: text/markdown, should serve markdown
  const mdResponse = await fetch(`${BASE_URL}/test-page`, {
    headers: { Accept: 'text/markdown' },
  });

  const mdContentType = mdResponse.headers.get('content-type') ?? '';
  const mdBody = await mdResponse.text();

  if (!mdBody.includes('Test Markdown Content')) {
    throw new Error('Worker did not serve markdown content');
  }
  console.log('✓ Accept: text/markdown request serves markdown content');

  if (!mdContentType.includes('text/markdown')) {
    throw new Error(`Expected Content-Type text/markdown, got: ${mdContentType}`);
  }
  console.log('✓ Accept: text/markdown request returns correct Content-Type');
}

async function testMarkdownNotFoundAsync(): Promise<void> {
  console.log('\n--- Testing markdown 404 responses ---');

  // Page with HTML but no .md should 404 when markdown is requested
  const missingMd = await fetch(`${BASE_URL}/html-only-page`, {
    headers: { Accept: 'text/markdown' },
  });

  if (missingMd.status !== 404) {
    throw new Error(`Expected 404 for missing .md, got: HTTP ${missingMd.status}`);
  }
  console.log('✓ Missing .md file returns 404');

  // Nonexistent page should also 404
  const notFound = await fetch(`${BASE_URL}/nonexistent-page`, {
    headers: { Accept: 'text/markdown' },
  });

  if (notFound.status !== 404) {
    throw new Error(`Expected 404 for nonexistent page, got: HTTP ${notFound.status}`);
  }
  console.log('✓ Nonexistent page returns 404');
}

async function testUpgradePairNegotiationAsync(): Promise<void> {
  console.log('\n--- Testing upgrade helper version-pair negotiation ---');

  // Valid pair params should serve the pair-specific markdown
  const pairResponse = await fetch(`${BASE_URL}/bare/upgrade/?fromSdk=52&toSdk=57`, {
    headers: { Accept: 'text/markdown' },
  });
  const pairBody = await pairResponse.text();

  if (!pairBody.includes('Upgrade Pair 52 To 57')) {
    throw new Error(
      'Expected pair markdown for fromSdk=52&toSdk=57, got: ' + pairBody.slice(0, 200)
    );
  }
  console.log('✓ Valid version pair serves pair-specific markdown');

  // Missing pair file should fall back to the default index.md
  const missingPair = await fetch(`${BASE_URL}/bare/upgrade/?fromSdk=52&toSdk=99`, {
    headers: { Accept: 'text/markdown' },
  });
  const missingPairBody = await missingPair.text();

  if (!missingPairBody.includes('Default Upgrade Markdown')) {
    throw new Error('Expected fallback to default markdown for a missing pair');
  }
  console.log('✓ Missing pair file falls back to default markdown');

  // No query params should serve the default index.md
  const noQuery = await fetch(`${BASE_URL}/bare/upgrade/`, {
    headers: { Accept: 'text/markdown' },
  });
  const noQueryBody = await noQuery.text();

  if (!noQueryBody.includes('Default Upgrade Markdown')) {
    throw new Error('Expected default markdown when no version pair is selected');
  }
  console.log('✓ No version pair serves default markdown');

  // Path-traversal style params must be rejected, not resolved as paths
  const traversal = await fetch(
    `${BASE_URL}/bare/upgrade/?fromSdk=${encodeURIComponent('../secret')}&toSdk=57`,
    { headers: { Accept: 'text/markdown' } }
  );
  const traversalBody = await traversal.text();

  if (traversal.status >= 500) {
    throw new Error(`Server error for traversal params: HTTP ${traversal.status}`);
  }
  if (!traversalBody.includes('Default Upgrade Markdown')) {
    throw new Error('Expected traversal params to fall back to default markdown');
  }
  console.log('✓ Invalid version params fall back to default markdown');

  // The /<slug>.md convention resolves pair pages via the _redirects wildcard
  const slugUrl = await fetch(`${BASE_URL}/bare/upgrade/52-to-57.md`);
  const slugBody = await slugUrl.text();

  if (!slugUrl.ok || !slugBody.includes('Upgrade Pair 52 To 57')) {
    throw new Error('Expected /bare/upgrade/52-to-57.md to serve the pair page');
  }
  console.log('✓ Pair page resolves at the /<slug>.md convention');

  // Known limit: .md paths bypass the worker (excluded in _routes.json) and
  // _redirects cannot read query strings, so a pair query on the .md page
  // path serves the default markdown, whose top note points at pair URLs.
  const mdPathWithQuery = await fetch(`${BASE_URL}/bare/upgrade.md?fromSdk=52&toSdk=57`);
  const mdPathWithQueryBody = await mdPathWithQuery.text();

  if (!mdPathWithQuery.ok || !mdPathWithQueryBody.includes('Default Upgrade Markdown')) {
    throw new Error('Expected /bare/upgrade.md with a pair query to serve the default markdown');
  }
  console.log('✓ .md page path with pair query serves default markdown (documented limit)');

  // Appending .md to the page path without a query serves the default
  const mdPathPlain = await fetch(`${BASE_URL}/bare/upgrade.md`);
  const mdPathPlainBody = await mdPathPlain.text();

  if (!mdPathPlain.ok || !mdPathPlainBody.includes('Default Upgrade Markdown')) {
    throw new Error('Expected /bare/upgrade.md to serve the default markdown');
  }
  console.log('✓ .md page path without query serves default markdown');

  // Appending .md to the last query value (the copy-paste gesture) also works
  const mdSuffixParam = await fetch(`${BASE_URL}/bare/upgrade/?fromSdk=52&toSdk=57.md`);
  const mdSuffixParamBody = await mdSuffixParam.text();

  if (!mdSuffixParam.ok || !mdSuffixParamBody.includes('Upgrade Pair 52 To 57')) {
    throw new Error('Expected ?fromSdk=52&toSdk=57.md to serve the pair page');
  }
  console.log('✓ .md suffix on the toSdk value serves pair markdown');

  // The /<slug>.md convention on regular pages still works through the worker
  const regularSlug = await fetch(`${BASE_URL}/test-page.md`);
  const regularSlugBody = await regularSlug.text();

  if (!regularSlug.ok || !regularSlugBody.includes('Test Markdown Content')) {
    throw new Error('Expected /test-page.md to serve the page markdown');
  }
  console.log('✓ Regular /<slug>.md path serves markdown through the worker');

  // The canonical index.md file path serves directly (bypassing the worker)
  const direct = await fetch(`${BASE_URL}/bare/upgrade/52-to-57/index.md`);
  const directBody = await direct.text();

  if (!direct.ok || !directBody.includes('Upgrade Pair 52 To 57')) {
    throw new Error('Expected direct pair index.md request to serve the static file');
  }
  console.log('✓ Direct pair index.md request serves content correctly');
}

async function testDeletedPageRedirectsAsync(): Promise<void> {
  console.log('\n--- Testing deleted development build page redirects ---');

  const easRedirect = await fetch(`${BASE_URL}/develop/development-builds/create-a-build`, {
    redirect: 'manual',
  });
  const easLocation = easRedirect.headers.get('location') ?? '';

  if (
    easRedirect.status !== 301 ||
    !easLocation.includes('?buildenv=build-with-eas#create-a-development-build-with-eas')
  ) {
    throw new Error(
      `Expected 301 to the introduction EAS path, got: HTTP ${easRedirect.status} -> ${easLocation}`
    );
  }
  console.log('✓ create-a-build redirects to the introduction EAS path');

  const goRedirect = await fetch(`${BASE_URL}/develop/development-builds/expo-go-to-dev-build`, {
    redirect: 'manual',
  });
  const goLocation = goRedirect.headers.get('location') ?? '';

  if (goRedirect.status !== 301 || !goLocation.includes('#build-locally')) {
    throw new Error(
      `Expected 301 to the introduction build locally section, got: HTTP ${goRedirect.status} -> ${goLocation}`
    );
  }
  console.log('✓ expo-go-to-dev-build redirects to the introduction build locally section');

  const mdRedirect = await fetch(`${BASE_URL}/develop/development-builds/create-a-build.md`, {
    redirect: 'manual',
  });
  const mdLocation = mdRedirect.headers.get('location') ?? '';

  if (
    mdRedirect.status !== 301 ||
    !mdLocation.includes('/develop/development-builds/introduction/index.md')
  ) {
    throw new Error(
      `Expected 301 to the introduction index.md, got: HTTP ${mdRedirect.status} -> ${mdLocation}`
    );
  }
  console.log('✓ create-a-build.md redirects to the introduction markdown');
}

async function testHtmlNotFoundAsync(): Promise<void> {
  console.log('\n--- Testing HTML 404 responses ---');

  // Nonexistent page without Accept: text/markdown should not 500
  const response = await fetch(`${BASE_URL}/nonexistent-page`);

  if (response.status >= 500) {
    throw new Error(`Server error for nonexistent page: HTTP ${response.status}`);
  }
  console.log(`✓ Nonexistent HTML page returns HTTP ${response.status} (not a server error)`);
}

async function mainAsync(): Promise<void> {
  console.log('=== Testing Cloudflare Pages Worker and Routes ===');

  try {
    setupTestDirectory();
    await startWranglerAsync();
    await testHttpResponseAsync();
    await testDirectMarkdownAccessAsync();
    await testMarkdownContentNegotiationAsync();
    await testMarkdownNotFoundAsync();
    await testUpgradePairNegotiationAsync();
    await testDeletedPageRedirectsAsync();
    await testHtmlNotFoundAsync();

    console.log('\n=== All tests passed! ===');
  } catch (error) {
    console.error('\n✗ Test failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await cleanupAsync();
  }
}

void mainAsync();
