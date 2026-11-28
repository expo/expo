/**
 * Tests for step gating — each step's `shouldRun` evaluated against
 * a minimal PrebuildContext built from createRequest/createContext.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SPMPackageSource } from '../ExternalPackage';
import type { BuildFlavor } from '../Prebuilder.types';
import type { SPMProduct } from '../SPMConfig.types';
import { createRequest, createContext } from './Context';
import type { PrebuildCliOptions } from './Context';
import { cleanPackageStep } from './PackageSteps';
import { cleanProductStep, generateStep, buildStep, composeStep, verifyStep } from './ProductSteps';
import { prepareInputsStep, prepareCacheStep } from './RunSteps';

// ---------------------------------------------------------------------------
// Helper: build a context from partial CLI options
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

function ctxWith(overrides: Partial<PrebuildCliOptions> = {}) {
  const opts = { ...defaultOptions, ...overrides };
  const request = createRequest([], opts);
  return createContext(request);
}

// ---------------------------------------------------------------------------
// prepare:inputs — always runs
// ---------------------------------------------------------------------------

describe('prepare:inputs shouldRun', () => {
  it('returns true with default options', () => {
    assert.equal(prepareInputsStep.shouldRun(ctxWith()), true);
  });

  it('returns true regardless of flags', () => {
    assert.equal(
      prepareInputsStep.shouldRun(ctxWith({ clean: true, cleanCache: true, skipGenerate: true })),
      true
    );
  });
});

// ---------------------------------------------------------------------------
// prepare:cache — gated by cleanCache
// ---------------------------------------------------------------------------

describe('prepare:cache shouldRun', () => {
  it('returns false when cleanCache is false', () => {
    assert.equal(prepareCacheStep.shouldRun(ctxWith({ cleanCache: false })), false);
  });

  it('returns true when cleanCache is true', () => {
    assert.equal(prepareCacheStep.shouldRun(ctxWith({ cleanCache: true })), true);
  });
});

// ---------------------------------------------------------------------------
// clean:package — gated by clean
// ---------------------------------------------------------------------------

describe('clean:package shouldRun', () => {
  it('returns false when clean is false', () => {
    assert.equal(cleanPackageStep.shouldRun(ctxWith({ clean: false })), false);
  });

  it('returns true when clean is true', () => {
    assert.equal(cleanPackageStep.shouldRun(ctxWith({ clean: true })), true);
  });
});

// ---------------------------------------------------------------------------
// clean:product — gated by clean
// ---------------------------------------------------------------------------

describe('clean:product shouldRun', () => {
  it('returns false when clean is false', () => {
    assert.equal(cleanProductStep.shouldRun(ctxWith({ clean: false })), false);
  });

  it('returns true when clean is true', () => {
    assert.equal(cleanProductStep.shouldRun(ctxWith({ clean: true })), true);
  });
});

// ---------------------------------------------------------------------------
// generate — gated by skipGenerate (inverted)
// ---------------------------------------------------------------------------

describe('generate shouldRun', () => {
  it('returns true when skipGenerate is false', () => {
    assert.equal(generateStep.shouldRun(ctxWith({ skipGenerate: false })), true);
  });

  it('returns false when skipGenerate is true', () => {
    assert.equal(generateStep.shouldRun(ctxWith({ skipGenerate: true })), false);
  });
});

// ---------------------------------------------------------------------------
// build — gated by skipBuild (inverted)
// ---------------------------------------------------------------------------

describe('build shouldRun', () => {
  it('returns true when skipBuild is false', () => {
    assert.equal(buildStep.shouldRun(ctxWith({ skipBuild: false })), true);
  });

  it('returns false when skipBuild is true', () => {
    assert.equal(buildStep.shouldRun(ctxWith({ skipBuild: true })), false);
  });
});

// ---------------------------------------------------------------------------
// compose — gated by skipCompose (inverted)
// ---------------------------------------------------------------------------

describe('compose shouldRun', () => {
  it('returns true when skipCompose is false', () => {
    assert.equal(composeStep.shouldRun(ctxWith({ skipCompose: false })), true);
  });

  it('returns false when skipCompose is true', () => {
    assert.equal(composeStep.shouldRun(ctxWith({ skipCompose: true })), false);
  });
});

// ---------------------------------------------------------------------------
// verify — gated by skipVerify (inverted)
// ---------------------------------------------------------------------------

describe('verify shouldRun', () => {
  it('returns true when skipVerify is false', () => {
    assert.equal(verifyStep.shouldRun(ctxWith({ skipVerify: false })), true);
  });

  it('returns false when skipVerify is true', () => {
    assert.equal(verifyStep.shouldRun(ctxWith({ skipVerify: true })), false);
  });
});

// ---------------------------------------------------------------------------
// apple.debugOnly — the Release flavor is made from Debug, not built
// ---------------------------------------------------------------------------

describe('debug-only package gating', () => {
  const product: SPMProduct = {
    name: 'DevTool',
    podName: 'DevTool',
    platforms: ['iOS(.v15)'],
    targets: [],
  };

  const pkg = (appleDebugOnly?: boolean): SPMPackageSource => ({
    path: '/packages/dev-tool',
    buildPath: '/packages/precompile/.build/dev-tool',
    packageName: 'dev-tool',
    packageVersion: '1.0.0',
    getSwiftPMConfiguration: () => ({ products: [product] }),
    appleDebugOnly,
  });

  function unitCtx(unitPackage: SPMPackageSource, flavor: BuildFlavor) {
    const ctx = ctxWith({ clean: true });
    ctx.currentPackage = unitPackage;
    ctx.currentProduct = product;
    ctx.currentFlavor = flavor;
    return ctx;
  }

  it('skips clean, generate and build only for the Release flavor of a debug-only package', () => {
    const units: [SPMPackageSource, BuildFlavor, boolean][] = [
      [pkg(true), 'Release', false],
      [pkg(true), 'Debug', true],
      [pkg(false), 'Release', true],
      [pkg(), 'Release', true],
    ];
    for (const [unitPackage, flavor, builds] of units) {
      const ctx = unitCtx(unitPackage, flavor);
      const label = `appleDebugOnly ${unitPackage.appleDebugOnly}, ${flavor}`;
      assert.equal(cleanProductStep.shouldRun(ctx), builds, `clean:product for ${label}`);
      assert.equal(generateStep.shouldRun(ctx), builds, `generate for ${label}`);
      assert.equal(buildStep.shouldRun(ctx), builds, `build for ${label}`);
      assert.equal(composeStep.shouldRun(ctx), true, `compose for ${label}`);
      assert.equal(verifyStep.shouldRun(ctx), true, `verify for ${label}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Step metadata sanity
// ---------------------------------------------------------------------------

describe('step metadata', () => {
  const allSteps = [
    prepareInputsStep,
    prepareCacheStep,
    cleanPackageStep,
    cleanProductStep,
    generateStep,
    buildStep,
    composeStep,
    verifyStep,
  ];

  it('every step has a unique id', () => {
    const ids = allSteps.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `Duplicate step ids: ${ids}`);
  });

  it('every step has a valid onError policy', () => {
    for (const step of allSteps) {
      assert.ok(
        ['stop-run', 'skip-remaining', 'continue'].includes(step.onError),
        `Step ${step.id} has invalid onError: ${step.onError}`
      );
    }
  });

  it('every step has a valid scope', () => {
    for (const step of allSteps) {
      assert.ok(
        ['run', 'package', 'product'].includes(step.scope),
        `Step ${step.id} has invalid scope: ${step.scope}`
      );
    }
  });
});
