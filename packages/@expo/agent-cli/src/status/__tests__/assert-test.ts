// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
//
// Three outcomes, and the one that matters most is the middle one: a gate that returned 0 because
// nothing was measured would not be a gate.

import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../../exitCodes';
import type { ImpactClass } from '../../impact/types';
import { buildAssertStatus, strongestClass } from '../assert';
import type { FingerprintHashSource, FreshnessStatus } from '../types';
/**
 * A fingerprint this run measured, which is what every case here assumes unless it says otherwise.
 *
 * @ref llp/0023-fingerprint-caching.rfc.md §The report says where the answer came from
 */
const COMPUTED_FINGERPRINT: FingerprintHashSource = {
  source: 'computed',
  revalidatedAgainst: null,
  keyKind: null,
  computedAt: null,
  ageMs: null,
  caveats: [],
};

/**
 * A freshness section with one entry per class.
 *
 * `null` means the platform has **no recorded build** — the case the gate skips. Use
 * {@link unmeasured} for the other null, the one that makes the whole answer unknown.
 */
function freshness(...classes: (ImpactClass | null)[]): FreshnessStatus {
  return {
    hash: 'abc',
    comparison: {
      kind: 'last-build',
      label: 'last build recorded by @expo/agent-cli',
      buildId: null,
      platform: null,
    },
    changedFiles: null,
    hashSource: COMPUTED_FINGERPRINT,
    ota: null,
    platforms: classes.map((impactClass, index) => ({
      platform: index === 0 ? ('ios' as const) : ('android' as const),
      backend: 'local' as const,
      state: 'stale' as const,
      detail: '',
      recordedHash: impactClass ? 'recorded-hash' : null,
      buildId: null,
      buildProfile: null,
      impact: {
        class: impactClass,
        fingerprintChanged: impactClass !== 'js-only',
        reason: impactClass ? `the ${impactClass} reason` : 'no build is recorded for ios',
        changedCount: null,
        changedSources: null,
      },
    })),
  };
}

/** A platform that *was* built here and whose cost could not be measured — a v1 record. */
function unmeasured(): FreshnessStatus {
  const value = freshness(null);
  value.platforms[0]!.recordedHash = 'recorded-hash';
  value.platforms[0]!.impact!.reason = 'the recorded ios build stored only a hash';
  return value;
}

describe(strongestClass, () => {
  it(`should take the strongest class across the platforms`, () => {
    expect(strongestClass(freshness('js-only', 'needs-native-build'))).toBe('needs-native-build');
    expect(strongestClass(freshness('dev-client-compatible', 'js-only'))).toBe(
      'dev-client-compatible'
    );
  });

  // The distinction that keeps `--assert` usable: a platform this project has never built for is
  // not a platform whose cost is unknown, it is one with nothing to be wrong about. Requiring both
  // would make the gate permanently inconclusive for the ordinary single-platform project.
  it(`should ignore a platform with no recorded build`, () => {
    expect(strongestClass(freshness('js-only', null))).toBe('js-only');
  });

  // The other null: built here, and the record cannot say what it cost.
  it(`should answer null for a platform that was built and could not be measured`, () => {
    expect(strongestClass(unmeasured())).toBeNull();
  });

  it(`should answer null when no platform established anything`, () => {
    expect(strongestClass(freshness(null))).toBeNull();
  });

  it(`should answer null for a report with no freshness section at all`, () => {
    expect(strongestClass(null)).toBeNull();
  });
});

describe(buildAssertStatus, () => {
  it(`should pass when the real class is exactly the asserted one`, () => {
    const assertion = buildAssertStatus('js-only', freshness('js-only'));

    expect(assertion).toMatchObject({
      asserted: 'js-only',
      actual: 'js-only',
      ok: true,
      exitCode: EXIT_OK,
    });
  });

  it(`should pass when the real class is weaker than the asserted one`, () => {
    expect(buildAssertStatus('needs-native-build', freshness('js-only'))).toMatchObject({
      ok: true,
      exitCode: EXIT_OK,
    });
  });

  it(`should fail with 20 when the change costs more than asserted`, () => {
    const assertion = buildAssertStatus('js-only', freshness('needs-native-build'));

    expect(assertion).toMatchObject({
      asserted: 'js-only',
      actual: 'needs-native-build',
      ok: false,
      exitCode: EXIT_OUTCOME_FAILED,
    });
    expect(assertion.reason).toContain('costs "needs-native-build"');
    // The sentence that carried the class, so a failing gate says what tripped it.
    expect(assertion.reason).toContain(': the needs-native-build reason');
    // Never capitalized: a reason that begins with a path would become `Apps/…/tsconfig.json`.
    expect(assertion.reason).not.toContain('The needs-native-build reason');
  });

  // The distinction that keeps this from being a two-outcome gate: `20` means change the code or
  // raise the assertion, `22` means give the gate something to measure.
  it(`should fail with 22 when no class could be established`, () => {
    const assertion = buildAssertStatus('js-only', freshness(null));

    expect(assertion).toMatchObject({
      asserted: 'js-only',
      actual: null,
      ok: false,
      exitCode: EXIT_OUTCOME_TIMEOUT,
    });
    expect(assertion.reason).toContain('No class could be established');
    // The cause, verbatim in the words the freshness section already used — these sentences often
    // begin with a path, so nothing capitalizes them.
    expect(assertion.reason).toContain('no build is recorded for ios');
  });

  it(`should fail with 22 for a project that could not be probed at all`, () => {
    const assertion = buildAssertStatus('needs-native-build', null);

    expect(assertion).toMatchObject({ ok: false, exitCode: EXIT_OUTCOME_TIMEOUT, actual: null });
    expect(assertion.reason).toContain('the project could not be probed');
  });

  // The strictest gate on the cheapest change, which is the shape a CI line takes.
  it.each([
    ['js-only', 'js-only', true],
    ['js-only', 'dev-client-compatible', false],
    ['js-only', 'needs-native-build', false],
    ['dev-client-compatible', 'dev-client-compatible', true],
    ['dev-client-compatible', 'needs-native-build', false],
    ['needs-native-build', 'needs-native-build', true],
  ])(`--assert %s against a real %s should pass: %s`, (asserted, actual, ok) => {
    expect(buildAssertStatus(asserted as ImpactClass, freshness(actual as ImpactClass)).ok).toBe(
      ok
    );
  });
});
