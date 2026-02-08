/* eslint-disable no-console */
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

  // Copy worker files
  const routesContent = fs.readFileSync('public/_routes.json', 'utf8');
  const workerContent = fs.readFileSync('public/_worker.js', 'utf8');

  fs.writeFileSync(`${TEST_DIR}/_routes.json`, routesContent);
  fs.writeFileSync(`${TEST_DIR}/_worker.js`, workerContent);
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
