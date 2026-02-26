/**
 * Tests for the Executor's error-policy enforcement:
 *  - executeStep behavior with each onError policy
 *  - runPrebuildPipeline failure propagation with mock steps
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { executeStep, runPrebuildPipeline } from './Executor';
import type { PipelineSteps } from './Executor';
import { createRequest, createContext } from './Context';
import type { PrebuildContext, PrebuildCliOptions } from './Context';
import type { Step } from './Types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultOptions: PrebuildCliOptions = {
  hermesVersion: 'nightly',
  clean: false,
  cleanCache: false,
  skipGenerate: false,
  skipArtifacts: false,
  skipBuild: false,
  skipCompose: false,
  skipVerify: false,
  verbose: false,
};

function makeCtx(overrides: Partial<PrebuildCliOptions> = {}): PrebuildContext {
  const opts = { ...defaultOptions, ...overrides };
  return createContext(createRequest([], opts));
}

function makeStep(
  overrides: Partial<Step<PrebuildContext>> = {}
): Step<PrebuildContext> {
  return {
    id: 'test-step',
    scope: 'product',
    label: 'Test step',
    onError: 'stop-run',
    shouldRun: () => true,
    run: async () => {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// executeStep tests
// ---------------------------------------------------------------------------

describe('executeStep', () => {
  it('returns ok when step succeeds', async () => {
    const ctx = makeCtx();
    const step = makeStep({ run: async () => {} });
    const result = await executeStep(step, ctx);
    assert.equal(result, 'ok');
  });

  it('returns stop-run when ctx.cancelled is true', async () => {
    const ctx = makeCtx();
    ctx.cancelled = true;
    let ran = false;
    const step = makeStep({ run: async () => { ran = true; } });
    const result = await executeStep(step, ctx);
    assert.equal(result, 'stop-run');
    assert.equal(ran, false, 'step.run should not be called when cancelled');
  });

  it('returns ok without running when shouldRun returns false', async () => {
    const ctx = makeCtx();
    let ran = false;
    const step = makeStep({
      shouldRun: () => false,
      run: async () => { ran = true; },
    });
    const result = await executeStep(step, ctx);
    assert.equal(result, 'ok');
    assert.equal(ran, false);
  });

  it('returns stop-run and records error when step fails with stop-run policy', async () => {
    const ctx = makeCtx();
    const step = makeStep({
      onError: 'stop-run',
      run: async () => { throw new Error('boom'); },
    });
    const result = await executeStep(step, ctx);
    assert.equal(result, 'stop-run');
    assert.equal(ctx.errors.length, 1);
    assert.equal(ctx.errors[0].error.message, 'boom');
  });

  it('returns skip-remaining and records error when step fails with skip-remaining policy', async () => {
    const ctx = makeCtx();
    const step = makeStep({
      id: 'generate',
      onError: 'skip-remaining',
      run: async () => { throw new Error('gen fail'); },
    });
    const result = await executeStep(step, ctx);
    assert.equal(result, 'skip-remaining');
    assert.equal(ctx.errors.length, 1);
    assert.equal(ctx.errors[0].stage, 'generate');
  });

  it('returns ok and records error when step fails with continue policy', async () => {
    const ctx = makeCtx();
    const step = makeStep({
      id: 'verify',
      onError: 'continue',
      run: async () => { throw new Error('verify fail'); },
    });
    const result = await executeStep(step, ctx);
    assert.equal(result, 'ok');
    assert.equal(ctx.errors.length, 1);
    assert.equal(ctx.errors[0].stage, 'verify');
  });

  it('marks product stage as failed on unit status when product step fails', async () => {
    const ctx = makeCtx();
    // Set up current pointers and a UnitStatus
    ctx.currentPackage = {
      path: '/pkg',
      buildPath: '/build',
      packageName: 'test-pkg',
      packageVersion: '1.0.0',
      getSwiftPMConfiguration: () => ({ products: [] }),
    };
    ctx.currentProduct = {
      name: 'TestProduct',
      podName: 'TestProduct',
      platforms: ['iOS(.v15)'],
      targets: [],
    };
    ctx.currentFlavor = 'Debug';
    ctx.statuses.push({
      packageName: 'test-pkg',
      productName: 'TestProduct',
      flavor: 'Debug',
      unitId: 'test-pkg/TestProduct[Debug]',
      stages: { generate: 'skipped', build: 'skipped', compose: 'skipped', verify: 'skipped' },
      elapsedMs: 0,
    });

    const step = makeStep({
      id: 'build',
      onError: 'skip-remaining',
      run: async () => { throw new Error('build fail'); },
    });

    await executeStep(step, ctx);

    const unit = ctx.statuses[0];
    assert.equal(unit.stages.build, 'failed');
    // Other stages remain skipped
    assert.equal(unit.stages.generate, 'skipped');
    assert.equal(unit.stages.compose, 'skipped');
    assert.equal(unit.stages.verify, 'skipped');
  });

  it('classifies clean steps correctly in error stage', async () => {
    const ctx = makeCtx();
    const step = makeStep({
      id: 'clean:product',
      onError: 'skip-remaining',
      run: async () => { throw new Error('clean fail'); },
    });
    await executeStep(step, ctx);
    assert.equal(ctx.errors[0].stage, 'clean');
  });

  it('classifies prepare steps correctly in error stage', async () => {
    const ctx = makeCtx();
    const step = makeStep({
      id: 'prepare:inputs',
      onError: 'stop-run',
      run: async () => { throw new Error('prepare fail'); },
    });
    await executeStep(step, ctx);
    assert.equal(ctx.errors[0].stage, 'prepare');
  });
});

// ---------------------------------------------------------------------------
// runPrebuildPipeline tests with mock steps
// ---------------------------------------------------------------------------

describe('runPrebuildPipeline', () => {
  it('returns exitCode 0 when all steps succeed', async () => {
    const ctx = makeCtx({ flavor: 'Debug' });
    // Provide a package with a product so the pipeline has work to do
    ctx.packages = [{
      path: '/pkg',
      buildPath: '/build',
      packageName: 'test-pkg',
      packageVersion: '1.0.0',
      getSwiftPMConfiguration: () => ({
        products: [{
          name: 'TestProduct',
          podName: 'TestProduct',
          platforms: ['iOS(.v15)' as const],
          targets: [],
        }],
      }),
    }];
    ctx.reactNativeVersion = '0.76.0';
    ctx.hermesVersion = 'nightly';
    ctx.artifactsPath = '/cache';
    // Pre-populate artifacts so pipeline skips download
    ctx.artifactsByFlavor.set('Debug', null);

    const ran: string[] = [];
    const noopSteps: PipelineSteps = {
      run: [makeStep({ id: 'run-step', scope: 'run', run: async () => { ran.push('run'); } })],
      package: [makeStep({ id: 'pkg-step', scope: 'package', run: async () => { ran.push('pkg'); } })],
      product: [makeStep({ id: 'prod-step', scope: 'product', run: async () => { ran.push('prod'); } })],
    };

    const result = await runPrebuildPipeline(ctx, noopSteps);
    assert.equal(result.exitCode, 0);
    assert.deepEqual(ran, ['run', 'pkg', 'prod']);
  });

  it('returns exitCode 1 when a run-scope step fails with stop-run', async () => {
    const ctx = makeCtx();
    const noopSteps: PipelineSteps = {
      run: [makeStep({
        id: 'run-fail',
        scope: 'run',
        onError: 'stop-run',
        run: async () => { throw new Error('run fail'); },
      })],
      package: [],
      product: [],
    };

    const result = await runPrebuildPipeline(ctx, noopSteps);
    assert.equal(result.exitCode, 1);
  });

  it('skips remaining product steps after skip-remaining failure', async () => {
    const ctx = makeCtx({ flavor: 'Debug' });
    ctx.packages = [{
      path: '/pkg',
      buildPath: '/build',
      packageName: 'test-pkg',
      packageVersion: '1.0.0',
      getSwiftPMConfiguration: () => ({
        products: [{
          name: 'TestProduct',
          podName: 'TestProduct',
          platforms: ['iOS(.v15)' as const],
          targets: [],
        }],
      }),
    }];
    ctx.reactNativeVersion = '0.76.0';
    ctx.hermesVersion = 'nightly';
    ctx.artifactsPath = '/cache';
    ctx.artifactsByFlavor.set('Debug', null);

    const ran: string[] = [];
    const steps: PipelineSteps = {
      run: [],
      package: [],
      product: [
        makeStep({
          id: 'generate',
          scope: 'product',
          onError: 'skip-remaining',
          run: async () => { throw new Error('gen fail'); },
        }),
        makeStep({
          id: 'build',
          scope: 'product',
          run: async () => { ran.push('build'); },
        }),
      ],
    };

    const result = await runPrebuildPipeline(ctx, steps);
    // Build step should not have run because generate returned skip-remaining
    assert.ok(!ran.includes('build'), 'build should have been skipped');
    // Exit code 1 because there's an error
    assert.equal(result.exitCode, 1);
    assert.equal(result.errors.length, 1);
  });

  it('continues with next unit after continue-policy failure', async () => {
    const ctx = makeCtx({ flavor: 'Debug' });
    ctx.packages = [{
      path: '/pkg',
      buildPath: '/build',
      packageName: 'test-pkg',
      packageVersion: '1.0.0',
      getSwiftPMConfiguration: () => ({
        products: [{
          name: 'TestProduct',
          podName: 'TestProduct',
          platforms: ['iOS(.v15)' as const],
          targets: [],
        }],
      }),
    }];
    ctx.reactNativeVersion = '0.76.0';
    ctx.hermesVersion = 'nightly';
    ctx.artifactsPath = '/cache';
    ctx.artifactsByFlavor.set('Debug', null);

    const ran: string[] = [];
    const steps: PipelineSteps = {
      run: [],
      package: [],
      product: [
        makeStep({
          id: 'verify',
          scope: 'product',
          onError: 'continue',
          run: async () => { throw new Error('verify fail'); },
        }),
        makeStep({
          id: 'post-verify',
          scope: 'product',
          run: async () => { ran.push('post-verify'); },
        }),
      ],
    };

    const result = await runPrebuildPipeline(ctx, steps);
    // The post-verify step should have run because verify uses continue policy
    assert.ok(ran.includes('post-verify'), 'post-verify should have run');
    // Exit code 1 because there's still an error recorded
    assert.equal(result.exitCode, 1);
  });

  it('returns exitCode 0 with no packages to process', async () => {
    const ctx = makeCtx();
    // No packages, so only run-scope steps execute
    const ran: string[] = [];
    const steps: PipelineSteps = {
      run: [makeStep({ id: 'run-step', scope: 'run', run: async () => { ran.push('run'); } })],
      package: [],
      product: [],
    };

    const result = await runPrebuildPipeline(ctx, steps);
    assert.equal(result.exitCode, 0);
    assert.deepEqual(ran, ['run']);
  });
});
