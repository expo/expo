import { vol } from 'memfs';

import { checkExpoGoCompatibilityAsync, decidesAgainstExpoGo } from '../expoGo';

const projectRoot = '/project';

/** Files of a stub `expo` package installed in the project. */
function expoPackage(
  bundledNativeModules: Record<string, string> | null,
  version: string | null = '54.0.0'
): Record<string, string> {
  const files: Record<string, string> = {};
  if (version) {
    files[`${projectRoot}/node_modules/expo/package.json`] = JSON.stringify({
      name: 'expo',
      version,
    });
  }
  if (bundledNativeModules) {
    files[`${projectRoot}/node_modules/expo/bundledNativeModules.json`] =
      JSON.stringify(bundledNativeModules);
  }
  return files;
}

/** Files of the project `package.json`. */
function projectPackage(
  dependencies: Record<string, string>,
  devDependencies: Record<string, string> = {}
): Record<string, string> {
  return {
    [`${projectRoot}/package.json`]: JSON.stringify({
      name: 'app',
      dependencies,
      devDependencies,
    }),
  };
}

afterEach(() => {
  vol.reset();
});

describe(checkExpoGoCompatibilityAsync, () => {
  it(`should be compatible for a project with only bundled dependencies`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0', 'expo-camera': '~54.0.0' }),
      ...expoPackage({ 'expo-camera': '~54.0.0' }),
      [`${projectRoot}/node_modules/expo-camera/package.json`]: '{"name":"expo-camera"}',
      [`${projectRoot}/node_modules/expo-camera/ios/Camera.swift`]: '',
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { name: 'app' } }),
    });

    await expect(checkExpoGoCompatibilityAsync(projectRoot)).resolves.toEqual({
      compatible: true,
      reasons: [],
    });
  });

  it(`should be compatible for a project with a JS-only unbundled dependency`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0', lodash: '^4.0.0' }),
      ...expoPackage({}),
      [`${projectRoot}/node_modules/lodash/package.json`]: '{"name":"lodash"}',
      [`${projectRoot}/node_modules/lodash/index.js`]: '',
    });

    await expect(checkExpoGoCompatibilityAsync(projectRoot)).resolves.toEqual({
      compatible: true,
      reasons: [],
    });
  });

  it(`should report an unbundled native module with an ios directory`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0', 'react-native-fancy': '1.0.0' }),
      ...expoPackage({}),
      [`${projectRoot}/node_modules/react-native-fancy/package.json`]: '{"name":"x"}',
      [`${projectRoot}/node_modules/react-native-fancy/ios/Fancy.m`]: '',
    });

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.compatible).toBe(false);
    expect(result.reasons).toEqual([
      expect.objectContaining({
        kind: 'unbundled-native-module',
        packageName: 'react-native-fancy',
      }),
    ]);
  });

  it(`should report an unbundled native module declared by expo-module.config.json`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0', 'my-expo-module': '1.0.0' }),
      ...expoPackage({}),
      [`${projectRoot}/node_modules/my-expo-module/package.json`]: '{"name":"my-expo-module"}',
      [`${projectRoot}/node_modules/my-expo-module/expo-module.config.json`]: '{}',
    });

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.reasons).toEqual([
      expect.objectContaining({ kind: 'unbundled-native-module', packageName: 'my-expo-module' }),
    ]);
  });

  it(`should report an unbundled native module declared by a podspec`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0', 'rn-legacy': '1.0.0' }),
      ...expoPackage({}),
      [`${projectRoot}/node_modules/rn-legacy/package.json`]: '{"name":"rn-legacy"}',
      [`${projectRoot}/node_modules/rn-legacy/RNLegacy.podspec`]: '',
    });

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.reasons).toEqual([
      expect.objectContaining({ kind: 'unbundled-native-module', packageName: 'rn-legacy' }),
    ]);
  });

  it(`should check dev dependencies too`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0' }, { 'rn-dev-native': '1.0.0' }),
      ...expoPackage({}),
      [`${projectRoot}/node_modules/rn-dev-native/package.json`]: '{"name":"rn-dev-native"}',
      [`${projectRoot}/node_modules/rn-dev-native/android/build.gradle`]: '',
    });

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.reasons).toEqual([
      expect.objectContaining({ kind: 'unbundled-native-module', packageName: 'rn-dev-native' }),
    ]);
  });

  it(`should ignore a dependency that is not installed`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0', 'never-installed': '1.0.0' }),
      ...expoPackage({}),
    });

    await expect(checkExpoGoCompatibilityAsync(projectRoot)).resolves.toEqual({
      compatible: true,
      reasons: [],
    });
  });

  it(`should never report the expo package itself as unbundled`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0' }),
      ...expoPackage({}),
      // The `expo` package ships native code, but it is the Expo Go runtime itself.
      [`${projectRoot}/node_modules/expo/ios/Expo.swift`]: '',
      [`${projectRoot}/node_modules/expo/expo-module.config.json`]: '{}',
    });

    await expect(checkExpoGoCompatibilityAsync(projectRoot)).resolves.toEqual({
      compatible: true,
      reasons: [],
    });
  });

  it(`should report a config plugin of an unbundled package`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0' }),
      ...expoPackage({}),
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: { plugins: ['react-native-fancy'] },
      }),
    });

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.compatible).toBe(false);
    expect(result.reasons).toEqual([
      expect.objectContaining({ kind: 'config-plugin', packageName: 'react-native-fancy' }),
    ]);
  });

  it(`should accept a config plugin of a bundled module, including its options and subpath`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0' }),
      ...expoPackage({ 'expo-camera': '~54.0.0', 'expo-build-properties': '~54.0.0' }),
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: {
          plugins: [
            'expo-camera',
            ['expo-build-properties/app.plugin.js', { ios: { useFrameworks: 'static' } }],
          ],
        },
      }),
    });

    await expect(checkExpoGoCompatibilityAsync(projectRoot)).resolves.toEqual({
      compatible: true,
      reasons: [],
    });
  });

  it(`should report a local config plugin path`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0' }),
      ...expoPackage({}),
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: { plugins: ['./plugins/withCustomThing'] },
      }),
    });

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.reasons).toEqual([
      expect.objectContaining({ kind: 'config-plugin', detail: expect.any(String) }),
    ]);
    expect(result.reasons[0]?.packageName).toBeUndefined();
  });

  it(`should read plugins from an app.json without an expo key`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0' }),
      ...expoPackage({}),
      [`${projectRoot}/app.json`]: JSON.stringify({ plugins: ['react-native-fancy'] }),
    });

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.reasons).toEqual([
      expect.objectContaining({ kind: 'config-plugin', packageName: 'react-native-fancy' }),
    ]);
  });

  it(`should skip plugin detection when only a dynamic app config exists`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0' }),
      ...expoPackage({}),
      // Evaluating `app.config.js` would run project code, so the plugin list is unknown.
      [`${projectRoot}/app.config.js`]: 'module.exports = { plugins: ["react-native-fancy"] };',
    });

    await expect(checkExpoGoCompatibilityAsync(projectRoot)).resolves.toEqual({
      compatible: true,
      reasons: [],
    });
  });

  it(`should report custom native code for checked-in native directories`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0' }),
      ...expoPackage({}),
      [`${projectRoot}/ios/Podfile`]: '',
      [`${projectRoot}/android/build.gradle`]: '',
    });

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.compatible).toBe(false);
    expect(result.reasons).toEqual([expect.objectContaining({ kind: 'custom-native-code' })]);
  });

  it(`should report an unknown SDK when expo is not installed`, async () => {
    vol.fromJSON(projectPackage({ expo: '54.0.0' }));

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.compatible).toBe(false);
    expect(result.reasons).toEqual([expect.objectContaining({ kind: 'unknown-sdk' })]);
  });

  it(`should report an unknown SDK when bundledNativeModules.json is missing`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0' }),
      ...expoPackage(null),
    });

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.reasons).toEqual([expect.objectContaining({ kind: 'unknown-sdk' })]);
  });

  it(`should report every reason it finds`, async () => {
    vol.fromJSON({
      ...projectPackage({ expo: '54.0.0', 'react-native-fancy': '1.0.0' }),
      ...expoPackage({}),
      [`${projectRoot}/node_modules/react-native-fancy/package.json`]: '{}',
      [`${projectRoot}/node_modules/react-native-fancy/android/build.gradle`]: '',
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { plugins: ['./plugins/withThing'] } }),
      [`${projectRoot}/ios/Podfile`]: '',
    });

    const result = await checkExpoGoCompatibilityAsync(projectRoot);

    expect(result.reasons.map((reason) => reason.kind)).toEqual([
      'custom-native-code',
      'unbundled-native-module',
      'config-plugin',
    ]);
  });

  it(`should not throw when the project has no package.json`, async () => {
    vol.fromJSON({ [`${projectRoot}/index.js`]: '' });

    await expect(checkExpoGoCompatibilityAsync(projectRoot)).resolves.toEqual({
      compatible: false,
      reasons: [expect.objectContaining({ kind: 'unknown-sdk' })],
    });
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
//
// `compatible` is `false` for all four reason kinds, and only two of them rule Expo Go out. The
// commands that pick a deep-link shape need the three-valued answer, because the other two kinds
// mean "decide from something else": `unknown-sdk` is a fresh clone with no `node_modules`, and a
// checked-in native directory is a project that may still run in Expo Go perfectly well.
describe(decidesAgainstExpoGo, () => {
  it(`rules Expo Go out for a native module its runtime does not have`, () => {
    expect(
      decidesAgainstExpoGo({
        compatible: false,
        reasons: [
          { kind: 'unbundled-native-module', packageName: 'react-native-mmkv', detail: '' },
        ],
      })
    ).toBe(false);
  });

  it(`rules Expo Go out for a config plugin that changes the native projects`, () => {
    expect(
      decidesAgainstExpoGo({
        compatible: false,
        reasons: [{ kind: 'config-plugin', detail: '' }],
      })
    ).toBe(false);
  });

  it(`answers yes for a project with nothing against it`, () => {
    expect(decidesAgainstExpoGo({ compatible: true, reasons: [] })).toBe(true);
  });

  // The two that must not become a refusal. A project this check could not read is the ordinary
  // state of a fresh clone, and a bare project with no unbundled module still runs in Expo Go —
  // both have to reach the caller as "unknown" so its own precedence decides.
  it.each([
    ['the project could not be read', 'unknown-sdk' as const],
    ['a native directory is checked in', 'custom-native-code' as const],
  ])(`answers unknown when %s`, (_name, kind) => {
    expect(decidesAgainstExpoGo({ compatible: false, reasons: [{ kind, detail: '' }] })).toBeNull();
  });

  // A decisive reason wins over an inconclusive one, whatever order they arrive in.
  it(`rules Expo Go out when a decisive reason sits beside an inconclusive one`, () => {
    expect(
      decidesAgainstExpoGo({
        compatible: false,
        reasons: [
          { kind: 'custom-native-code', detail: '' },
          { kind: 'unbundled-native-module', packageName: 'react-native-fancy', detail: '' },
        ],
      })
    ).toBe(false);
  });
});
