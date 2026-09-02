import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  computeRunConclusionCounts,
  computeWorkflowStats,
  formatSuccessRate,
} from './GitHubMetricsCommand';

function runs(conclusions: (string | null)[]) {
  return conclusions.map((conclusion) => ({ conclusion }));
}

function repeat(conclusion: string | null, count: number) {
  return Array.from({ length: count }, () => conclusion);
}

function workflowRun(workflowId: number, name: string | null, filePath: string) {
  return { workflow_id: workflowId, name, path: filePath, conclusion: 'success' };
}

describe('computeRunConclusionCounts', () => {
  it('rates all-successful runs at 100%', () => {
    const result = computeRunConclusionCounts(runs(['success', 'success']));
    assert.equal(result.successRate, 100);
  });

  it('counts cancelled runs as successful', () => {
    const result = computeRunConclusionCounts(runs(['success', 'cancelled', 'failure']));
    assert.equal(result.resolvedRuns, 3);
    assert.equal(result.successRate, (2 / 3) * 100);
  });

  it('excludes skipped runs from the success-rate denominator', () => {
    const result = computeRunConclusionCounts(runs(['skipped', 'skipped', 'skipped', 'success']));
    assert.equal(result.skippedRuns, 3);
    assert.equal(result.resolvedRuns, 1);
    assert.equal(result.successRate, 100);
  });

  it('does not divide by zero when every run was skipped', () => {
    const result = computeRunConclusionCounts(runs(['skipped', 'skipped']));
    assert.equal(result.resolvedRuns, 0);
    assert.equal(result.successRate, 0);
  });

  it('excludes unresolved runs (in progress, queued, neutral) from the denominator', () => {
    const result = computeRunConclusionCounts(runs([null, 'neutral', 'success']));
    assert.equal(result.otherRuns, 2);
    assert.equal(result.resolvedRuns, 1);
    assert.equal(result.successRate, 100);
  });

  it('reports the resolved success rate for a real week of runs', () => {
    const result = computeRunConclusionCounts(
      runs([
        ...repeat('success', 335),
        ...repeat('failure', 31),
        ...repeat('cancelled', 96),
        ...repeat('skipped', 468),
        ...repeat(null, 70),
      ])
    );

    assert.equal(result.totalRuns, 1000);
    assert.equal(result.otherRuns, 70);
    assert.equal(result.resolvedRuns, 462);
    assert.equal(result.successRate.toFixed(1), '93.3');
    assert.notEqual(result.successRate.toFixed(1), '81.0');
  });

  it('rates a failure-free set at 100% however many runs are still unresolved', () => {
    const result = computeRunConclusionCounts(
      runs(['success', 'cancelled', null, 'action_required', 'queued'])
    );
    assert.equal(result.failedRuns, 0);
    assert.equal(result.successRate, 100);
  });
});

describe('formatSuccessRate', () => {
  it('has no rate to report when nothing resolved', () => {
    const result = computeRunConclusionCounts(runs([null, null, 'action_required']));
    assert.equal(formatSuccessRate(result), 'N/A (no executed runs)');
  });

  it('rounds the resolved rate to one decimal', () => {
    const result = computeRunConclusionCounts(
      runs([...repeat('success', 431), ...repeat('failure', 31), ...repeat(null, 70)])
    );
    assert.equal(formatSuccessRate(result), '93.3%');
  });
});

describe('computeWorkflowStats', () => {
  const verifyPath = '.github/workflows/verify-comment.yml';

  it('groups runs of one workflow together despite dynamic run names', () => {
    const stats = computeWorkflowStats([
      workflowRun(342612912, 'verify', verifyPath),
      workflowRun(342612912, 'verify #49383 — expo-bot', verifyPath),
      workflowRun(342612912, 'verify #48626 — brentvatne', verifyPath),
    ]);

    assert.equal(stats.length, 1);
    assert.equal(stats[0].name, 'verify');
    assert.equal(stats[0].totalRuns, 3);
  });

  it('keeps distinct workflows apart even when they share a name', () => {
    const stats = computeWorkflowStats([
      workflowRun(1, 'test', '.github/workflows/test-suite.yml'),
      workflowRun(2, 'test', '.github/workflows/test-tools.yml'),
    ]);

    assert.equal(stats.length, 2);
  });

  it('falls back to the workflow file name when no run is named', () => {
    const stats = computeWorkflowStats([
      workflowRun(1, null, verifyPath),
      workflowRun(1, null, verifyPath),
    ]);

    assert.deepEqual(
      stats.map((workflow) => workflow.name),
      ['verify-comment.yml']
    );
  });

  it('breaks shortest-name ties alphabetically', () => {
    const stats = computeWorkflowStats([
      workflowRun(1, 'beta', verifyPath),
      workflowRun(1, 'alfa', verifyPath),
    ]);

    assert.equal(stats[0].name, 'alfa');
  });

  it('orders workflows by total runs, descending', () => {
    const stats = computeWorkflowStats([
      workflowRun(1, 'once', '.github/workflows/once.yml'),
      workflowRun(2, 'twice', '.github/workflows/twice.yml'),
      workflowRun(2, 'twice', '.github/workflows/twice.yml'),
    ]);

    assert.deepEqual(
      stats.map((workflow) => workflow.name),
      ['twice', 'once']
    );
  });
});
