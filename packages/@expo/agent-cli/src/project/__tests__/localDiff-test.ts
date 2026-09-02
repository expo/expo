// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
//
// The whole point of this module is that it agrees with the CLI it replaces, so the first test is
// the only one that really matters: the same pair of fingerprints, and the item list the **real**
// `fingerprint:diff` printed for it. See `src/__fixtures__/fingerprint/README.md` for provenance.

import recordedBase from '../../__fixtures__/fingerprint/diff-base.json';
import recordedHead from '../../__fixtures__/fingerprint/diff-head.json';
import recordedItems from '../../__fixtures__/fingerprint/diff-items.json';
import type { FingerprintDiffItem, FingerprintSource } from '../fingerprint';
import { diffFingerprintSourcesLocally, sourceIdentity } from '../localDiff';

/** Order-insensitive comparison: this join is keyed, and the CLI's is a merge over sorted lists. */
function normalize(items: FingerprintDiffItem[]): string[] {
  return items
    .map((item) => {
      switch (item.op) {
        case 'added':
          return `added ${sourceIdentity(item.addedSource)}`;
        case 'removed':
          return `removed ${sourceIdentity(item.removedSource)}`;
        case 'changed':
          return `changed ${sourceIdentity(item.afterSource)} ${item.beforeSource.hash}->${item.afterSource.hash}`;
      }
    })
    .sort();
}

const base = recordedBase.sources as FingerprintSource[];
const head = recordedHead.sources as FingerprintSource[];

describe(diffFingerprintSourcesLocally, () => {
  it(`should produce exactly what the real fingerprint:diff produced for the same pair`, () => {
    const items = diffFingerprintSourcesLocally(base, head);

    expect(normalize(items)).toEqual(normalize(recordedItems as FingerprintDiffItem[]));
  });

  // The rule a reimplementation is most likely to get wrong, and the recorded diff proves it: a
  // package's identity is `name@version`, so a bump is two items rather than one.
  it(`should report a package version bump as a removal and an addition`, () => {
    const items = diffFingerprintSourcesLocally(base, head);
    const packages = items.filter((item) =>
      normalize([item])[0]!.includes('@react-native-masked-view/masked-view')
    );

    expect(normalize(packages)).toEqual([
      'added package:@react-native-masked-view/masked-view@9.9.9',
      'removed package:@react-native-masked-view/masked-view@0.3.2',
    ]);
  });

  it(`should answer an empty diff for two identical lists`, () => {
    expect(diffFingerprintSourcesLocally(base, base)).toEqual([]);
  });

  it(`should report every source as added when nothing was there before`, () => {
    const items = diffFingerprintSourcesLocally([], head);

    expect(items).toHaveLength(head.length);
    expect(items.every((item) => item.op === 'added')).toBe(true);
  });

  it(`should report every source as removed when nothing is there now`, () => {
    const items = diffFingerprintSourcesLocally(base, []);

    expect(items.every((item) => item.op === 'removed')).toBe(true);
  });

  // A keyed join, not a merge over sorted lists: the CLI can re-order its output without this
  // reporting a project's whole native surface as replaced.
  it(`should not depend on the order the sources arrive in`, () => {
    const shuffled = [...head].reverse();

    expect(normalize(diffFingerprintSourcesLocally(base, shuffled))).toEqual(
      normalize(diffFingerprintSourcesLocally(base, head))
    );
  });

  it(`should keep both sides of a changed source, the way the classifier reads them`, () => {
    const changed = diffFingerprintSourcesLocally(base, head).find((item) => item.op === 'changed');

    expect(changed).toMatchObject({
      op: 'changed',
      beforeSource: { type: 'dir' },
      afterSource: { type: 'dir', hash: '0000000000000000000000000000000000000000' },
    });
  });

  // Two sources that cannot be told apart cannot be diffed, and inventing an identity for them
  // would silently pair the wrong two.
  it(`should drop a source with no identity rather than guess one`, () => {
    const nameless = [{ type: 'file', reasons: ['expoConfig'], hash: 'a' } as FingerprintSource];

    expect(diffFingerprintSourcesLocally(nameless, nameless)).toEqual([]);
    expect(diffFingerprintSourcesLocally([], nameless)).toEqual([]);
  });
});

describe(sourceIdentity, () => {
  // Ported from `packages/@expo/fingerprint/src/Sort.ts` `compareSource`, which is what decides
  // whether two sources are the same source.
  it.each([
    [{ type: 'file', filePath: 'app.json' }, 'file:app.json'],
    [{ type: 'file', filePath: 'app.json', overrideHashKey: 'k' }, 'file:k'],
    [{ type: 'dir', filePath: 'ios' }, 'dir:ios'],
    [{ type: 'contents', id: 'expoAutolinkingConfig:ios' }, 'contents:expoAutolinkingConfig:ios'],
    [{ type: 'package', name: 'expo', version: '57.0.0' }, 'package:expo@57.0.0'],
    [{ type: 'package', name: 'expo', version: '1', overrideHashKey: 'k' }, 'package:k'],
  ])(`should identify %j`, (source, identity) => {
    expect(sourceIdentity(source as FingerprintSource)).toBe(identity);
  });

  it.each([
    [{ type: 'file' }],
    [{ type: 'contents' }],
    [{ type: 'package', name: 'expo' }],
    [{ filePath: 'app.json' }],
    [{ type: 'whatever-is-next', filePath: 'app.json' }],
  ])(`should answer null for %j, which nothing can be matched against`, (source) => {
    expect(sourceIdentity(source as FingerprintSource)).toBeNull();
  });
});
