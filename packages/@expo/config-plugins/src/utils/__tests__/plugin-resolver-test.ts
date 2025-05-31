import * as path from 'path';

import {
  moduleNameIsDirectFileReference,
  moduleNameIsPackageReference,
  resolvePluginForModule,
} from '../plugin-resolver';
jest.unmock('resolve-from');

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

      it.each([['test-lib-with-exports/app.plugin.js'], ['test-lib-with-exports']])(
        'a plugin file which is not made available via package.json exports for %s',
        (moduleName) => {
          expect(() => resolvePluginForModule(projectRoot, moduleName)).toThrow(
            /Failed to resolve plugin for module "test-lib-with-exports\/app\.plugin\.js" relative to ".*\/fixtures".*\n└─ Cause: Error: Package subpath '\.\/app\.plugin\.js' is not defined by "exports" in .*test-lib-with-exports\/package\.json/
          );
        }
      );
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

      it('direct file path', () => {
        expect(
          resolvePluginForModule(projectRoot, './node_modules/test-plugin/lib/commonjs/index.js')
        ).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-plugin/lib/commonjs/index.js`,
          isPluginFile: false,
        });
        expect(
          resolvePluginForModule(projectRoot, './node_modules/test-lib-with-exports/app.plugin.js')
        ).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-lib-with-exports/app.plugin.js`,
          isPluginFile: true,
        });
      });

      it('test-lib library name', () => {
        expect(resolvePluginForModule(projectRoot, 'test-lib')).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-lib/app.plugin.js`,
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
          isPluginFile: true,
        });
        expect(resolvePluginForModule(projectRoot, 'test-lib/not.app.plugin.js')).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-lib/not.app.plugin.js`,
          isPluginFile: false,
        });
      });
    });
  });
});
