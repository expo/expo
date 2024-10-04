import type { ExpoConfig } from '@expo/config';
import * as path from 'node:path';

import {
  getHermesBytecodeBundleVersionAsync,
  isEnableHermesManaged,
  isHermesBytecodeBundleAsync,
  parseGradleProperties,
} from '../exportHermes';

jest.unmock('fs');

describe('parseGradleProperties', () => {
  it('should return array of key-value tuple', () => {
    const content = `
    keyFoo=valueFoo
    keyBar=valueBar
    `;

    expect(parseGradleProperties(content)).toEqual({
      keyFoo: 'valueFoo',
      keyBar: 'valueBar',
    });
  });

  it('should keep "=" in value if there are multiple "="', () => {
    const content = `
    key=a=b=c
    `;

    expect(parseGradleProperties(content)).toEqual({
      key: 'a=b=c',
    });
  });

  it('should exclude comment', () => {
    const content = `
    # This is comment
      # comment with space prefix
    keyFoo=valueFoo
    `;

    expect(parseGradleProperties(content)).toEqual({
      keyFoo: 'valueFoo',
    });
  });
});

describe('getHermesBytecodeBundleVersionAsync', () => {
  it('should return hermes bytecode version 74 for plain.74.hbc', async () => {
    const file = path.join(__dirname, 'fixtures', 'plain.74.hbc');
    const result = await getHermesBytecodeBundleVersionAsync(file);
    expect(result).toBe(74);
  });

  it('should throw exception for plain javascript file', async () => {
    const file = path.join(__dirname, 'fixtures', 'plain.js');
    await expect(getHermesBytecodeBundleVersionAsync(file)).rejects.toThrow();
  });
});

describe(isEnableHermesManaged, () => {
  it('should support shared jsEngine key', () => {
    const config: ExpoConfig = {
      name: 'foo',
      slug: 'foo',
      sdkVersion: 'UNVERSIONED',
      jsEngine: 'hermes',
    };
    expect(isEnableHermesManaged(config, 'android')).toBe(true);
    expect(isEnableHermesManaged(config, 'ios')).toBe(true);
  });

  it('platform jsEngine should override shared jsEngine', () => {
    const config: ExpoConfig = {
      name: 'foo',
      slug: 'foo',
      sdkVersion: 'UNVERSIONED',
      jsEngine: 'hermes',
      android: {
        jsEngine: 'jsc',
      },
      ios: {
        jsEngine: 'jsc',
      },
    };
    expect(isEnableHermesManaged(config, 'android')).toBe(false);
    expect(isEnableHermesManaged(config, 'ios')).toBe(false);
  });
});

describe('isHermesBytecodeBundleAsync', () => {
  it('should return true for hermes bytecode bundle file', async () => {
    const file = path.join(__dirname, 'fixtures', 'plain.74.hbc');
    const result = await isHermesBytecodeBundleAsync(file);
    expect(result).toBe(true);
  });

  it('should return false for plain javascript file', async () => {
    const file = path.join(__dirname, 'fixtures', 'plain.js');
    const result = await isHermesBytecodeBundleAsync(file);
    expect(result).toBe(false);
  });

  it('should throw exception for nonexistent file', async () => {
    const file = path.join(__dirname, 'fixtures', 'nonexistent.js');
    await expect(isHermesBytecodeBundleAsync(file)).rejects.toThrow();
  });
});

describe('maybeThrowFromInconsistentEngineAsync - common', () => {
  // To customize fs-extra mock logic, instead of importing globally,
  // we dynamically require `maybeThrowFromInconsistentEngineAsync`,
  // so that fs-extra inside HermesBundler could honor our mock logic.
  let fs = require('fs-extra');
  let { maybeThrowFromInconsistentEngineAsync } = require('../exportHermes');

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('fs-extra');
    fs = require('fs-extra');
    maybeThrowFromInconsistentEngineAsync =
      require('../exportHermes').maybeThrowFromInconsistentEngineAsync;
  });
  afterAll(() => {
    jest.dontMock('fs-extra');
    jest.resetModules();
  });

  it('should resolve for managed project', async () => {
    const mockFsExistSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    mockFsExistSync.mockReturnValue(false);
    await expect(
      maybeThrowFromInconsistentEngineAsync(
        '/expo',
        '/expo/app.json',
        'android',
        /* isHermesManaged */ true
      )
    ).resolves.toBeUndefined();
  });
});

describe('maybeThrowFromInconsistentEngineAsync - android', () => {
  // To customize fs-extra mock logic, instead of importing globally,
  // we dynamically require `maybeThrowFromInconsistentEngineAsync`,
  // so that fs-extra inside HermesBundler could honor our mock logic.
  let fs = require('fs-extra');
  let { maybeThrowFromInconsistentEngineAsync } = require('../exportHermes');

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('fs-extra');
    fs = require('fs-extra');
    maybeThrowFromInconsistentEngineAsync =
      require('../exportHermes').maybeThrowFromInconsistentEngineAsync;
  });
  afterAll(() => {
    jest.dontMock('fs-extra');
    jest.resetModules();
  });

  function addMockedFiles(fileContentMap: Record<string, string>) {
    // add mock for `fs.existsSync`
    const mockFsExistSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    mockFsExistSync.mockImplementation((file: string) =>
      Object.keys(fileContentMap).includes(file)
    );

    // add mock for `fs.readFile`
    const mockFsReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
    mockFsReadFile.mockImplementation((file: string) => {
      for (const [fileName, content] of Object.entries(fileContentMap)) {
        if (file === fileName) {
          return Promise.resolve(content);
        }
      }
      return Promise.reject(new Error('File not found.'));
    });
  }

  it('should resolve if "hermesEnabled=true" in gradle.properties and "jsEngine: \'hermes\'" in app.json', async () => {
    addMockedFiles({
      '/expo/android/gradle.properties': 'hermesEnabled=true',
    });

    await expect(
      maybeThrowFromInconsistentEngineAsync(
        '/expo',
        '/expo/app.json',
        'android',
        /* isHermesManaged */ true
      )
    ).resolves.toBeUndefined();
  });

  it('should resolve if "hermesEnabled=false" in gradle.properties but no "jsEngine: \'hermes\'" in app.json', async () => {
    addMockedFiles({
      '/expo/android/gradle.properties': 'hermesEnabled=true',
    });

    await expect(
      maybeThrowFromInconsistentEngineAsync(
        '/expo',
        '/expo/app.json',
        'android',
        /* isHermesManaged */ true
      )
    ).resolves.toBeUndefined();
  });

  it('should throw if "hermesEnabled=true" in gradle.properties and "jsEngine: \'jsc\'" in app.json', async () => {
    addMockedFiles({
      '/expo/android/gradle.properties': 'hermesEnabled=true',
    });

    await expect(
      maybeThrowFromInconsistentEngineAsync(
        '/expo',
        '/expo/app.json',
        'android',
        /* isHermesManaged */ false
      )
    ).rejects.toThrow();
  });
});

describe('maybeThrowFromInconsistentEngineAsync - ios', () => {
  // To customize fs-extra mock logic, instead of importing globally,
  // we dynamically require `maybeThrowFromInconsistentEngineAsync`,
  // so that fs-extra inside HermesBundler could honor our mock logic.
  let fs = require('fs-extra');
  let { maybeThrowFromInconsistentEngineAsync } = require('../exportHermes');

  function addMockedFiles(fileContentMap: Record<string, string>) {
    // add mock for `fs.existsSync`
    const mockFsExistSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    mockFsExistSync.mockImplementation((file: string) =>
      Object.keys(fileContentMap).includes(file)
    );

    // add mock for `fs.readFile`
    const mockFsReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
    mockFsReadFile.mockImplementation((file: string) => {
      for (const [fileName, content] of Object.entries(fileContentMap)) {
        if (file === fileName) {
          return Promise.resolve(content);
        }
      }
      return Promise.reject(new Error('File not found.'));
    });
  }

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('fs-extra');
    fs = require('fs-extra');
    maybeThrowFromInconsistentEngineAsync =
      require('../exportHermes').maybeThrowFromInconsistentEngineAsync;
  });
  afterAll(() => {
    jest.dontMock('fs-extra');
    jest.resetModules();
  });

  it('should resolve if ":hermes_enabled => true" in Podfile and "jsEngine: \'hermes\'" in app.json', async () => {
    const podfileTestCases = [
      `
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true
  )`,
      `
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true, // with comments
  )`,
    ];

    for (const content of podfileTestCases) {
      addMockedFiles({
        '/expo/ios/Podfile': content,
      });

      await expect(
        maybeThrowFromInconsistentEngineAsync(
          '/expo',
          '/expo/app.json',
          'ios',
          /* isHermesManaged */ true
        )
      ).resolves.toBeUndefined();
    }
  });

  it('should throw if ":hermes_enabled => true" in Podfile but no "jsEngine: \'hermes\'" in app.json', async () => {
    addMockedFiles({
      '/expo/ios/Podfile': `
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true
  )`,
    });

    await expect(
      maybeThrowFromInconsistentEngineAsync(
        '/expo',
        '/expo/app.json',
        'ios',
        /* isHermesManaged */ false
      )
    ).rejects.toThrow();
  });

  it('should throw if (":hermes_enabled => false" or not existed in Podfile) and "jsEngine: \'hermes\'" in app.json', async () => {
    const podfileTestCases = [
      `
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => false
  )`,
      `
  use_react_native!(
    :path => config[:reactNativePath],
  )`,
    ];

    for (const content of podfileTestCases) {
      addMockedFiles({
        '/expo/ios/Podfile': content,
      });

      await expect(
        maybeThrowFromInconsistentEngineAsync(
          '/expo',
          '/expo/app.json',
          'ios',
          /* isHermesManaged */ true
        )
      ).rejects.toThrow();
    }
  });

  it('should resolve if "expo.jsEngine": \'hermes\' in Podfile.properties.json and "jsEngine: \'hermes\'" in app.json', async () => {
    addMockedFiles({
      '/expo/ios/Podfile.properties.json': '{"expo.jsEngine":"hermes"}',
    });

    await expect(
      maybeThrowFromInconsistentEngineAsync(
        '/expo',
        '/expo/app.json',
        'ios',
        /* isHermesManaged */ true
      )
    ).resolves.toBeUndefined();
  });

  it('should handle the inconsistency between Podfile and Podfile.properties.json', async () => {
    addMockedFiles({
      '/expo/ios/Podfile': `
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => false
  )`,
      '/expo/ios/Podfile.properties.json': '{"expo.jsEngine":"hermes"}',
    });

    await expect(
      maybeThrowFromInconsistentEngineAsync(
        '/expo',
        '/expo/app.json',
        'ios',
        /* isHermesManaged */ true
      )
    ).rejects.toThrow();
  });
});
