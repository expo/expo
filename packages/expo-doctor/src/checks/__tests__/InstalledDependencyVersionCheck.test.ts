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

  it('ignores all stderr content when dependencies are up to date for SDK 54+ projects', async () => {
    const jsonOutput = JSON.stringify({ upToDate: true, dependencies: [] });
    const stderrWithDebugLogs = `
      expo:env /Users/test/.env does not exist, skipping this env file
      2025-09-23T15:35:37.693Z expo:doctor:dependencies:bundledNativeModules Fetching bundled native modules from the server...
      expo:doctor:dependencies:validate Checking dependencies for 54.0.0: {
  '@expo/vector-icons': '^15.0.2',
  '@expo/metro-runtime': '~6.1.2'
}
    `.trim();

    jest.mocked(spawnAsync).mockImplementation(() =>
      mockSpawnPromise(
        Promise.resolve({
          stdout: jsonOutput,
          stderr: stderrWithDebugLogs,
          status: 0,
        })
      )
    );

    const check = new InstalledDependencyVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '54.0.0' },
    });

    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toEqual([]);
  });

  it('reports actual errors in stderr while filtering out debug logs when dependencies are not up to date for SDK 54+ projects', async () => {
    const jsonOutput = JSON.stringify({ upToDate: false, dependencies: [] });
    const stderrWithMixedContent = `
      expo:env /Users/test/.env does not exist, skipping this env file
      2025-09-23T15:35:37.693Z expo:doctor:dependencies:bundledNativeModules Fetching bundled native modules from the server...
      Error: Something went wrong
      expo:doctor:dependencies:validate Checking dependencies for 54.0.0
      Another actual error message
    `.trim();

    jest.mocked(spawnAsync).mockImplementation(() =>
      mockSpawnPromise(
        Promise.resolve({
          stdout: jsonOutput,
          stderr: stderrWithMixedContent,
          status: 0,
        })
      )
    );

    const check = new InstalledDependencyVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '54.0.0' },
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toEqual([
      'Error: Something went wrong\n      Another actual error message',
    ]);
  });

  it('filters debug logs from stderr when dependencies are not up to date but no real errors exist for SDK 54+ projects', async () => {
    const jsonOutput = JSON.stringify({ upToDate: false, dependencies: [] });
    const stderrWithOnlyDebugLogs = `
      expo:env /Users/test/.env does not exist, skipping this env file
      
      2025-09-23T15:35:37.693Z expo:doctor:dependencies:bundledNativeModules Fetching bundled native modules from the server...
      
      expo:doctor:dependencies:validate Checking dependencies for 54.0.0
      
    `.trim();

    jest.mocked(spawnAsync).mockImplementation(() =>
      mockSpawnPromise(
        Promise.resolve({
          stdout: jsonOutput,
          stderr: stderrWithOnlyDebugLogs,
          status: 0,
        })
      )
    );

    const check = new InstalledDependencyVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
      exp: { ...additionalProjectProps.exp, sdkVersion: '54.0.0' },
    });

    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toEqual([]);
  });
});
