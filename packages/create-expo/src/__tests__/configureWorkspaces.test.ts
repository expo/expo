import { vol } from 'memfs';

import {
  configureWorkspacesAsync,
  PNPM_WORKSPACE_FILENAME,
  YARN_RC_FILENAME,
} from '../configureWorkspaces';
import type { MonorepoConfig } from '../monorepoConfig';

jest.mock('fs');

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

const HOISTED: MonorepoConfig = { workspaceConfig: { nodeLinker: 'hoisted' } };
const ISOLATED: MonorepoConfig = { workspaceConfig: { nodeLinker: 'isolated' } };

describe(configureWorkspacesAsync, () => {
  const originalUserAgent = process.env.npm_config_user_agent;

  beforeEach(() => {
    vol.reset();
    delete process.env.npm_config_user_agent;
  });

  afterAll(() => {
    if (originalUserAgent === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = originalUserAgent;
    }
  });

  it('is a no-op when the root package.json has no workspaces field', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ name: 'single-app', version: '0.0.0' }),
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
    it('rewrites "*" workspace deps to "workspace:*" and writes pnpm-workspace.yaml without nodeLinker', async () => {
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

    it('adds nodeLinker: hoisted when the monorepo config opts in', async () => {
      seedMonorepo('*');

      await configureWorkspacesAsync(projectRoot, 'pnpm', HOISTED);

      const yaml = String(vol.readFileSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`));
      expect(yaml).toBe(
        ['packages:', '  - apps/*', '  - packages/*', 'nodeLinker: hoisted', ''].join('\n')
      );
    });

    it('passes other nodeLinker values through verbatim', async () => {
      seedMonorepo('*');

      await configureWorkspacesAsync(projectRoot, 'pnpm', ISOLATED);

      const yaml = String(vol.readFileSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`));
      expect(yaml).toContain('nodeLinker: isolated');
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
      seedMonorepo('*', { rootWorkspaces: { packages: ['apps/*', 'packages/*'] } });

      await configureWorkspacesAsync(projectRoot, 'pnpm');

      expect(readJson(`${projectRoot}/apps/mobile/package.json`).dependencies['shared-ui']).toBe(
        'workspace:*'
      );
      expect(vol.existsSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`)).toBe(true);
    });
  });

  describe('with yarn / npm / bun', () => {
    it.each(['yarn', 'npm', 'bun'] as const)(
      'rewrites "workspace:*" workspace deps to "*" with %s and does not write pnpm-workspace.yaml',
      async (manager) => {
        seedMonorepo('workspace:*');

        await configureWorkspacesAsync(projectRoot, manager);

        const mobile = readJson(`${projectRoot}/apps/mobile/package.json`);
        expect(mobile.dependencies['shared-ui']).toBe('*');
        expect(mobile.devDependencies['shared-config']).toBe('*');
        expect(vol.existsSync(`${projectRoot}/${PNPM_WORKSPACE_FILENAME}`)).toBe(false);
      }
    );

    it('leaves already-"*" specs untouched under yarn', async () => {
      seedMonorepo('*');
      await configureWorkspacesAsync(projectRoot, 'yarn');
      expect(readJson(`${projectRoot}/apps/mobile/package.json`).dependencies['shared-ui']).toBe(
        '*'
      );
    });

    it('does not write .yarnrc.yml when the monorepo config does not opt into hoisted', async () => {
      seedMonorepo('workspace:*');

      await configureWorkspacesAsync(projectRoot, 'yarn');

      expect(vol.existsSync(`${projectRoot}/${YARN_RC_FILENAME}`)).toBe(false);
    });

    it('writes .yarnrc.yml under yarn 2+ when hoisted is requested', async () => {
      process.env.npm_config_user_agent = 'yarn/4.0.0 npm/? node/v18.0.0 darwin x64';
      seedMonorepo('workspace:*');

      await configureWorkspacesAsync(projectRoot, 'yarn', HOISTED);

      const yarnRc = String(vol.readFileSync(`${projectRoot}/${YARN_RC_FILENAME}`));
      expect(yarnRc).toBe('nodeLinker: node-modules\n');
    });

    it('still writes .yarnrc.yml when the yarn version is unknown (no user agent)', async () => {
      // No npm_config_user_agent set — common when the user ran `node ./bin/...` directly
      // or via a non-yarn launcher but yarn happens to be installed locally.
      seedMonorepo('workspace:*');

      await configureWorkspacesAsync(projectRoot, 'yarn', HOISTED);

      expect(vol.existsSync(`${projectRoot}/${YARN_RC_FILENAME}`)).toBe(true);
    });

    it('skips .yarnrc.yml under yarn classic (v1)', async () => {
      process.env.npm_config_user_agent = 'yarn/1.22.19 npm/? node/v18.0.0 darwin x64';
      seedMonorepo('workspace:*');

      await configureWorkspacesAsync(projectRoot, 'yarn', HOISTED);

      expect(vol.existsSync(`${projectRoot}/${YARN_RC_FILENAME}`)).toBe(false);
    });

    it('appends to an existing .yarnrc.yml when it does not already declare nodeLinker', async () => {
      process.env.npm_config_user_agent = 'yarn/3.5.1 npm/? node/v18.0.0 darwin x64';
      seedMonorepo('workspace:*', {
        extraMembers: {
          [`${projectRoot}/${YARN_RC_FILENAME}`]: 'yarnPath: .yarn/releases/yarn-3.5.1.cjs\n',
        },
      });

      await configureWorkspacesAsync(projectRoot, 'yarn', HOISTED);

      const yarnRc = String(vol.readFileSync(`${projectRoot}/${YARN_RC_FILENAME}`));
      expect(yarnRc).toBe(
        ['yarnPath: .yarn/releases/yarn-3.5.1.cjs', 'nodeLinker: node-modules', ''].join('\n')
      );
    });

    it('leaves an existing .yarnrc.yml alone when it already declares nodeLinker', async () => {
      process.env.npm_config_user_agent = 'yarn/3.5.1 npm/? node/v18.0.0 darwin x64';
      const userContent = 'nodeLinker: pnp\n';
      seedMonorepo('workspace:*', {
        extraMembers: {
          [`${projectRoot}/${YARN_RC_FILENAME}`]: userContent,
        },
      });

      await configureWorkspacesAsync(projectRoot, 'yarn', HOISTED);

      expect(String(vol.readFileSync(`${projectRoot}/${YARN_RC_FILENAME}`))).toBe(userContent);
    });

    it('does not write .yarnrc.yml under npm or bun even when hoisted is requested', async () => {
      seedMonorepo('workspace:*');

      await configureWorkspacesAsync(projectRoot, 'npm', HOISTED);
      expect(vol.existsSync(`${projectRoot}/${YARN_RC_FILENAME}`)).toBe(false);

      vol.reset();
      seedMonorepo('workspace:*');
      await configureWorkspacesAsync(projectRoot, 'bun', HOISTED);
      expect(vol.existsSync(`${projectRoot}/${YARN_RC_FILENAME}`)).toBe(false);
    });
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
