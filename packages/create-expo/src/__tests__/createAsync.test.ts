import { logNodeInstallWarning, setupDependenciesAsync } from '../createAsync';
import { installDependenciesAsync } from '../resolvePackageManager';

jest.mock('../configureWorkspaces', () => ({ configureWorkspacesAsync: jest.fn() }));
jest.mock('../resolvePackageManager', () => ({
  resolvePackageManager: jest.fn(() => 'npm'),
  configurePackageManager: jest.fn(),
  installDependenciesAsync: jest.fn(),
}));
jest.mock('../Template', () => ({ logProjectReady: jest.fn(), installPodsAsync: jest.fn() }));

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe(logNodeInstallWarning, () => {
  beforeEach(() => {
    asMock(console.log).mockClear();
  });
  it(`logs correct cd`, () => {
    logNodeInstallWarning('/foo/bar', 'npm', false);

    expect(console.log).toHaveBeenNthCalledWith(2, expect.stringContaining('cd /foo/bar/'));
    expect(console.log).toHaveBeenNthCalledWith(3, expect.stringContaining('npm install'));
  });
  it(`logs correct cd for same directory`, () => {
    logNodeInstallWarning('', 'yarn', false);

    expect(console.log).toHaveBeenNthCalledWith(2, expect.stringContaining('cd ./'));
    expect(console.log).toHaveBeenNthCalledWith(3, expect.stringContaining('yarn install'));
  });
});

describe(setupDependenciesAsync, () => {
  beforeEach(() => {
    asMock(console.log).mockClear();
    asMock(installDependenciesAsync).mockReset();
  });

  it(`warns about missing node modules when the install fails`, async () => {
    asMock(installDependenciesAsync).mockRejectedValueOnce(
      new Error('npm install exited with non-zero code: 1')
    );

    await setupDependenciesAsync('/foo/bar', { install: true });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('make sure you have modules installed')
    );
  });

  it(`does not warn when the install succeeds`, async () => {
    asMock(installDependenciesAsync).mockResolvedValueOnce(undefined);

    await setupDependenciesAsync('/foo/bar', { install: true });

    expect(console.log).not.toHaveBeenCalledWith(
      expect.stringContaining('make sure you have modules installed')
    );
  });
});
