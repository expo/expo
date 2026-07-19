import { execSync } from 'node:child_process';

import { isPackageManagerName, resolvePackageManager } from '../packageManager';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('node:child_process', () => ({
  execSync: jest.fn(),
}));

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
