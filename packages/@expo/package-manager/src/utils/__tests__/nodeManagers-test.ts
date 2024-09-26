import { vol } from 'memfs';

import { BunPackageManager } from '../../node/BunPackageManager';
import { NpmPackageManager } from '../../node/NpmPackageManager';
import { PnpmPackageManager } from '../../node/PnpmPackageManager';
import { YarnPackageManager } from '../../node/YarnPackageManager';
import {
  createForProject,
  resolvePackageManager,
  resolveWorkspaceRoot,
  BUN_LOCK_FILE,
  NPM_LOCK_FILE,
  PNPM_LOCK_FILE,
  YARN_LOCK_FILE,
} from '../nodeManagers';

// Jest doesn't mock `node:fs` when mocking `fs`
jest.mock('fs', () => require('memfs').fs);
jest.mock('node:fs', () => require('memfs').fs);

describe(createForProject, () => {
  const projectRoot = '/foo';

  afterEach(() => vol.reset());

  it(`creates npm package manager from options`, () => {
    expect(createForProject(projectRoot, { npm: true })).toBeInstanceOf(NpmPackageManager);
  });

  it(`creates yarn package manager from options`, () => {
    expect(createForProject(projectRoot, { yarn: true })).toBeInstanceOf(YarnPackageManager);
  });

  it(`creates pnpm package manager from options`, () => {
    expect(createForProject(projectRoot, { pnpm: true })).toBeInstanceOf(PnpmPackageManager);
  });

  it(`creates bun package manager from options`, () => {
    expect(createForProject(projectRoot, { bun: true })).toBeInstanceOf(BunPackageManager);
  });

  it(`defaults to npm package manager`, () => {
    expect(createForProject(projectRoot)).toBeInstanceOf(NpmPackageManager);
  });

  it(`creates npm package manager from project`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'project' }),
        [NPM_LOCK_FILE]: '',
      },
      projectRoot
    );

    expect(createForProject(projectRoot)).toBeInstanceOf(NpmPackageManager);
  });

  it(`creates yarn package manager from project`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'project' }),
        [YARN_LOCK_FILE]: '',
      },
      projectRoot
    );

    expect(createForProject(projectRoot)).toBeInstanceOf(YarnPackageManager);
  });

  it(`creates pnpm package manager from project`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'project' }),
        [PNPM_LOCK_FILE]: '',
      },
      projectRoot
    );

    expect(createForProject(projectRoot)).toBeInstanceOf(PnpmPackageManager);
  });

  it(`creates bun package manager from project`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'project' }),
        [BUN_LOCK_FILE]: '',
      },
      projectRoot
    );

    expect(createForProject(projectRoot)).toBeInstanceOf(BunPackageManager);
  });

  it(`creates bun package manager from project using "yarn.lock" and "bun.lockb"`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'project' }),
        [BUN_LOCK_FILE]: '',
        [YARN_LOCK_FILE]: '',
      },
      projectRoot
    );

    expect(createForProject(projectRoot)).toBeInstanceOf(BunPackageManager);
  });

  it(`defaults to npm package manager`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'project' }),
      },
      projectRoot
    );

    expect(createForProject(projectRoot)).toBeInstanceOf(NpmPackageManager);
  });
});

describe(resolvePackageManager, () => {
  const workspaceRoot = '/monorepo/';
  const projectRoot = '/monorepo/packages/test/';

  afterEach(() => vol.reset());

  it(`resolves npm from monorepo workspace`, () => {
    vol.fromJSON(
      {
        'packages/test/package.json': JSON.stringify({ name: 'project' }),
        'package.json': JSON.stringify({
          private: true,
          name: 'monorepo',
          workspaces: ['packages/*'],
        }),
        [NPM_LOCK_FILE]: '',
      },
      workspaceRoot
    );

    expect(resolvePackageManager(projectRoot)).toBe('npm');
    expect(resolvePackageManager(projectRoot, 'npm')).toBe('npm');
    expect(resolvePackageManager(projectRoot, 'pnpm')).toBeNull();
    expect(resolvePackageManager(projectRoot, 'yarn')).toBeNull();
    expect(resolvePackageManager(projectRoot, 'bun')).toBeNull();
  });

  it(`resolves pnpm from monorepo workspace`, () => {
    vol.fromJSON(
      {
        'packages/test/package.json': JSON.stringify({ name: 'project' }),
        'package.json': JSON.stringify({
          private: true,
          name: 'monorepo',
        }),
        [PNPM_LOCK_FILE]: '',
        'pnpm-workspace.yaml': 'packages:\n  - packages/*',
      },
      workspaceRoot
    );

    expect(resolvePackageManager(projectRoot)).toBe('pnpm');
    expect(resolvePackageManager(projectRoot, 'pnpm')).toBe('pnpm');
    expect(resolvePackageManager(projectRoot, 'npm')).toBeNull();
    expect(resolvePackageManager(projectRoot, 'yarn')).toBeNull();
    expect(resolvePackageManager(projectRoot, 'bun')).toBeNull();
  });

  it(`resolves yarn from monorepo workspace`, () => {
    vol.fromJSON(
      {
        'packages/test/package.json': JSON.stringify({ name: 'project' }),
        'package.json': JSON.stringify({
          private: true,
          name: 'monorepo',
          workspaces: ['packages/*'],
        }),
        [YARN_LOCK_FILE]: '',
      },
      workspaceRoot
    );

    expect(resolvePackageManager(projectRoot)).toBe('yarn');
    expect(resolvePackageManager(projectRoot, 'yarn')).toBe('yarn');
    expect(resolvePackageManager(projectRoot, 'npm')).toBeNull();
    expect(resolvePackageManager(projectRoot, 'pnpm')).toBeNull();
    expect(resolvePackageManager(projectRoot, 'bun')).toBeNull();
  });

  it(`resolves bun from monorepo workspace`, () => {
    vol.fromJSON(
      {
        'packages/test/package.json': JSON.stringify({ name: 'project' }),
        'package.json': JSON.stringify({
          private: true,
          name: 'monorepo',
          workspaces: ['packages/*'],
        }),
        [BUN_LOCK_FILE]: '',
      },
      workspaceRoot
    );

    expect(resolvePackageManager(projectRoot)).toBe('bun');
    expect(resolvePackageManager(projectRoot, 'bun')).toBe('bun');
    expect(resolvePackageManager(projectRoot, 'npm')).toBeNull();
    expect(resolvePackageManager(projectRoot, 'pnpm')).toBeNull();
    expect(resolvePackageManager(projectRoot, 'yarn')).toBeNull();
  });

  it(`resolves bun from monorepo workspace using "yarn.lock" and "bun.lockb"`, () => {
    vol.fromJSON(
      {
        'packages/test/package.json': JSON.stringify({ name: 'project' }),
        'package.json': JSON.stringify({
          private: true,
          name: 'monorepo',
          workspaces: ['packages/*'],
        }),
        [BUN_LOCK_FILE]: '',
        [YARN_LOCK_FILE]: '',
      },
      workspaceRoot
    );

    expect(resolvePackageManager(projectRoot)).toBe('bun');
    expect(resolvePackageManager(projectRoot, 'bun')).toBe('bun');
    expect(resolvePackageManager(projectRoot, 'npm')).toBeNull();
    expect(resolvePackageManager(projectRoot, 'pnpm')).toBeNull();

    // Due to the `yarn.lock` file being present when running `bun install --yarn`,
    // yarn can be returned as package manager when prefering `yarn`.
    expect(resolvePackageManager(projectRoot, 'yarn')).toBe('yarn');
  });
});

describe(resolveWorkspaceRoot, () => {
  const workspaceRoot = '/monorepo';

  afterEach(() => vol.reset());

  it('resolves root from project', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ private: true, name: '@acme/monorepo' }),
        'pnpm-workspace.yaml': 'packages:\n  - packages/*',
        'packages/test/package.json': JSON.stringify({ name: '@acme/test' }),
      },
      workspaceRoot
    );

    expect(resolveWorkspaceRoot('/monorepo/packages/test')).toBe(workspaceRoot);
  });

  it('resolves root from workspace', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ private: true, name: '@acme/monorepo' }),
        'pnpm-workspace.yaml': 'packages:\n  - packages/*',
        'packages/test/package.json': JSON.stringify({ name: '@acme/test' }),
      },
      workspaceRoot
    );

    expect(resolveWorkspaceRoot('/monorepo/packages/test')).toBe(workspaceRoot);
  });

  it('ignores root from uncoupled project', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ private: true, name: '@acme/monorepo' }),
        'pnpm-workspace.yaml': 'packages:\n  - packages-not-included/*',
        'packages/test/package.json': JSON.stringify({ name: '@acme/test' }),
      },
      workspaceRoot
    );

    expect(resolveWorkspaceRoot('/monorepo/packages/test')).toBeNull();
  });
});
