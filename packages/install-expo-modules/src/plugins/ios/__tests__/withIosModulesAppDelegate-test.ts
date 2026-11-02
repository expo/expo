import fs from 'fs';
import path from 'path';

import { getSdkVersion } from '../../../utils/expoVersionMappings';
import { updateVirtualMetroEntryIos } from '../../cli/withCliIntegration';
import {
  updateModulesAppDelegateObjcHeader,
  updateModulesAppDelegateObjcImpl,
  updateModulesAppDelegateSwift,
} from '../withIosModulesAppDelegate';

const fixturesPath = path.resolve(__dirname, 'fixtures');

describe(updateModulesAppDelegateObjcHeader, () => {
  it('migrates RN 0.88 after the user removes sourceURL(for:)', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn088.swift'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn088-updated.swift'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.88.0');
    expect(() => updateModulesAppDelegateSwift(rawContents, sdkVersion)).toThrow(
      /Remove sourceURL\(for:\).*custom bundle selection.*bundleURL\(\).*run install-expo-modules again/
    );

    const withoutLegacyMethod = rawContents.replace(
      `  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

`,
      ''
    );
    const contents = updateModulesAppDelegateSwift(withoutLegacyMethod, sdkVersion);
    expect(contents).toEqual(expectContents);

    const nextContents = updateModulesAppDelegateSwift(contents, sdkVersion);
    expect(nextContents).toEqual(expectContents);
  });

  it('should migrate from react-native@>=0.83.0 AppDelegate.swift', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn083.swift'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn083-updated.swift'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.83.0');
    const contents = updateModulesAppDelegateSwift(rawContents, sdkVersion);
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateSwift(contents, sdkVersion);
    expect(nextContents).toEqual(expectContents);
  });

  it('should migrate from react-native@>=0.79.0 AppDelegate.swift', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn079.swift'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn079-updated.swift'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.79.0');
    const contents = updateModulesAppDelegateSwift(rawContents, sdkVersion);
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateSwift(contents, sdkVersion);
    expect(nextContents).toEqual(expectContents);
  });

  it('should migrate from react-native@>=0.71.0 AppDelegate header', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn071.h'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn071-updated.h'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.71.0');
    const contents = updateModulesAppDelegateObjcHeader(rawContents, sdkVersion);
    expect(updateModulesAppDelegateObjcHeader(contents, sdkVersion)).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateObjcHeader(contents, sdkVersion);
    expect(updateModulesAppDelegateObjcHeader(nextContents, sdkVersion)).toEqual(expectContents);
  });

  it('should migrate from classic RN AppDelegate header', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067.h'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067-updated.h'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.67.0');
    const contents = updateModulesAppDelegateObjcHeader(rawContents, sdkVersion);
    expect(updateModulesAppDelegateObjcHeader(contents, sdkVersion)).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateObjcHeader(contents, sdkVersion);
    expect(updateModulesAppDelegateObjcHeader(nextContents, sdkVersion)).toEqual(expectContents);
  });
});

describe(updateModulesAppDelegateObjcImpl, () => {
  it('should migrate from classic react-native@>=0.68.0 AppDelegate.mm implementation', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn068.mm'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn068-updated.mm'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.68.0');
    const contents = updateModulesAppDelegateObjcImpl(rawContents, sdkVersion);
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateObjcImpl(contents, sdkVersion);
    expect(nextContents).toEqual(expectContents);
  });

  it('should migrate from classic react-native@<0.68.0 AppDelegate.m implementation', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067.m'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067-updated.m'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.67.0');
    const contents = updateModulesAppDelegateObjcImpl(rawContents, sdkVersion);
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateObjcImpl(contents, sdkVersion);
    expect(nextContents).toEqual(expectContents);
  });
});

describe(updateModulesAppDelegateSwift, () => {
  describe('SDK 58 sourceURL migration', () => {
    const delegate = (superclass: string, body: string) => `internal import Expo
class ReactNativeDelegate: ${superclass} {
  @objc public override func sourceURL(
    for sourceBridge: RCTBridge
  ) -> URL? {
    ${body}
  }
}
`;

    it.each([
      ['ExpoReactNativeFactoryDelegate', 'sourceBridge.bundleURL ?? bundleURL()'],
      ['BaseDelegate', 'recordLaunch(); return customBundleURL()'],
    ])('requires manual migration for a delegate extending %s', (superclass, body) => {
      expect(() => updateModulesAppDelegateSwift(delegate(superclass, body), '58.0.0')).toThrow(
        /sourceURL\(for:\).*line 3.*Remove sourceURL\(for:\) and its attributes.*custom bundle selection.*bundleURL\(\).*run install-expo-modules again/
      );
    });

    it('ignores declarations in comments and strings', () => {
      const lookalike =
        'override func sourceURL(for bridge: RCTBridge) -> URL? { self.bundleURL() }';
      const contents = `internal import Expo
// ${lookalike}
/* nested /* comment */
${lookalike}
*/
let example = #"""
${lookalike}
"""#
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func bundleURL() -> URL? { customBundleURL() }
}
`;
      expect(updateModulesAppDelegateSwift(contents, '58.0.0')).toBe(contents);
    });

    it('keeps the old transformation for SDK 57 and an unknown SDK', () => {
      const contents = delegate('ExpoReactNativeFactoryDelegate', 'self.bundleURL()').replace(
        'sourceURL(\n    for sourceBridge: RCTBridge\n  )',
        'sourceURL(for bridge: RCTBridge)'
      );
      expect(() => updateModulesAppDelegateSwift(contents, '58.0.0')).toThrow(
        /Remove sourceURL\(for:\)/
      );
      for (const sdkVersion of ['57.0.0', undefined]) {
        const updated = updateModulesAppDelegateSwift(contents, sdkVersion);
        expect(updated).toContain('bridge.bundleURL ?? bundleURL()');
        expect(updated).toContain('func sourceURL(');
      }
    });
  });

  it('should migrate from RN 0.77 AppDelegate.swift', async () => {
    const rawContents = await fs.promises.readFile(
      path.join(fixturesPath, 'AppDelegate-rn077.swift'),
      'utf8'
    );

    const sdkVersion = getSdkVersion('0.77.0');
    expect(updateModulesAppDelegateSwift(rawContents, sdkVersion)).toMatchSnapshot();
  });

  it('should migrate from RN 0.77 AppDelegate.swift with CLI integration', async () => {
    const rawContents = await fs.promises.readFile(
      path.join(fixturesPath, 'AppDelegate-rn077.swift'),
      'utf8'
    );

    const sdkVersion = getSdkVersion('0.77.0');
    let expectedContents = updateModulesAppDelegateSwift(rawContents, sdkVersion);
    expectedContents = updateVirtualMetroEntryIos(expectedContents);
    expect(expectedContents).toMatchSnapshot();
  });

  it('should migrate from legacy RN AppDelegate.swift', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067.swift'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067-updated.swift'), 'utf8'),
    ]);

    const sdkVersion = '44.0.0';
    expect(updateModulesAppDelegateSwift(rawContents, sdkVersion)).toEqual(expectContents);
  });
});

describe('withIosModulesAppDelegate sdkVersion snapshots', () => {
  const [objcHeaderFixture, objcImplFixture, swiftFixture] = [
    fs.readFileSync(path.join(fixturesPath, 'AppDelegate-rn067.h'), 'utf8'),
    fs.readFileSync(path.join(fixturesPath, 'AppDelegate-rn067.m'), 'utf8'),
    fs.readFileSync(path.join(fixturesPath, 'AppDelegate-rn067.swift'), 'utf8'),
  ];

  ['43.0.0', '44.0.0'].forEach((sdkVersion) => {
    it(`sdkVersion ${sdkVersion}`, () => {
      expect(updateModulesAppDelegateObjcHeader(objcHeaderFixture, sdkVersion)).toMatchSnapshot();
      expect(updateModulesAppDelegateObjcImpl(objcImplFixture, sdkVersion)).toMatchSnapshot();
      expect(updateModulesAppDelegateSwift(swiftFixture, sdkVersion)).toMatchSnapshot();
    });
  });
});
