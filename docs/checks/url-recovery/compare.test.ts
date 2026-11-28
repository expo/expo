/** @jest-environment node */
import { afterEach, describe, expect, test } from '@jest/globals';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { compareRuns, loadRunAsync, renderComparisonReport, type SavedRun } from './compare.ts';
import type { EvalResult } from './report.ts';

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map(directory => rm(directory, { recursive: true, force: true }))
  );
});

function result(id: string, overrides: Partial<EvalResult> = {}): EvalResult {
  return {
    id,
    path: `/${id}/`,
    expectedPaths: ['/router/introduction/'],
    category: 'typo',
    sourcePath: '/router/introduction/',
    split: 'dev',
    reviewed: false,
    predictedPath: '/router/introduction/',
    status: 'ok',
    durationMs: 100,
    calls: 2,
    inputTokens: 1000,
    outputTokens: 50,
    cost: null,
    model: 'jev',
    ...overrides,
  };
}

function saved(results: EvalResult[], metadata: Record<string, unknown> = {}): SavedRun {
  return {
    directory: '/saved/run',
    metadata: {
      datasetHash: 'same-dataset',
      inventoryHash: 'same-inventory',
      repeat: 1,
      ...metadata,
    },
    cases: results.map(({ id, path, expectedPaths, category, sourcePath, split, reviewed }) => ({
      id,
      path,
      expectedPaths,
      category,
      sourcePath,
      split,
      reviewed,
    })),
    results,
  };
}

describe('compareRuns', () => {
  test('pairs by ID and distinguishes correctness changes from destination changes', () => {
    const baseline = saved([
      result('improved', { predictedPath: null }),
      result('regressed'),
      result('still-wrong', { predictedPath: '/wrong/' }),
      result('same'),
    ]);
    const candidate = saved([
      result('same'),
      result('still-wrong', { predictedPath: '/another-wrong/' }),
      result('regressed', { predictedPath: null }),
      result('improved', { durationMs: 50 }),
    ]);
    const comparison = compareRuns(baseline, candidate);
    expect(comparison.paired).toMatchObject({
      total: 4,
      improved: 1,
      regressed: 1,
      unchanged: 2,
      unchangedCorrect: 1,
      unchangedIncorrect: 1,
      changed: 3,
    });
    expect(comparison.pairs[0]).toMatchObject({
      id: 'improved',
      outcome: 'improved',
      latencyDeltaMs: -50,
    });
    expect(comparison.pairs[2]).toMatchObject({
      id: 'still-wrong',
      outcome: 'unchanged',
      changed: true,
    });
    expect(comparison.baseline.summary.correct).toBe(2);
    expect(comparison.candidate.summary.correct).toBe(2);
  });

  test('treats errors on no-match cases as incorrect and propagates missing usage', () => {
    const baseline = saved([
      result('negative', { expectedPaths: [], predictedPath: null, status: 'error' }),
    ]);
    const candidate = saved([
      result('negative', { expectedPaths: [], predictedPath: null, inputTokens: null }),
    ]);
    const comparison = compareRuns(baseline, candidate);
    expect(comparison.paired).toMatchObject({
      improved: 1,
      changed: 1,
      errorsFixed: 1,
      newErrors: 0,
    });
    expect(comparison.deltas).toMatchObject({
      accuracy: 1,
      errors: -1,
      inputTokens: null,
      cost: null,
    });
    expect(comparison.candidate.summary.correctNegatives).toBe(1);
  });

  test('flags false redirects while preserving multiple acceptable destinations', () => {
    const alternatives = { expectedPaths: ['/router/introduction/', '/router/'] };
    const baseline = saved([
      result('negative', { expectedPaths: [], predictedPath: null }),
      result('alternatives', alternatives),
    ]);
    const candidate = saved([
      result('negative', { expectedPaths: [] }),
      result('alternatives', { ...alternatives, predictedPath: '/router/' }),
    ]);
    const comparison = compareRuns(baseline, candidate);
    expect(comparison.paired).toMatchObject({ regressed: 1, unchangedCorrect: 1, changed: 2 });
    expect(comparison.deltas).toMatchObject({ falseRedirectRate: 1, redirectPrecision: -0.5 });
    expect(comparison.pairs[1]).toMatchObject({ outcome: 'unchanged', changed: true });
  });

  test.each(['datasetHash', 'inventoryHash'])('rejects mismatched %s', field => {
    expect(() =>
      compareRuns(saved([result('case')]), saved([result('case')], { [field]: 'different' }))
    ).toThrow(`different ${field}`);
  });

  test('rejects different case IDs and labels even if recorded dataset hashes match', () => {
    expect(() => compareRuns(saved([result('first')]), saved([result('second')]))).toThrow(
      'missing case'
    );
    expect(() =>
      compareRuns(saved([result('same')]), saved([result('same', { expectedPaths: [] })]))
    ).toThrow('different labels');
    expect(() =>
      compareRuns(saved([result('same')]), saved([result('same', { reviewed: true })]))
    ).toThrow('different labels');
  });

  test('rejects repeated, incomplete and invalid result records', () => {
    const baseline = saved([result('one'), result('two')]);
    expect(() => compareRuns(baseline, saved(baseline.results, { repeat: 2 }))).toThrow(
      '--repeat 1'
    );
    expect(() =>
      compareRuns(baseline, { ...baseline, results: [baseline.results[0], baseline.results[0]] })
    ).toThrow('repeated result');
    expect(() => compareRuns(baseline, { ...baseline, results: [baseline.results[0]] })).toThrow(
      'Incomplete run'
    );
    expect(() =>
      compareRuns(baseline, saved([result('one', { durationMs: NaN }), result('two')]))
    ).toThrow('Invalid metrics');
    expect(() =>
      compareRuns(baseline, {
        ...baseline,
        results: [result('one', { expectedPaths: [] }), result('two')],
      })
    ).toThrow('do not match saved case');
  });

  test('keeps traces out of comparison artifacts', () => {
    const comparison = compareRuns(
      saved([result('case', { trace: 'large request payload' })]),
      saved([result('case')])
    );
    expect(JSON.stringify(comparison)).not.toContain('large request payload');
  });
});

test('loadRunAsync verifies the actual inventory file against metadata', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'jev-compare-test-'));
  temporary.push(directory);
  const inventory = '[]\n';
  const run = saved([result('case')], {
    inventoryHash: createHash('sha256').update(inventory).digest('hex'),
  });
  await Promise.all([
    writeFile(path.join(directory, 'summary.json'), JSON.stringify({ metadata: run.metadata })),
    writeFile(
      path.join(directory, 'cases.jsonl'),
      run.cases.map(value => JSON.stringify(value)).join('\n')
    ),
    writeFile(
      path.join(directory, 'results.jsonl'),
      run.results.map(value => JSON.stringify(value)).join('\n')
    ),
    writeFile(path.join(directory, 'inventory.json'), inventory),
  ]);
  expect((await loadRunAsync(directory)).results).toHaveLength(1);
  await writeFile(path.join(directory, 'inventory.json'), '[{}]');
  await expect(loadRunAsync(directory)).rejects.toThrow('does not match its recorded hash');
});

test('renders provisional labels and escapes case data, metadata and links', () => {
  const malicious = result('<script>bad()</script>', {
    path: '//evil.example/',
    sourcePath: '/\\evil.example/',
    predictedPath: '/safe/" onclick="bad()',
  });
  const comparison = compareRuns(
    saved([malicious]),
    saved([{ ...malicious, predictedPath: null }], { strategy: '<img src=x onerror=bad()>' })
  );
  const view = renderComparisonReport(comparison);
  expect(view).toContain('Provisional comparison: 1 of 1 labels are unreviewed.');
  expect(view).toContain('not verified production accuracy');
  expect(view).not.toContain('<script>bad()');
  expect(view).not.toContain('<img src=x');
  expect(view).not.toContain('href="https://evil.example');
  expect(view).not.toContain(' onclick="');
  expect(view).toContain('id="changed"');
  expect(view).toContain('id="search"');
  expect(view).toContain('href="https://docs.expo.dev/safe/');
});
