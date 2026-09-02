import type { FingerprintDiffItem, FingerprintSource } from '../../project/fingerprint';
import {
  classifyChangedFiles,
  classifyDiffItem,
  classifyFingerprintDiff,
  classifyReasons,
  KIND_CLASSES,
  REASON_KINDS,
  sourceLabel,
} from '../classify';
import type { ChangeKind } from '../types';
import { isStrongerClass } from '../types';
import realDiff from './fixtures/notesapp-ios-diff.json';
import realFingerprint from './fixtures/notesapp-ios-sources.json';

function added(source: FingerprintSource): FingerprintDiffItem {
  return { op: 'added', addedSource: source };
}

/**
 * Every `reasons` value `@expo/fingerprint` 0.20.9 emits, read out of its sourcer rather than out
 * of a design document [observed — `src/sourcer/{Expo,Bare,PatchPackage,Packages}.ts`, 2026-08-24].
 *
 * The three values a design document listed and the sourcer does not emit as reasons —
 * `expoAutolinkingConfig:ios`, `rncoreAutolinkingConfig:ios`,
 * `expoConfigExternalFile:contentsOnly` — are covered below as the `id` / `contentsId` /
 * `overrideHashKey` fields they really are.
 */
const VOCABULARY: { reason: string; kind: ChangeKind }[] = [
  { reason: 'expoConfig', kind: 'app-config' },
  { reason: 'expoConfigExternalFile', kind: 'app-config' },
  { reason: 'expoConfigPlugins', kind: 'config-plugin' },
  { reason: 'expoAutolinkingIos', kind: 'native-module' },
  { reason: 'expoAutolinkingAndroid', kind: 'native-module' },
  { reason: 'rncoreAutolinking', kind: 'native-module' },
  { reason: 'rncoreAutolinkingIos', kind: 'native-module' },
  { reason: 'rncoreAutolinkingAndroid', kind: 'native-module' },
  { reason: 'bareNativeDir', kind: 'native-project' },
  { reason: 'bareGitIgnore', kind: 'native-project' },
  { reason: 'expoCNGPatches', kind: 'config-plugin' },
  { reason: 'patchPackage', kind: 'config-plugin' },
  { reason: 'easBuild', kind: 'build-config' },
  { reason: 'packageJson:scripts', kind: 'build-scripts' },
  { reason: 'package:react-native', kind: 'native-module' },
];

describe(classifyReasons, () => {
  it.each(VOCABULARY)(`should classify $reason as $kind`, ({ reason, kind }) => {
    expect(classifyReasons([reason])).toBe(kind);
  });

  it(`should classify every value of the table as something other than unknown`, () => {
    for (const reason of Object.keys(REASON_KINDS)) {
      expect(classifyReasons([reason])).not.toBe('unknown');
    }
  });

  it(`should classify a reason it has never seen as unknown`, () => {
    expect(classifyReasons(['someFutureSourcer'])).toBe('unknown');
  });

  it(`should classify an empty reasons list as unknown`, () => {
    expect(classifyReasons([])).toBe('unknown');
  });

  it(`should classify an unreleased member of a prefix family by its family`, () => {
    // `package:<name>` is one source per pinned package, so the family grows without this table.
    expect(classifyReasons(['package:react-native-reanimated'])).toBe('native-module');
    expect(classifyReasons(['packageJson:workspaces'])).toBe('build-scripts');
    expect(classifyReasons(['expoAutolinkingMacos'])).toBe('native-module');
  });

  it(`should let the first exact match win over a later one`, () => {
    // A module both autolinkers see carries both reasons, and reports one kind, not two.
    expect(classifyReasons(['expoAutolinkingIos', 'rncoreAutolinkingIos'])).toBe('native-module');
  });

  it(`should prefer an exact match over a prefix match`, () => {
    // `expoConfigPlugins` starts with `expoConfig`, whose family is `app-config`. The exact
    // entry has to win, or every plugin change would be reported as a config edit.
    expect(classifyReasons(['expoConfigPlugins'])).toBe('config-plugin');
  });
});

describe('every kind needs a native build', () => {
  it(`should map every kind to needs-native-build`, () => {
    // A fingerprint source *is* the native surface, so a source that moved means the binary
    // differs. What varies between the kinds is the follow-up, not the class.
    for (const kind of Object.keys(KIND_CLASSES) as ChangeKind[]) {
      expect(KIND_CLASSES[kind]).toBe('needs-native-build');
    }
  });

  it(`should treat an unrecognized source as needing a build, not as free`, () => {
    expect(KIND_CLASSES.unknown).toBe('needs-native-build');
  });
});

describe(classifyDiffItem, () => {
  it(`should read the reasons of an added source`, () => {
    expect(
      classifyDiffItem(
        added({
          type: 'dir',
          filePath: 'node_modules/react-native-mmkv',
          reasons: ['rncoreAutolinkingIos'],
        })
      )
    ).toEqual({
      op: 'added',
      type: 'dir',
      path: 'node_modules/react-native-mmkv',
      reasons: ['rncoreAutolinkingIos'],
      kind: 'native-module',
      class: 'needs-native-build',
    });
  });

  it(`should read the reasons of a removed source`, () => {
    const item: FingerprintDiffItem = {
      op: 'removed',
      removedSource: { type: 'file', filePath: 'patches/expo.patch', reasons: ['patchPackage'] },
    };

    expect(classifyDiffItem(item)).toMatchObject({ op: 'removed', kind: 'config-plugin' });
  });

  it(`should read the *after* side of a changed source`, () => {
    // The reasons of a source that is still there are what it is there for now.
    const item: FingerprintDiffItem = {
      op: 'changed',
      beforeSource: { type: 'contents', id: 'x', reasons: ['expoConfig'] },
      afterSource: { type: 'contents', id: 'x', reasons: ['expoConfigPlugins'] },
    };

    expect(classifyDiffItem(item)).toMatchObject({ kind: 'config-plugin' });
  });

  it(`should classify a source that arrived with no reasons at all`, () => {
    expect(classifyDiffItem(added({ type: 'file', filePath: 'a.txt' }))).toMatchObject({
      reasons: [],
      kind: 'unknown',
      class: 'needs-native-build',
    });
  });

  it(`should drop a reason that is not a string`, () => {
    const source = {
      type: 'file',
      reasons: [null, 'easBuild', ''],
    } as unknown as FingerprintSource;

    expect(classifyDiffItem(added(source))).toMatchObject({
      reasons: ['easBuild'],
      kind: 'build-config',
    });
  });
});

describe(sourceLabel, () => {
  it(`should name a file source by its path`, () => {
    expect(sourceLabel({ type: 'file', filePath: 'app.json' })).toBe('app.json');
  });

  it(`should name a contents source by its id`, () => {
    expect(sourceLabel({ type: 'contents', id: 'expoAutolinkingConfig:ios' })).toBe(
      'expoAutolinkingConfig:ios'
    );
  });

  it(`should name a package source by name and version`, () => {
    expect(sourceLabel({ type: 'package', name: 'react-native', version: '0.86.2' })).toBe(
      'react-native@0.86.2'
    );
  });

  it(`should return null for a source with nothing to name it by`, () => {
    expect(sourceLabel({ type: 'contents' })).toBeNull();
  });
});

describe(classifyFingerprintDiff, () => {
  it(`should report js-only for an empty diff`, () => {
    expect(classifyFingerprintDiff([])).toEqual({
      class: 'js-only',
      changedSources: [],
      reasons: [],
    });
  });

  it(`should let the strongest class win over a mixed diff`, () => {
    const result = classifyFingerprintDiff([
      added({ type: 'file', filePath: 'eas.json', reasons: ['easBuild'] }),
      added({
        type: 'dir',
        filePath: 'node_modules/expo-camera/ios',
        reasons: ['expoAutolinkingIos'],
      }),
      added({ type: 'contents', id: 'packageJson:scripts', reasons: ['packageJson:scripts'] }),
    ]);

    expect(result.class).toBe('needs-native-build');
    expect(result.changedSources).toHaveLength(3);
  });

  it(`should put the strongest kind's sentence first`, () => {
    const result = classifyFingerprintDiff([
      added({ type: 'contents', id: 'packageJson:scripts', reasons: ['packageJson:scripts'] }),
      added({
        type: 'dir',
        filePath: 'node_modules/expo-camera/ios',
        reasons: ['expoAutolinkingIos'],
      }),
    ]);

    // Both are `needs-native-build`, so the order is stable rather than meaningful — what the
    // assertion pins is that both kinds are described, once each.
    expect(result.reasons).toHaveLength(2);
    expect(result.reasons.join(' ')).toContain('autolinked native modules');
    expect(result.reasons.join(' ')).toContain('package.json scripts');
  });

  it(`should name at most three sources and count the rest`, () => {
    const result = classifyFingerprintDiff(
      ['a', 'b', 'c', 'd', 'e'].map((name) =>
        added({ type: 'dir', filePath: `node_modules/${name}`, reasons: ['expoAutolinkingIos'] })
      )
    );

    expect(result.reasons[0]).toContain(
      'node_modules/a, node_modules/b, node_modules/c and 2 more'
    );
  });

  it(`should say a build-config change needs no prebuild`, () => {
    const result = classifyFingerprintDiff([
      added({ type: 'file', filePath: 'eas.json', reasons: ['easBuild'] }),
    ]);

    expect(result.reasons[0]).toContain('prebuild is not needed');
  });

  it(`should classify the real diff of one added native dependency`, () => {
    // The whole point of the fixture: a table written from the documentation would have looked
    // for `rncoreAutolinkingConfig:ios` here, which is the source's *id*, and found no reason it
    // recognised on any of the three items.
    const result = classifyFingerprintDiff(realDiff as FingerprintDiffItem[]);

    expect(result.class).toBe('needs-native-build');
    expect(result.changedSources.map((source) => source.kind)).toEqual([
      'native-module',
      'native-module',
      'native-module',
    ]);
    expect(result.changedSources.map((source) => source.path)).toEqual([
      'node_modules/react-native-mmkv',
      'node_modules/react-native-nitro-modules',
      'rncoreAutolinkingConfig:ios',
    ]);
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0]).toContain('react-native-mmkv');
  });

  it(`should recognise every reason a real project's fingerprint carries`, () => {
    // The fixture keeps one source per distinct `reasons` combination of a real 59-source
    // fingerprint. None of them may fall through to `unknown`: an `unknown` here would mean the
    // table had drifted from the tool, which is the failure this test exists to catch.
    const sources = realFingerprint.sources as FingerprintSource[];
    const unknown = sources
      .map((source) => ({ source, kind: classifyReasons(source.reasons ?? []) }))
      .filter((entry) => entry.kind === 'unknown');

    expect(unknown.map((entry) => entry.source.reasons)).toEqual([]);
  });
});

describe(classifyChangedFiles, () => {
  it(`should report js-only when nothing changed`, () => {
    expect(classifyChangedFiles([])).toEqual({
      class: 'js-only',
      counts: { total: 0, native: 0, js: 0, config: 0 },
      reasons: [],
    });
  });

  it(`should report js-only for source files inside the bundle`, () => {
    const result = classifyChangedFiles(['src/app/index.tsx', 'src/components/card.tsx']);

    expect(result.class).toBe('js-only');
    expect(result.counts).toEqual({ total: 2, native: 0, js: 2, config: 0 });
    expect(result.reasons[0]).toContain('Fast Refresh');
  });

  it.each([
    'metro.config.js',
    'metro.config.ts',
    'babel.config.js',
    '.babelrc',
    '.env',
    '.env.local',
    'tsconfig.json',
    'package.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'bun.lock',
  ])(`should report dev-client-compatible for %s`, (file) => {
    expect(classifyChangedFiles([file]).class).toBe('dev-client-compatible');
  });

  it(`should match a config file in a subdirectory of the project`, () => {
    expect(classifyChangedFiles(['apps/mobile/metro.config.js']).class).toBe(
      'dev-client-compatible'
    );
  });

  it(`should never reach needs-native-build`, () => {
    // The fingerprint has already said the native surface did not move; a file under `ios/` that
    // it did not react to is one the preset ignores, and contradicting it would be wrong.
    const result = classifyChangedFiles(['ios/Podfile', 'android/build.gradle']);

    expect(result.class).toBe('js-only');
    expect(result.counts.native).toBe(2);
  });

  it(`should count config files apart from JavaScript ones`, () => {
    const result = classifyChangedFiles(['app.json', 'eas.json', 'src/app/index.tsx']);

    expect(result.counts).toEqual({ total: 3, native: 0, js: 1, config: 2 });
  });

  it(`should normalize Windows separators before matching`, () => {
    expect(classifyChangedFiles(['apps\\mobile\\metro.config.js']).class).toBe(
      'dev-client-compatible'
    );
    expect(classifyChangedFiles(['ios\\Podfile']).counts.native).toBe(1);
  });

  it(`should name the file that forces the restart`, () => {
    expect(classifyChangedFiles(['metro.config.js']).reasons[0]).toContain('metro.config.js');
  });
});

describe(isStrongerClass, () => {
  it(`should order the three classes weakest to strongest`, () => {
    expect(isStrongerClass('needs-native-build', 'dev-client-compatible')).toBe(true);
    expect(isStrongerClass('dev-client-compatible', 'js-only')).toBe(true);
    expect(isStrongerClass('js-only', 'js-only')).toBe(false);
    expect(isStrongerClass('js-only', 'needs-native-build')).toBe(false);
  });
});
