import spawnAsync from '@expo/spawn-async';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  installDependencies,
  isPackageManagerName,
  resolvePackageManager,
  shouldCreatePnpmWorkspace,
} from '../packageManager';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('node:child_process', () => ({
  execSync: jest.fn(),
}));
jest.mock('@expo/spawn-async');

describe(resolvePackageManager, () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    asMock(execSync).mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses yarn from the package manager user agent', () => {
    process.env.npm_config_user_agent = 'yarn/1.22.17 npm/? node/v18.0.0 darwin x64';

    expect(resolvePackageManager()).toBe('yarn');
  });

  it('uses pnpm from the package manager user agent', () => {
    process.env.npm_config_user_agent = 'pnpm/9.0.0 npm/? node/v18.0.0 darwin x64';

    expect(resolvePackageManager()).toBe('pnpm');
  });

  it('uses bun from the package manager user agent', () => {
    process.env.npm_config_user_agent = 'bun/1.1.0 npm/? node/v18.0.0 darwin x64';

    expect(resolvePackageManager()).toBe('bun');
  });

  it('uses npm from the package manager user agent', () => {
    process.env.npm_config_user_agent = 'npm/10.0.0 node/v18.0.0 darwin x64';

    expect(resolvePackageManager()).toBe('npm');
  });

  it('falls back to available package managers in the existing order', () => {
    delete process.env.npm_config_user_agent;

    expect(resolvePackageManager()).toBe('yarn');
    expect(execSync).toHaveBeenCalledWith('yarn --version', { stdio: 'ignore' });
  });

  it('falls back to npm when no preferred package manager is available', () => {
    delete process.env.npm_config_user_agent;
    asMock(execSync).mockImplementation(() => {
      throw new Error('not installed');
    });

    expect(resolvePackageManager()).toBe('npm');
    expect(execSync).toHaveBeenCalledTimes(3);
  });
});

describe(isPackageManagerName, () => {
  it('accepts supported package manager names', () => {
    expect(isPackageManagerName('npm')).toBe(true);
    expect(isPackageManagerName('pnpm')).toBe(true);
    expect(isPackageManagerName('yarn')).toBe(true);
    expect(isPackageManagerName('bun')).toBe(true);
  });

  it('rejects unsupported package manager names', () => {
    expect(isPackageManagerName('deno')).toBe(false);
    expect(isPackageManagerName(undefined)).toBe(false);
  });
});

describe(shouldCreatePnpmWorkspace, () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-module-pnpm-'));
    asMock(execSync).mockReturnValue('12.3.4\n');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('creates a workspace for a pnpm module outside of a pnpm workspace', () => {
    expect(shouldCreatePnpmWorkspace('pnpm', path.join(root, 'my-module'))).toBe(true);
  });

  it('reads the pnpm version after warnings printed by pnpm', () => {
    asMock(execSync).mockReturnValue(
      '[WARN] This project is configured to use 12.2.1 of pnpm. Your current pnpm is v12.3.4\n12.3.4\n'
    );
    expect(shouldCreatePnpmWorkspace('pnpm', path.join(root, 'my-module'))).toBe(true);
  });

  it('does not create a workspace for pnpm versions that do not fail on ignored build scripts', () => {
    asMock(execSync).mockReturnValue('10.34.6\n');
    expect(shouldCreatePnpmWorkspace('pnpm', path.join(root, 'my-module'))).toBe(false);
  });

  it('does not create a workspace for other package managers', () => {
    expect(shouldCreatePnpmWorkspace('npm', path.join(root, 'my-module'))).toBe(false);
  });

  describe('inside of a pnpm workspace', () => {
    const mockWorkspaceProjects = (...projects: string[]) =>
      asMock(execSync).mockImplementation((command) =>
        command === 'pnpm --version'
          ? '12.3.4\n'
          : JSON.stringify(projects.map((project) => ({ path: project })))
      );

    beforeEach(() => {
      fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
      fs.mkdirSync(path.join(root, 'packages/my-module'), { recursive: true });
    });

    it('does not create a workspace for a module that is a workspace project', () => {
      mockWorkspaceProjects(root, path.join(root, 'packages/my-module'));
      expect(shouldCreatePnpmWorkspace('pnpm', path.join(root, 'packages/my-module'))).toBe(false);
    });

    it('creates a workspace for a module that is not a workspace project', () => {
      mockWorkspaceProjects(root);
      expect(shouldCreatePnpmWorkspace('pnpm', path.join(root, 'packages/my-module'))).toBe(true);
    });
  });
});

describe(installDependencies, () => {
  it('explains how to allow build scripts when pnpm ignores them', async () => {
    // pnpm 11 prints the error to stdout, pnpm 12 to stderr
    asMock(spawnAsync).mockRejectedValueOnce({
      status: 1,
      stdout: '[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: unrs-resolver@1.12.2',
      stderr: '',
    });

    await expect(installDependencies('pnpm', '/workspace/my-module')).rejects.toThrow(
      /pnpm approve-builds[\s\S]*run create-expo-module again[\s\S]*Ignored build scripts: unrs-resolver@1\.12\.2/
    );
  });
});
