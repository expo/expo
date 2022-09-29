import { vol } from 'memfs';
import path from 'path';

import { NpmPackageManager } from '../../node/NpmPackageManager';
import { PnpmPackageManager } from '../../node/PnpmPackageManager';
import { YarnPackageManager } from '../../node/YarnPackageManager';
import { createFromOptions, createFromProject, resolvePackageManager } from '../nodeManagers';
import {
  NPM_LOCK_FILE,
  PNPM_LOCK_FILE,
  PNPM_WORKSPACE_FILE,
  YARN_LOCK_FILE,
} from '../nodeWorkspaces';

jest.mock('fs');

describe(createFromOptions, () => {
  const projectRoot = '/foo/';

  it(`creates npm package manager from options`, () => {
    const manager = createFromOptions(projectRoot, { npm: true });
    expect(manager.name).toBe('npm');
  });

  it(`creates yarn package manager from options`, () => {
    const manager = createFromOptions(projectRoot, { yarn: true });
    expect(manager.name).toBe('yarn');
  });

  it(`creates pnpm package manager from options`, () => {
    const manager = createFromOptions(projectRoot, { pnpm: true });
    expect(manager.name).toBe('pnpm');
  });

  it(`defaults to npm package manager`, () => {
    const manager = createFromOptions(projectRoot);
    expect(manager.name).toBe('npm');
  });
});

describe(createFromProject, () => {
  const projectRoot = '/foo';

  afterEach(() => vol.reset());

  it(`creates npm package manager from project`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'project' }),
        [NPM_LOCK_FILE]: '',
      },
      projectRoot
    );

    expect(createFromProject(projectRoot)).toBeInstanceOf(NpmPackageManager);
  });

  it(`creates yarn package manager from project`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'project' }),
        [YARN_LOCK_FILE]: '',
      },
      projectRoot
    );

    expect(createFromProject(projectRoot)).toBeInstanceOf(YarnPackageManager);
  });

  it(`creates pnpm package manager from project`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'project' }),
        [PNPM_LOCK_FILE]: '',
      },
      projectRoot
    );

    expect(createFromProject(projectRoot)).toBeInstanceOf(PnpmPackageManager);
  });

  it(`defaults to npm package manager`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'project' }),
      },
      projectRoot
    );

    expect(createFromProject(projectRoot)).toBeInstanceOf(NpmPackageManager);
  });
});

describe(resolvePackageManager, () => {
  const workspaceRoot = path.resolve('/monorepo/');
  const projectRoot = path.resolve('/monorepo/packages/test/');

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
        [PNPM_WORKSPACE_FILE]: 'packages:\n  - packages/*',
      },
      workspaceRoot
    );

    expect(resolvePackageManager(projectRoot)).toBe('pnpm');
    expect(resolvePackageManager(projectRoot, 'pnpm')).toBe('pnpm');
    expect(resolvePackageManager(projectRoot, 'npm')).toBeNull();
    expect(resolvePackageManager(projectRoot, 'yarn')).toBeNull();
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
  });
});
