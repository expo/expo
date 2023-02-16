import spawnAsync from '@expo/spawn-async';
import findUp from 'find-up';
import fs from 'fs';
import { vol, fs as volFS } from 'memfs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { normalizeOptions } from '../../Options';
import {
  getEasBuildSourcesAsync,
  getExpoAutolinkingAndroidSourcesAsync,
  getExpoAutolinkingIosSourcesAsync,
  getExpoConfigSourcesAsync,
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

    const sources = await getEasBuildSourcesAsync('/app', normalizeOptions());
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
    let sources = await getExpoAutolinkingAndroidSourcesAsync('/app', normalizeOptions());
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'dir',
        filePath: 'node_modules/expo-modules-core/android',
      })
    );
    expect(sources).toMatchSnapshot();

    sources = await getExpoAutolinkingIosSourcesAsync('/app', normalizeOptions());
    expect(sources).toContainEqual(
      expect.objectContaining({ type: 'dir', filePath: 'node_modules/expo-modules-core' })
    );
    expect(sources).toMatchSnapshot();
  });

  it('should not containt absolute path in contents', async () => {
    let sources = await getExpoAutolinkingAndroidSourcesAsync('/app', normalizeOptions());
    for (const source of sources) {
      if (source.type === 'contents') {
        expect(source.contents.indexOf('/app/')).toBe(-1);
      }
    }

    sources = await getExpoAutolinkingIosSourcesAsync('/app', normalizeOptions());
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
    const mockedResolveFrom = resolveFrom as jest.MockedFunction<typeof resolveFrom>;
    mockedResolveFrom.mockImplementationOnce((fromDirectory: string, moduleId: string) => {
      const actualResolver = jest.requireActual('resolve-from');
      // To fake the case as no expo installed, trying to resolve as **nonexist/expo/config** module
      return actualResolver(fromDirectory, 'nonexist/expo/config');
    });
    const sources = await getExpoConfigSourcesAsync('/app', normalizeOptions());
    expect(sources.length).toBe(0);
  });

  it('should contain app.json', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    const sources = await getExpoConfigSourcesAsync('/app', normalizeOptions());
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'file',
        filePath: 'app.json',
      })
    );
  });

  it('should contain external icon file in app.json', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    vol.mkdirSync('/app/assets');
    vol.writeFileSync('/app/assets/icon.png', 'PNG data');
    const sources = await getExpoConfigSourcesAsync('/app', normalizeOptions());
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'file',
        filePath: './assets/icon.png',
      })
    );
  });
});

describe(`getExpoConfigSourcesAsync - config-plugins`, () => {
  let baseAppJson: { expo: any };

  function setupThirdPartyPlugin() {
    vol.mkdirSync('/app/node_modules/third-party', { recursive: true });

    // package.json
    vol.writeFileSync('/app/node_modules/third-party/package.json', '{}');
    const mockFindUpSync = findUp.sync as jest.MockedFunction<typeof findUp.sync>;
    mockFindUpSync.mockReturnValue('/app/node_modules/third-party/package.json');

    // entry file
    const withNoopPlugin = (config: any) => config;
    jest.mock('/app/node_modules/third-party/index.js', () => ({ default: withNoopPlugin }), {
      virtual: true,
    });
    const mockResolveFrom = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockResolveFrom.mockReturnValue('/app/node_modules/third-party/index.js');
  }

  beforeEach(() => {
    jest.doMock('fs', () => volFS);
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    baseAppJson = JSON.parse(vol.readFileSync('/app/app.json', 'utf8').toString());
  });

  afterEach(() => {
    vol.reset();
    const mockResolveFrom = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockResolveFrom.mockReset();
  });

  it('should contain external config-plugin dir', async () => {
    setupThirdPartyPlugin();

    vol.writeFileSync(
      '/app/app.json',
      JSON.stringify({
        ...baseAppJson,
        expo: {
          ...baseAppJson.expo,
          plugins: ['third-party'],
        },
      })
    );
    const sources = await getExpoConfigSourcesAsync('/app', normalizeOptions());
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'dir',
        filePath: 'node_modules/third-party',
      })
    );
  });

  it('should contain external config-plugin dir from plugin with parameters', async () => {
    setupThirdPartyPlugin();

    vol.writeFileSync(
      '/app/app.json',
      JSON.stringify({
        ...baseAppJson,
        expo: {
          ...baseAppJson.expo,
          plugins: [['third-party', { parameter: 'foo' }]],
        },
      })
    );
    const sources = await getExpoConfigSourcesAsync('/app', normalizeOptions());
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'dir',
        filePath: 'node_modules/third-party',
      })
    );
  });

  it('should not contain external config-plugin dir from raw function plugins', async () => {
    vol.writeFileSync(
      '/app/app.config.js',
      `\
export default ({ config }) => {
  return config;
};`
    );
    const sources = await getExpoConfigSourcesAsync('/app', normalizeOptions());

    vol.writeFileSync(
      '/app/app.config.js',
      `\
export default ({ config }) => {
  config.plugins ||= [];
  const withNoopPlugin = (config: any) => config;
  config.plugins.push(withNoopPlugin);
  return config;
};`
    );
    const sources2 = await getExpoConfigSourcesAsync('/app', normalizeOptions());

    expect(sources).toEqual(sources2);
  });
});
