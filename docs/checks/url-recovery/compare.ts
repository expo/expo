import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { summarize, type EvalCase, type EvalResult } from './report.ts';

export type SavedRun = {
  directory: string;
  metadata: Record<string, unknown>;
  cases: EvalCase[];
  results: (EvalResult & { run?: number })[];
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function jsonLines(text: string, filename: string) {
  return text
    .trim()
    .split('\n')
    .map((line, index): unknown => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`Invalid JSON in ${filename}, line ${index + 1}`);
      }
    });
}

export async function loadRunAsync(directory: string): Promise<SavedRun> {
  const resolved = path.resolve(directory);
  const [summaryText, casesText, resultsText, inventoryText] = await Promise.all(
    ['summary.json', 'cases.jsonl', 'results.jsonl', 'inventory.json'].map(filename =>
      readFile(path.join(resolved, filename), 'utf8')
    )
  );
  const summary: unknown = JSON.parse(summaryText);
  if (!record(summary) || !record(summary.metadata)) {
    throw new Error(`Missing run metadata in ${resolved}`);
  }
  const inventoryHash = createHash('sha256').update(inventoryText).digest('hex');
  if (summary.metadata.inventoryHash !== inventoryHash) {
    throw new Error(`Saved inventory does not match its recorded hash in ${resolved}`);
  }
  const run = {
    directory: resolved,
    metadata: summary.metadata,
    cases: jsonLines(casesText, 'cases.jsonl') as EvalCase[],
    results: jsonLines(resultsText, 'results.jsonl') as SavedRun['results'],
  };
  validateRun(run);
  return run;
}

function caseFields(value: EvalCase): EvalCase {
  return {
    id: value.id,
    path: value.path,
    expectedPaths: [...value.expectedPaths].sort(),
    category: value.category,
    sourcePath: value.sourcePath,
    split: value.split,
    reviewed: value.reviewed,
  };
}

function validCase(value: unknown): value is EvalCase {
  return (
    record(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.path === 'string' &&
    Array.isArray(value.expectedPaths) &&
    value.expectedPaths.every(item => typeof item === 'string') &&
    typeof value.category === 'string' &&
    typeof value.sourcePath === 'string' &&
    (value.split === 'dev' || value.split === 'test') &&
    typeof value.reviewed === 'boolean'
  );
}

function nonnegative(value: unknown, integer = false) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    (!integer || Number.isInteger(value))
  );
}

function validateRun(run: SavedRun) {
  for (const field of ['datasetHash', 'inventoryHash']) {
    if (typeof run.metadata[field] !== 'string' || !run.metadata[field]) {
      throw new Error(`Missing ${field} in ${run.directory}`);
    }
  }
  if (run.metadata.repeat !== undefined && run.metadata.repeat !== 1) {
    throw new Error('Paired comparison requires --repeat 1; repeated runs are not supported');
  }
  if (run.metadata.interrupted || !run.cases.length || !run.results.length) {
    throw new Error(`Cannot compare an interrupted or empty run: ${run.directory}`);
  }
  const cases = new Map<string, EvalCase>();
  for (const testCase of run.cases) {
    if (!validCase(testCase) || cases.has(testCase.id)) {
      throw new Error(`Invalid or duplicate case in ${run.directory}`);
    }
    cases.set(testCase.id, testCase);
  }
  const ids = new Set<string>();
  for (const result of run.results) {
    if (
      !validCase(result) ||
      ids.has(result.id) ||
      (result.run !== undefined && result.run !== 1)
    ) {
      throw new Error(
        `Invalid or repeated result in ${run.directory}; one result per case is required`
      );
    }
    const expected = cases.get(result.id);
    if (!expected || JSON.stringify(caseFields(result)) !== JSON.stringify(caseFields(expected))) {
      throw new Error(`Result labels do not match saved case ${result.id} in ${run.directory}`);
    }
    if (
      !['ok', 'error'].includes(result.status) ||
      (result.predictedPath !== null && typeof result.predictedPath !== 'string') ||
      !nonnegative(result.durationMs) ||
      !nonnegative(result.calls, true) ||
      (result.inputTokens !== null && !nonnegative(result.inputTokens, true)) ||
      (result.outputTokens !== null && !nonnegative(result.outputTokens, true)) ||
      (result.cost !== null && !nonnegative(result.cost)) ||
      (result.model !== null && typeof result.model !== 'string') ||
      (result.error !== undefined && typeof result.error !== 'string')
    ) {
      throw new Error(`Invalid metrics or outcome for ${result.id} in ${run.directory}`);
    }
    ids.add(result.id);
  }
  if (ids.size !== cases.size) {
    throw new Error(
      `Incomplete run in ${run.directory}: ${ids.size} results for ${cases.size} cases`
    );
  }
}

function correct(result: EvalResult) {
  return (
    result.status === 'ok' &&
    (result.predictedPath === null
      ? !result.expectedPaths.length
      : result.expectedPaths.includes(result.predictedPath))
  );
}

function decision(result: EvalResult) {
  return {
    predictedPath: result.predictedPath,
    status: result.status,
    correct: correct(result),
    durationMs: result.durationMs,
    calls: result.calls,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    cost: result.cost,
    model: result.model,
    ...(result.error ? { error: result.error } : {}),
  };
}

function difference(before: number | null, after: number | null) {
  return before === null || after === null ? null : after - before;
}

export function compareRuns(baseline: SavedRun, candidate: SavedRun) {
  validateRun(baseline);
  validateRun(candidate);
  for (const field of ['datasetHash', 'inventoryHash']) {
    if (baseline.metadata[field] !== candidate.metadata[field]) {
      throw new Error(`Runs have different ${field}; use the same dataset and inventory`);
    }
  }
  const candidates = new Map(candidate.results.map(result => [result.id, result]));
  if (baseline.results.length !== candidate.results.length) {
    throw new Error('Runs must contain exactly the same case IDs');
  }
  const pairs = baseline.results.map(previous => {
    const next = candidates.get(previous.id);
    if (!next) {
      throw new Error(`Candidate run is missing case ${previous.id}`);
    }
    if (JSON.stringify(caseFields(previous)) !== JSON.stringify(caseFields(next))) {
      throw new Error(`Runs have different labels or case details for ${previous.id}`);
    }
    const before = decision(previous);
    const after = decision(next);
    const outcome: 'improved' | 'regressed' | 'unchanged' =
      before.correct === after.correct ? 'unchanged' : after.correct ? 'improved' : 'regressed';
    return {
      ...caseFields(previous),
      baseline: before,
      candidate: after,
      outcome,
      changed: before.predictedPath !== after.predictedPath || before.status !== after.status,
      latencyDeltaMs: after.durationMs - before.durationMs,
      inputTokensDelta: difference(before.inputTokens, after.inputTokens),
      outputTokensDelta: difference(before.outputTokens, after.outputTokens),
    };
  });
  const baselineSummary = summarize(baseline.results);
  const candidateSummary = summarize(candidate.results);
  const deltaFields = [
    'accuracy',
    'redirectPrecision',
    'recoveryRecall',
    'falseRedirectRate',
    'errors',
    'p50Ms',
    'p95Ms',
    'totalCalls',
    'inputTokens',
    'outputTokens',
    'cost',
  ] as const;
  return {
    baseline: {
      directory: baseline.directory,
      metadata: baseline.metadata,
      summary: baselineSummary,
    },
    candidate: {
      directory: candidate.directory,
      metadata: candidate.metadata,
      summary: candidateSummary,
    },
    paired: {
      total: pairs.length,
      improved: pairs.filter(pair => pair.outcome === 'improved').length,
      regressed: pairs.filter(pair => pair.outcome === 'regressed').length,
      unchanged: pairs.filter(pair => pair.outcome === 'unchanged').length,
      unchangedCorrect: pairs.filter(pair => pair.outcome === 'unchanged' && pair.candidate.correct)
        .length,
      unchangedIncorrect: pairs.filter(
        pair => pair.outcome === 'unchanged' && !pair.candidate.correct
      ).length,
      changed: pairs.filter(pair => pair.changed).length,
      errorsFixed: pairs.filter(
        pair => pair.baseline.status === 'error' && pair.candidate.status === 'ok'
      ).length,
      newErrors: pairs.filter(
        pair => pair.baseline.status === 'ok' && pair.candidate.status === 'error'
      ).length,
    },
    deltas: Object.fromEntries(
      deltaFields.map(field => [field, difference(baselineSummary[field], candidateSummary[field])])
    ),
    pairs,
  };
}

type Comparison = ReturnType<typeof compareRuns>;

function escapeHtml(value: string) {
  return value.replace(
    /["&'<>]/g,
    character =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]!
  );
}

function pathLink(value: string) {
  const label = escapeHtml(value);
  if (value.startsWith('/') && !value.startsWith('//')) {
    try {
      const url = new URL(value, 'https://docs.expo.dev');
      if (url.origin === 'https://docs.expo.dev') {
        return `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      }
    } catch {
      return label;
    }
  }
  return label;
}

function format(value: number | null, kind: 'count' | 'rate' | 'ms' | 'cost', delta = false) {
  if (value === null) {
    return kind === 'count' || kind === 'cost' ? 'Unknown' : 'N/A';
  }
  const prefix = delta && value > 0 ? '+' : '';
  if (kind === 'rate') {
    return `${prefix}${(value * 100).toFixed(1)}${delta ? ' pp' : '%'}`;
  }
  if (kind === 'cost') {
    return `${prefix}$${value.toFixed(6)}`;
  }
  return `${prefix}${Math.round(value).toLocaleString('en-US')}${kind === 'ms' ? ' ms' : ''}`;
}

function renderDecision(value: Comparison['pairs'][number]['baseline']) {
  const label =
    value.status === 'error' ? 'Error' : value.correct ? 'Matches label' : 'Label mismatch';
  return `${value.predictedPath === null ? 'No redirect' : pathLink(value.predictedPath)}<small>${label}</small>${value.error ? `<details><summary>Error details</summary><pre>${escapeHtml(value.error)}</pre></details>` : ''}`;
}

export function renderComparisonReport(comparison: Comparison) {
  const { baseline, candidate, paired } = comparison;
  const metricRows: [string, keyof typeof baseline.summary, 'count' | 'rate' | 'ms' | 'cost'][] = [
    ['Correct cases', 'correct', 'count'],
    ['Label agreement', 'accuracy', 'rate'],
    ['Redirect precision', 'redirectPrecision', 'rate'],
    ['Recovery recall', 'recoveryRecall', 'rate'],
    ['False redirect rate', 'falseRedirectRate', 'rate'],
    ['False redirects', 'falseRedirects', 'count'],
    ['Errors', 'errors', 'count'],
    ['Latency p50', 'p50Ms', 'ms'],
    ['Latency p95', 'p95Ms', 'ms'],
    ['API calls', 'totalCalls', 'count'],
    ['Input tokens', 'inputTokens', 'count'],
    ['Output tokens', 'outputTokens', 'count'],
    ['Estimated cost (USD)', 'cost', 'cost'],
  ];
  const metrics = metricRows
    .map(([label, key, kind]) => {
      const before = baseline.summary[key] as number | null;
      const after = candidate.summary[key] as number | null;
      return `<tr><th>${label}</th><td>${format(before, kind)}</td><td>${format(after, kind)}</td><td>${format(difference(before, after), kind, true)}</td></tr>`;
    })
    .join('');
  const rank = { regressed: 0, improved: 1, unchanged: 2 };
  const rows = [...comparison.pairs]
    .sort((a, b) => rank[a.outcome] - rank[b.outcome])
    .map(pair => {
      const search = [
        pair.id,
        pair.path,
        pair.sourcePath,
        pair.category,
        ...pair.expectedPaths,
        pair.baseline.predictedPath ?? '',
        pair.candidate.predictedPath ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return `<tr data-changed="${pair.changed}" data-outcome="${pair.outcome}" data-split="${escapeHtml(pair.split)}" data-search="${escapeHtml(search)}"${pair.changed ? '' : ' hidden'}>
<td><strong>${escapeHtml(pair.id)}</strong><div>${pathLink(pair.path)}</div><small>Source: ${pathLink(pair.sourcePath)}</small><small>${escapeHtml(pair.category)} · ${pair.split} · ${pair.reviewed ? 'reviewed' : 'unreviewed'}</small></td>
<td>${pair.expectedPaths.length ? pair.expectedPaths.map(pathLink).join('<br>') : 'No redirect'}</td>
<td>${renderDecision(pair.baseline)}</td><td>${renderDecision(pair.candidate)}</td>
<td class="${pair.outcome}">${pair.outcome}<small>${pair.changed ? 'Decision changed' : 'Same decision'}</small></td>
<td>${format(pair.baseline.durationMs, 'ms')} → ${format(pair.candidate.durationMs, 'ms')}<small>${format(pair.latencyDeltaMs, 'ms', true)}</small></td>
<td>${format(pair.baseline.inputTokens, 'count')} → ${format(pair.candidate.inputTokens, 'count')}<small>Input delta: ${format(pair.inputTokensDelta, 'count', true)}</small><small>Output: ${format(pair.baseline.outputTokens, 'count')} → ${format(pair.candidate.outputTokens, 'count')}</small></td></tr>`;
    })
    .join('');
  const unreviewed = baseline.summary.unreviewed;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>URL recovery strategy comparison</title><style>
:root{color-scheme:light dark;font:15px/1.5 system-ui,sans-serif;background:#f5f6f8;color:#17202e}*{box-sizing:border-box}body{max-width:1700px;margin:auto;padding:32px}h1{font-size:30px;margin:0}h2{font-size:21px}p{max-width:1100px}a{color:#075cb8;overflow-wrap:anywhere}small{display:block;color:#596574;margin-top:5px}.notice{background:#fff7dd;border:1px solid #c58211;border-radius:8px;padding:16px}.counts{display:flex;gap:14px;flex-wrap:wrap;margin:20px 0}.counts div{border:1px solid #cbd3df;border-radius:8px;background:white;padding:14px;min-width:160px}.counts strong{display:block;font-size:26px}.scroll{overflow:auto;border:1px solid #cbd3df;border-radius:8px;background:white}table{border-collapse:collapse;width:100%;text-align:left}th,td{padding:12px;border-bottom:1px solid #dfe4eb;vertical-align:top}thead{background:#eaf0f6}#cases td{min-width:170px}#cases td:first-child{min-width:240px}.improved{color:#14703b}.regressed{color:#ac2424}.filters{display:flex;gap:14px;align-items:end;flex-wrap:wrap;margin:16px 0}input,select{font:inherit;padding:7px;border:1px solid #9aa6b6;border-radius:5px;background:white;color:inherit}input[type=search]{min-width:280px}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-width:650px}summary{cursor:pointer}[hidden]{display:none!important}details{margin-top:8px}
@media(prefers-color-scheme:dark){:root{background:#121820;color:#e4e9f0}a{color:#85baff}small{color:#aab6c6}.notice{background:#332a12}.counts div,.scroll,input,select{background:#1d2632;border-color:#465164}thead{background:#293648}th,td{border-color:#3a4759}.improved{color:#72dba0}.regressed{color:#ffaaaa}}@media(max-width:700px){body{padding:16px}}
</style></head><body><h1>URL recovery strategy comparison</h1>
<p>Baseline: <strong>${escapeHtml(String(baseline.metadata.strategy ?? 'baseline'))}</strong> → Candidate: <strong>${escapeHtml(String(candidate.metadata.strategy ?? 'candidate'))}</strong>. ${paired.total} paired cases; one run per case.</p>
${unreviewed ? `<div class="notice"><strong>Provisional comparison: ${unreviewed} of ${paired.total} labels are unreviewed.</strong><p>Improvement means closer agreement with the proposed labels, not verified production accuracy. Review ambiguous destinations before choosing a strategy.</p></div>` : '<p>All case labels are marked reviewed.</p>'}
<div class="counts"><div>Improved<strong>${paired.improved}</strong></div><div>Regressed<strong>${paired.regressed}</strong></div><div>Same correctness<strong>${paired.unchanged}</strong></div><div>Changed decisions<strong>${paired.changed}</strong></div></div>
<p>“Same correctness” includes ${paired.unchangedCorrect} cases correct in both runs and ${paired.unchangedIncorrect} incorrect in both. Changed destinations are shown even when correctness stays the same. Errors fixed: ${paired.errorsFixed}; new errors: ${paired.newErrors}.</p>
<h2>Overall metrics</h2><div class="scroll"><table><thead><tr><th>Metric</th><th>Baseline</th><th>Candidate</th><th>Candidate − baseline</th></tr></thead><tbody>${metrics}</tbody></table></div>
<p>Precision measures correct redirects / proposed redirects. Recall measures recovered positives / all positives. False redirect rate measures redirects on negative cases / all negatives. Errors are incorrect, including errors on negative cases. Latency includes errors; percentiles use linear interpolation. Missing usage stays unknown. Percentage deltas are percentage points (pp).</p>
<p>Development: ${baseline.summary.splits.dev.total} cases, ${format(baseline.summary.splits.dev.accuracy, 'rate')} → ${format(candidate.summary.splits.dev.accuracy, 'rate')} agreement. Test: ${baseline.summary.splits.test.total} cases, ${format(baseline.summary.splits.test.accuracy, 'rate')} → ${format(candidate.summary.splits.test.accuracy, 'rate')} agreement.</p>
<details><summary>Run provenance and timing</summary><pre>${escapeHtml(JSON.stringify({ baseline: { directory: baseline.directory, metadata: baseline.metadata }, candidate: { directory: candidate.directory, metadata: candidate.metadata } }, null, 2))}</pre></details>
<h2>Paired cases</h2><div class="filters"><label>Search<br><input id="search" type="search" placeholder="Input, source, expected or actual path"></label><label>Outcome<br><select id="outcome"><option value="">All outcomes</option><option value="regressed">Regressed</option><option value="improved">Improved</option><option value="unchanged">Same correctness</option></select></label><label>Split<br><select id="split"><option value="">Both splits</option><option value="dev">Development</option><option value="test">Test</option></select></label><label><input id="changed" type="checkbox" checked> Changed decisions only</label></div>
<p id="visible-count" aria-live="polite">Showing ${paired.changed} of ${paired.total} cases. Summary metrics cover all paired cases.</p><div class="scroll"><table id="cases"><thead><tr><th>Input and source</th><th>Expected</th><th>Baseline</th><th>Candidate</th><th>Outcome</th><th>Latency</th><th>Tokens</th></tr></thead><tbody>${rows}</tbody></table></div>
<script>
const rows = Array.from(document.querySelectorAll('#cases tbody tr'));
const controls = Object.fromEntries(['search','outcome','split','changed'].map(id => [id,document.getElementById(id)]));
function update() {
  const search = controls.search.value.trim().toLowerCase();
  let visible = 0;
  for (const row of rows) {
    row.hidden = (controls.changed.checked && row.dataset.changed !== 'true') || !row.dataset.search.includes(search) || ['outcome','split'].some(key => controls[key].value && row.dataset[key] !== controls[key].value);
    if (!row.hidden) visible++;
  }
  document.getElementById('visible-count').textContent = 'Showing ' + visible + ' of ' + rows.length + ' cases. Summary metrics cover all paired cases.';
}
Object.values(controls).forEach(control => control.addEventListener('input',update));
</script></body></html>`;
}

async function mainAsync() {
  const { values } = parseArgs({
    options: {
      baseline: { type: 'string' },
      candidate: { type: 'string' },
      output: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    process.stdout.write(
      'Usage: pnpm eval:url-recovery:compare --baseline DIR --candidate DIR --output NEW_DIR\n\nCompares complete, single-run evaluations with the same dataset, inventory and case IDs.\nWrites summary.json and a standalone report.html. No API calls are made.\n'
    );
    return;
  }
  if (!values.baseline || !values.candidate || !values.output) {
    throw new Error('--baseline, --candidate and --output are required');
  }
  const [baseline, candidate] = await Promise.all([
    loadRunAsync(values.baseline),
    loadRunAsync(values.candidate),
  ]);
  const comparison = compareRuns(baseline, candidate);
  const output = path.resolve(values.output);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output);
  await Promise.all([
    writeFile(path.join(output, 'summary.json'), JSON.stringify(comparison, null, 2) + '\n'),
    writeFile(path.join(output, 'report.html'), renderComparisonReport(comparison)),
  ]);
  process.stdout.write(
    `Compared ${comparison.paired.total} cases: ${comparison.paired.improved} improved, ${comparison.paired.regressed} regressed. Report: ${path.join(output, 'report.html')}\n`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await mainAsync().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
