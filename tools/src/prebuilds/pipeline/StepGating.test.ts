/**
 * Tests for step gating — each step's `shouldRun` evaluated against
 * a minimal PrebuildContext built from createRequest/createContext.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createRequest, createContext } from './Context';
import type { PrebuildCliOptions } from './Context';

// Import individual steps
import { prepareInputsStep, prepareCacheStep } from './RunSteps';
import { cleanPackageStep } from './PackageSteps';
import { cleanProductStep, generateStep, buildStep, composeStep, verifyStep } from './ProductSteps';

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
      prepareInputsStep.shouldRun(
        ctxWith({ clean: true, cleanCache: true, skipGenerate: true })
      ),
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
