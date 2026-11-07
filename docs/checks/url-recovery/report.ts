export type EvalCase = {
  id: string;
  path: string;
  expectedPaths: string[];
  category: string;
  sourcePath: string;
  split: 'dev' | 'test';
  reviewed: boolean;
};

export type EvalResult = EvalCase & {
  predictedPath: string | null;
  status: 'ok' | 'error';
  durationMs: number;
  calls: number;
  inputTokens: number | null;
  outputTokens: number | null;
  cost: number | null;
  model: string | null;
  error?: string;
  trace?: unknown;
};

function isCorrect(result: EvalResult) {
  return (
    result.status === 'ok' &&
    (result.predictedPath === null
      ? result.expectedPaths.length === 0
      : result.expectedPaths.includes(result.predictedPath))
  );
}

function ratio(numerator: number, denominator: number) {
  return denominator ? numerator / denominator : null;
}

function percentile(sorted: number[], fraction: number) {
  if (!sorted.length) {
    return null;
  }
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower);
}

function totalUsage(results: EvalResult[], field: 'inputTokens' | 'outputTokens' | 'cost') {
  let total = 0;
  for (const result of results) {
    const value = result[field];
    if (value === null) {
      return null;
    }
    total += value;
  }
  return total;
}

function metrics(results: EvalResult[]) {
  const total = results.length;
  const correct = results.filter(isCorrect).length;
  const redirects = results.filter(result => result.predictedPath !== null).length;
  const correctRedirects = results.filter(
    result => result.predictedPath !== null && isCorrect(result)
  ).length;
  const positiveCases = results.filter(result => result.expectedPaths.length > 0).length;
  const negativeCases = total - positiveCases;
  const falseRedirects = results.filter(
    result => result.expectedPaths.length === 0 && result.predictedPath !== null
  ).length;
  const durations = results.map(result => result.durationMs).sort((a, b) => a - b);
  const reviewed = results.filter(result => result.reviewed).length;

  return {
    total,
    correct,
    accuracy: ratio(correct, total),
    redirects,
    correctRedirects,
    positiveCases,
    negativeCases,
    falseRedirects,
    correctNegatives: results.filter(
      result => result.expectedPaths.length === 0 && isCorrect(result)
    ).length,
    wrongDestinations: results.filter(
      result =>
        result.status === 'ok' &&
        result.expectedPaths.length > 0 &&
        result.predictedPath !== null &&
        !isCorrect(result)
    ).length,
    abstentions: results.filter(result => result.status === 'ok' && result.predictedPath === null)
      .length,
    errors: results.filter(result => result.status === 'error').length,
    redirectPrecision: ratio(correctRedirects, redirects),
    recoveryRecall: ratio(correctRedirects, positiveCases),
    falseRedirectRate: ratio(falseRedirects, negativeCases),
    p50Ms: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
    totalCalls: results.reduce((sum, result) => sum + result.calls, 0),
    inputTokens: totalUsage(results, 'inputTokens'),
    outputTokens: totalUsage(results, 'outputTokens'),
    cost: totalUsage(results, 'cost'),
    reviewed,
    unreviewed: total - reviewed,
  };
}

export function summarize(results: EvalResult[]) {
  return {
    ...metrics(results),
    splits: {
      dev: metrics(results.filter(result => result.split === 'dev')),
      test: metrics(results.filter(result => result.split === 'test')),
    },
    perCategory: [...new Set(results.map(result => result.category))].sort().map(category => ({
      category,
      ...metrics(results.filter(result => result.category === category)),
    })),
  };
}

function escapeHtml(value: string) {
  return value.replace(/["&'<>]/g, character => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!;
  });
}

function pathLink(path: string) {
  const label = escapeHtml(path);
  if (!path.startsWith('/') || path.startsWith('//')) {
    return label;
  }
  try {
    const url = new URL(path, 'https://docs.expo.dev');
    if (url.origin !== 'https://docs.expo.dev') {
      return label;
    }
    return `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  } catch {
    return label;
  }
}

function percentage(value: number | null) {
  return value === null ? 'N/A' : `${(value * 100).toFixed(1)}%`;
}

function quantity(value: number | null) {
  return value === null ? 'Unknown' : value.toLocaleString('en-US');
}

function dollars(value: number | null) {
  return value === null ? 'Unknown' : `$${value.toFixed(6)}`;
}

function latency(value: number | null) {
  return value === null ? 'N/A' : `${Math.round(value).toLocaleString('en-US')} ms`;
}

function outcome(result: EvalResult) {
  if (result.status === 'error') {
    return { key: 'error', label: 'Error' };
  }
  if (isCorrect(result)) {
    return {
      key: 'correct',
      label: result.predictedPath === null ? 'Correct no-match' : 'Correct redirect',
    };
  }
  return {
    key: 'incorrect',
    label:
      result.predictedPath === null
        ? 'Missed recovery'
        : result.expectedPaths.length === 0
          ? 'False redirect'
          : 'Wrong destination',
  };
}

function renderRow(result: EvalResult, index: number) {
  const decision = outcome(result);
  const searchable = [
    result.id,
    result.path,
    ...result.expectedPaths,
    result.predictedPath ?? '',
    result.sourcePath,
    result.category,
    result.error ?? '',
  ].join(' ');
  return `<tr data-index="${index}" data-outcome="${decision.key}" data-category="${escapeHtml(result.category)}" data-split="${escapeHtml(result.split)}" data-reviewed="${result.reviewed}" data-search="${escapeHtml(searchable.toLowerCase())}">
<td><strong>${escapeHtml(result.id)}</strong><div>${pathLink(result.path)}</div><small>Source: ${pathLink(result.sourcePath)}</small></td>
<td>${result.expectedPaths.length ? result.expectedPaths.map(pathLink).join('<br>') : 'No redirect'}<small>${result.reviewed ? 'Reviewed label' : 'Proposed label · unreviewed'}</small></td>
<td>${result.predictedPath === null ? 'No redirect' : pathLink(result.predictedPath)}<small class="${decision.key}">${decision.label}</small>${result.error ? `<details><summary>Error details</summary><pre>${escapeHtml(result.error)}</pre></details>` : ''}</td>
<td>${escapeHtml(result.category)}<small>${escapeHtml(result.split)} · ${result.reviewed ? 'reviewed' : 'unreviewed'}</small></td>
<td>${latency(result.durationMs)}<small>${result.calls} API calls</small></td>
<td>${quantity(result.inputTokens)} input<small>${quantity(result.outputTokens)} output</small></td>
<td>${dollars(result.cost)}<small>${escapeHtml(result.model ?? 'Unknown model')}</small></td>
</tr>`;
}

export function renderReport({
  results,
  metadata,
}: {
  results: EvalResult[];
  metadata: Record<string, unknown>;
}) {
  const summary = summarize(results);
  const reviewed = metrics(results.filter(result => result.reviewed));
  const costLabel = metadata.costKind === 'estimated' ? 'Estimated cost (USD)' : 'Cost (USD)';
  const cards = [
    [
      'Label agreement',
      percentage(summary.accuracy),
      `${summary.correct} / ${summary.total} cases`,
    ],
    [
      'Redirect precision',
      percentage(summary.redirectPrecision),
      `${summary.correctRedirects} correct / ${summary.redirects} proposed redirects`,
    ],
    [
      'Recovery recall',
      percentage(summary.recoveryRecall),
      `${summary.correctRedirects} correct / ${summary.positiveCases} positive cases`,
    ],
    [
      'False redirect rate',
      percentage(summary.falseRedirectRate),
      `${summary.falseRedirects} redirects / ${summary.negativeCases} negative cases`,
    ],
    [
      'Latency p50 / p95',
      `${latency(summary.p50Ms)} / ${latency(summary.p95Ms)}`,
      'Includes errors',
    ],
    [costLabel, dollars(summary.cost), `${summary.totalCalls} API calls`],
  ];
  const rows = results
    .map((result, index) => ({ result, index }))
    .sort((a, b) => Number(isCorrect(a.result)) - Number(isCorrect(b.result)))
    .map(({ result, index }) => renderRow(result, index))
    .join('\n');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>URL recovery evaluation</title>
<style>
:root{color-scheme:light dark;font:15px/1.5 system-ui,sans-serif;background:#f5f6f8;color:#17202e}*{box-sizing:border-box}body{margin:0;padding:32px;max-width:1800px;margin-inline:auto}h1{font-size:30px;margin:0 0 8px}h2{font-size:20px;margin:28px 0 12px}p{max-width:1000px}a{color:#075cb8;text-decoration-thickness:1px;overflow-wrap:anywhere}small{display:block;color:#5b6471;margin-top:5px}strong{font-weight:650}.notice{padding:16px 20px;border:1px solid #c58211;border-radius:10px;background:#fff7dd}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:20px}.card{padding:16px;border:1px solid #d6dbe3;border-radius:10px;background:white}.card strong{display:block;font-size:23px;margin-top:8px}.filters{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin:20px 0 10px}label{display:block}input,select{font:inherit;padding:7px;border:1px solid #a5adba;border-radius:5px;background:white;color:inherit}input[type=search]{min-width:270px}input[type=checkbox]{accent-color:#075cb8}.scroll{overflow:auto;border:1px solid #d6dbe3;border-radius:8px;background:white}table{border-collapse:collapse;width:100%;text-align:left}th,td{padding:12px;vertical-align:top;border-bottom:1px solid #e1e5eb}th{font-size:13px;background:#eaf0f6;white-space:nowrap}td{min-width:120px}#cases td:first-child{min-width:230px}#cases td:nth-child(2),#cases td:nth-child(3){min-width:220px}.correct{color:#14703b}.incorrect,.error{color:#ac2424}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-width:650px}details{margin-top:8px}summary{cursor:pointer}dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 20px}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}dt{font-weight:650}[hidden]{display:none!important}
@media(prefers-color-scheme:dark){:root{background:#121820;color:#e4e9f0}a{color:#85baff}small{color:#aab6c6}.notice{background:#332a12;border-color:#b88b37}.card,.scroll,input,select{background:#1d2632;border-color:#465164}th{background:#293648}th,td{border-color:#3a4759}.correct{color:#72dba0}.incorrect,.error{color:#ffaaaa}}@media(max-width:700px){body{padding:16px}dl{display:block}dd{margin-bottom:12px}}
</style></head><body>
<h1>URL recovery evaluation</h1>
${summary.unreviewed ? `<div class="notice"><strong>Provisional results: ${summary.unreviewed} of ${summary.total} labels are unreviewed.</strong><p>Scores measure agreement with proposed labels, not verified redirect accuracy. Review expected destinations before using these results for production decisions.</p></div>` : '<p>All labels in this run are marked reviewed.</p>'}
<p>${summary.total} cases · ${summary.errors} errors · ${summary.abstentions} successful abstentions, including ${summary.correctNegatives} correct no-matches. Reviewed-label agreement: ${percentage(reviewed.accuracy)} (${reviewed.correct} / ${reviewed.total}).</p>
<div class="cards">${cards.map(([label, value, detail]) => `<div class="card">${label}<strong>${value}</strong><small>${detail}</small></div>`).join('')}</div>
<p>Input tokens: ${quantity(summary.inputTokens)} · Output tokens: ${quantity(summary.outputTokens)}. Usage totals are unknown if any case lacks usage data. Errors are incorrect, including errors on negative cases. Percentiles use linear interpolation; N/A means the denominator is zero or no latency was recorded.</p>
<p>Development split: ${summary.splits.dev.total} cases (${summary.splits.dev.reviewed} reviewed), ${percentage(summary.splits.dev.accuracy)} agreement. Test split: ${summary.splits.test.total} cases (${summary.splits.test.reviewed} reviewed), ${percentage(summary.splits.test.accuracy)} agreement.</p>
<details><summary>Run metadata</summary><dl>${Object.entries(metadata)
    .map(
      ([key, value]) =>
        `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? String(value)))}</dd>`
    )
    .join('')}</dl></details>
<h2>Categories</h2><div class="scroll"><table><thead><tr><th>Category</th><th>Cases</th><th>Correct</th><th>Agreement</th><th>Precision</th><th>Recall</th><th>False redirects</th><th>Errors</th></tr></thead><tbody>${summary.perCategory.map(category => `<tr><td>${escapeHtml(category.category)}</td><td>${category.total}</td><td>${category.correct}</td><td>${percentage(category.accuracy)}</td><td>${percentage(category.redirectPrecision)}</td><td>${percentage(category.recoveryRecall)}</td><td>${category.falseRedirects} / ${category.negativeCases}</td><td>${category.errors}</td></tr>`).join('')}</tbody></table></div>
<h2>Review cases</h2>
<div class="filters"><label>Search<br><input id="search" type="search" placeholder="Path, destination, source, case ID"></label>
<label>Outcome<br><select id="outcome"><option value="">All outcomes</option><option value="wrong">Mismatches and errors</option><option value="error">Errors</option><option value="correct">Correct</option></select></label>
<label>Category<br><select id="category"><option value="">All categories</option>${summary.perCategory.map(({ category }) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</select></label>
<label>Split<br><select id="split"><option value="">Both splits</option><option value="dev">Development</option><option value="test">Test</option></select></label>
<label>Labels<br><select id="reviewed"><option value="">All labels</option><option value="false">Unreviewed</option><option value="true">Reviewed</option></select></label>
<label><input id="wrong-first" type="checkbox" checked> Mismatches and errors first</label></div>
<p id="visible-count" aria-live="polite">Showing ${results.length} of ${results.length} cases. Summary scores cover the full run.</p>
<div class="scroll"><table id="cases"><thead><tr><th>Input and source</th><th>Expected destination</th><th>Actual result</th><th>Category and label</th><th>Latency and calls</th><th>Tokens</th><th>${costLabel} and model</th></tr></thead><tbody>${rows}</tbody></table></div>
<script>
const rows = Array.from(document.querySelectorAll('#cases tbody tr'));
const controls = Object.fromEntries(['search', 'outcome', 'category', 'split', 'reviewed', 'wrong-first'].map(id => [id, document.getElementById(id)]));
function update() {
  const query = controls.search.value.toLowerCase().trim();
  let visible = 0;
  rows.sort((a, b) => (controls['wrong-first'].checked ? Number(a.dataset.outcome === 'correct') - Number(b.dataset.outcome === 'correct') : 0) || Number(a.dataset.index) - Number(b.dataset.index));
  for (const row of rows) {
    const outcome = controls.outcome.value;
    row.hidden = !row.dataset.search.includes(query) || (outcome === 'wrong' ? row.dataset.outcome === 'correct' : outcome && row.dataset.outcome !== outcome) || ['category', 'split', 'reviewed'].some(key => controls[key].value && row.dataset[key] !== controls[key].value);
    if (!row.hidden) visible++;
    row.parentElement.append(row);
  }
  document.getElementById('visible-count').textContent = 'Showing ' + visible + ' of ' + rows.length + ' cases. Summary scores cover the full run.';
}
Object.values(controls).forEach(control => control.addEventListener('input', update));
</script></body></html>`;
}
