import assert from 'node:assert/strict';
import test from 'node:test';

import { validatePluginExports, validateWorkspaceDependencyProtocols } from './check.js';

const workspacePackageNames = new Set(['expo', 'expo-constants', 'external-name-collision']);
const logger = { warn() {}, verbose() {} };

test('accepts workspace protocols and broad internal peers', () => {
  assert.doesNotThrow(() =>
    validateWorkspaceDependencyProtocols(
      {
        packageName: 'consumer',
        workspacePackageNames,
        packageJson: {
          dependencies: { expo: 'workspace:~' },
          devDependencies: { 'expo-constants': 'workspace:^' },
          peerDependencies: { expo: '*' },
          optionalDependencies: { 'expo-constants': 'workspace:*' },
        },
      },
      logger
    )
  );
});

test('rejects non-workspace ranges for every internal dependency kind', () => {
  assert.throws(
    () =>
      validateWorkspaceDependencyProtocols(
        {
          packageName: 'consumer',
          workspacePackageNames,
          packageJson: {
            dependencies: { expo: '^56.0.0' },
            devDependencies: { 'expo-constants': '~56.0.0' },
            peerDependencies: { expo: '^56.0.0' },
            optionalDependencies: { 'expo-constants': '56.0.0' },
          },
        },
        logger
      ),
    /without the workspace: protocol/
  );
});

test('only permits a broad non-workspace range for peer dependencies', () => {
  assert.throws(
    () =>
      validateWorkspaceDependencyProtocols(
        {
          packageName: 'consumer',
          workspacePackageNames,
          packageJson: { dependencies: { expo: '*' } },
        },
        logger
      ),
    /without the workspace: protocol/
  );
});

test('does not apply workspace rules to external dependencies', () => {
  assert.doesNotThrow(() =>
    validateWorkspaceDependencyProtocols(
      {
        packageName: 'consumer',
        workspacePackageNames,
        packageJson: { dependencies: { react: '19.2.0' } },
      },
      logger
    )
  );
});

const pluginPackage = (exports) => ({
  packageName: 'expo-example',
  packageJson: { name: 'expo-example', ...(exports !== undefined ? { exports } : {}) },
});

test('should accept a plugin listed in exports', () => {
  assert.doesNotThrow(() =>
    validatePluginExports(
      pluginPackage({ '.': './build/index.js', './app.plugin.js': './app.plugin.js' }),
      ['app.plugin.js'],
      logger
    )
  );
});

test('should accept a plugin covered by an exports pattern', () => {
  assert.doesNotThrow(() =>
    validatePluginExports(
      pluginPackage({ '.': './build/index.js', './*': './*' }),
      ['app.plugin.js'],
      logger
    )
  );
  assert.doesNotThrow(() =>
    validatePluginExports(
      pluginPackage({ '.': './build/index.js', './*.js': './*.js' }),
      ['app.plugin.js'],
      logger
    )
  );
});

test('should accept a package without exports', () => {
  assert.doesNotThrow(() =>
    validatePluginExports(pluginPackage(undefined), ['app.plugin.js'], logger)
  );
});

test('should accept a package without a plugin file', () => {
  assert.doesNotThrow(() =>
    validatePluginExports(pluginPackage({ '.': './build/index.js' }), [], logger)
  );
});

test('should reject a plugin missing from exports', () => {
  assert.throws(
    () =>
      validatePluginExports(
        pluginPackage({ '.': './build/index.js', './plugin': './plugin/build/index.js' }),
        ['app.plugin.js'],
        logger
      ),
    /does not export its config plugin/
  );
});

test('should reject a plugin that exports explicitly hide', () => {
  assert.throws(
    () =>
      validatePluginExports(
        pluginPackage({ '.': './build/index.js', './*': './*', './app.plugin.js': null }),
        ['app.plugin.js'],
        logger
      ),
    /does not export its config plugin/
  );
});

test('should reject a package whose exports has no subpaths', () => {
  assert.throws(
    () => validatePluginExports(pluginPackage('./build/index.js'), ['app.plugin.js'], logger),
    /does not export its config plugin/
  );
});
