import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';

import { EXPO_DIR } from './Constants';
import { Package, PackageJson } from './Packages';
import { buildWorkspacesInfo } from './Workspace';

function makePackage(
  packageName: string,
  packageJson: Partial<PackageJson> & { version: string },
  relPath?: string
): Package {
  // The directory name does NOT have to match the package name — that's the
  // whole point of the regression these tests cover.
  const dirName = relPath ?? packageName.replace(/^@[^/]+\//, '');
  return new Package(path.join(EXPO_DIR, 'packages', dirName), {
    name: packageName,
    scripts: {},
    ...packageJson,
  } as PackageJson);
}

describe('buildWorkspacesInfo', () => {
  it('returns empty info for an empty workspace', () => {
    assert.deepEqual(buildWorkspacesInfo([]), {});
  });

  it('classifies regular dependencies that satisfy the local version', () => {
    const expo = makePackage('expo', { version: '56.0.1' });
    const consumer = makePackage('consumer', {
      version: '1.0.0',
      dependencies: { expo: '^56.0.0' },
    });

    const info = buildWorkspacesInfo([expo, consumer]);

    assert.deepEqual(info.consumer.workspaceDependencies, ['expo']);
    assert.deepEqual(info.consumer.mismatchedWorkspaceDependencies, []);
  });

  it('classifies regular dependencies whose range does not satisfy the local version as mismatched', () => {
    const expo = makePackage('expo', { version: '56.0.1' });
    const consumer = makePackage('consumer', {
      version: '1.0.0',
      dependencies: { expo: '~55.0.0' },
    });

    const info = buildWorkspacesInfo([expo, consumer]);

    assert.deepEqual(info.consumer.workspaceDependencies, []);
    assert.deepEqual(info.consumer.mismatchedWorkspaceDependencies, ['expo']);
  });

  it('treats workspace: protocol specs as always-satisfying (pnpm linkWorkspacePackages: deep)', () => {
    const expo = makePackage('expo', { version: '56.0.1' });
    const consumer = makePackage('consumer', {
      version: '1.0.0',
      dependencies: {
        expo: 'workspace:*',
      },
      devDependencies: {
        // Even an explicit workspace:~55 range still resolves locally under pnpm.
        'expo-dev': 'workspace:~55.0.0',
      },
    });
    const expoDev = makePackage('expo-dev', { version: '56.0.1' });

    const info = buildWorkspacesInfo([expo, consumer, expoDev]);

    assert.deepEqual(info.consumer.workspaceDependencies.sort(), ['expo', 'expo-dev']);
    assert.deepEqual(info.consumer.mismatchedWorkspaceDependencies, []);
  });

  it('populates workspacePeerDependencies for peer-deps that point at workspace packages', () => {
    const expo = makePackage('expo', { version: '56.0.1' });
    // The directory differs from the package name — the previous yarn-based
    // implementation silently dropped this case.
    const ui = makePackage(
      '@expo/ui',
      {
        version: '56.0.1',
        peerDependencies: {
          expo: 'workspace:*',
          react: '*',
        },
      },
      'expo-ui'
    );

    const info = buildWorkspacesInfo([expo, ui]);

    assert.deepEqual(info['@expo/ui'].workspacePeerDependencies, ['expo']);
    assert.deepEqual(info['@expo/ui'].mismatchedWorkspacePeerDependencies, []);
    // `react` isn't a workspace package, so it's not classified as a workspace peer.
    assert.ok(!info['@expo/ui'].workspacePeerDependencies.includes('react'));
  });

  it('flags peer pins whose range does not satisfy the local peer version', () => {
    const expo = makePackage('expo', { version: '56.0.0-preview.2' });
    const cli = makePackage('@expo/cli', {
      version: '56.0.2',
      peerDependencies: {
        expo: '56.0.0-preview.1', // exact pin to an older expo
      },
    });

    const info = buildWorkspacesInfo([expo, cli]);

    assert.deepEqual(info['@expo/cli'].workspacePeerDependencies, ['expo']);
    assert.deepEqual(info['@expo/cli'].mismatchedWorkspacePeerDependencies, ['expo']);
  });

  it('keeps mismatchedWorkspacePeerDependencies as a subset of workspacePeerDependencies', () => {
    const expo = makePackage('expo', { version: '56.0.0-preview.2' });
    const reanimated = makePackage('react-native-reanimated', { version: '4.3.0' });
    const consumer = makePackage('consumer', {
      version: '1.0.0',
      peerDependencies: {
        expo: '56.0.0-preview.1', // mismatched
        'react-native-reanimated': 'workspace:*', // satisfied
        react: '*', // not a workspace package
      },
    });

    const info = buildWorkspacesInfo([expo, reanimated, consumer]);

    assert.deepEqual(info.consumer.workspacePeerDependencies.sort(), [
      'expo',
      'react-native-reanimated',
    ]);
    assert.deepEqual(info.consumer.mismatchedWorkspacePeerDependencies, ['expo']);
  });

  it('populates workspaceOptionalDependencies separately from regular deps', () => {
    const expo = makePackage('expo', { version: '56.0.1' });
    const consumer = makePackage('consumer', {
      version: '1.0.0',
      optionalDependencies: { expo: 'workspace:*' },
    });

    const info = buildWorkspacesInfo([expo, consumer]);

    assert.deepEqual(info.consumer.workspaceOptionalDependencies, ['expo']);
    assert.deepEqual(info.consumer.workspaceDependencies, []);
  });

  it('ignores deps whose name does not match a workspace package', () => {
    const expo = makePackage('expo', { version: '56.0.1' });
    const consumer = makePackage('consumer', {
      version: '1.0.0',
      dependencies: {
        expo: '^56.0.0',
        'react-native': '0.85.2',
      },
    });

    const info = buildWorkspacesInfo([expo, consumer]);

    assert.deepEqual(info.consumer.workspaceDependencies, ['expo']);
  });

  it('records each project at its location relative to EXPO_DIR', () => {
    const ui = makePackage('@expo/ui', { version: '56.0.1' }, 'expo-ui');

    const info = buildWorkspacesInfo([ui]);

    assert.equal(info['@expo/ui'].location, 'packages/expo-ui');
  });

  it('matches prerelease ranges that explicitly target the same prerelease line', () => {
    const expo = makePackage('expo', { version: '56.0.0-preview.2' });
    const tilde = makePackage('tilde-consumer', {
      version: '1.0.0',
      dependencies: { expo: '~56.0.0-preview.0' },
    });

    const info = buildWorkspacesInfo([expo, tilde]);

    assert.deepEqual(info['tilde-consumer'].workspaceDependencies, ['expo']);
  });

  it('flags non-prerelease ranges against prerelease versions as mismatched', () => {
    const expo = makePackage('expo', { version: '56.0.0-preview.2' });
    const caret = makePackage('caret-consumer', {
      version: '1.0.0',
      dependencies: { expo: '^56.0.0' },
    });

    const info = buildWorkspacesInfo([expo, caret]);

    assert.deepEqual(info['caret-consumer'].workspaceDependencies, []);
    assert.deepEqual(info['caret-consumer'].mismatchedWorkspaceDependencies, ['expo']);
  });
});
