import type { ExpoConfig } from '@expo/config-types';
import * as path from 'path';

import {
  moduleNameIsDirectFileReference,
  moduleNameIsPackageReference,
  resolveConfigPluginFunction,
  resolvePluginForModule,
} from '../plugin-resolver';

describe('plugin resolver', () => {
  describe(moduleNameIsDirectFileReference, () => {
    it('file path', () => {
      expect(moduleNameIsDirectFileReference('./app')).toBe(true);
      expect(moduleNameIsDirectFileReference('~/app')).toBe(true);
      expect(moduleNameIsDirectFileReference('/app')).toBe(true);
      expect(moduleNameIsDirectFileReference('.')).toBe(true);
    });
    it('module', () => {
      expect(moduleNameIsDirectFileReference('app')).toBe(false);
      expect(moduleNameIsDirectFileReference('@bugsnag/plugin-expo-eas-sourcemaps')).toBe(false);
      expect(moduleNameIsDirectFileReference('@expo/app')).toBe(false);
    });
    it('module folder', () => {
      expect(moduleNameIsDirectFileReference('app/')).toBe(true);
      expect(moduleNameIsDirectFileReference('@expo/app/')).toBe(true);
    });
    it('module file', () => {
      expect(moduleNameIsDirectFileReference('app/index.js')).toBe(true);
      expect(moduleNameIsDirectFileReference('@expo/app/index')).toBe(true);
      expect(moduleNameIsDirectFileReference('@sentry/react-native/expo')).toBe(true);
    });
  });

  it('moduleNameIsPackageReference', () => {
    expect(moduleNameIsPackageReference('app')).toBe(true);
    expect(moduleNameIsPackageReference('@expo/app')).toBe(true);
    // eslint-disable-next-line no-useless-escape -- package references don't have backslashes - even on Windows
    expect(moduleNameIsPackageReference(`@expo\app`)).toBe(false);
    expect(moduleNameIsPackageReference(`@expo/app/path.js`)).toBe(false);
    expect(moduleNameIsPackageReference(`@bugsnag/plugin-expo-eas-sourcemaps`)).toBe(true);
    expect(moduleNameIsPackageReference(`@sentry/react-native/expo`)).toBe(false);
  });

  describe(resolvePluginForModule, () => {
    const projectRoot = path.resolve(__dirname, 'fixtures');

    describe('throws when given', () => {
      it('a non-existent plugin', () => {
        expect(() => resolvePluginForModule(projectRoot, './testPlugin__wrong_path.js')).toThrow(
          `Failed to resolve plugin for module "./testPlugin__wrong_path.js" relative to`
        );
      });
    });

    describe('resolves plugin path for', () => {
      it('./testPlugin.js module path with extension', () => {
        expect(resolvePluginForModule(projectRoot, './testPlugin.js')).toStrictEqual({
          filePath: `${projectRoot}/testPlugin.js`,
          isPluginFile: false,
        });
      });

      it('./testPlugin module path', () => {
        expect(resolvePluginForModule(projectRoot, './testPlugin')).toStrictEqual({
          filePath: `${projectRoot}/testPlugin.js`,
          isPluginFile: false,
        });
      });

      it('./localTsPlugin module path resolves the TypeScript file', () => {
        expect(resolvePluginForModule(projectRoot, './localTsPlugin')).toStrictEqual({
          filePath: `${projectRoot}/localTsPlugin.ts`,
          isPluginFile: false,
        });
      });

      it('./node_modules/test-plugin/lib/commonjs/index.js direct file path', () => {
        expect(
          resolvePluginForModule(projectRoot, './node_modules/test-plugin/lib/commonjs/index.js')
        ).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-plugin/lib/commonjs/index.js`,
          isPluginFile: false,
        });
      });

      it('test-lib library name', () => {
        expect(resolvePluginForModule(projectRoot, 'test-lib')).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-lib/app.plugin.js`,
          isPluginFile: true,
        });
      });

      it('test-lib-ts library name with TypeScript plugin entry', () => {
        expect(resolvePluginForModule(projectRoot, 'test-lib-ts')).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-lib-ts/app.plugin.ts`,
          isPluginFile: true,
        });
      });

      it('test-lib-esm library name with ESM plugin entry', () => {
        expect(resolvePluginForModule(projectRoot, 'test-lib-esm')).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-lib-esm/app.plugin.mjs`,
          isPluginFile: true,
        });
      });

      it('test library which does not have app.plugin.js file but has main entry', () => {
        expect(resolvePluginForModule(projectRoot, 'test-plugin')).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-plugin/lib/commonjs/index.js`,
          isPluginFile: false,
        });
      });

      it('test-lib library name with file path', () => {
        expect(resolvePluginForModule(projectRoot, 'test-lib/app.plugin.js')).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-lib/app.plugin.js`,
          isPluginFile: false,
        });
        expect(resolvePluginForModule(projectRoot, 'test-lib/not.app.plugin.js')).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-lib/not.app.plugin.js`,
          isPluginFile: false,
        });
      });
    });

    describe('warns when package.json:exports hides the plugin', () => {
      let warn: jest.SpyInstance;

      beforeEach(() => {
        warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        warn.mockRestore();
      });

      it('warns once for a package that does not export its app.plugin.js', () => {
        expect(resolvePluginForModule(projectRoot, 'test-lib-unexported')).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-lib-unexported/app.plugin.js`,
          isPluginFile: true,
        });
        resolvePluginForModule(projectRoot, 'test-lib-unexported');
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/"test-lib-unexported"[\s\S]*"\.\/app\.plugin\.js"/);
      });

      it('does not warn for a package that exports its app.plugin.js', () => {
        resolvePluginForModule(projectRoot, 'test-lib-exported');
        expect(warn).not.toHaveBeenCalled();
      });

      it('does not warn for a package without exports', () => {
        resolvePluginForModule(projectRoot, 'test-lib');
        expect(warn).not.toHaveBeenCalled();
      });
    });
  });

  describe(resolveConfigPluginFunction, () => {
    const projectRoot = path.resolve(__dirname, 'fixtures');

    it('loads and transpiles a TypeScript plugin entry', () => {
      const plugin = resolveConfigPluginFunction(projectRoot, 'test-lib-ts');
      expect(typeof plugin).toBe('function');
      const input = { name: 'app' } as ExpoConfig;
      expect(plugin(input, undefined)).toBe(input);
    });
  });
});
