// @ref llp/0011-impact-and-freshness.rfc.md §Two commands, one classifier
//
// The headline `exagent status` prints for free. The tests that matter are the ones about what it
// refuses to say: this answers `null` wherever `exagent impact` answers `needs-native-build`,
// because a gate has to name a class and a report does not.

import type { LastBuildFingerprint } from '../../plan/lastBuild';
import type { FingerprintSource } from '../../project/fingerprint';
import { classifyAgainstRecordedBuild } from '../fromRecord';

/** One autolinked native module, in the shape the sourcer emits. */
function nativeModule(hash: string): FingerprintSource {
  return {
    type: 'dir',
    filePath: 'node_modules/react-native-mmkv',
    reasons: ['rncoreAutolinkingIos'],
    hash,
  };
}

/** A file outside the native surface as far as the fingerprint is concerned. */
function appConfig(hash: string): FingerprintSource {
  return { type: 'file', filePath: 'app.json', reasons: ['expoConfig'], hash };
}

function recorded(hash: string, sources: FingerprintSource[] | null): LastBuildFingerprint {
  return { hash, sources };
}

describe(classifyAgainstRecordedBuild, () => {
  it(`should classify an added autolinked module as needing a native build`, () => {
    const impact = classifyAgainstRecordedBuild('ios', recorded('base', [appConfig('a')]), {
      hash: 'head',
      sources: [appConfig('a'), nativeModule('b')],
    });

    expect(impact).toMatchObject({
      class: 'needs-native-build',
      fingerprintChanged: true,
      changedCount: 1,
    });
    expect(impact.reason).toContain('autolinked native modules changed');
    expect(impact.changedSources).toEqual([
      expect.objectContaining({
        op: 'added',
        path: 'node_modules/react-native-mmkv',
        kind: 'native-module',
      }),
    ]);
  });

  // An empty diff is decided, not a fallback: the sources were compared one by one.
  it(`should classify an unmoved native surface as js-only`, () => {
    const sources = [appConfig('a'), nativeModule('b')];

    const impact = classifyAgainstRecordedBuild('ios', recorded('same', sources), {
      hash: 'same',
      sources,
    });

    expect(impact).toMatchObject({
      class: 'js-only',
      fingerprintChanged: false,
      changedCount: 0,
      changedSources: [],
    });
    expect(impact.reason).toContain('unchanged');
  });

  it(`should take the strongest class when several kinds moved at once`, () => {
    const impact = classifyAgainstRecordedBuild('android', recorded('base', [appConfig('a')]), {
      hash: 'head',
      sources: [appConfig('changed'), nativeModule('b')],
    });

    expect(impact.class).toBe('needs-native-build');
    expect(impact.changedCount).toBe(2);
  });

  describe('what it refuses to classify', () => {
    it(`should answer null when the working tree could not be fingerprinted`, () => {
      const impact = classifyAgainstRecordedBuild('ios', recorded('base', [appConfig('a')]), {
        hash: null,
        sources: null,
      });

      expect(impact).toMatchObject({ class: null, fingerprintChanged: null, changedCount: null });
      expect(impact.reason).toContain('could not be fingerprinted');
    });

    // The case `exagent impact` calls `needs-native-build`. Nothing was compared, so nothing was
    // established, and the freshness line beside this already says "no recorded build".
    it(`should answer null when nothing is recorded for the platform`, () => {
      const impact = classifyAgainstRecordedBuild('ios', null, {
        hash: 'head',
        sources: [appConfig('a')],
      });

      expect(impact.class).toBeNull();
      expect(impact.fingerprintChanged).toBeNull();
      expect(impact.reason).toContain('no build is recorded for ios');
    });

    // A v1 record is a bare hash. It can still answer *whether* the surface moved.
    it(`should still answer whether the surface moved for a record with no sources`, () => {
      const impact = classifyAgainstRecordedBuild('ios', recorded('base', null), {
        hash: 'head',
        sources: [appConfig('a')],
      });

      expect(impact).toMatchObject({ class: null, fingerprintChanged: true, changedCount: null });
      expect(impact.reason).toContain('stored only a hash');
    });

    it(`should report an unmoved surface as unchanged even with no sources to diff`, () => {
      const impact = classifyAgainstRecordedBuild('ios', recorded('same', null), {
        hash: 'same',
        sources: null,
      });

      expect(impact).toMatchObject({ class: null, fingerprintChanged: false });
    });

    it(`should answer null when the fingerprint CLI returned a hash with no sources`, () => {
      const impact = classifyAgainstRecordedBuild('ios', recorded('base', [appConfig('a')]), {
        hash: 'head',
        sources: null,
      });

      expect(impact).toMatchObject({ class: null, fingerprintChanged: true });
      expect(impact.reason).toContain('no sources');
    });
  });

  // No subprocess, no promise: the whole reason this exists rather than reusing `impact`'s path.
  it(`should be synchronous, so a status line costs nothing to produce`, () => {
    const result = classifyAgainstRecordedBuild('ios', recorded('base', [appConfig('a')]), {
      hash: 'head',
      sources: [appConfig('b')],
    });

    expect(result).not.toHaveProperty('then');
  });
});
