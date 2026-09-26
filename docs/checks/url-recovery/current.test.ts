/** @jest-environment node */
import { beforeAll, expect, test } from '@jest/globals';
import { spawnSync } from 'node:child_process';

import type { EvalResult } from './report.ts';

let run: {
  repeated: EvalResult[];
  malformed: EvalResult;
  afterError: EvalResult;
  noMatch: EvalResult;
  batch: EvalResult;
  requests: { model: string; gateway: { id: string }; timeoutMs: number; hasSignal: boolean }[];
  batchTimeouts: number[];
  sharedSignal: boolean;
  hierarchical: EvalResult;
  hierarchicalMalformed: EvalResult;
  hierarchicalFailure: EvalResult;
  hierarchicalTimeouts: number[];
  hierarchicalSharedSignal: boolean;
};

beforeAll(() => {
  const script = `
import { evaluateAsync } from ${JSON.stringify(new URL('./evaluate.ts', import.meta.url).href)};
const destination = '/router/introduction/';
const pages = [destination, '/guides/permissions/'].map(path => ({ path, title: path, description: 'Expo docs' }));
const testCase = { id: 'typo', path: '/ruter/introduction/', expectedPaths: [destination], category: 'typo', sourcePath: destination, split: 'dev', reviewed: false };
const gatewayUrl = 'http://127.0.0.1:1/mocked-only';
const requests = [];
const signals = [];
let mode = 'success';
let batchCall = 0;
globalThis.fetch = async (url, options) => {
  if (url !== gatewayUrl) throw new Error('Unexpected network request');
  const body = JSON.parse(options.body);
  requests.push({ model: body.model, gateway: body.gateway, timeoutMs: body.timeoutMs, hasSignal: options.signal instanceof AbortSignal });
  signals.push(options.signal);
  if ((mode === 'batch' || mode === 'hierarchical') && batchCall++ === 0) await new Promise(resolve => setTimeout(resolve, 20));
  const finalRound = destination in (body.input.questions.destination?.criteria ?? {});
  if (mode === 'transport-error' && finalRound) return Response.json({ error: 'AI fixture unavailable' }, { status: 503 });
  const answers = Object.fromEntries(Object.entries(body.input.questions).map(([id, question]) => {
    const choice = mode === 'no-match' ? 'none_of_the_above'
      : destination in question.criteria ? destination
      : 'section:/router/' in question.criteria ? 'section:/router/' : 'none_of_the_above';
    return [id, { type: 'choice', choice, confidence: .9, probabilities: Object.fromEntries(Object.keys(question.criteria).map(path => [path, path === choice ? 1 : 0])) }];
  }));
  const malformed = mode === 'malformed' || (mode === 'malformed-final' && finalRound);
  return Response.json({ result: { state: 'Completed', result: { answers: malformed ? {} : answers, usage: { input_tokens: 100, output_tokens: 10 }, model: 'jev-test' } } });
};
const evaluate = (value = testCase, inventory = pages, strategy = 'current') => evaluateAsync(value, inventory, gatewayUrl, { input: .042, output: 0 }, strategy);
const repeated = [await evaluate(), await evaluate()];
mode = 'malformed';
const malformed = await evaluate({ ...testCase, expectedPaths: [] });
mode = 'success';
const afterError = await evaluate();
mode = 'no-match';
const noMatch = await evaluate({ ...testCase, expectedPaths: [] });
mode = 'batch';
const batchStart = requests.length;
const inventory = [pages[0], ...Array.from({ length: 254 }, (_, index) => ({ path: '/guides/page-' + index + '/', title: 'Page ' + index, description: 'Expo docs' }))];
const batch = await evaluate(testCase, inventory);
const batchTimeouts = requests.slice(batchStart).map(request => request.timeoutMs);
const hierarchicalInventory = [...inventory, { path: '/router/navigation/', title: 'Navigation', description: 'Expo docs' }];
mode = 'hierarchical';
batchCall = 0;
const hierarchicalStart = requests.length;
const hierarchical = await evaluate(testCase, hierarchicalInventory, 'hierarchical');
const hierarchicalTimeouts = requests.slice(hierarchicalStart).map(request => request.timeoutMs);
mode = 'malformed-final';
const hierarchicalMalformed = await evaluate({ ...testCase, expectedPaths: [] }, hierarchicalInventory, 'hierarchical');
mode = 'transport-error';
const hierarchicalFailure = await evaluate({ ...testCase, expectedPaths: [] }, hierarchicalInventory, 'hierarchical');
process.stdout.write(JSON.stringify({ repeated, malformed, afterError, noMatch, batch, requests, batchTimeouts, sharedSignal: signals[batchStart] === signals[batchStart + 1], hierarchical, hierarchicalMalformed, hierarchicalFailure, hierarchicalTimeouts, hierarchicalSharedSignal: signals[hierarchicalStart] === signals[hierarchicalStart + 1] }));
`;
  const execution = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', script],
    { encoding: 'utf8', timeout: 10000 }
  );
  if (execution.status !== 0) {
    throw new Error(execution.error?.message ?? (execution.stderr || execution.stdout));
  }
  run = JSON.parse(execution.stdout);
});

test('uses fresh production state for repeated cases and after an inference failure', () => {
  for (const result of [...run.repeated, run.afterError]) {
    expect(result).toMatchObject({
      status: 'ok',
      predictedPath: '/router/introduction/',
      calls: 1,
    });
  }
  expect(run.malformed).toMatchObject({ status: 'error', predictedPath: null, calls: 1 });
  expect(run.malformed.error).toContain('Invalid Jev Choice answer');
  expect(run.noMatch).toMatchObject({ status: 'ok', predictedPath: null, calls: 1 });
  expect(run.noMatch.error).toBeUndefined();
});

test('records provider usage and calculated cost through the mocked native-binding transport', () => {
  expect(run.repeated[0]).toMatchObject({
    inputTokens: 100,
    outputTokens: 10,
    model: 'jev-test',
  });
  expect(run.repeated[0].cost).toBeCloseTo(0.0000042, 10);
  expect(run.repeated[0].durationMs).toBeGreaterThanOrEqual(0);
  expect(run.requests).toHaveLength(13);
  for (const request of run.requests) {
    expect(request).toMatchObject({
      model: 'typesafe/jev',
      gateway: { id: 'default' },
      hasSignal: true,
    });
  }
});

test('shares the production abort signal and spends only the remaining budget in the final round', () => {
  expect(run.batch).toMatchObject({
    status: 'ok',
    predictedPath: '/router/introduction/',
    calls: 2,
    inputTokens: 200,
    outputTokens: 20,
  });
  expect(run.sharedSignal).toBe(true);
  expect(run.batchTimeouts).toHaveLength(2);
  expect(run.batchTimeouts[0]).toBeLessThanOrEqual(3000);
  expect(run.batchTimeouts[1]).toBeGreaterThan(0);
  expect(run.batchTimeouts[1]).toBeLessThan(run.batchTimeouts[0]);
});

test('accounts for hierarchical inference across both rounds with one deadline', () => {
  expect(run.hierarchical).toMatchObject({
    status: 'ok',
    predictedPath: '/router/introduction/',
    calls: 2,
    inputTokens: 200,
    outputTokens: 20,
    model: 'jev-test',
  });
  expect(run.hierarchical.cost).toBeCloseTo(0.0000084, 10);
  expect(run.hierarchicalSharedSignal).toBe(true);
  expect(run.hierarchicalTimeouts).toHaveLength(2);
  expect(run.hierarchicalTimeouts[0]).toBeLessThanOrEqual(3000);
  expect(run.hierarchicalTimeouts[1]).toBeGreaterThan(0);
  expect(run.hierarchicalTimeouts[1]).toBeLessThan(run.hierarchicalTimeouts[0]);
});

test('records hierarchical final-round failures as errors and preserves unknown usage', () => {
  expect(run.hierarchicalMalformed).toMatchObject({
    status: 'error',
    predictedPath: null,
    calls: 2,
    inputTokens: 200,
    outputTokens: 20,
    error: 'Invalid Jev Choice answer',
  });
  expect(run.hierarchicalFailure).toMatchObject({
    status: 'error',
    predictedPath: null,
    calls: 2,
    inputTokens: null,
    outputTokens: null,
    cost: null,
    error: 'AI fixture unavailable',
  });
});
