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
  it('should migrate from react-native@>=0.88.0 AppDelegate.swift to the scene life cycle', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn088.swift'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn088-updated.swift'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.88.0');
    const contents = updateModulesAppDelegateSwift(rawContents, sdkVersion);
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
    const bundleMethod = '  override func bundleURL() -> URL? { customBundleURL() }';
    const delegate = (body: string) => `internal import Expo
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    ${body}
  }

${bundleMethod}
}
`;
    const migrated = `internal import Expo
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
${bundleMethod}
}
`;

    it.each([
      'self.bundleURL()',
      'return self.bundleURL()',
      'bundleURL()',
      'return bundleURL();',
      'bridge.bundleURL ?? bundleURL()',
      'return bridge.bundleURL ?? self.bundleURL()',
      '// dev client fallback\n    bridge.bundleURL /* nested /* comment */ } */ ?? bundleURL()',
    ])('removes a stock forwarder: %s', (body) => {
      expect(updateModulesAppDelegateSwift(delegate(body), '58.0.0')).toBe(migrated);
      expect(updateModulesAppDelegateSwift(migrated, '58.0.0')).toBe(migrated);
    });

    it('accepts a multiline signature and a renamed bridge parameter', () => {
      const contents = delegate('return sourceBridge.bundleURL ?? self.bundleURL()').replace(
        'override func sourceURL(for bridge: RCTBridge) -> URL? {',
        'public override func sourceURL(\n    for sourceBridge: RCTBridge\n  ) -> URL?\n  {'
      );
      expect(updateModulesAppDelegateSwift(contents, '58.0.0')).toBe(migrated);
    });

    it.each([
      'return customBundleURL()',
      'recordLaunch(); return self.bundleURL()',
      'if let url = bridge.bundleURL { return url }; return bundleURL()',
      'return URL(string: "https://example.com/bundle.js")',
      'let message = "}"; return bundleURL()',
    ])('requires manual migration for custom code: %s', (body) => {
      expect(() => updateModulesAppDelegateSwift(delegate(body), '58.0.0')).toThrow(
        /sourceURL\(for:\).*bundleURL\(\)/
      );
    });

    it('does not match method declarations in comments, strings, or other classes', () => {
      const lookalike =
        'override func sourceURL(for bridge: RCTBridge) -> URL? { self.bundleURL() }';
      const prefix = `internal import Expo
// ${lookalike}
/* nested /* comment */
${lookalike}
*/
let example = #"""
${lookalike}
"""#
class OtherDelegate: OtherFactory {
  ${lookalike}
}
`;
      expect(updateModulesAppDelegateSwift(prefix + delegate('self.bundleURL()'), '58.0.0')).toBe(
        prefix + migrated
      );
    });

    it('requires manual migration for an attributed method', () => {
      const contents = delegate('self.bundleURL()').replace(
        '  override func sourceURL',
        '  @available(\n    iOS 16.4, *\n  )\n  override func sourceURL'
      );
      expect(() => updateModulesAppDelegateSwift(contents, '58.0.0')).toThrow(
        /sourceURL\(for:\).*bundleURL\(\)/
      );
    });

    it('keeps the old transformation for SDK 57 and an unknown SDK', () => {
      const contents = delegate('self.bundleURL()');
      expect(updateModulesAppDelegateSwift(contents, '58.0.0')).toBe(migrated);
      for (const sdkVersion of ['57.0.0', undefined]) {
        expect(updateModulesAppDelegateSwift(contents, sdkVersion)).toContain(
          'bridge.bundleURL ?? bundleURL()'
        );
        expect(updateModulesAppDelegateSwift(contents, sdkVersion)).toContain('func sourceURL(');
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
