import { spawn, type ChildProcess } from 'child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';

const PORT = 8788;
const BASE_URL = `http://localhost:${PORT}`;

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

async function cleanup(): Promise<void> {
  if (wranglerProcess) {
    wranglerProcess.kill();
    wranglerProcess = null;
  }
  if (existsSync('out')) {
    rmSync('out', { recursive: true, force: true });
  }
}

function validateRoutesJson(): void {
  console.log('\n--- Validating _routes.json ---');

  const routesPath = 'public/_routes.json';
  if (!existsSync(routesPath)) {
    throw new Error('_routes.json does not exist');
  }
  console.log('✓ _routes.json exists');

  const content = readFileSync(routesPath, 'utf8');
  const routes = JSON.parse(content);
  console.log('✓ _routes.json is valid JSON');

  if (routes.version !== 1) {
    throw new Error('_routes.json version must be 1');
  }
  if (!Array.isArray(routes.include)) {
    throw new Error('_routes.json include must be an array');
  }
  if (!Array.isArray(routes.exclude)) {
    throw new Error('_routes.json exclude must be an array');
  }
  console.log('✓ _routes.json has valid structure (version, include, exclude)');

  // Validate that static asset extensions are excluded from the worker
  const requiredExcludes = ['/*.md', '/*.txt', '/*.xml', '/*.json'];
  for (const pattern of requiredExcludes) {
    if (!routes.exclude.includes(pattern)) {
      throw new Error(`_routes.json missing required exclude pattern: ${pattern}`);
    }
  }
  console.log('✓ _routes.json excludes static asset patterns (md, txt, xml, json)');

  // Ensure total rules stay within Cloudflare's limit of 100
  const totalRules = routes.include.length + routes.exclude.length;
  if (totalRules > 100) {
    throw new Error(`_routes.json has ${totalRules} rules, exceeding Cloudflare's limit of 100`);
  }
  console.log(`✓ _routes.json has ${totalRules} rules (limit: 100)`);
}

function validateWorkerJs(): void {
  console.log('\n--- Validating _worker.js ---');

  const workerPath = 'public/_worker.js';
  if (!existsSync(workerPath)) {
    throw new Error('_worker.js does not exist');
  }
  console.log('✓ _worker.js exists');

  const content = readFileSync(workerPath, 'utf8');

  if (!content.includes('export default')) {
    throw new Error('_worker.js missing default export');
  }
  console.log('✓ _worker.js has default export');

  if (!content.includes('async fetch')) {
    throw new Error('_worker.js missing fetch handler');
  }
  console.log('✓ _worker.js has fetch handler');
}

function setupTestDirectory(): void {
  console.log('\n--- Setting up test directory ---');

  mkdirSync('out', { recursive: true });
  mkdirSync('out/test-page', { recursive: true });

  // Copy worker files
  const routesContent = readFileSync('public/_routes.json', 'utf8');
  const workerContent = readFileSync('public/_worker.js', 'utf8');

  writeFileSync('out/_routes.json', routesContent);
  writeFileSync('out/_worker.js', workerContent);
  writeFileSync('out/index.html', '<html><body><h1>Test Page</h1></body></html>');
  writeFileSync(
    'out/test-page/index.html',
    '<html><body><h1>Test Page HTML</h1></body></html>'
  );
  writeFileSync('out/test-page/index.md', '# Test Markdown Content\n\nThis is test content.');

  console.log('✓ Test directory created');
}

async function startWrangler(): Promise<void> {
  console.log('\n--- Starting wrangler pages dev ---');

  wranglerProcess = spawn('npx', ['wrangler', 'pages', 'dev', 'out', '--port', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Wait for "Ready on" message in stdout/stderr
  await waitForReady(wranglerProcess);

  console.log('✓ Wrangler started');
}

async function testHttpResponse(): Promise<void> {
  console.log('\n--- Testing HTTP responses ---');

  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw new Error(`Server not responding: HTTP ${response.status}`);
  }
  console.log(`✓ Server responds with HTTP ${response.status}`);
}

async function testDirectMarkdownAccess(): Promise<void> {
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

async function testMarkdownContentNegotiation(): Promise<void> {
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

  const mdContentType = mdResponse.headers.get('content-type') || '';
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

async function main(): Promise<void> {
  console.log('=== Testing Cloudflare Pages Worker and Routes ===');

  try {
    validateRoutesJson();
    validateWorkerJs();
    setupTestDirectory();
    await startWrangler();
    await testHttpResponse();
    await testDirectMarkdownAccess();
    await testMarkdownContentNegotiation();

    console.log('\n=== All tests passed! ===');
  } catch (error) {
    console.error('\n✗ Test failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
}

main();
