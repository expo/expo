import { vol } from 'memfs';

import { getConfig, getProjectConfigDescriptionWithPaths, modifyConfigAsync } from '../Config';

jest.mock('fs');
jest.mock('@expo/config-plugins', () => ({
  withPlugins: jest.fn((config, plugins) => config),
}));

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

    expect((exp as any).hooks).toBeUndefined();

    expect(exp.ios).toBeDefined();
    expect(exp.ios!.buildNumber).toEqual(appJsonWithPrivateData.ios.buildNumber);
    expect(exp.ios!.config).toBeUndefined();

    expect(exp.android).toBeDefined();
    expect(exp.android!.versionCode).toEqual(appJsonWithPrivateData.android.versionCode);
    expect(exp.android!.config).toBeUndefined();
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
      const { exp } = getConfig('/from-config');
      expect(exp.sdkVersion).toBe('100.0.0');
    });

    it('reads the SDK version from the installed version of expo', () => {
      const { exp } = getConfig('/from-package');
      expect(exp.sdkVersion).toBe('650.0.0');
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

    it(`can skip throwing when the app.json is missing and expo isn't installed`, () => {
      const { exp, pkg } = getConfig('/no-package', { skipSDKVersionRequirement: true });
      expect(exp.name).toBe(pkg.name);
      expect(exp.description).toBe(pkg.description);
    });

    it(`will not throw if the app.json is missing`, () => {
      // No config is required for new method
      expect(() => getConfig('/no-config')).not.toThrow();
    });

    it(`will not throw if the expo package is missing when skipSDKVersionRequirement is enabled`, () => {
      expect(() => getConfig('/no-package', { skipSDKVersionRequirement: false })).toThrow(
        /Cannot determine which native SDK version your project uses/
      );
    });
  });
});

describe('hasUnusedStaticConfig', () => {
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

  afterAll(() => vol.reset());

  it('is false when there is no dynamic config and only a static config', () => {
    vol.fromJSON({
      '/static-config/package.json': packageJson,
      '/static-config/app.json': JSON.stringify({ expo: appJson }),
      '/static-config/node_modules/expo/package.json': expoPackageJson,
    });

    const { hasUnusedStaticConfig } = getConfig('/static-config');
    expect(hasUnusedStaticConfig).toBe(false);
  });

  it('is false when a dynamic config exists and spreads the static config', () => {
    const appConfigJsThatInherits = `
      module.exports = ({ config }) => {
        return {
          ...config,
        };
      };
    `;

    vol.fromJSON({
      '/dynamic-inherits/package.json': packageJson,
      '/dynamic-inherits/app.json': JSON.stringify({ expo: appJson }),
      '/dynamic-inherits/app.config.js': appConfigJsThatInherits,
      '/dynamic-inherits/node_modules/expo/package.json': expoPackageJson,
    });

    const { hasUnusedStaticConfig } = getConfig('/dynamic-inherits');
    expect(hasUnusedStaticConfig).toBe(false);
  });

  it('is true when a dynamic config exists and does not spread the static config', () => {
    const appConfigJsThatDoesntInherit = `
      module.exports = ({ config }) => {
        return {
          hi: 'no inherit'
        };
      };
    `;

    vol.fromJSON({
      '/dynamic-no-inherits/package.json': packageJson,
      '/dynamic-no-inherits/app.json': JSON.stringify({ expo: appJson }),
      '/dynamic-no-inherits/app.config.js': appConfigJsThatDoesntInherit,
      '/dynamic-no-inherits/node_modules/expo/package.json': expoPackageJson,
    });

    const { hasUnusedStaticConfig } = getConfig('/dynamic-no-inherits');
    expect(hasUnusedStaticConfig).toBe(true);
  });

  it('is false when there is only a dynamic config and no static config', () => {
    const appConfigJs = `
      module.exports = () => {
        return {
          "name": "testing 123",
          "version": "0.1.0",
          "slug": "testing-123",
          "sdkVersion": "100.0.0",
        };
      };
    `;

    vol.fromJSON({
      '/dynamic/package.json': packageJson,
      '/dynamic/app.config.js': appConfigJs,
      '/dynamic/node_modules/expo/package.json': expoPackageJson,
    });

    const { hasUnusedStaticConfig } = getConfig('/dynamic');
    expect(hasUnusedStaticConfig).toBe(false);
  });
});

describe(modifyConfigAsync, () => {
  function createProject(
    projectRoot: Parameters<typeof vol.fromJSON>[1],
    files: Parameters<typeof vol.fromJSON>[0] = {}
  ) {
    const packageFile = {
      name: 'testing123',
      version: '0.1.0',
      description: 'fake description',
      main: 'index.js',
    };

    const expoPackageFile = {
      name: 'expo',
      version: '650.x.x',
    };

    vol.fromJSON(
      {
        'package.json': JSON.stringify(packageFile),
        'node_modules/expo/package.json': JSON.stringify(expoPackageFile),
        ...files,
      },
      projectRoot
    );
  }

  const appFile = {
    name: 'testing 123',
    version: '0.1.0',
    slug: 'testing-123',
    sdkVersion: '100.0.0',
  };

  afterEach(() => vol.reset());

  it('succeeds without existing config', async () => {
    createProject('/no-config');

    await expect(modifyConfigAsync('/no-config', { name: 'new name' })).resolves.toMatchObject({
      type: 'success',
      config: { name: 'new name' },
    });
  });

  it('succeeds when modifying static config only', async () => {
    createProject('/static-only', {
      'app.json': JSON.stringify(appFile, null, 2),
    });

    await expect(modifyConfigAsync('/static-only', { name: 'new name' })).resolves.toMatchObject({
      type: 'success',
      config: { ...appFile, name: 'new name' },
    });
  });

  it('warns when modifying dynamic config only', async () => {
    createProject('/dynamic-only', {
      'app.config.js': `module.exports = () => JSON.parse(\`${JSON.stringify({ ...appFile, version: '9.9.9' })}\`);`,
    });

    await expect(modifyConfigAsync('/dynamic-only', { name: 'new name' })).resolves.toMatchObject({
      type: 'warn',
      config: null,
      message: expect.stringMatching(/dynamic config/),
    });
  });

  it('warns when modifying static with object-like dynamic config', async () => {
    createProject('/static-dynamic-object', {
      'app.json': JSON.stringify(appFile),
      'app.config.js': `module.exports = JSON.parse(\`${JSON.stringify({ ...appFile, version: '9.9.9' })}\`);`,
    });

    await expect(
      modifyConfigAsync('/static-dynamic-object', { name: 'new name' })
    ).resolves.toMatchObject({
      type: 'warn',
      config: null,
      message: expect.stringMatching(/dynamic config/),
    });

    // Ensure the config was rolled back
    expect(appFile).toMatchObject(
      JSON.parse(
        vol.readFileSync('/static-dynamic-object/app.json', { encoding: 'utf-8' }) as string
      )
    );
  });

  it('warns when modifying static with function-like dynamic config, without extending config', async () => {
    createProject('/static-dynamic-function', {
      'app.json': JSON.stringify(appFile),
      'app.config.js': `module.exports = () => JSON.parse(\`${JSON.stringify({ ...appFile, version: '9.9.9' })}\`);`,
    });

    await expect(
      modifyConfigAsync('/static-dynamic-function', { name: 'new name' })
    ).resolves.toMatchObject({
      type: 'warn',
      config: null,
      message: expect.stringMatching(/dynamic config/),
    });

    // Ensure the config was rolled back
    expect(appFile).toMatchObject(
      JSON.parse(
        vol.readFileSync('/static-dynamic-function/app.json', { encoding: 'utf-8' }) as string
      )
    );
  });

  it('succeeds when modifying static with function-like dynamic config, with extending config', async () => {
    createProject('/static-dynamic-function', {
      'app.json': JSON.stringify(appFile),
      'app.config.js': `module.exports = ({ config }) => ({ ...config, version: '9.9.9' });`,
    });

    await expect(
      modifyConfigAsync('/static-dynamic-function', { name: 'new name' })
    ).resolves.toMatchObject({
      type: 'success',
      config: {
        ...appFile,
        version: '9.9.9', // Modified by dynamic config
        name: 'new name',
      },
    });
  });

  it('succeeds when modifying static with function-like dynamic config, when mutating updates.url', async () => {
    createProject('/static-dynamic-function-updates.url', {
      'app.json': JSON.stringify({
        ...appFile,
        updates: { requestHeaders: { 'expo-channel-name': 'existing-property' } },
      }),
      'app.config.js': `module.exports = ({ config }) => ({ ...config, version: '9.9.9' });`,
    });

    await expect(
      modifyConfigAsync('/static-dynamic-function-updates.url', {
        updates: { url: 'https://u.expo.dev/test-project' },
      })
    ).resolves.toMatchObject({
      type: 'success',
      config: {
        ...appFile,
        version: '9.9.9', // Modified by dynamic config
        // The combined nested object
        updates: {
          requestHeaders: { 'expo-channel-name': 'existing-property' },
          url: 'https://u.expo.dev/test-project',
        },
      },
    });
  });

  it('succeeds when modifying static with function-like dynamic config, when mutating and deleting updates.url properties', async () => {
    createProject('/static-dynamic-function-updates.url', {
      'app.json': JSON.stringify({
        ...appFile,
        updates: { requestHeaders: { 'expo-channel-name': 'existing-property' } },
      }),
      'app.config.js': `module.exports = ({ config }) => ({ ...config, version: '9.9.9' });`,
    });

    await expect(
      modifyConfigAsync('/static-dynamic-function-updates.url', {
        updates: { url: 'https://u.expo.dev/test-project', requestHeaders: undefined },
      })
    ).resolves.toMatchObject({
      type: 'success',
      config: {
        ...appFile,
        version: '9.9.9', // Modified by dynamic config
        // The combined nested object
        updates: {
          url: 'https://u.expo.dev/test-project',
        },
      },
    });
  });

  it('succeeds when modifying static with function-like dynamic config, when mutating and extending extra.eas', async () => {
    createProject('/static-dynamic-function-extra.eas', {
      'app.json': JSON.stringify(appFile),
      'app.config.js': `module.exports = ({ config }) => ({
        ...config, 
        extra: { 
          ...config.extra, 
          eas: { 
            ...config.extra?.eas, 
            someProperty: 'dynamic-property'
          }
        }
      });`,
    });

    await expect(
      modifyConfigAsync('/static-dynamic-function-extra.eas', {
        extra: { eas: { projectId: 'test-project' } },
      })
    ).resolves.toMatchObject({
      type: 'success',
      config: {
        ...appFile,
        // The combined nested object
        extra: {
          eas: {
            someProperty: 'dynamic-property',
            projectId: 'test-project',
          },
        },
      },
    });
  });

  it('warns when modifying static with function-like dynamic config, when mutating but not extending extra.eas', async () => {
    createProject('/static-dynamic-function-extra.eas-override', {
      'app.json': JSON.stringify(appFile),
      'app.config.js': `module.exports = ({ config }) => ({
        ...config, 
        extra: { 
          ...config.extra, 
          eas: { 
            someProperty: 'dynamic-property'
          }
        }
      });`,
    });

    await expect(
      modifyConfigAsync('/static-dynamic-function-extra.eas-override', {
        extra: { eas: { projectId: 'test-project' } },
      })
    ).resolves.toMatchObject({
      type: 'warn',
      config: null,
      message: expect.stringMatching(/dynamic config/),
    });

    // Ensure the config was rolled back
    expect(appFile).toMatchObject(
      JSON.parse(
        vol.readFileSync('/static-dynamic-function-extra.eas-override/app.json', {
          encoding: 'utf-8',
        }) as string
      )
    );
  });

  describe('plugins modifications', () => {
    it('adds plugin entry without props', async () => {
      createProject('/plugins-modification-add-simple', {
        'app.json': JSON.stringify(appFile),
      });

      await expect(
        modifyConfigAsync('/plugins-modification-add-simple', {
          plugins: ['expo-router'],
        })
      ).resolves.toMatchObject({
        type: 'success',
        config: {
          ...appFile,
          plugins: ['expo-router'],
        },
      });
    });

    it('does not add existing plugin entry without props', async () => {
      createProject('/plugins-modification-existing-simple', {
        'app.json': JSON.stringify({ ...appFile, plugins: ['expo-font', 'expo-router'] }),
      });

      await expect(
        modifyConfigAsync('/plugins-modification-existing-simple', {
          plugins: ['expo-font'],
        })
      ).resolves.toMatchObject({
        type: 'success',
        config: {
          ...appFile,
          plugins: ['expo-font', 'expo-router'],
        },
      });
    });

    it('adds plugin properties to plugin entry without props', async () => {
      createProject('/plugins-modification-add-complex', {
        'app.json': JSON.stringify({ ...appFile, plugins: ['expo-font', 'expo-router'] }),
      });

      await expect(
        modifyConfigAsync('/plugins-modification-add-complex', {
          plugins: [['expo-font', { test: 'prop' }]],
        })
      ).resolves.toMatchObject({
        type: 'success',
        config: {
          ...appFile,
          plugins: [['expo-font', { test: 'prop' }], 'expo-router'],
        },
      });
    });

    it('merges plugin properties to plugin entry with props', async () => {
      createProject('/plugins-modification-existing-complex', {
        'app.json': JSON.stringify({
          ...appFile,
          plugins: [['expo-font', { existing: 'prop' }], 'expo-router'],
        }),
      });

      await expect(
        modifyConfigAsync('/plugins-modification-existing-complex', {
          plugins: [['expo-font', { test: 'prop' }]],
        })
      ).resolves.toMatchObject({
        type: 'success',
        config: {
          ...appFile,
          plugins: [['expo-font', { existing: 'prop', test: 'prop' }], 'expo-router'],
        },
      });
    });

    // This shouldn't be used, but might be if users unnecessarily defines plugins as single array entries
    it('merges plugin properties to plugin entry with empty props', async () => {
      createProject('/plugins-modification-existing-unnecessary-complex', {
        'app.json': JSON.stringify({
          ...appFile,
          plugins: [['expo-font'], ['expo-router']],
        }),
      });

      await expect(
        modifyConfigAsync('/plugins-modification-existing-unnecessary-complex', {
          plugins: [['expo-font', { test: 'prop' }]],
        })
      ).resolves.toMatchObject({
        type: 'success',
        config: {
          ...appFile,
          plugins: [['expo-font', { test: 'prop' }], ['expo-router']],
        },
      });
    });
  });
});
