import assert from 'node:assert/strict';
import test from 'node:test';

import { validateWorkspaceDependencyProtocols } from './check.js';

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
