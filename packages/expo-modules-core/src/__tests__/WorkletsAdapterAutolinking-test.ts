import fs from 'fs';
import path from 'path';

// Regression guard for iOS worklets-adapter autolinking.
//
// `ExpoModulesWorkletsAdapter` is a source-only pod that hard-depends on `RNWorklets`
// (react-native-worklets) and whose podspec raises if it can't resolve that package.
// It must therefore be linked ONLY when react-native-worklets is installed. That
// conditional gate lives in `spm.config.json` as `autolinkWhen: { npmPackage: 'react-native-worklets' }`.
//
// Entries in `apple.podspecPath` (expo-module.config.json) are linked UNCONDITIONALLY
// into every app — `ExpoModuleConfig.applePodspecPaths()` returns them as-is, with no
// filtering. Listing the adapter there forces `RNWorklets` onto apps that don't use
// worklets, breaking their `pod install` with:
//   "Unable to find a specification for `RNWorklets` depended upon by
//    `ExpoModulesWorkletsAdapter`"
// (this is what broke the updates-e2e build). So the adapter must stay OUT of
// podspecPath and remain companion-gated. This test fails if either invariant regresses.

const packageRoot = path.resolve(__dirname, '../..');

function readJson(name: string): any {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, name), 'utf8'));
}

describe('iOS worklets-adapter autolinking', () => {
  it('keeps ExpoModulesWorkletsAdapter out of apple.podspecPath', () => {
    const podspecPaths: string[] = readJson('expo-module.config.json').apple?.podspecPath ?? [];

    // Unconditional podspecPath entries break apps without react-native-worklets.
    const adapterEntries = podspecPaths.filter((p) => /WorkletsAdapter/i.test(p));
    expect(adapterEntries).toEqual([]);
  });

  it('gates ExpoModulesWorkletsAdapter on react-native-worklets in spm.config.json', () => {
    const products: any[] = readJson('spm.config.json').products ?? [];
    const adapter = products.find((p) => p?.name === 'ExpoModulesWorkletsAdapter');

    expect(adapter).toBeDefined();
    // The companion-pod gate: linked only when react-native-worklets is installed.
    expect(adapter.autolinkWhen).toEqual({ npmPackage: 'react-native-worklets' });
  });
});
