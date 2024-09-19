import * as path from 'path';

import { moduleNameIsDirectFileReference, resolvePluginForModule } from '../plugin-resolver';
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
      expect(moduleNameIsDirectFileReference('@expo/app')).toBe(false);
    });
    it('module folder', () => {
      expect(moduleNameIsDirectFileReference('app/')).toBe(true);
      expect(moduleNameIsDirectFileReference('@expo/app/')).toBe(true);
    });
    it('module file', () => {
      expect(moduleNameIsDirectFileReference('app/index.js')).toBe(true);
      expect(moduleNameIsDirectFileReference('@expo/app/index')).toBe(true);
    });
  });

  describe(resolvePluginForModule, () => {
    const projectRoot = path.resolve(__dirname, 'fixtures');

    it('throws an error for non-existent plugin', () => {
      expect(() => resolvePluginForModule(projectRoot, './testPlugin__wrong_path.js')).toThrow(
        `Failed to resolve plugin for module "./testPlugin__wrong_path.js" relative to`
      );
    });

    it.each([
      {
        pluginReference: './testPlugin.js',
        expected: { filePath: 'testPlugin.js', isPluginFile: false },
      },
      {
        pluginReference: './testPlugin',
        expected: { filePath: 'testPlugin.js', isPluginFile: false },
      },
      {
        pluginReference: './node_modules/test-plugin/lib/commonjs/index.js',
        expected: {
          filePath: 'node_modules/test-plugin/lib/commonjs/index.js',
          isPluginFile: false,
        },
      },
      {
        pluginReference: 'test-plugin',
        expected: {
          filePath: 'node_modules/test-plugin/lib/commonjs/index.js',
          isPluginFile: false,
        },
      },
      {
        pluginReference: 'test-lib',
        expected: { filePath: 'node_modules/test-lib/app.plugin.js', isPluginFile: true },
      },
    ])('resolves plugin for $pluginReference', ({ pluginReference, expected }) => {
      expect(resolvePluginForModule(projectRoot, pluginReference)).toStrictEqual({
        filePath: `${projectRoot}/${expected.filePath}`,
        isPluginFile: expected.isPluginFile,
      });
    });
  });
});
