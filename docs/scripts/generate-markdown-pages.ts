/**
 * Generates per-page markdown files in out/ for Accept: text/markdown content negotiation.
 *
 * Converts the rendered HTML from `next build` to markdown with cheerio + turndown.
 * This automatically handles all custom MDX components (APISection,
 * ConfigPluginProperties, etc.) since they're already rendered in the HTML.
 *
 * Uses worker_threads to parallelize across all available CPUs.
 *
 * Run after `next build` so the out/ directory exists with all published HTML pages.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';

import { findHtmlPages } from './generate-markdown-pages-utils.ts';

const OUT_DIR = path.join(process.cwd(), 'out');

if (!fs.existsSync(OUT_DIR)) {
  console.error('out/ directory not found. Run `next build` first.');
  process.exit(1);
}

const htmlPages = findHtmlPages(OUT_DIR);
const workerFile = path.join(import.meta.dirname, 'generate-markdown-pages-worker.ts');
const numWorkers = Math.min(
  Math.max(1, (os.availableParallelism?.() ?? os.cpus().length) - 1),
  htmlPages.length
);

let generated = 0;
let skipped = 0;
let warned = 0;
let nextIndex = 0;
let activeWorkers = numWorkers;

console.warn(` \x1b[2m⧖\x1b[0m Converting ${htmlPages.length} pages with ${numWorkers} workers…`);

function sendNext(worker: Worker) {
  if (nextIndex < htmlPages.length) {
    worker.postMessage({ type: 'task', htmlPath: htmlPages[nextIndex++] });
  } else {
    worker.postMessage({ type: 'done' });
  }
}

const workers: Worker[] = [];
const done = new Promise<void>((resolve, reject) => {
  for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker(workerFile, {
      execArgv: ['--experimental-strip-types'],
      workerData: { outDir: OUT_DIR },
    });

    worker.on('message', (msg: { type: string; status: string; warnings?: string[] }) => {
      if (msg.type === 'result') {
        if (msg.status === 'generated') {
          generated++;
        } else if (msg.status === 'skipped') {
          skipped++;
        }

        if (msg.warnings) {
          for (const w of msg.warnings) {
            console.warn(`  \x1b[33m⚠\x1b[0m ${w}`);
          }
          warned++;
        }

        sendNext(worker);
      }
    });

    worker.on('error', err => {
      for (const w of workers) {
        void w.terminate();
      }
      reject(err);
    });

    worker.on('exit', () => {
      activeWorkers--;
      if (activeWorkers === 0) {
        resolve();
      }
    });

    workers.push(worker);
    sendNext(worker);
  }
});

try {
  await done;
} catch (err) {
  console.error(`\x1b[31m✗\x1b[0m ${(err as Error).message}`);
  process.exit(1);
}

const parts = [`${skipped} skipped`];
if (warned) {
  parts.push(`${warned} with warnings`);
}

console.warn(
  ` \x1b[1m\x1b[32m✓\x1b[0m Generated ${generated} markdown pages (${parts.join(', ')})`
);
