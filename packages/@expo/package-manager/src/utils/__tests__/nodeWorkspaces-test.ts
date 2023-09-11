import { vol } from 'memfs';
import path from 'path';

import { findPnpmWorkspaceRoot, PNPM_WORKSPACE_FILE } from '../nodeWorkspaces';

jest.mock('@expo/spawn-async');
jest.mock('fs');
jest.mock('path', () => jest.requireActual('path').posix); // Make tests run on Windows

describe(findPnpmWorkspaceRoot, () => {
  const workspaceRoot = '/monorepo';
  const projectRoot = '/monorepo/packages/test';

  afterEach(() => vol.reset());

  it('resolves root from project', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ private: true, name: '@acme/monorepo' }),
        [PNPM_WORKSPACE_FILE]: 'packages:\n  - packages/*',
        [path.join(projectRoot, 'package.json')]: JSON.stringify({ name: '@acme/test' }),
      },
      workspaceRoot
    );

    expect(findPnpmWorkspaceRoot(projectRoot)).toBe(workspaceRoot);
  });

  it('resolves root from workspace', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ private: true, name: '@acme/monorepo' }),
        [PNPM_WORKSPACE_FILE]: 'packages:\n  - packages/*',
        [path.join(projectRoot, 'package.json')]: JSON.stringify({ name: '@acme/test' }),
      },
      workspaceRoot
    );

    expect(findPnpmWorkspaceRoot(workspaceRoot)).toBe(workspaceRoot);
  });

  it('ignores root from uncoupled project', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ private: true, name: '@acme/monorepo' }),
        [PNPM_WORKSPACE_FILE]: 'packages:\n  - packages-not-included/*',
        [path.join(projectRoot, 'package.json')]: JSON.stringify({ name: '@acme/test' }),
      },
      workspaceRoot
    );

    expect(findPnpmWorkspaceRoot(projectRoot)).toBeNull();
  });
});
