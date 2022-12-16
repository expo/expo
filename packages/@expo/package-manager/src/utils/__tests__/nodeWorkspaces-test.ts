import { vol } from 'memfs';
import path from 'path';

import {
  findWorkspaceRoot,
  findYarnOrNpmWorkspaceRootSafe,
  NPM_LOCK_FILE,
  PNPM_LOCK_FILE,
  PNPM_WORKSPACE_FILE,
  resolvePackageManager,
  YARN_LOCK_FILE,
} from '../nodeWorkspaces';

jest.mock('fs');

describe(findYarnOrNpmWorkspaceRootSafe, () => {
  afterEach(() => vol.reset());
  it(`doesn't throw when the upper level has a malformed package.json`, () => {
    vol.fromJSON(
      {
        'packages/test/package.json': '{}',
        'package.json': '',
      },
      '/'
    );

    expect(findYarnOrNpmWorkspaceRootSafe('/packages/test')).toBe(null);
  });
});

describe(findWorkspaceRoot, () => {
  // Resolve these paths to avoid posix vs windows path issues when validating
  const workspaceRoot = path.resolve('/monorepo/');
  const projectRoot = path.resolve('/monorepo/packages/test/');

  afterEach(() => vol.reset());

  it('resolves npm workspace root', () => {
    vol.fromJSON(
      {
        'packages/test/package.json': '{}',
        'package.json': JSON.stringify({
          private: true,
          name: 'monorepo',
          workspaces: ['packages/*'],
        }),
        [NPM_LOCK_FILE]: '',
      },
      workspaceRoot
    );

    expect(findWorkspaceRoot(projectRoot)).toBe(workspaceRoot);
    expect(findWorkspaceRoot(projectRoot, 'npm')).toBe(workspaceRoot);
  });

  it('resolves yarn workspace root', () => {
    vol.fromJSON(
      {
        'packages/test/package.json': '{}',
        'package.json': JSON.stringify({
          private: true,
          name: 'monorepo',
          workspaces: ['packages/*'],
        }),
        [YARN_LOCK_FILE]: '',
      },
      workspaceRoot
    );

    expect(findWorkspaceRoot(projectRoot)).toBe(workspaceRoot);
    expect(findWorkspaceRoot(projectRoot, 'yarn')).toBe(workspaceRoot);
  });

  it('resolves pnpm workspace root', () => {
    vol.fromJSON(
      {
        'packages/test/package.json': '{}',
        'package.json': JSON.stringify({
          private: true,
          name: 'monorepo',
        }),
        [PNPM_LOCK_FILE]: '',
        [PNPM_WORKSPACE_FILE]: '',
      },
      workspaceRoot
    );

    expect(findWorkspaceRoot(projectRoot)).toBe(workspaceRoot);
    expect(findWorkspaceRoot(projectRoot, 'pnpm')).toBe(workspaceRoot);
  });
});

describe(resolvePackageManager, () => {
  const workspaceRoot = '/monorepo/';
  const projectRoot = '/monorepo/packages/test/';

  afterEach(() => vol.reset());

  it('resolves npm from monorepo', () => {
    vol.fromJSON(
      {
        'packages/test/package.json': '{}',
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
  });

  it('resolves yarn from project', () => {
    vol.fromJSON(
      {
        'package.json': '{}',
        [YARN_LOCK_FILE]: '',
      },
      projectRoot
    );

    expect(resolvePackageManager(projectRoot)).toBe('yarn');
    expect(resolvePackageManager(projectRoot, 'yarn')).toBe('yarn');
  });

  it('resolves pnpm from project', () => {
    vol.fromJSON(
      {
        'package.json': '{}',
        [PNPM_LOCK_FILE]: '',
        [PNPM_WORKSPACE_FILE]: '',
      },
      projectRoot
    );

    expect(resolvePackageManager(projectRoot)).toBe('pnpm');
    expect(resolvePackageManager(projectRoot, 'pnpm')).toBe('pnpm');
  });
});
