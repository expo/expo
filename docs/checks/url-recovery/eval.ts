/* oxlint-disable no-console */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { parseArgs } from 'node:util';

import { parseRedirects } from '../internal-links/redirects.ts';
import { evaluateCurrentAsync, type Page } from './current.ts';
import { startGatewayAsync } from './gateway.ts';
import { renderReport, summarize, type EvalCase, type EvalResult } from './report.ts';

const { values } = parseArgs({
  options: {
    inventory: { type: 'string' },
    cases: { type: 'string', default: 'checks/url-recovery/cases.jsonl' },
    output: {
      type: 'string',
      default: `.cache/url-recovery-eval/${new Date().toISOString().replaceAll(':', '-')}`,
    },
    'account-id': { type: 'string', default: process.env.CLOUDFLARE_ACCOUNT_ID },
    limit: { type: 'string' },
    split: { type: 'string' },
    repeat: { type: 'string', default: '1' },
    'input-price': { type: 'string' },
    'output-price': { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
});
if (values.help) {
  console.log(`Usage: pnpm eval:url-recovery --inventory <file-or-url> --account-id <Cloudflare account>

Runs the unchanged production classifier through a live Cloudflare AI binding.
Each case starts without cached decisions or backoff; gateway caching is disabled.
Asset verification uses the inventory, so timings measure classification, not deployed HTTP latency.
Uses Wrangler login or CLOUDFLARE_API_TOKEN. Inference is billable.

  --cases <jsonl>         Dataset (default: checks/url-recovery/cases.jsonl)
  --output <directory>    New result directory (default: .cache/url-recovery-eval/<timestamp>)
  --split dev|test        Select a dataset split
  --limit <number>        Evaluate the first N selected cases
  --repeat <number>       Repeat each case, without cache (default: 1)
  --input-price <USD>     Estimated price per million input tokens
  --output-price <USD>    Estimated price per million output tokens (both prices required)

Writes inventory.json, cases.jsonl, results.jsonl (including request/response traces),
summary.json and report.html. All scores are provisional until labels are reviewed.`);
  process.exit(0);
}

if (!values.inventory || !values['account-id']) {
  throw new Error('--inventory and --account-id are required');
}
if (!/^[\da-f]{32}$/.test(values['account-id'])) {
  throw new Error('Invalid Cloudflare account ID');
}
if (values.split && !['dev', 'test'].includes(values.split)) {
  throw new Error('--split must be dev or test');
}
const repeat = Number(values.repeat);
const limit = values.limit === undefined ? Infinity : Number(values.limit);
if (
  !Number.isInteger(repeat) ||
  repeat < 1 ||
  (limit !== Infinity && (!Number.isInteger(limit) || limit < 1))
) {
  throw new Error('--repeat and --limit must be positive integers');
}
let prices: { input: number; output: number } | null = null;
if (values['input-price'] !== undefined || values['output-price'] !== undefined) {
  prices = { input: Number(values['input-price']), output: Number(values['output-price']) };
  if (!Object.values(prices).every(price => Number.isFinite(price) && price >= 0)) {
    throw new Error('Provide both nonnegative --input-price and --output-price values');
  }
}
const inventoryText = values.inventory.startsWith('https://')
  ? await fetch(values.inventory, { signal: AbortSignal.timeout(15000) }).then(async response => {
      if (!response.ok) {
        throw new Error(`Inventory request returned ${response.status}`);
      }
      return await response.text();
    })
  : await readFile(values.inventory, 'utf8');
const pages = JSON.parse(inventoryText) as Page[];
if (
  !Array.isArray(pages) ||
  !pages.length ||
  pages.some(
    page =>
      !page ||
      typeof page.path !== 'string' ||
      !/^\/(?:[\w.-]+\/)*$/.test(page.path) ||
      typeof page.title !== 'string' ||
      typeof page.description !== 'string'
  )
) {
  throw new Error('Invalid page inventory');
}
const inventoryPaths = new Set(pages.map(page => page.path));
const redirectsText = await readFile(new URL('../../public/_redirects', import.meta.url), 'utf8');
const redirects = parseRedirects(redirectsText);
const casesText = await readFile(values.cases, 'utf8');
const cases = casesText
  .trim()
  .split('\n')
  .map(line => JSON.parse(line) as EvalCase);
const ids = new Set<string>();
const paths = new Set<string>();
for (const testCase of cases) {
  if (
    !testCase ||
    typeof testCase.id !== 'string' ||
    !testCase.id ||
    ids.has(testCase.id) ||
    typeof testCase.path !== 'string' ||
    !/^\/(?:[\w.-]+\/)+$/.test(testCase.path) ||
    paths.has(testCase.path) ||
    inventoryPaths.has(testCase.path) ||
    redirects.literal.has(testCase.path.replace(/\/$/, '')) ||
    redirects.splats.some(rule => rule.regex?.test(testCase.path)) ||
    !inventoryPaths.has(testCase.sourcePath) ||
    !Array.isArray(testCase.expectedPaths) ||
    testCase.expectedPaths.some(target => !inventoryPaths.has(target)) ||
    typeof testCase.category !== 'string' ||
    !['dev', 'test'].includes(testCase.split) ||
    typeof testCase.reviewed !== 'boolean'
  ) {
    throw new Error(`Invalid, duplicate, or stale case: ${testCase?.id ?? 'unknown'}`);
  }
  ids.add(testCase.id);
  paths.add(testCase.path);
}
const selected = cases
  .filter(testCase => !values.split || testCase.split === values.split)
  .slice(0, limit);
if (!selected.length) {
  throw new Error('No cases selected');
}
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const metadata: Record<string, unknown> = {
  strategy: 'current',
  startedAt: new Date().toISOString(),
  gitRevision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
  classifierHash: hash(
    await readFile(new URL('../../worker/url-recovery.ts', import.meta.url), 'utf8')
  ),
  datasetHash: hash(casesText),
  inventoryHash: hash(inventoryText),
  redirectsHash: hash(redirectsText),
  inventorySource: values.inventory,
  inventoryPages: pages.length,
  accountId: values['account-id'],
  gateway: 'default',
  repeat,
  concurrency: 1,
  costKind: prices ? 'estimated' : 'unavailable',
  prices,
  cache: 'Fresh classifier module per case; AI Gateway skipCache enabled',
  timing:
    'Classifier plus local Wrangler proxy and live inference; inventory-backed asset fixture; excludes startup and reporting',
  labels: 'Generated proposals. Unreviewed labels are not ground truth.',
};
const output = path.resolve(values.output);
await mkdir(path.dirname(output), { recursive: true });
await mkdir(output);
await writeFile(path.join(output, 'inventory.json'), inventoryText);
await writeFile(
  path.join(output, 'cases.jsonl'),
  selected.map(testCase => JSON.stringify(testCase)).join('\n') + '\n'
);
const results: EvalResult[] = [];
const saveReportAsync = async () => {
  await writeFile(
    path.join(output, 'summary.json'),
    JSON.stringify({ metadata, summary: summarize(results) }, null, 2) + '\n'
  );
  await writeFile(path.join(output, 'report.html'), renderReport({ results, metadata }));
};
console.log(
  `Evaluating ${selected.length} draft cases × ${repeat} run(s) against ${pages.length} pages. Output: ${output}`
);
let gateway: Awaited<ReturnType<typeof startGatewayAsync>> | undefined;
let interrupted = false;
const startup = new AbortController();
const stop = (signal: 'SIGINT' | 'SIGTERM') => {
  if (interrupted) {
    return;
  }
  interrupted = true;
  metadata.interrupted = signal;
  process.exitCode = signal === 'SIGINT' ? 130 : 143;
  startup.abort();
  console.log(`Received ${signal}; finishing the current case and saving partial results.`);
};
const onInterrupt = () => {
  stop('SIGINT');
};
const onTerminate = () => {
  stop('SIGTERM');
};
process.on('SIGINT', onInterrupt);
process.on('SIGTERM', onTerminate);
try {
  gateway = await startGatewayAsync(values['account-id'], startup.signal);
  runs: for (let run = 0; run < repeat; run++) {
    for (const testCase of selected) {
      if (interrupted) {
        break runs;
      }
      const result = await evaluateCurrentAsync(testCase, pages, gateway.url, prices);
      results.push(result);
      await appendFile(
        path.join(output, 'results.jsonl'),
        JSON.stringify({ ...result, run: run + 1 }) + '\n'
      );
      console.log(
        `[${results.length}/${selected.length * repeat}] ${testCase.path} => ${result.error ?? result.predictedPath ?? 'no match'} (${Math.round(result.durationMs)} ms)`
      );
      if (results.length % 25 === 0) {
        await saveReportAsync();
      }
      if (!interrupted) {
        await setTimeout(650);
      }
    }
  }
} catch (error) {
  if (!interrupted) {
    throw error;
  }
} finally {
  metadata.finishedAt = new Date().toISOString();
  try {
    await saveReportAsync();
  } finally {
    try {
      await gateway?.dispose();
    } finally {
      process.off('SIGINT', onInterrupt);
      process.off('SIGTERM', onTerminate);
    }
  }
}
console.log(JSON.stringify(summarize(results), null, 2));
console.log(`Review: ${path.join(output, 'report.html')}`);
