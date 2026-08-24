import { classifyChangedFiles } from '../classify';
import { buildImpactReport } from '../impactAsync';
import type { ImpactOptions } from '../resolveOptions';
import { DEFAULT_PRESET } from '../resolveOptions';
import type { PlatformImpact, RuntimeVersionInfo } from '../types';

function options(overrides: Partial<ImpactOptions> = {}): ImpactOptions {
  return {
    platform: 'all',
    mode: 'last-build',
    buildId: null,
    base: null,
    head: null,
    profile: null,
    preset: DEFAULT_PRESET,
    assert: null,
    json: true,
    followups: true,
    ...overrides,
  };
}

function platform(overrides: Partial<PlatformImpact> = {}): PlatformImpact {
  return {
    platform: 'ios',
    class: 'needs-native-build',
    fingerprintChanged: true,
    baseHash: 'aaaaaaaaaaaaaaaa',
    headHash: 'bbbbbbbbbbbbbbbb',
    changedSources: [],
    reasons: ['the autolinked native modules changed'],
    cachedBuild: null,
    caveats: [],
    ...overrides,
  };
}

const runtimeVersion: RuntimeVersionInfo = {
  policy: 'appVersion',
  literal: null,
  source: 'app.json',
};

function report(overrides: Partial<Parameters<typeof buildImpactReport>[0]> = {}) {
  return buildImpactReport({
    projectRoot: '/project',
    options: options(),
    platforms: [platform()],
    fileClass: null,
    changedFilesKnown: true,
    runtimeVersion,
    ...overrides,
  });
}

describe(buildImpactReport, () => {
  it(`pins the top-level keys of the payload`, () => {
    // The top-level keys are the de-facto version of this command (llp/0006 §Output contract).
    expect(Object.keys(report())).toEqual([
      'projectRoot',
      'comparison',
      'platforms',
      'ota',
      'class',
      'changedFiles',
      'caveats',
      'assertion',
      'followups',
    ]);
  });

  it(`should keep the key set complete when nothing was found`, () => {
    const empty = report({
      platforms: [platform({ class: 'js-only', fingerprintChanged: false, reasons: [] })],
      fileClass: classifyChangedFiles([]),
    });

    // A caller branching on `ota.safe` or on `assertion` must read a value, not a missing key.
    expect(empty.assertion).toBeNull();
    expect(empty.changedFiles).toEqual({ total: 0, native: 0, js: 0, config: 0 });
    expect(empty.ota.safe).toBe(true);
  });

  it(`pins the per-platform keys`, () => {
    expect(Object.keys(report().platforms[0]!)).toEqual([
      'platform',
      'class',
      'fingerprintChanged',
      'baseHash',
      'headHash',
      'changedSources',
      'reasons',
      'cachedBuild',
      'caveats',
    ]);
  });

  it(`pins the ota keys`, () => {
    expect(Object.keys(report().ota)).toEqual(['safe', 'runtimeVersion', 'why']);
  });

  describe('the class is the strongest across the platforms', () => {
    it(`should report the strongest of two platforms`, () => {
      const result = report({
        platforms: [
          platform({ platform: 'ios', class: 'js-only', fingerprintChanged: false }),
          platform({ platform: 'android', class: 'needs-native-build' }),
        ],
      });

      expect(result.class).toBe('needs-native-build');
    });

    it(`should fall through to the file-level class when no fingerprint moved`, () => {
      const result = report({
        platforms: [platform({ class: 'js-only', fingerprintChanged: false, reasons: [] })],
        fileClass: classifyChangedFiles(['metro.config.js']),
      });

      expect(result.class).toBe('dev-client-compatible');
      // …and the platform reports it too, so the two channels of one report agree.
      expect(result.platforms[0]!.class).toBe('dev-client-compatible');
      expect(result.platforms[0]!.reasons.join(' ')).toContain('metro.config.js');
    });

    it(`should not weaken a platform whose fingerprint could not be decided`, () => {
      // The state a project with no recorded build is in. Nothing has been shown about the native
      // surface, so the file-level answer has nothing to refine, and reporting the cheap class
      // would be a claim with no evidence — and would contradict `exagent dev`, which plans a
      // build for the same project (llp/0004 §Implemented in v1 as, item 2).
      const result = report({
        platforms: [platform({ class: 'needs-native-build', fingerprintChanged: null })],
        fileClass: classifyChangedFiles(['src/app/index.tsx']),
      });

      expect(result.class).toBe('needs-native-build');
      expect(result.platforms[0]!.class).toBe('needs-native-build');
    });

    it(`should not weaken a platform whose fingerprint did move`, () => {
      const result = report({
        platforms: [platform({ class: 'needs-native-build' })],
        fileClass: classifyChangedFiles(['src/app/index.tsx']),
      });

      expect(result.platforms[0]!.class).toBe('needs-native-build');
    });
  });

  describe('ota safety comes from the policy, never from the class', () => {
    it(`should report an unsafe update for a needs-native-build change under appVersion`, () => {
      expect(report().ota.safe).toBe(false);
    });

    it(`should report a safe update for the same change under the fingerprint policy`, () => {
      // Same class, opposite verdict. This is the whole reason the two are computed apart.
      const result = report({
        runtimeVersion: { policy: 'fingerprint', literal: null, source: 'app.json' },
      });

      expect(result.class).toBe('needs-native-build');
      expect(result.ota.safe).toBe(true);
    });

    it(`should report unknown when one platform could not be decided`, () => {
      const result = report({
        platforms: [
          platform({ class: 'js-only', fingerprintChanged: false }),
          platform({ platform: 'android', class: 'js-only', fingerprintChanged: null }),
        ],
      });

      // An undecidable platform beside an unchanged one leaves the whole answer undecidable,
      // rather than letting the confident half speak for both.
      expect(result.ota.safe).toBeNull();
    });
  });

  describe('--assert', () => {
    it(`should pass when the real class is the asserted one`, () => {
      const result = report({ options: options({ assert: 'needs-native-build' }) });

      expect(result.assertion).toEqual({ asserted: 'needs-native-build', ok: true });
    });

    it(`should pass when the real class is weaker than the asserted one`, () => {
      const result = report({
        options: options({ assert: 'needs-native-build' }),
        platforms: [platform({ class: 'js-only', fingerprintChanged: false })],
      });

      expect(result.assertion!.ok).toBe(true);
    });

    it(`should fail when the real class is stronger`, () => {
      const result = report({ options: options({ assert: 'js-only' }) });

      expect(result.assertion).toEqual({ asserted: 'js-only', ok: false });
    });
  });

  describe('caveats', () => {
    it(`should always report the preset both sides were computed under`, () => {
      expect(report().caveats.join(' ')).toContain(`"${DEFAULT_PRESET}" fingerprint preset`);
    });

    it(`should say when no build profile was applied`, () => {
      expect(report().caveats.join(' ')).toContain('No --profile was given');
    });

    it(`should say a named profile was reported and not applied`, () => {
      // The local fingerprint CLI has no way to apply an eas.json profile's environment, and
      // claiming otherwise would be the report inventing precision it does not have.
      const result = report({ options: options({ profile: 'production' }) });

      expect(result.caveats.join(' ')).toContain('reported and not applied');
    });

    it(`should carry a platform's caveat up to the top level`, () => {
      const result = report({
        platforms: [platform({ caveats: ['No build is recorded for ios'] })],
      });

      expect(result.caveats).toContain('No build is recorded for ios');
    });

    it(`should report each caveat once when both platforms raised it`, () => {
      const result = report({
        platforms: [
          platform({ caveats: ['same caveat'] }),
          platform({ platform: 'android', caveats: ['same caveat'] }),
        ],
      });

      expect(result.caveats.filter((caveat) => caveat === 'same caveat')).toHaveLength(1);
    });

    it(`should say when the project is not in a git work tree`, () => {
      const result = report({
        platforms: [platform({ class: 'js-only', fingerprintChanged: false })],
        changedFilesKnown: false,
      });

      expect(result.caveats.join(' ')).toContain('not in a git work tree');
    });
  });

  describe('follow-ups', () => {
    it(`should suggest the cached build over starting a new one`, () => {
      const result = report({
        platforms: [
          platform({
            cachedBuild: {
              id: 'build-1',
              status: 'FINISHED',
              platform: 'IOS',
              buildProfile: 'development',
              createdAt: null,
              buildUrl: null,
            },
          }),
        ],
      });

      expect(result.followups[0]!.id).toBe('impact-cached-build');
      expect(result.followups[0]!.command).toContain('build-1');
    });

    it(`should suggest a build when EAS has no cached one`, () => {
      expect(report().followups[0]!.id).toBe('impact-native-build');
    });

    it(`should warn before an update when the policy makes one unsafe`, () => {
      expect(report().followups.map((followup) => followup.id)).toContain('impact-ota-unsafe');
    });

    it(`should be empty with --no-followups`, () => {
      expect(report({ options: options({ followups: false }) }).followups).toEqual([]);
    });
  });

  it(`should report the comparison the mode names`, () => {
    const result = report({ options: options({ mode: 'eas-build', buildId: 'build-9' }) });

    expect(result.comparison).toEqual({
      kind: 'eas-build',
      base: { label: 'EAS build build-9', hash: 'aaaaaaaaaaaaaaaa' },
      head: { label: 'working tree', hash: 'bbbbbbbbbbbbbbbb' },
      preset: DEFAULT_PRESET,
    });
  });
});
