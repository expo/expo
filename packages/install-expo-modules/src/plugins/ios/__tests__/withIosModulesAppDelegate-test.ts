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
    let warn: jest.SpyInstance;

    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
    });

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
    ])('requires manual migration for custom code: %s', (body) => {
      expect(() => updateModulesAppDelegateSwift(delegate(body), '58.0.0')).toThrow(
        /custom implementation.*Move.*bundleURL\(\)/
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
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('superclass'));
    });

    it.each(['@objc', '@available(\n    iOS 16.4, *\n  )'])(
      'gives removal instructions for a stock forwarder with %s',
      (attribute) => {
        const contents = delegate('self.bundleURL()').replace(
          '  override func sourceURL',
          `  ${attribute}\n  override func sourceURL`
        );
        expect(() => updateModulesAppDelegateSwift(contents, '58.0.0')).toThrow(
          /forwarding method has attributes.*Remove the method together with its attributes/
        );
      }
    );

    it('refuses a declaration whose modifiers would be left behind', () => {
      const contents = delegate('self.bundleURL()').replace(
        '  override func sourceURL',
        '  public\n  override func sourceURL'
      );
      expect(() => updateModulesAppDelegateSwift(contents, '58.0.0')).toThrow(
        /method declaration is not recognized.*Review the declaration/
      );
    });

    it('reports an unmatched brace as a syntax error', () => {
      const contents = delegate('self.bundleURL()').replace(/\n}\n$/, '\n');
      expect(() => updateModulesAppDelegateSwift(contents, '58.0.0')).toThrow(
        /unmatched opening brace.*line 2.*Check the Swift syntax/
      );
    });

    it.each([
      ['/* unfinished', 'unterminated block comment'],
      ['"unfinished', 'unterminated string literal'],
    ])('reports malformed Swift: %s', (body, reason) => {
      expect(() => updateModulesAppDelegateSwift(delegate(body), '58.0.0')).toThrow(reason);
    });

    it('warns about an intermediate subclass after removing known forwarders', () => {
      const base = 'class BaseDelegate: ExpoReactNativeFactoryDelegate {}\n';
      const indirect = delegate('self.bundleURL()').replace(
        'ReactNativeDelegate: ExpoReactNativeFactoryDelegate',
        'IndirectDelegate: BaseDelegate'
      );
      const contents = base + indirect + delegate('self.bundleURL()');
      expect(updateModulesAppDelegateSwift(contents, '58.0.0')).toBe(base + indirect + migrated);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/sourceURL\(for:\).*superclass.*bundleURL\(\)/)
      );
    });

    it('removes the separator before a forwarder that is the last member', () => {
      const contents = `internal import Expo
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
${bundleMethod}

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }
}
`;
      expect(updateModulesAppDelegateSwift(contents, '58.0.0')).toBe(migrated);
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
