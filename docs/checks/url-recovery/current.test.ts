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
};

beforeAll(() => {
  const script = `
import { evaluateCurrentAsync } from ${JSON.stringify(new URL('./current.ts', import.meta.url).href)};
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
  if (mode === 'batch' && batchCall++ === 0) await new Promise(resolve => setTimeout(resolve, 20));
  const answers = Object.fromEntries(Object.entries(body.input.questions).map(([id, question]) => {
    const choice = mode !== 'no-match' && destination in question.criteria ? destination : 'none_of_the_above';
    return [id, { type: 'choice', choice, confidence: .9, probabilities: Object.fromEntries(Object.keys(question.criteria).map(path => [path, path === choice ? 1 : 0])) }];
  }));
  return Response.json({ result: { state: 'Completed', result: { answers: mode === 'malformed' ? {} : answers, usage: { input_tokens: 100, output_tokens: 10 }, model: 'jev-test' } } });
};
const evaluate = (value = testCase, inventory = pages) => evaluateCurrentAsync(value, inventory, gatewayUrl, { input: .042, output: 0 });
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
process.stdout.write(JSON.stringify({ repeated, malformed, afterError, noMatch, batch, requests, batchTimeouts: requests.slice(batchStart).map(request => request.timeoutMs), sharedSignal: signals[batchStart] === signals[batchStart + 1] }));
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
  expect(run.requests).toHaveLength(7);
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
