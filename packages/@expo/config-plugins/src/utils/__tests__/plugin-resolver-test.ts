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

      it('a path to plugin library which does not contain app.plugin.js file', () => {
        const spy = jest.spyOn(console, 'warn').mockImplementation(jest.fn);

        /**
         * TODO @vonovak we might want to flip the expectation in the future.
         * Packages must export a plugin via app.plugin.js, this rule was added to prevent popular packages like lodash from being mistaken for a config plugin and breaking the prebuild.
         * https://docs.expo.dev/config-plugins/development-and-debugging/#expo-install
         * */
        expect(() => resolvePluginForModule(projectRoot, 'test-plugin')).not.toThrow(
          `Failed to resolve plugin for module "test-plugin" relative to`
        );
        expect(console.warn)
          .toHaveBeenCalledWith(`"test-plugin" config plugin is being resolved from its package.json main entry (node_modules/test-plugin/lib/commonjs/index.js).
This approach is deprecated and will throw an error in Expo SDK53.

To fix this:
1. Report this issue to the maintainer of "test-plugin" - they need to migrate to using \`app.plugin.js\` instead.
2. For immediate unblocking, reference the config plugin file directly: node_modules/test-plugin/lib/commonjs/index.js`);
        spy.mockRestore();
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

      it('test library which does not have app.plugin.js file but has main entry', () => {
        const spy = jest.spyOn(console, 'warn').mockImplementation(jest.fn);
        // https://docs.expo.dev/config-plugins/plugins-and-mods/#node-module-default-file
        // TODO @vonovak we might want this to throw in the future (see the TODO and test case above).
        expect(resolvePluginForModule(projectRoot, 'test-plugin')).toStrictEqual({
          filePath: `${projectRoot}/node_modules/test-plugin/lib/commonjs/index.js`,
          isPluginFile: false,
        });
        expect(console.warn).toHaveBeenCalledTimes(1);
        spy.mockRestore();
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
