import { execSync } from 'child_process';

import { resolvePackageManager } from '../resolvePackageManager';

// TODO: replace with jest.mocked when jest 27+ is upgraded to
export const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

describe(resolvePackageManager, () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use yarn due to the user agent', () => {
    process.env.npm_config_user_agent = 'yarn/1.22.17 npm/? node/v16.13.0 darwin x64';
    expect(resolvePackageManager()).toBe('yarn');
  });
  it('should use pnpm due to the user agent', () => {
    process.env.npm_config_user_agent = 'pnpm';
    expect(resolvePackageManager()).toBe('pnpm');
  });
  it('should use bun due to the user agent', () => {
    process.env.npm_config_user_agent = 'bun';
    expect(resolvePackageManager()).toBe('bun');
  });
  it('should use npm due to the user agent', () => {
    process.env.npm_config_user_agent = 'npm/8.1.0 node/v16.13.0 darwin x64 workspaces/false';
    expect(resolvePackageManager()).toBe('npm');
  });
  it('should use yarn due to manager being installed', () => {
    delete process.env.npm_config_user_agent;
    expect(resolvePackageManager()).toBe('yarn');
    expect(execSync).toHaveBeenCalledWith('yarn --version', { stdio: 'ignore' });
  });
  it('should use pnpm due to manager being installed', () => {
    delete process.env.npm_config_user_agent;

    // throw for the first check -- yarn
    asMock(execSync).mockImplementationOnce(() => {
      throw new Error('foobar');
    });

    expect(resolvePackageManager()).toBe('pnpm');
    expect(execSync).toHaveBeenCalledWith('pnpm --version', { stdio: 'ignore' });
  });
  it('should use bun due to manager being installed', () => {
    delete process.env.npm_config_user_agent;

    // throw for the first two checks -- yarn, pnpm
    asMock(execSync)
      .mockImplementationOnce(() => {
        throw new Error('foobar');
      })
      .mockImplementationOnce(() => {
        throw new Error('foobar');
      });

    expect(resolvePackageManager()).toBe('bun');
    expect(execSync).toHaveBeenCalledWith('bun --version', { stdio: 'ignore' });
  });
  it('should default to npm when nothing else is available', () => {
    delete process.env.npm_config_user_agent;

    // throw for the first check -- yarn
    asMock(execSync)
      .mockClear()
      .mockImplementationOnce(() => {
        throw new Error('foobar');
      })
      .mockImplementationOnce(() => {
        throw new Error('foobar');
      })
      .mockImplementationOnce(() => {
        throw new Error('foobar');
      });

    expect(resolvePackageManager()).toBe('npm');
    expect(execSync).toHaveBeenCalledTimes(3);
  });
});
