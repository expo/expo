import type { ExpoConfig } from '@expo/config';
import fs from 'fs';
import * as path from 'node:path';

import {
  maybeThrowFromInconsistentEngineAsync,
  getHermesBytecodeBundleVersionAsync,
  isEnableHermesManaged,
  isHermesBytecodeBundleAsync,
  parseGradleProperties,
} from '../exportHermes';

jest.unmock('fs');

const existsSync = jest.spyOn(fs, 'existsSync');
const readFile = jest.spyOn(fs.promises, 'readFile');

afterEach(() => {
  existsSync.mockReset();
  readFile.mockReset();
});

function addMockedFiles(fileContentMap: Record<string, string>) {
  const readPaths: string[] = [];

  existsSync.mockImplementation((file: fs.PathLike) =>
    Object.keys(fileContentMap).includes(`${file}`)
  );

  readFile.mockImplementation((file: fs.PathLike | fs.promises.FileHandle) => {
    for (const [fileName, content] of Object.entries(fileContentMap)) {
      if (`${file}` === fileName) {
        readPaths.push(fileName);
        return Promise.resolve(content);
      }
    }
    return Promise.reject(new Error('File not found.'));
  });

  return readPaths;
}

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
  it('should resolve for managed project', async () => {
    existsSync.mockReturnValue(false);
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
  it('should resolve if "hermesEnabled=true" in gradle.properties and "jsEngine: \'hermes\'" in app.json', async () => {
    const readPaths = addMockedFiles({
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

    expect(readPaths).toEqual(['/expo/android/gradle.properties']);
  });

  it('should resolve if "hermesEnabled=false" in gradle.properties but no "jsEngine: \'hermes\'" in app.json', async () => {
    const readPaths = addMockedFiles({
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

    expect(readPaths).toEqual(['/expo/android/gradle.properties']);
  });

  it('should throw if "hermesEnabled=true" in gradle.properties and "jsEngine: \'jsc\'" in app.json', async () => {
    const readPaths = addMockedFiles({
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

    expect(readPaths).toEqual(['/expo/android/gradle.properties']);
  });
});

describe('maybeThrowFromInconsistentEngineAsync - ios', () => {
  it('should support either :hermes_enabled => true or hermes_enabled: true syntax', async () => {
    const podfileTestCases = [
      `
  use_react_native!(
    :path => config[:reactNativePath],
    hermes_enabled: false
  )`,
      `
  use_react_native!(
    :path => config[:reactNativePath],
    hermes_enabled: false, // with comments
  )`,
    ];

    for (const content of podfileTestCases) {
      const readPaths = addMockedFiles({
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

      expect(readPaths).toEqual(['/expo/ios/Podfile']);
    }
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
      const readPaths = addMockedFiles({
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

      expect(readPaths).toEqual(['/expo/ios/Podfile']);
    }
  });

  it('should throw if ":hermes_enabled => true" in Podfile but no "jsEngine: \'hermes\'" in app.json', async () => {
    const readPaths = addMockedFiles({
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

    expect(readPaths).toEqual(['/expo/ios/Podfile']);
  });

  it('should throw if (":hermes_enabled => false" or not existed in Podfile) and "jsEngine: \'hermes\'" in app.json', async () => {
    const podfileTestCases = [
      `
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => false
  )`,
    ];

    for (const content of podfileTestCases) {
      const readPaths = addMockedFiles({
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

      expect(readPaths).toEqual(['/expo/ios/Podfile']);
    }
  });

  it('should not throw if :hermes_enabled is not present in Podfile and "jsEngine: \'hermes\'" in app.json', async () => {
    const podfileTestCases = [
      `
  use_react_native!(
    :path => config[:reactNativePath],
  )`,
    ];

    for (const content of podfileTestCases) {
      const readPaths = addMockedFiles({
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

      expect(readPaths).toEqual(['/expo/ios/Podfile']);
    }
  });

  describe('should handle the inconsistency between Podfile and Podfile.properties.json', () => {
    it('inconsistent /expo/ios/Podfile', async () => {
      const readPaths = addMockedFiles({
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

      expect(readPaths).toEqual(['/expo/ios/Podfile']);
    });

    it('inconsistent /expo/ios/Podfile.properties.json', async () => {
      const readPaths = addMockedFiles({
        '/expo/ios/Podfile': `
    use_react_native!(
      :path => config[:reactNativePath],
      :hermes_enabled => true
    )`,
        '/expo/ios/Podfile.properties.json': '{"expo.jsEngine":"jsc"}',
      });

      await expect(
        maybeThrowFromInconsistentEngineAsync(
          '/expo',
          '/expo/app.json',
          'ios',
          /* isHermesManaged */ true
        )
      ).rejects.toThrow();

      expect(readPaths).toEqual(['/expo/ios/Podfile', '/expo/ios/Podfile.properties.json']);
    });
  });
});
