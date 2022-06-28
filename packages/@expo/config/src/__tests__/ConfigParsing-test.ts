import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import { getConfig, resetCustomConfigPaths, setCustomConfigPath } from '../Config';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('fs');

describe(getConfig, () => {
  beforeAll(async () => {
    vol.fromJSON(
      {
        'app.json': JSON.stringify({
          expo: {
            foo: 'invalid',
            slug: 'someslug',
          },
        }),
        'package.json': JSON.stringify({
          name: 'js-config-test',
          version: '1.0.0',
        }),
        // Config exporting a function on the module.exports object
        'app.config.js': `module.exports = function ({ config }) {
          config.foo = 'bar';
          if (config.name) config.name += '+config';
          if (config.slug) config.slug += '+config';
          return config;
        };`,
        // Config exporting a function as default
        'with-default_app.config.js': `export default function ({ config }) {
          config.foo = 'bar';
          if (config.name) config.name += '+config-default';
          return config;
        }`,
        // Config exporting an object (JSON)
        'export-json_app.config.js': `module.exports = {
          foo: 'bar',
          name: 'cool+export-json_app.config',
        };`,
      },
      'js'
    );
    vol.fromJSON(
      {
        // Read this TS file so we can validate the types
        'app.config.ts': fsReal.readFileSync(
          path.join(__dirname, './fixtures/ts/app.config.ts'),
          'utf8'
        ),
        'package.json': JSON.stringify({
          name: 'ts-config-test',
          version: '1.0.0',
        }),
      },
      'ts'
    );
    vol.fromJSON(
      {
        // A custom config location
        'src/app.staging.json': JSON.stringify({
          name: 'app-staging-name',
          expo: {
            name: 'app-staging-expo-name',
            expo: {
              name: 'app-staging-expo-expo-name',
            },
          },
        }),
        'app.json': JSON.stringify({
          name: 'app-name',
          expo: {
            name: 'app-expo-name',
            expo: {
              name: 'app-expo-expo-name',
            },
          },
        }),
        'package.json': JSON.stringify({
          version: '1.0.0',
        }),
      },
      'custom-location-json'
    );
    vol.fromJSON(
      {
        'app.json': JSON.stringify({
          expo: {
            name: 'app-expo-name',
            plugins: ['__missing-plugin'],
          },
        }),
        'package.json': JSON.stringify({
          version: '1.0.0',
        }),
      },
      'json-missing-plugins'
    );
    vol.fromJSON(
      {
        'app.config.js': `module.exports = {
          foo: 'bar',
          name: 'cool+export-json_app.config',
          plugins: [(config)=> { config.name ='custom'; return config; }]
        };`,
        'package.json': JSON.stringify({
          version: '1.0.0',
        }),
      },
      'js-plugins'
    );
  });

  afterAll(() => {
    vol.reset();
  });

  // Tests the following:
  // - All supported languages are working
  // - ensure `app.config` has higher priority to `app`
  // - generated `.expo` object is created and the language hint is added
  describe('language support', () => {
    beforeEach(() => {
      delete process.env.EXPO_DEBUG;
      const projectRoot = 'js';
      setCustomConfigPath(projectRoot, undefined);
    });
    it('parses a ts config', () => {
      const projectRoot = 'ts';
      const { exp } = getConfig(projectRoot, {
        skipSDKVersionRequirement: true,
      });
      // @ts-ignore: foo property is not defined
      expect(exp.foo).toBe('bar+value');
      expect(exp.name).toBe('rewrote+ts-config-test');
      expect(exp._internal).toStrictEqual({
        dynamicConfigPath: 'ts/app.config.ts',
        isDebug: false,
        packageJsonPath: 'ts/package.json',
        projectRoot: 'ts',
        staticConfigPath: null,
      });
    });
    it('parses a js config', () => {
      // ensure config is composed (package.json values still exist)
      const projectRoot = 'js';
      const { exp, dynamicConfigPath, staticConfigPath } = getConfig(projectRoot, {
        skipSDKVersionRequirement: true,
      });
      expect(dynamicConfigPath).toBe(path.join(projectRoot, 'app.config.js'));
      expect(staticConfigPath).toBe(path.join(projectRoot, 'app.json'));

      // @ts-ignore: foo property is not defined
      expect(exp.foo).toBe('bar');
      // Ensure the config is passed the package.json values
      expect(exp.name).toBe('js-config-test+config');
      // Ensures that the app.json is read and passed to the method
      expect(exp.slug).toBe('someslug+config');
      expect(exp._internal).toStrictEqual({
        dynamicConfigPath: 'js/app.config.js',
        isDebug: false,
        packageJsonPath: 'js/package.json',
        projectRoot: 'js',
        staticConfigPath: 'js/app.json',
      });
    });
    it('parses a js config with export default', () => {
      const projectRoot = 'js';
      const configPath = path.resolve(projectRoot, 'with-default_app.config.js');
      setCustomConfigPath(projectRoot, configPath);
      const { exp, staticConfigPath } = getConfig(projectRoot, {
        skipSDKVersionRequirement: true,
      });
      // @ts-ignore: foo property is not defined
      expect(exp.foo).toBe('bar');
      expect(exp.name).toBe('js-config-test+config-default');
      // Static is undefined when a custom path is a dynamic config.
      expect(staticConfigPath).toBe(null);
    });
    it('parses a js config that exports json', () => {
      const projectRoot = 'js';
      const configPath = path.resolve(projectRoot, 'export-json_app.config.js');
      setCustomConfigPath(projectRoot, configPath);
      const { exp } = getConfig(projectRoot, {
        skipSDKVersionRequirement: true,
      });
      // @ts-ignore: foo property is not defined
      expect(exp.foo).toBe('bar');
      expect(exp.name).toBe('cool+export-json_app.config');
    });
  });

  describe('behavior', () => {
    beforeEach(() => {
      delete process.env.EXPO_DEBUG;
      resetCustomConfigPaths();
    });

    it(`skips plugin parsing`, () => {
      const { exp } = getConfig('json-missing-plugins', {
        skipSDKVersionRequirement: true,
        skipPlugins: true,
      });
      expect(exp.plugins).toBeUndefined();
    });
    it(`skips JS plugin parsing`, () => {
      const { exp } = getConfig('js-plugins', {
        skipSDKVersionRequirement: true,
        skipPlugins: true,
      });
      expect(exp.name).toBe('cool+export-json_app.config');
      expect(exp.plugins).toBeUndefined();
    });
    it(`applies JS plugins`, () => {
      const { exp } = getConfig('js-plugins', {
        skipSDKVersionRequirement: true,
        skipPlugins: false,
      });
      expect(exp.name).toBe('custom');
      expect(exp.plugins).toBeDefined();
    });
    it(`throws when plugins are missing`, () => {
      expect(() =>
        getConfig('json-missing-plugins', {
          skipSDKVersionRequirement: true,
          skipPlugins: false,
        })
      ).toThrow(
        /Failed to resolve plugin for module "__missing-plugin" relative to "json-missing-plugins"/
      );
    });

    // Test that setCustomConfigPath works to read custom json configs.
    it('uses a custom location', () => {
      const projectRoot = 'custom-location-json';
      const customConfigPath = path.join(projectRoot, 'src/app.staging.json');
      setCustomConfigPath(projectRoot, customConfigPath);

      const { exp, staticConfigPath, dynamicConfigPath } = getConfig(projectRoot, {
        skipSDKVersionRequirement: true,
      });

      expect(staticConfigPath).toBe(customConfigPath);
      expect(dynamicConfigPath).toBe(null);

      // Ensure the expo object is reduced out. See #1542.
      // Also test that a nested expo object isn't recursively reduced.
      // @ts-ignore: expo property is not defined
      expect(exp.expo).toStrictEqual({ name: 'app-staging-expo-expo-name' });
      // name is read from the correct config at the custom location.
      expect(exp.name).toBe('app-staging-expo-name');
      // slug should be copied from name if it wasn't defined.
      expect(exp.slug).toBe('app-staging-expo-name');
      // Version comes from package.json in the root.
      expect(exp.version).toBe('1.0.0');
      // No packages are installed and no platforms are specified.
      expect(exp.platforms).toEqual(expect.any(Array));

      // Ensure this works
      resetCustomConfigPaths();
      // After the reset, read the root config and ensure it doesn't match the custom location config.
      const { exp: baseExp } = getConfig(projectRoot, {
        skipSDKVersionRequirement: true,
      });
      // name is read from the default config.
      expect(baseExp.name).toBe('app-expo-name');
      // A base app.json is parsed differently, ensure the app.json parsing doesn't accidentally reduce the "expo" object multiple times.
      // @ts-ignore: expo property is not defined
      expect(baseExp.expo).toStrictEqual({ name: 'app-expo-expo-name' });

      expect(exp._internal).toStrictEqual({
        dynamicConfigPath: null,
        isDebug: false,
        packageJsonPath: 'custom-location-json/package.json',
        projectRoot: 'custom-location-json',
        staticConfigPath: 'custom-location-json/src/app.staging.json',
      });
    });
  });
});
