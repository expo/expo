import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import type { NormalizedOptions } from '../../Fingerprint.types';
import { normalizeOptionsAsync } from '../../Options';
import {
  getBareAndroidSourcesAsync,
  getBareIosSourcesAsync,
  getPackageJsonScriptSourcesAsync,
  getCoreAutolinkingSourcesFromExpoAndroid,
  getCoreAutolinkingSourcesFromExpoIos,
  getCoreAutolinkingSourcesFromRncCliAsync,
} from '../Bare';
import { SourceSkips } from '../SourceSkips';

jest.mock('@expo/spawn-async');
jest.mock('fs/promises');
jest.mock('/app/package.json', () => ({}), { virtual: true });

describe('getBareSourcesAsync', () => {
  afterEach(() => {
    vol.reset();
  });

  it('should contain android and ios folders in bare react-native project', async () => {
    vol.fromJSON(require('./fixtures/BareReactNative70Project.json'));
    let sources = await getBareAndroidSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(expect.objectContaining({ filePath: 'android', type: 'dir' }));

    sources = await getBareIosSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(expect.objectContaining({ filePath: 'ios', type: 'dir' }));
  });
});

describe(getPackageJsonScriptSourcesAsync, () => {
  it('by default, should skip package.json scripts if items does not contain "run"', async () => {
    await jest.isolateModulesAsync(async () => {
      const scripts = {
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web',
      };
      jest.doMock(
        '/app/package.json',
        () => ({
          scripts: { ...scripts },
        }),
        {
          virtual: true,
        }
      );
      const sources = await getPackageJsonScriptSourcesAsync(
        '/app',
        await normalizeOptionsAsync('/app')
      );
      expect(sources).toContainEqual(
        expect.objectContaining({
          id: 'packageJson:scripts',
          contents: JSON.stringify({ web: 'expo start --web' }),
        })
      );
    });
  });

  it('by default, should not touch pacakge.json scripts if items contain "run" with custom scripts', async () => {
    await jest.isolateModulesAsync(async () => {
      const scripts = {
        android: 'test-cli run:android',
        ios: 'test-cli run:ios',
        web: 'expo start --web',
      };
      jest.doMock(
        '/app/package.json',
        () => ({
          scripts: { ...scripts },
        }),
        {
          virtual: true,
        }
      );
      const sources = await getPackageJsonScriptSourcesAsync(
        '/app',
        await normalizeOptionsAsync('/app')
      );
      expect(sources).toContainEqual(
        expect.objectContaining({
          id: 'packageJson:scripts',
          contents: JSON.stringify(scripts),
        })
      );
    });
  });

  it('when sourceSkips=None, should not touch pacakge.json scripts if items contain "run"', async () => {
    await jest.isolateModulesAsync(async () => {
      const scripts = {
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web',
      };
      jest.doMock(
        '/app/package.json',
        () => ({
          scripts: { ...scripts },
        }),
        {
          virtual: true,
        }
      );
      const options = await normalizeOptionsAsync('/app', {
        sourceSkips: SourceSkips.None,
      });
      const sources = await getPackageJsonScriptSourcesAsync('/app', options);
      expect(sources).toContainEqual(
        expect.objectContaining({
          id: 'packageJson:scripts',
          contents: JSON.stringify(scripts),
        })
      );
    });
  });
});

describe('getCoreAutolinkingSources', () => {
  afterEach(() => {
    vol.reset();
  });

  const getCoreAutolinkingSourcesFromExpoAndroidWrapper = function (
    projectRoot: string,
    options: NormalizedOptions
  ) {
    return getCoreAutolinkingSourcesFromExpoAndroid(
      projectRoot,
      options,
      true /* useRNCoreAutolinkingFromExpo */
    );
  };
  const getCoreAutolinkingSourcesFromExpoIosWrapper = function (
    projectRoot: string,
    options: NormalizedOptions
  ) {
    return getCoreAutolinkingSourcesFromExpoIos(
      projectRoot,
      options,
      true /* useRNCoreAutolinkingFromExpo */
    );
  };
  const getCoreAutolinkingSourcesFromRncCliAsyncWrapper = function (
    projectRoot: string,
    options: NormalizedOptions
  ) {
    return getCoreAutolinkingSourcesFromRncCliAsync(
      projectRoot,
      options,
      false /* useRNCoreAutolinkingFromExpo */
    );
  };

  for (const testFn of [
    getCoreAutolinkingSourcesFromExpoAndroidWrapper,
    getCoreAutolinkingSourcesFromExpoIosWrapper,
    getCoreAutolinkingSourcesFromRncCliAsyncWrapper,
  ]) {
    it('should contain react-native core autolinking projects', async () => {
      const mockSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;
      const fixture = fs.readFileSync(
        path.join(__dirname, 'fixtures', 'RncoreAutoLinkingFromRncCli.json'),
        'utf8'
      );
      mockSpawnAsync.mockResolvedValue({
        stdout: fixture,
        stderr: '',
        status: 0,
        signal: null,
        output: [fixture, ''],
      });
      const sources = await testFn('/root/apps/demo', await normalizeOptionsAsync('/app'));
      expect(sources).toContainEqual(
        expect.objectContaining({
          type: 'dir',
          filePath: '../../node_modules/react-native-reanimated',
        })
      );
      expect(sources).toContainEqual(
        expect.objectContaining({
          type: 'dir',
          filePath: '../../node_modules/react-native-navigation-bar-color',
        })
      );
      expect(sources).toMatchSnapshot();
    });

    it('should not contain absolute paths', async () => {
      const mockSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;
      const fixture = fs.readFileSync(
        path.join(__dirname, 'fixtures', 'RncoreAutoLinkingFromRncCli.json'),
        'utf8'
      );
      mockSpawnAsync.mockResolvedValue({
        stdout: fixture,
        stderr: '',
        status: 0,
        signal: null,
        output: [fixture, ''],
      });
      const sources = await testFn('/root/apps/demo', await normalizeOptionsAsync('/app'));
      for (const source of sources) {
        if (source.type === 'dir' || source.type === 'file') {
          expect(source.filePath).not.toMatch(/^\/root/);
        } else {
          expect(source.contents).not.toMatch(/"\/root\//);
        }
      }
    });

    it('should gracefully ignore react-native-cli dependencies with a bad form', async () => {
      const mockSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;
      const fixture = fs.readFileSync(
        path.join(__dirname, 'fixtures', 'RncoreAutoLinkingBadDependencyFromRncCli.json'),
        'utf8'
      );
      mockSpawnAsync.mockResolvedValue({
        stdout: fixture,
        stderr: '',
        status: 0,
        signal: null,
        output: [fixture, ''],
      });
      const sources = await testFn('/root/apps/demo', await normalizeOptionsAsync('/app'));

      expect(sources).toContainEqual(
        expect.objectContaining({
          type: 'dir',
          filePath: '../../node_modules/react-native-reanimated',
        })
      );

      expect(sources).not.toContainEqual(
        expect.objectContaining({
          type: 'dir',
          filePath: '../../node_modules/react-native-navigation-bar-color',
        })
      );
    });
  }
});
