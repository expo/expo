import { vol } from 'memfs';

import { configureWorkspacesAsync, PNPM_WORKSPACE_FILENAME } from '../configureWorkspaces';

jest.mock('fs');
jest.mock('node:fs', () => require('memfs').fs);

const projectRoot = '/project';

const readJson = (file: string) => JSON.parse(String(vol.readFileSync(file)));

const seedMonorepo = (
  pkgManagerSpec: 'workspace:*' | '*',
  options: {
    rootWorkspaces?: any;
    extraMembers?: Record<string, any>;
  } = {}
) => {
  const rootWorkspaces = options.rootWorkspaces ?? ['apps/*', 'packages/*'];
  const json: Record<string, string> = {
    [`${projectRoot}/package.json`]: JSON.stringify({
      name: 'monorepo',
      private: true,
      workspaces: rootWorkspaces,
    }),
    [`${projectRoot}/apps/mobile/package.json`]: JSON.stringify({
      name: 'mobile',
      version: '0.0.0',
      dependencies: {
        expo: '~55.0.0',
        'shared-ui': pkgManagerSpec,
      },
      devDependencies: {
        'shared-config': pkgManagerSpec,
        typescript: '^5.0.0',
      },
    }),
    [`${projectRoot}/apps/tv/package.json`]: JSON.stringify({
      name: 'tv',
      version: '0.0.0',
      dependencies: {
        expo: '~55.0.0',
        'shared-ui': pkgManagerSpec,
      },
    }),
    [`${projectRoot}/packages/shared-ui/package.json`]: JSON.stringify({
      name: 'shared-ui',
      version: '0.0.0',
    }),
    [`${projectRoot}/packages/shared-config/package.json`]: JSON.stringify({
      name: 'shared-config',
      version: '0.0.0',
    }),
  };
  for (const [filePath, contents] of Object.entries(options.extraMembers ?? {})) {
    json[filePath] = typeof contents === 'string' ? contents : JSON.stringify(contents);
  }
  vol.fromJSON(json);
};

describe(configureWorkspacesAsync, () => {
  beforeEach(() => {
    vol.reset();
  });

  it('is a no-op when the root package.json has no workspaces field', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({
        name: 'single-app',
        version: '0.0.0',
      }),
    });

    await configureWorkspacesAsync(projectRoot, 'pnpm');

    expect(vol.existsSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`)).toBe(false);
    // package.json unchanged.
    expect(readJson(`${projectRoot}/package.json`)).toEqual({
      name: 'single-app',
      version: '0.0.0',
    });
  });

  it('is a no-op when the project root has no package.json', async () => {
    vol.fromJSON({ [`${projectRoot}/.keep`]: '' });

    await expect(configureWorkspacesAsync(projectRoot, 'pnpm')).resolves.toBeUndefined();
    expect(vol.existsSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`)).toBe(false);
  });

  describe('with pnpm', () => {
    it('rewrites "*" workspace deps to "workspace:*" and writes pnpm-workspace.yaml', async () => {
      seedMonorepo('*');

      await configureWorkspacesAsync(projectRoot, 'pnpm');

      const mobile = readJson(`${projectRoot}/apps/mobile/package.json`);
      expect(mobile.dependencies).toEqual({
        expo: '~55.0.0',
        'shared-ui': 'workspace:*',
      });
      expect(mobile.devDependencies).toEqual({
        'shared-config': 'workspace:*',
        typescript: '^5.0.0',
      });
      const tv = readJson(`${projectRoot}/apps/tv/package.json`);
      expect(tv.dependencies['shared-ui']).toBe('workspace:*');

      const yaml = String(vol.readFileSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`));
      expect(yaml).toBe(['packages:', '  - apps/*', '  - packages/*', ''].join('\n'));
    });

    it('leaves already-"workspace:*" specs untouched (no needless write)', async () => {
      seedMonorepo('workspace:*');

      await configureWorkspacesAsync(projectRoot, 'pnpm');

      const mobile = readJson(`${projectRoot}/apps/mobile/package.json`);
      expect(mobile.dependencies['shared-ui']).toBe('workspace:*');
      // Still writes the YAML file regardless.
      expect(vol.existsSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`)).toBe(true);
    });

    it('accepts the yarn object form `{ packages: [...] }`', async () => {
      seedMonorepo('*', {
        rootWorkspaces: { packages: ['apps/*', 'packages/*'] },
      });

      await configureWorkspacesAsync(projectRoot, 'pnpm');

      expect(readJson(`${projectRoot}/apps/mobile/package.json`).dependencies['shared-ui']).toBe(
        'workspace:*'
      );
      expect(vol.existsSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`)).toBe(true);
    });
  });

  describe('with npm', () => {
    it('rewrites "workspace:*" workspace deps to "*" with %s and does not write pnpm-workspace.yaml', async () => {
      seedMonorepo('workspace:*');

      await configureWorkspacesAsync(projectRoot, 'npm');

      const mobile = readJson(`${projectRoot}/apps/mobile/package.json`);
      expect(mobile.dependencies['shared-ui']).toBe('*');
      expect(mobile.devDependencies['shared-config']).toBe('*');
      expect(vol.existsSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`)).toBe(false);
    });

    it('leaves already-"*" specs untouched under npm', async () => {
      seedMonorepo('*');
      await configureWorkspacesAsync(projectRoot, 'npm');
      expect(readJson(`${projectRoot}/apps/mobile/package.json`).dependencies['shared-ui']).toBe(
        '*'
      );
    });
  });

  describe('with yarn / bun', () => {
    it.each(['yarn', 'bun'] as const)(
      'rewrites "*" workspace deps to "workspace:*" with %s and does not write pnpm-workspace.yaml',
      async (manager) => {
        seedMonorepo('*');

        await configureWorkspacesAsync(projectRoot, manager);

        const mobile = readJson(`${projectRoot}/apps/mobile/package.json`);
        expect(mobile.dependencies['shared-ui']).toBe('workspace:*');
        expect(mobile.devDependencies['shared-config']).toBe('workspace:*');
        expect(vol.existsSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`)).toBe(false);
      }
    );

    it.each(['yarn', 'bun'] as const)(
      'leaves already-"workspace:*" specs untouched',
      async (manager) => {
        seedMonorepo('workspace:*');
        await configureWorkspacesAsync(projectRoot, manager);
        expect(readJson(`${projectRoot}/apps/mobile/package.json`).dependencies['shared-ui']).toBe(
          'workspace:*'
        );
      }
    );
  });

  it('leaves non-workspace dep specs (semver ranges, file paths) untouched', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({
        name: 'monorepo',
        workspaces: ['apps/*'],
      }),
      [`${projectRoot}/apps/mobile/package.json`]: JSON.stringify({
        name: 'mobile',
        dependencies: {
          expo: '~55.0.0',
          'shared-ui': '*',
          'some-local': 'file:../some-local',
          react: '19.2.3',
        },
      }),
    });

    await configureWorkspacesAsync(projectRoot, 'pnpm');

    const mobile = readJson(`${projectRoot}/apps/mobile/package.json`);
    expect(mobile.dependencies).toEqual({
      expo: '~55.0.0',
      'shared-ui': 'workspace:*',
      'some-local': 'file:../some-local',
      react: '19.2.3',
    });
  });

  it('skips workspace members that do not have a package.json (e.g. empty dir)', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({
        name: 'monorepo',
        workspaces: ['apps/*'],
      }),
      [`${projectRoot}/apps/mobile/package.json`]: JSON.stringify({
        name: 'mobile',
        dependencies: { 'shared-ui': '*' },
      }),
      [`${projectRoot}/apps/empty-dir/.gitkeep`]: '',
    });

    await expect(configureWorkspacesAsync(projectRoot, 'pnpm')).resolves.toBeUndefined();
    expect(readJson(`${projectRoot}/apps/mobile/package.json`).dependencies['shared-ui']).toBe(
      'workspace:*'
    );
  });
});
