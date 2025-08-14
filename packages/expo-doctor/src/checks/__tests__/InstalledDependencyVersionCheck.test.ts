import spawnAsync from '@expo/spawn-async';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { InstalledDependencyVersionCheck } from '../InstalledDependencyVersionCheck';

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  pkg: {},
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

describe('runAsync', () => {
  it('returns result with isSuccessful = true if check passes', async () => {
    jest.mocked(spawnAsync).mockImplementation(() =>
      mockSpawnPromise(
        Promise.resolve({
          stdout: '',
        })
      )
    );
    const check = new InstalledDependencyVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  // CI=1 is required to prevent interactive prompt asking to fix the dependencies
  it('calls npx expo install --check with CI=1 env variable', async () => {
    const mockSpawnAsync = jest.mocked(spawnAsync).mockImplementation(() =>
      mockSpawnPromise(
        Promise.resolve({
          stdout: '',
        })
      )
    );
    const check = new InstalledDependencyVersionCheck();
    await check.runAsync({ projectRoot: '/path/to/project', ...additionalProjectProps });
    expect(mockSpawnAsync.mock.calls[0][0]).toBe('npx');
    expect(mockSpawnAsync.mock.calls[0][1]).toEqual(['expo', 'install', '--check']);
    expect(mockSpawnAsync.mock.calls[0][2]).toMatchObject({ env: { CI: '1' } });
  });

  it('returns result with isSuccessful = false if check fails', async () => {
    jest.mocked(spawnAsync).mockImplementation(() => {
      const error: any = new Error();
      error.stderr = 'error';
      error.stdout = '';
      error.status = 1;
      return mockSpawnPromise(Promise.reject(error));
    });
    const check = new InstalledDependencyVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('pushes npx expo install --check stderr to issues list', async () => {
    jest.mocked(spawnAsync).mockImplementation(() => {
      const error: any = new Error();
      error.stderr = 'error';
      error.stdout = '';
      error.status = 1;
      return mockSpawnPromise(Promise.reject(error));
    });
    const check = new InstalledDependencyVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.issues).toEqual(['error']);
  });

  it('parses and formats JSON output from SDK 54+ with version mismatches', async () => {
    const jsonOutput = JSON.stringify({
      upToDate: false,
      dependencies: [
        {
          packageName: 'expo-image',
          expectedVersionOrRange: '~3.0.0',
          actualVersion: '2.5.0',
        },
        {
          packageName: 'react',
          expectedVersionOrRange: '^18.0.0',
          actualVersion: '17.0.2',
        },
      ],
    });

    jest.mocked(spawnAsync).mockImplementation(() => {
      const error: any = new Error();
      error.stderr = '';
      error.stdout = jsonOutput;
      error.status = 1;
      return mockSpawnPromise(Promise.reject(error));
    });

    const check = new InstalledDependencyVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '54.0.0' },
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(1);

    const issue = result.issues[0];
    expect(issue).toContain('expo-image');
    expect(issue).toContain('react');
  });

  it('uses --json flag for SDK 54+ projects', async () => {
    const mockSpawnAsync = jest.mocked(spawnAsync).mockImplementation(() =>
      mockSpawnPromise(
        Promise.resolve({
          stdout: JSON.stringify({ upToDate: true, dependencies: [] }),
          stderr: '',
          status: 0,
        })
      )
    );

    const check = new InstalledDependencyVersionCheck();
    await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '54.0.0' },
    });

    expect(mockSpawnAsync.mock.calls[0][1]).toEqual(['expo', 'install', '--check', '--json']);
  });

  it('does not use --json flag for SDK < 54 projects', async () => {
    const mockSpawnAsync = jest.mocked(spawnAsync).mockImplementation(() =>
      mockSpawnPromise(
        Promise.resolve({
          stdout: '',
          stderr: '',
          status: 0,
        })
      )
    );

    const check = new InstalledDependencyVersionCheck();
    await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '53.0.0' },
    });

    expect(mockSpawnAsync.mock.calls[0][1]).toEqual(['expo', 'install', '--check']);
  });
});
