/**
 * Tests for the DAG-aware parallel scheduler.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SPMPackageSource } from '../ExternalPackage';
import type { PackageResult } from './Scheduler';
import { runPackagesInParallel } from './Scheduler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePkg(name: string): SPMPackageSource {
  return {
    path: `/repo/packages/${name}`,
    buildPath: `/repo/packages/precompile/.build/${name}`,
    packageName: name,
    packageVersion: '1.0.0',
    getSwiftPMConfiguration: () => ({ products: [] }),
  };
}

function successResult(name: string): PackageResult {
  return { packageName: name, statuses: [], errors: [], stopRun: false };
}

function stopRunResult(name: string): PackageResult {
  return { packageName: name, statuses: [], errors: [], stopRun: true };
}

function failedResult(name: string): PackageResult {
  return {
    packageName: name,
    statuses: [],
    errors: [
      {
        packageName: name,
        productName: 'p',
        flavor: 'Release',
        unitId: `${name}/p[Release]`,
        stage: 'build',
        error: new Error(`${name} failed`),
      },
    ],
    stopRun: false,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runPackagesInParallel', () => {
  it('runs independent packages concurrently', async () => {
    const a = makePkg('a');
    const b = makePkg('b');
    const c = makePkg('c');

    const dependsOn = new Map<string, Set<string>>([
      ['a', new Set()],
      ['b', new Set()],
      ['c', new Set()],
    ]);

    const startTimes: Record<string, number> = {};
    const endTimes: Record<string, number> = {};

    const results = await runPackagesInParallel(
      [a, b, c],
      dependsOn,
      3,
      new AbortController(),
      async (pkg) => {
        startTimes[pkg.packageName] = Date.now();
        await new Promise((r) => setTimeout(r, 50));
        endTimes[pkg.packageName] = Date.now();
        return successResult(pkg.packageName);
      }
    );

    assert.equal(results.length, 3);
    // All three should have started before any finished (concurrent)
    const latestStart = Math.max(...Object.values(startTimes));
    const earliestEnd = Math.min(...Object.values(endTimes));
    assert.ok(latestStart < earliestEnd, 'All packages should start before any finishes');
  });

  it('respects dependency ordering', async () => {
    const a = makePkg('a');
    const b = makePkg('b'); // b depends on a

    const dependsOn = new Map<string, Set<string>>([
      ['a', new Set()],
      ['b', new Set(['a'])],
    ]);

    const executionOrder: string[] = [];

    const results = await runPackagesInParallel(
      [a, b],
      dependsOn,
      2,
      new AbortController(),
      async (pkg) => {
        executionOrder.push(`start:${pkg.packageName}`);
        await new Promise((r) => setTimeout(r, 10));
        executionOrder.push(`end:${pkg.packageName}`);
        return successResult(pkg.packageName);
      }
    );

    assert.equal(results.length, 2);
    // a must finish before b starts
    const aEndIdx = executionOrder.indexOf('end:a');
    const bStartIdx = executionOrder.indexOf('start:b');
    assert.ok(aEndIdx < bStartIdx, 'Package a must finish before package b starts');
  });

  it('respects concurrency limit', async () => {
    const a = makePkg('a');
    const b = makePkg('b');
    const c = makePkg('c');

    const dependsOn = new Map<string, Set<string>>([
      ['a', new Set()],
      ['b', new Set()],
      ['c', new Set()],
    ]);

    let maxConcurrent = 0;
    let currentConcurrent = 0;

    const results = await runPackagesInParallel(
      [a, b, c],
      dependsOn,
      2, // limit to 2
      new AbortController(),
      async (pkg) => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise((r) => setTimeout(r, 50));
        currentConcurrent--;
        return successResult(pkg.packageName);
      }
    );

    assert.equal(results.length, 3);
    assert.ok(maxConcurrent <= 2, `Max concurrent was ${maxConcurrent}, expected <= 2`);
  });

  it('aborts on stop-run error', async () => {
    const a = makePkg('a');
    const b = makePkg('b');
    const c = makePkg('c');

    const dependsOn = new Map<string, Set<string>>([
      ['a', new Set()],
      ['b', new Set()],
      ['c', new Set(['a'])], // c depends on a, so it waits
    ]);

    const executed: string[] = [];

    const results = await runPackagesInParallel(
      [a, b, c],
      dependsOn,
      2,
      new AbortController(),
      async (pkg) => {
        executed.push(pkg.packageName);
        await new Promise((r) => setTimeout(r, 10));
        if (pkg.packageName === 'a') {
          return stopRunResult(pkg.packageName);
        }
        return successResult(pkg.packageName);
      }
    );

    // a and b started (both independent), c should not have started because a returned stop-run
    assert.ok(!executed.includes('c'), 'Package c should not have been launched after stop-run');
    // Results should include a and b
    const resultNames = results.map((r) => r.packageName);
    assert.ok(resultNames.includes('a'));
    assert.ok(resultNames.includes('b'));
  });

  it('handles empty package list', async () => {
    const results = await runPackagesInParallel([], new Map(), 4, new AbortController(), async () =>
      successResult('never')
    );
    assert.deepEqual(results, []);
  });

  it('works with concurrency 1 (sequential)', async () => {
    const a = makePkg('a');
    const b = makePkg('b');

    const dependsOn = new Map<string, Set<string>>([
      ['a', new Set()],
      ['b', new Set()],
    ]);

    const executionOrder: string[] = [];

    const results = await runPackagesInParallel(
      [a, b],
      dependsOn,
      1,
      new AbortController(),
      async (pkg) => {
        executionOrder.push(`start:${pkg.packageName}`);
        await new Promise((r) => setTimeout(r, 10));
        executionOrder.push(`end:${pkg.packageName}`);
        return successResult(pkg.packageName);
      }
    );

    assert.equal(results.length, 2);
    // With concurrency 1, a must finish before b starts
    assert.deepEqual(executionOrder, ['start:a', 'end:a', 'start:b', 'end:b']);
  });

  it('diamond dependency: D depends on B and C, which both depend on A', async () => {
    const a = makePkg('a');
    const b = makePkg('b');
    const c = makePkg('c');
    const d = makePkg('d');

    const dependsOn = new Map<string, Set<string>>([
      ['a', new Set()],
      ['b', new Set(['a'])],
      ['c', new Set(['a'])],
      ['d', new Set(['b', 'c'])],
    ]);

    const executionOrder: string[] = [];

    const results = await runPackagesInParallel(
      [a, b, c, d],
      dependsOn,
      4,
      new AbortController(),
      async (pkg) => {
        executionOrder.push(`start:${pkg.packageName}`);
        await new Promise((r) => setTimeout(r, 20));
        executionOrder.push(`end:${pkg.packageName}`);
        return successResult(pkg.packageName);
      }
    );

    assert.equal(results.length, 4);
    // a must finish before b or c start
    const aEnd = executionOrder.indexOf('end:a');
    const bStart = executionOrder.indexOf('start:b');
    const cStart = executionOrder.indexOf('start:c');
    const dStart = executionOrder.indexOf('start:d');
    const bEnd = executionOrder.indexOf('end:b');
    const cEnd = executionOrder.indexOf('end:c');

    assert.ok(aEnd < bStart, 'a must finish before b starts');
    assert.ok(aEnd < cStart, 'a must finish before c starts');
    // d must start after both b and c finish
    assert.ok(bEnd < dStart, 'b must finish before d starts');
    assert.ok(cEnd < dStart, 'c must finish before d starts');
  });

  it('skips downstream packages when a dependency fails (transitive diamond)', async () => {
    const a = makePkg('a');
    const b = makePkg('b');
    const c = makePkg('c');
    const d = makePkg('d');

    // b → a, c → a, d → b, c
    const dependsOn = new Map<string, Set<string>>([
      ['a', new Set()],
      ['b', new Set(['a'])],
      ['c', new Set(['a'])],
      ['d', new Set(['b', 'c'])],
    ]);

    const failedDepsReceived: Record<string, string[] | undefined> = {};
    const realExecutions: string[] = [];

    const results = await runPackagesInParallel(
      [a, b, c, d],
      dependsOn,
      4,
      new AbortController(),
      async (pkg, _signal, failedDeps) => {
        failedDepsReceived[pkg.packageName] = failedDeps;
        if (failedDeps && failedDeps.length > 0) {
          // Caller signals this package should be skipped; return a fake result.
          return failedResult(pkg.packageName);
        }
        realExecutions.push(pkg.packageName);
        if (pkg.packageName === 'a') {
          return failedResult('a');
        }
        return successResult(pkg.packageName);
      }
    );

    // a runs for real (and fails)
    assert.ok(realExecutions.includes('a'), 'a should run for real');
    // b, c, d must NOT run for real — they are skipped due to upstream failure
    assert.ok(!realExecutions.includes('b'), 'b should be skipped because a failed');
    assert.ok(!realExecutions.includes('c'), 'c should be skipped because a failed');
    assert.ok(!realExecutions.includes('d'), 'd should be skipped transitively');

    // Executor should be called for every package so it can synthesize statuses,
    // but dependents should receive non-empty failedDeps.
    assert.equal(failedDepsReceived.a, undefined, 'a has no failed upstream deps');
    assert.deepEqual(failedDepsReceived.b, ['a']);
    assert.deepEqual(failedDepsReceived.c, ['a']);
    assert.ok(
      failedDepsReceived.d && failedDepsReceived.d.length > 0,
      'd must be told its deps failed (transitively)'
    );

    assert.equal(results.length, 4, 'all four packages must appear in results');
  });

  it('does not skip independent packages when an unrelated package fails', async () => {
    const a = makePkg('a');
    const b = makePkg('b');

    // a and b are independent
    const dependsOn = new Map<string, Set<string>>([
      ['a', new Set()],
      ['b', new Set()],
    ]);

    let bFailedDeps: string[] | undefined = ['sentinel'];
    const realExecutions: string[] = [];

    await runPackagesInParallel(
      [a, b],
      dependsOn,
      2,
      new AbortController(),
      async (pkg, _signal, failedDeps) => {
        realExecutions.push(pkg.packageName);
        if (pkg.packageName === 'b') {
          bFailedDeps = failedDeps;
        }
        if (pkg.packageName === 'a') {
          return failedResult('a');
        }
        return successResult(pkg.packageName);
      }
    );

    assert.ok(realExecutions.includes('a'));
    assert.ok(realExecutions.includes('b'), 'b is independent and should run');
    assert.ok(
      bFailedDeps === undefined || bFailedDeps.length === 0,
      `b should have no failed deps, got ${JSON.stringify(bFailedDeps)}`
    );
  });
});
