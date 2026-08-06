import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computeRunConclusionCounts } from './GitHubMetricsCommand';

function runs(conclusions: (string | null)[]) {
  return conclusions.map((conclusion) => ({ conclusion }));
}

describe('computeRunConclusionCounts', () => {
  it('rates all-successful runs at 100%', () => {
    const result = computeRunConclusionCounts(runs(['success', 'success']));
    assert.equal(result.successRate, 100);
  });

  it('counts cancelled runs as successful', () => {
    const result = computeRunConclusionCounts(runs(['success', 'cancelled', 'failure']));
    assert.equal(result.totalRuns - result.skippedRuns, 3);
    assert.equal(result.successRate, (2 / 3) * 100);
  });

  it('excludes skipped runs from the success-rate denominator', () => {
    const result = computeRunConclusionCounts(runs(['skipped', 'skipped', 'skipped', 'success']));
    assert.equal(result.skippedRuns, 3);
    assert.equal(result.totalRuns - result.skippedRuns, 1);
    assert.equal(result.successRate, 100);
  });

  it('does not divide by zero when every run was skipped', () => {
    const result = computeRunConclusionCounts(runs(['skipped', 'skipped']));
    assert.equal(result.totalRuns - result.skippedRuns, 0);
    assert.equal(result.successRate, 0);
  });

  it('leaves ambiguous conclusions (in progress, neutral, etc.) in the denominator', () => {
    const result = computeRunConclusionCounts(runs([null, 'neutral', 'success']));
    assert.equal(result.otherRuns, 2);
    assert.equal(result.totalRuns - result.skippedRuns, 3);
    assert.equal(result.successRate, (1 / 3) * 100);
  });
});
