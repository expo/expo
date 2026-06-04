import fs from 'fs';
import path from 'path';

// Regression guard for iOS worklets-adapter autolinking.
//
// `ExpoModulesWorkletsAdapter` is a source-only pod that hard-depends on `RNWorklets`
// (react-native-worklets) and whose podspec raises if it can't resolve that package.
// It must therefore be linked ONLY when react-native-worklets is installed. That
// conditional gate lives in `expo-module.config.json` as a `podspecPath` entry carrying
// `autolinkWhen: { npmPackage: 'react-native-worklets' }`, which the autolinking resolver
// evaluates at `pod install` time.
//
// A bare-string `podspecPath` entry would link the adapter UNCONDITIONALLY into every
// app, forcing `RNWorklets` onto apps that don't use worklets and breaking their
// `pod install` with:
//   "Unable to find a specification for `RNWorklets` depended upon by
//    `ExpoModulesWorkletsAdapter`"
// (this is what broke the updates-e2e build). So the adapter entry must always carry an
// `autolinkWhen` condition. This test fails if that invariant regresses.

const packageRoot = path.resolve(__dirname, '../..');

function readJson(name: string): any {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, name), 'utf8'));
}

describe('iOS worklets-adapter autolinking', () => {
  it('gates ExpoModulesWorkletsAdapter on react-native-worklets via a conditional podspecPath entry', () => {
    const podspecPaths: any[] = readJson('expo-module.config.json').apple?.podspecPath ?? [];

    const adapterEntries = podspecPaths.filter((entry) => {
      const entryPath = typeof entry === 'string' ? entry : entry?.path;
      return /WorkletsAdapter/i.test(entryPath ?? '');
    });

    // Exactly one adapter entry, and it must be a conditional object (never a bare string,
    // which would link unconditionally).
    expect(adapterEntries).toHaveLength(1);
    const [adapter] = adapterEntries;
    expect(typeof adapter).toBe('object');
    expect(adapter.autolinkWhen).toEqual({ npmPackage: 'react-native-worklets' });
  });

  it('does not declare the adapter as a precompiled product in spm.config.json', () => {
    // The adapter is source-only and gated by autolinking — it must not be a precompile
    // product (and must not carry the legacy spm.config `autolinkWhen` gate).
    const products: any[] = readJson('spm.config.json').products ?? [];
    const adapter = products.find((p) => p?.name === 'ExpoModulesWorkletsAdapter');
    expect(adapter).toBeUndefined();
  });
});
