import { describe, expect, test } from '@jest/globals';

import { renderReport, summarize, type EvalResult } from './report.ts';

function result(overrides: Partial<EvalResult> = {}): EvalResult {
  return {
    id: 'router-typo',
    path: '/ruter/introduction/',
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
    cost: 0.000042,
    model: 'jev',
    ...overrides,
  };
}

describe('summarize', () => {
  test('scores alternatives, abstentions, wrong destinations and negative cases separately', () => {
    const summary = summarize([
      result({ expectedPaths: ['/router/introduction/', '/router/'], predictedPath: '/router/' }),
      result({ predictedPath: '/guides/permissions/' }),
      result({ predictedPath: null }),
      result({ expectedPaths: [], predictedPath: null, category: 'negative', split: 'test' }),
      result({ expectedPaths: [], category: 'negative', split: 'test', reviewed: true }),
    ]);
    expect(summary).toMatchObject({
      total: 5,
      correct: 2,
      accuracy: 2 / 5,
      correctRedirects: 1,
      redirects: 3,
      positiveCases: 3,
      negativeCases: 2,
      correctNegatives: 1,
      falseRedirects: 1,
      wrongDestinations: 1,
      abstentions: 2,
      errors: 0,
      redirectPrecision: 1 / 3,
      recoveryRecall: 1 / 3,
      falseRedirectRate: 1 / 2,
      reviewed: 1,
      unreviewed: 4,
    });
    expect(summary.splits.dev).toMatchObject({ total: 3, correct: 1, reviewed: 0 });
    expect(summary.splits.test).toMatchObject({ total: 2, correct: 1, reviewed: 1 });
    expect(summary.perCategory).toEqual([
      expect.objectContaining({ category: 'negative', total: 2, correct: 1 }),
      expect.objectContaining({ category: 'typo', total: 3, correct: 1 }),
    ]);
  });

  test('never counts an error as a correct no-match or successful abstention', () => {
    const summary = summarize([
      result({ expectedPaths: [], predictedPath: null, status: 'error', durationMs: 3000 }),
      result({ status: 'error', durationMs: 2000 }),
    ]);
    expect(summary).toMatchObject({
      total: 2,
      errors: 2,
      correct: 0,
      correctNegatives: 0,
      correctRedirects: 0,
      accuracy: 0,
      abstentions: 0,
      p50Ms: 2500,
      p95Ms: 2950,
    });
  });

  test('returns null for undefined rates and empty latency samples', () => {
    expect(summarize([])).toMatchObject({
      total: 0,
      accuracy: null,
      redirectPrecision: null,
      recoveryRecall: null,
      falseRedirectRate: null,
      p50Ms: null,
      p95Ms: null,
      totalCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
    });
    expect(summarize([result({ predictedPath: null })])).toMatchObject({
      redirectPrecision: null,
      recoveryRecall: 0,
      falseRedirectRate: null,
    });
    expect(summarize([result({ expectedPaths: [], predictedPath: null })])).toMatchObject({
      recoveryRecall: null,
      falseRedirectRate: 0,
    });
  });

  test('interpolates sorted latency samples without changing result order', () => {
    const results = [1000, 0, 300, 100].map(durationMs => result({ durationMs }));
    expect(summarize(results)).toMatchObject({ p50Ms: 200 });
    expect(summarize(results).p95Ms).toBeCloseTo(895);
    expect(results.map(value => value.durationMs)).toEqual([1000, 0, 300, 100]);
    expect(summarize([result({ durationMs: 321 })])).toMatchObject({ p50Ms: 321, p95Ms: 321 });
  });

  test('propagates unknown usage independently for each total', () => {
    expect(summarize([result(), result()])).toMatchObject({
      totalCalls: 4,
      inputTokens: 2000,
      outputTokens: 100,
    });
    expect(summarize([result(), result()]).cost).toBeCloseTo(0.000084);
    expect(summarize([result(), result({ inputTokens: null, cost: null })])).toMatchObject({
      totalCalls: 4,
      inputTokens: null,
      outputTokens: 100,
      cost: null,
    });
    expect(summarize([result({ outputTokens: null })]).outputTokens).toBeNull();
  });
});

describe('renderReport', () => {
  test('escapes labels, errors, metadata and attributes and never links another origin', () => {
    const view = renderReport({
      results: [
        result({
          id: '<img src=x onerror=alert(1)>',
          path: '//evil.example/',
          sourcePath: '/\\evil.example/',
          expectedPaths: [['javascript', 'alert(1)'].join(':')],
          predictedPath: '/safe/" onclick="alert(1)',
          category: '"><script>bad()</script>',
          status: 'error',
          error: '</pre><script>bad()</script>',
        }),
      ],
      metadata: { '<script>key</script>': '</dd><script>bad()</script>' },
    });
    expect(view).not.toContain('<script>bad()');
    expect(view).not.toContain('<img src=x');
    expect(view).not.toContain('href="javascript:');
    expect(view).not.toContain('href="https://evil.example');
    expect(view).not.toContain(' onclick="');
    expect(view).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(view).toContain('&lt;/pre&gt;&lt;script&gt;bad()&lt;/script&gt;');
    expect(view).toContain('href="https://docs.expo.dev/safe/');
  });

  test('marks proposed labels prominently and orders wrong cases first', () => {
    const view = renderReport({
      results: [result({ id: 'correct-case' }), result({ id: 'wrong-case', predictedPath: null })],
      metadata: { dataset: 'provisional' },
    });
    expect(view).toContain('Provisional results: 2 of 2 labels are unreviewed.');
    expect(view).toContain('not verified redirect accuracy');
    expect(view).toContain('Proposed label · unreviewed');
    expect(view).toContain('Development split: 2 cases (0 reviewed)');
    expect(view.indexOf('<strong>wrong-case</strong>')).toBeLessThan(
      view.indexOf('<strong>correct-case</strong>')
    );
    expect(view).toContain('id="wrong-first"');
    expect(view).toContain('id="search"');
    expect(view).toContain('href="https://docs.expo.dev/router/introduction/"');
  });

  test('renders reviewed-only and empty reports without misleading NaN metrics', () => {
    const view = renderReport({ results: [result({ reviewed: true })], metadata: {} });
    expect(view).not.toContain('Provisional results:');
    expect(view).toContain('All labels in this run are marked reviewed.');
    expect(renderReport({ results: [], metadata: {} })).toContain('N/A');
    expect(renderReport({ results: [], metadata: {} })).not.toContain('NaN');
    expect(renderReport({ results: [], metadata: {} })).not.toContain('Infinity');
  });

  test('identifies configured token-price calculations as estimated costs', () => {
    const view = renderReport({ results: [result()], metadata: { costKind: 'estimated' } });
    expect(view).toContain('Estimated cost (USD)');
    expect(view).toContain('$0.000042');
  });
});
