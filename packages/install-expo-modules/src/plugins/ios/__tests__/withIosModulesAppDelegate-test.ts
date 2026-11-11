import fs from 'fs';
import path from 'path';

import { getSdkVersion } from '../../../utils/expoVersionMappings';
import { updateVirtualMetroEntryIos } from '../../cli/withCliIntegration';
import {
  assertNoLegacySourceUrl,
  updateModulesAppDelegateObjcHeader,
  updateModulesAppDelegateObjcImpl,
  updateModulesAppDelegateSwift,
} from '../withIosModulesAppDelegate';

const fixturesPath = path.resolve(__dirname, 'fixtures');

describe(updateModulesAppDelegateObjcHeader, () => {
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

describe(assertNoLegacySourceUrl, () => {
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
    [
      'ExpoReactNativeFactoryDelegate',
      'sourceBridge.bundleURL ?? bundleURL()',
      'AppDelegate.swift',
    ],
    ['BaseDelegate', 'recordLaunch(); return customBundleURL()', 'SceneDelegate.swift'],
  ])('requires manual migration for a delegate extending %s', (superclass, body, fileName) => {
    expect(() => assertNoLegacySourceUrl(delegate(superclass, body), '59.0.0', fileName)).toThrow(
      `${fileName} contains the legacy sourceURL(for:) method at line 3.`
    );
  });

  it.each(['', 'let value = 1; '])('ignores declarations in line comments after %j', (prefix) => {
    const contents = `internal import Expo
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  ${prefix}// override func sourceURL(for bridge: RCTBridge) -> URL? { self.bundleURL() }
  override func bundleURL() -> URL? { customBundleURL() }
}
`;
    expect(() => assertNoLegacySourceUrl(contents, '59.0.0')).not.toThrow();
  });

  it('keeps the old transformation through SDK 58 and for an unknown SDK', () => {
    const contents = delegate('ExpoReactNativeFactoryDelegate', 'self.bundleURL()').replace(
      'sourceURL(\n    for sourceBridge: RCTBridge\n  )',
      'sourceURL(for bridge: RCTBridge)'
    );
    for (const sdkVersion of ['57.0.0', '58.0.0', undefined]) {
      expect(() => assertNoLegacySourceUrl(contents, sdkVersion)).not.toThrow();
      const updated = updateModulesAppDelegateSwift(contents, sdkVersion);
      expect(updated).toContain('bridge.bundleURL ?? bundleURL()');
      expect(updated).toContain('func sourceURL(');
    }
  });
});

describe(updateModulesAppDelegateSwift, () => {
  it.each(['58.0.0', '59.0.0'])('migrates the RN 0.88 fixture for SDK %s', async (sdkVersion) => {
    let [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn088.swift'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn088-updated.swift'), 'utf8'),
    ]);

    if (sdkVersion === '59.0.0') {
      rawContents = rawContents.replace(
        `  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

`,
        ''
      );
      expectContents = expectContents.replace(
        `  override func sourceURL(for bridge: RCTBridge) -> URL? {
    bridge.bundleURL ?? bundleURL()
  }

`,
        ''
      );
    }
    const contents = updateModulesAppDelegateSwift(rawContents, sdkVersion);
    expect(contents).toEqual(expectContents);

    const nextContents = updateModulesAppDelegateSwift(contents, sdkVersion);
    expect(nextContents).toEqual(expectContents);
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
