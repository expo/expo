import { vol } from 'memfs';

import { getConfig, getProjectConfigDescriptionWithPaths, readConfigJson } from '../Config';

jest.mock('fs');

describe(getProjectConfigDescriptionWithPaths, () => {
  it(`describes a project using both a static and dynamic config`, () => {
    const message = getProjectConfigDescriptionWithPaths('/', {
      dynamicConfigPath: '/app.config.js',
      staticConfigPath: '/app.config.json',
    });
    expect(message).toMatch(`app.config.js`);
    expect(message).toMatch(`app.config.json`);
  });
  it(`describes a project using only a static config`, () => {
    const message = getProjectConfigDescriptionWithPaths('/', {
      dynamicConfigPath: null,
      staticConfigPath: '/app.json',
    });
    expect(message).toMatch(`app.json`);
  });
  it(`describes a project using only a dynamic config`, () => {
    const message = getProjectConfigDescriptionWithPaths('/', {
      dynamicConfigPath: '/app.config.ts',
      staticConfigPath: null,
    });
    expect(message).toMatch(`app.config.ts`);
  });
  it(`describes a project with no configs using a default value`, () => {
    const message = getProjectConfigDescriptionWithPaths('/', {
      dynamicConfigPath: null,
      staticConfigPath: null,
    });
    expect(message).toBe('app.json');
  });
});

describe('getConfig public config', () => {
  const appJsonWithPrivateData = {
    name: 'testing 123',
    version: '0.1.0',
    slug: 'testing-123',
    sdkVersion: '100.0.0',
    hooks: {
      postPublish: [],
    },
    android: {
      config: {
        googleMaps: {
          apiKey: 'test-key',
        },
      },
      versionCode: 1,
    },
    ios: {
      config: {
        googleMapsApiKey: 'test-key',
      },
      buildNumber: '1.0',
    },
  };

  const appJsonNoPrivateData = {
    name: 'testing 123',
    version: '0.1.0',
    slug: 'testing-123',
    sdkVersion: '100.0.0',
    ios: {
      buildNumber: '1.0',
    },
  };

  beforeAll(() => {
    const packageJson = JSON.stringify(
      {
        name: 'testing123',
        version: '0.1.0',
        description: 'fake description',
        main: 'index.js',
      },
      null,
      2
    );

    vol.fromJSON({
      '/private-data/package.json': packageJson,
      '/private-data/app.json': JSON.stringify({ expo: appJsonWithPrivateData }),
      '/no-private-data/package.json': packageJson,
      '/no-private-data/app.json': JSON.stringify({ expo: appJsonNoPrivateData }),
    });
  });

  afterAll(() => vol.reset());

  it('removes only private data from the config', () => {
    const { exp } = getConfig('/private-data', { isPublicConfig: true });

    expect(exp.hooks).toBeUndefined();

    expect(exp.ios).toBeDefined();
    expect(exp.ios.buildNumber).toEqual(appJsonWithPrivateData.ios.buildNumber);
    expect(exp.ios.config).toBeUndefined();

    expect(exp.android).toBeDefined();
    expect(exp.android.versionCode).toEqual(appJsonWithPrivateData.android.versionCode);
    expect(exp.android.config).toBeUndefined();
    expect(exp._internal).toBeUndefined();
  });

  it('does not remove properties from a config with no private data', () => {
    const { exp } = getConfig('/no-private-data', { isPublicConfig: true });
    expect(exp).toMatchObject(appJsonNoPrivateData);
  });
});

describe('readConfigJson', () => {
  describe('sdkVersion', () => {
    beforeAll(() => {
      const packageJson = JSON.stringify(
        {
          name: 'testing123',
          version: '0.1.0',
          description: 'fake description',
          main: 'index.js',
        },
        null,
        2
      );

      const appJson = {
        name: 'testing 123',
        version: '0.1.0',
        slug: 'testing-123',
        sdkVersion: '100.0.0',
      };

      const expoPackageJson = JSON.stringify({
        name: 'expo',
        version: '650.x.x',
      });

      vol.fromJSON({
        '/from-config/package.json': packageJson,
        '/from-config/app.json': JSON.stringify({ expo: appJson }),
        '/from-config/node_modules/expo/package.json': expoPackageJson,

        '/from-package/package.json': packageJson,
        '/from-package/app.json': JSON.stringify({ expo: { ...appJson, sdkVersion: undefined } }),
        '/from-package/node_modules/expo/package.json': expoPackageJson,

        '/no-version/package.json': packageJson,
        '/no-version/app.json': JSON.stringify({ expo: { ...appJson, sdkVersion: undefined } }),
      });
    });
    afterAll(() => vol.reset());

    it('reads the SDK version from the config', () => {
      const { exp } = readConfigJson('/from-config');
      expect(exp.sdkVersion).toBe('100.0.0');
    });

    it('reads the SDK version from the installed version of expo', () => {
      const { exp } = readConfigJson('/from-package');
      expect(exp.sdkVersion).toBe('650.0.0');
    });

    it('skips resolution of the SDK version', () => {
      const { exp } = readConfigJson('/no-version', true, true);
      expect(exp.sdkVersion).not.toBeDefined();
    });
  });

  describe('validation', () => {
    beforeAll(() => {
      const packageJson = JSON.stringify({
        name: 'testing123',
        version: '0.1.0',
        main: 'index.js',
      });

      const expoPackageJson = JSON.stringify({
        name: 'expo',
        version: '650.x.x',
      });

      vol.fromJSON({
        '/no-config/package.json': packageJson,
        '/no-config/node_modules/expo/package.json': expoPackageJson,

        '/no-package/package.json': packageJson,
      });
    });
    afterAll(() => vol.reset());

    it(`can skip throwing when the app.json is missing`, () => {
      const { exp, pkg } = readConfigJson('/no-config', true);
      expect(exp.name).toBe(pkg.name);
      expect(exp.description).toBe(pkg.description);
    });

    it(`can skip throwing when the app.json is missing and expo isn't installed`, () => {
      const { exp, pkg } = readConfigJson('/no-package', true, true);
      expect(exp.name).toBe(pkg.name);
      expect(exp.description).toBe(pkg.description);
    });

    it(`will throw if the app.json is missing`, () => {
      expect(() => readConfigJson('/no-config')).toThrow(
        /Project at path \/no-config does not contain a valid Expo config/
      );
      // No config is required for new method
      expect(() => getConfig('/no-config')).not.toThrow();
    });

    it(`will throw if the expo package is missing`, () => {
      expect(() => readConfigJson('/no-package', true)).toThrow(
        /Cannot determine which native SDK version your project uses/
      );
      expect(() => getConfig('/no-package', { skipSDKVersionRequirement: false })).toThrow(
        /Cannot determine which native SDK version your project uses/
      );
    });
  });
});
