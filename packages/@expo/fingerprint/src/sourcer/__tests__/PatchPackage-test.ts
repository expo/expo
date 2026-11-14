import { vol } from 'memfs';

import { normalizeOptionsAsync } from '../../Options';
import { getPatchPackageSourcesAsync } from '../PatchPackage';
import { getHashSourcesAsync } from '../Sourcer';

jest.mock('@expo/spawn-async');
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('../../ProjectWorkflow');
jest.mock('../../utils/SpawnIPC');
jest.mock('/app/package.json', () => ({}), { virtual: true });

describe(getPatchPackageSourcesAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should contain patch-packages `patches` dir', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    vol.fromJSON(require('./fixtures/PatchPackage.json'));

    const sources = await getPatchPackageSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'dir',
        filePath: 'patches',
      })
    );
  });

  it('should NOT add patches dir if it is ignored from the root', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    vol.fromJSON(require('./fixtures/PatchPackage.json'));

    const options = await normalizeOptionsAsync('/app', { ignorePaths: ['patches/'] });
    const sources = await getPatchPackageSourcesAsync('/app', options);
    expect(sources).toEqual([]);
  });

  it('should include workspace-root `patches` in a monorepo', async () => {
    vol.fromJSON({
      '/monorepo/package.json': JSON.stringify({
        name: 'monorepo',
        private: true,
        workspaces: ['app'],
        patchedDependencies: {
          'react-native@0.88.0': 'patches/react-native@0.88.0.patch',
        },
      }),
      '/monorepo/app/package.json': JSON.stringify({ name: 'app', private: true }),
      '/monorepo/patches/react-native@0.88.0.patch': 'diff --git a/react-native\n',
    });

    const sources = await getPatchPackageSourcesAsync(
      '/monorepo/app',
      await normalizeOptionsAsync('/monorepo/app')
    );
    expect(sources).toEqual([
      {
        type: 'dir',
        filePath: '../patches',
        reasons: ['patchPackage'],
      },
    ]);
  });

  it('should include project and workspace-root `patches` without duplicating either', async () => {
    vol.fromJSON({
      '/monorepo/package.json': JSON.stringify({
        private: true,
        workspaces: ['app'],
      }),
      '/monorepo/app/package.json': JSON.stringify({ name: 'app', private: true }),
      '/monorepo/app/patches/left-pad+1.0.0.patch': 'diff --git a/left-pad\n',
      '/monorepo/patches/react-native@0.88.0.patch': 'diff --git a/react-native\n',
    });

    const sources = await getPatchPackageSourcesAsync(
      '/monorepo/app',
      await normalizeOptionsAsync('/monorepo/app')
    );
    expect(sources).toEqual([
      {
        type: 'dir',
        filePath: 'patches',
        reasons: ['patchPackage'],
      },
      {
        type: 'dir',
        filePath: '../patches',
        reasons: ['patchPackage'],
      },
    ]);
  });

  it('should include workspace-root `patches` once when projectRoot is the workspace root', async () => {
    vol.fromJSON({
      '/monorepo/package.json': JSON.stringify({
        private: true,
        workspaces: ['app'],
        patchedDependencies: {
          'react-native@0.88.0': 'patches/react-native@0.88.0.patch',
        },
      }),
      '/monorepo/patches/react-native@0.88.0.patch': 'diff --git a/react-native\n',
    });

    const sources = await getPatchPackageSourcesAsync(
      '/monorepo',
      await normalizeOptionsAsync('/monorepo')
    );
    expect(sources).toEqual([
      {
        type: 'dir',
        filePath: 'patches',
        reasons: ['patchPackage'],
      },
    ]);
  });

  it('should include workspace-root `patches` for a nested apps/* package', async () => {
    vol.fromJSON({
      '/monorepo/package.json': JSON.stringify({
        private: true,
        workspaces: { packages: ['apps/*', 'packages/*'] },
      }),
      '/monorepo/apps/mobile/package.json': JSON.stringify({ name: 'mobile', private: true }),
      '/monorepo/patches/react-native@0.88.0.patch': 'diff --git a/react-native\n',
    });

    const sources = await getPatchPackageSourcesAsync(
      '/monorepo/apps/mobile',
      await normalizeOptionsAsync('/monorepo/apps/mobile')
    );
    expect(sources).toEqual([
      {
        type: 'dir',
        filePath: '../../patches',
        reasons: ['patchPackage'],
      },
    ]);
  });

  it('should include pnpm workspace-root `patches`', async () => {
    vol.fromJSON({
      '/pnpm-monorepo/pnpm-workspace.yaml':
        'packages: # workspace packages\n  - \'apps/*\'\n  - "app"\n\nignoreWorkspaceCycles: true\n',
      '/pnpm-monorepo/package.json': JSON.stringify({ name: 'pnpm-monorepo', private: true }),
      '/pnpm-monorepo/app/package.json': JSON.stringify({ name: 'app', private: true }),
      '/pnpm-monorepo/patches/react-native@0.88.0.patch': 'diff --git a/react-native\n',
    });

    const sources = await getPatchPackageSourcesAsync(
      '/pnpm-monorepo/app',
      await normalizeOptionsAsync('/pnpm-monorepo/app')
    );
    expect(sources).toEqual([
      {
        type: 'dir',
        filePath: '../patches',
        reasons: ['patchPackage'],
      },
    ]);
  });

  it('should not include a parent `patches` dir when the project is outside the workspace globs', async () => {
    vol.fromJSON({
      '/outer/package.json': JSON.stringify({
        private: true,
        workspaces: ['packages/*'],
      }),
      '/outer/patches/react-native@0.88.0.patch': 'diff --git a/react-native\n',
      '/outer/app/package.json': JSON.stringify({ name: 'app', private: true }),
    });

    const sources = await getPatchPackageSourcesAsync(
      '/outer/app',
      await normalizeOptionsAsync('/outer/app')
    );
    expect(sources).toEqual([]);
  });
});

describe('patch-package postinstall', () => {
  it('should contain `package.json` scripts block for lifecycle patches', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    const scriptsBlock = {
      postinstall: 'npx patch-package',
    };
    jest.doMock(
      '/app/package.json',
      () => ({
        name: 'app',
        private: true,
        scripts: scriptsBlock,
      }),
      { virtual: true }
    );

    const sources = await getHashSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'contents',
        id: 'packageJson:scripts',
        contents: JSON.stringify(scriptsBlock),
        reasons: ['packageJson:scripts'],
      })
    );
  });
});
