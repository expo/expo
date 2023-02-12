import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import { getConfig } from '../Config';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('fs');

describe(getConfig, () => {
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
      vol.reset();
    });
    it('parses a ts config', () => {
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
        '/'
      );

      const { exp } = getConfig('/', {
        skipSDKVersionRequirement: true,
      });
      // @ts-ignore: foo property is not defined
      expect(exp.foo).toBe('bar+value');
      expect(exp.name).toBe('rewrote+ts-config-test');
      expect(exp._internal).toStrictEqual({
        dynamicConfigPath: '/app.config.ts',
        isDebug: false,
        packageJsonPath: '/package.json',
        projectRoot: '/',
        staticConfigPath: null,
      });
    });
    it('parses a js config', () => {
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
        },
        '/'
      );

      // ensure config is composed (package.json values still exist)
      const { exp, dynamicConfigPath, staticConfigPath } = getConfig('/', {
        skipSDKVersionRequirement: true,
      });
      expect(dynamicConfigPath).toBe('/app.config.js');
      expect(staticConfigPath).toBe('/app.json');

      // @ts-ignore: foo property is not defined
      expect(exp.foo).toBe('bar');
      // Ensure the config is passed the package.json values
      expect(exp.name).toBe('js-config-test+config');
      // Ensures that the app.json is read and passed to the method
      expect(exp.slug).toBe('someslug+config');
      expect(exp._internal).toStrictEqual({
        dynamicConfigPath: '/app.config.js',
        isDebug: false,
        packageJsonPath: '/package.json',
        projectRoot: '/',
        staticConfigPath: '/app.json',
      });
    });
    it('parses a js config with export default', () => {
      vol.fromJSON(
        {
          'package.json': JSON.stringify({
            name: 'js-config-test',
            version: '1.0.0',
          }),
          // Config exporting a function as default
          'app.config.js': `export default function ({ config }) {
            config.foo = 'bar';
            if (config.name) config.name += '+config-default';
            return config;
          }`,
        },
        '/'
      );
      const { exp, staticConfigPath } = getConfig('/', {
        skipSDKVersionRequirement: true,
      });
      // @ts-ignore: foo property is not defined
      expect(exp.foo).toBe('bar');
      expect(exp.name).toBe('js-config-test+config-default');
      // Static is undefined when a custom path is a dynamic config.
      expect(staticConfigPath).toBe(null);
    });
    it('parses a js config that exports json', () => {
      vol.fromJSON(
        {
          'package.json': JSON.stringify({
            name: 'js-config-test',
            version: '1.0.0',
          }),
          // Config exporting an object (JSON)
          'app.config.js': `module.exports = {
            foo: 'bar',
            name: 'cool+export-json_app.config',
          };`,
        },
        '/'
      );

      const { exp } = getConfig('/', {
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
      vol.reset();
    });

    it(`skips plugin parsing`, () => {
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
        '/'
      );
      const { exp } = getConfig('/', {
        skipSDKVersionRequirement: true,
        skipPlugins: true,
      });
      expect(exp.plugins).toBeUndefined();
    });
    it(`skips JS plugin parsing`, () => {
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
        '/'
      );
      const { exp } = getConfig('/', {
        skipSDKVersionRequirement: true,
        skipPlugins: true,
      });
      expect(exp.name).toBe('cool+export-json_app.config');
      expect(exp.plugins).toBeUndefined();
    });
    it(`applies JS plugins`, () => {
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
        '/'
      );
      const { exp } = getConfig('/', {
        skipSDKVersionRequirement: true,
        skipPlugins: false,
      });
      expect(exp.name).toBe('custom');
      expect(exp.plugins).toBeDefined();
    });
    it(`throws when plugins are missing`, () => {
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
        '/'
      );
      expect(() =>
        getConfig('/', {
          skipSDKVersionRequirement: true,
          skipPlugins: false,
        })
      ).toThrow(/Failed to resolve plugin for module "__missing-plugin" relative to "\/"/);
    });
  });
});
