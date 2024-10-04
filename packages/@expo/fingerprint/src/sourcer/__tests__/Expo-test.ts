import spawnAsync from '@expo/spawn-async';
import { getConfig } from 'expo/config';
import fs from 'fs';
import { vol, fs as volFS } from 'memfs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { HashSourceContents } from '../../Fingerprint.types';
import { normalizeOptionsAsync } from '../../Options';
import {
  getEasBuildSourcesAsync,
  getExpoAutolinkingAndroidSourcesAsync,
  getExpoAutolinkingIosSourcesAsync,
  getExpoConfigSourcesAsync,
  sortExpoAutolinkingAndroidConfig,
} from '../Expo';

jest.mock('@expo/spawn-async');
jest.mock('find-up');
jest.mock('fs/promises');
jest.mock('resolve-from');
jest.mock('/app/package.json', () => {}, { virtual: true });

describe(getEasBuildSourcesAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should contains `eas.json` file', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    vol.writeFileSync(
      '/app/eas.json',
      `
{
  "cli": {
    "version": ">= 2.6.0"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      },
      "ios": {
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}`
    );

    const sources = await getEasBuildSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'file',
        filePath: 'eas.json',
      })
    );
  });
});

describe('getExpoAutolinkingSourcesAsync', () => {
  beforeEach(() => {
    const mockSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;
    const fixtureAndroid = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'ExpoAutolinkingAndroid.json'),
      'utf8'
    );
    const fixtureIos = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'ExpoAutolinkingIos.json'),
      'utf8'
    );
    mockSpawnAsync.mockResolvedValueOnce({
      stdout: fixtureAndroid,
      stderr: '',
      status: 0,
      signal: null,
      output: [fixtureAndroid, ''],
    });
    mockSpawnAsync.mockResolvedValueOnce({
      stdout: fixtureIos,
      stderr: '',
      status: 0,
      signal: null,
      output: [fixtureIos, ''],
    });
  });

  afterEach(() => {
    vol.reset();
  });

  it('should contain expo autolinking projects', async () => {
    let sources = await getExpoAutolinkingAndroidSourcesAsync(
      '/app',
      await normalizeOptionsAsync('/app')
    );
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'dir',
        filePath: 'node_modules/expo-modules-core/android',
      })
    );
    expect(sources).toMatchSnapshot();

    sources = await getExpoAutolinkingIosSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(
      expect.objectContaining({ type: 'dir', filePath: 'node_modules/expo-modules-core' })
    );
    expect(sources).toMatchSnapshot();
  });

  it('should not containt absolute path in contents', async () => {
    let sources = await getExpoAutolinkingAndroidSourcesAsync(
      '/app',
      await normalizeOptionsAsync('/app')
    );
    for (const source of sources) {
      if (source.type === 'contents') {
        expect(source.contents.indexOf('/app/')).toBe(-1);
      }
    }

    sources = await getExpoAutolinkingIosSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    for (const source of sources) {
      if (source.type === 'contents') {
        expect(source.contents.indexOf('/app/')).toBe(-1);
      }
    }
  });
});

describe(getExpoConfigSourcesAsync, () => {
  beforeAll(() => {
    jest.doMock('fs', () => volFS);
  });

  afterEach(() => {
    vol.reset();
  });

  it('should return empty array when expo package is not installed', async () => {
    vol.fromJSON(require('./fixtures/BareReactNative70Project.json'));
    const mockedResolveFrom = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockedResolveFrom.mockImplementationOnce((fromDirectory: string, moduleId: string) => {
      const actualResolver = jest.requireActual('resolve-from').silent;
      // To fake the case as no expo installed, trying to resolve as **nonexist/expo/config** module
      return actualResolver(fromDirectory, 'nonexist/expo/config');
    });
    const sources = await getExpoConfigSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources.length).toBe(0);
  });

  it('should contain expo config', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    const appJson = JSON.parse(vol.readFileSync('/app/app.json', 'utf8').toString());
    const sources = await getExpoConfigSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    const expoConfigSource = sources.find<HashSourceContents>(
      (source): source is HashSourceContents =>
        source.type === 'contents' && source.id === 'expoConfig'
    );
    const expoConfig = JSON.parse(expoConfigSource?.contents?.toString() ?? 'null');
    expect(expoConfig).not.toBeNull();
    expect(expoConfig.name).toEqual(appJson.expo.name);
  });

  it('should not contain runtimeVersion in expo config', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    vol.writeFileSync(
      '/app/app.config.js',
      `\
export default ({ config }) => {
  config.runtimeVersion = '1.0.0';
  return config;
};`
    );
    const sources = await getExpoConfigSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    const expoConfigSource = sources.find<HashSourceContents>(
      (source): source is HashSourceContents =>
        source.type === 'contents' && source.id === 'expoConfig'
    );
    const expoConfig = JSON.parse(expoConfigSource?.contents?.toString() ?? 'null');
    expect(expoConfig).not.toBeNull();
    expect(expoConfig.runtimeVersion).toBeUndefined();
  });

  it('should keep expo config contents in deterministic order', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    const sources = await getExpoConfigSourcesAsync('/app', await normalizeOptionsAsync('/app'));

    const appJsonContents = vol.readFileSync('/app/app.json', 'utf8').toString();
    const appJson = JSON.parse(appJsonContents);
    const { name } = appJson.expo;
    // Re-insert name to change the object order
    delete appJson.expo.name;
    appJson.expo.name = name;
    const newAppJsonContents = JSON.stringify(appJson);
    expect(newAppJsonContents).not.toEqual(appJsonContents);
    vol.writeFileSync('/app/app.json', newAppJsonContents);

    // Even new app.json contents changed its order, the source contents should be the same.
    const sources2 = await getExpoConfigSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toEqual(sources2);
  });

  it('should contain external icon file in app.json', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    vol.mkdirSync('/app/assets');
    vol.writeFileSync('/app/assets/icon.png', 'PNG data');
    const sources = await getExpoConfigSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'file',
        filePath: './assets/icon.png',
      })
    );
  });

  it('should contain extra files from config plugins', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    const config = await getConfig('/app', { skipSDKVersionRequirement: true });
    const mockSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;
    const stdout = JSON.stringify({
      config,
      loadedModules: [
        'node_modules/third-party/index.js',
        'node_modules/third-party/node_modules/transitive-third-party/index.js',
      ],
    });
    mockSpawnAsync.mockResolvedValueOnce({
      output: [],
      stdout,
      stderr: '',
      signal: null,
      status: 0,
    });
    const sources = await getExpoConfigSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'file',
        filePath: 'node_modules/third-party/index.js',
      })
    );
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'file',
        filePath: 'node_modules/third-party/node_modules/transitive-third-party/index.js',
      })
    );
  });
});

describe('sortExpoAutolinkingConfig', () => {
  it('should sort autolinking projects by name', () => {
    const config = {
      extraDependencies: { androidMavenRepos: [], iosPods: {} },
      modules: [
        {
          packageName: 'expo',
          packageVersion: '49.0.5',
          projects: [
            {
              name: 'expo',
              sourceDir: '/app/node_modules/expo/android',
            },
          ],
          modules: [],
        },
        {
          packageName: 'expo-modules-core',
          packageVersion: '1.5.8',
          projects: [
            {
              name: 'expo-modules-core$android-annotation',
              sourceDir: '/app/node_modules/expo-modules-core/android-annotation',
            },
            {
              name: 'expo-modules-core',
              sourceDir: '/app/node_modules/expo-modules-core/android',
            },
            {
              name: 'expo-modules-core$android-annotation-processor',
              sourceDir: '/app/node_modules/expo-modules-core/android-annotation-processor',
            },
          ],
          modules: [],
        },
      ],
    };

    const result = sortExpoAutolinkingAndroidConfig(config);
    expect(result.modules[1].projects[0].name).toBe('expo-modules-core');
    expect(result.modules[1].projects[1].name).toBe('expo-modules-core$android-annotation');
    expect(result.modules[1].projects[2].name).toBe(
      'expo-modules-core$android-annotation-processor'
    );
  });
});
