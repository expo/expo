import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { installPodsAsync } from '../Template';
import { logNodeInstallWarning, setupDependenciesAsync } from '../createAsync';
import { installDependenciesAsync } from '../resolvePackageManager';

jest.mock('fs');
jest.mock('@expo/spawn-async', () => jest.fn());

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

describe('setupDependenciesAsync with swiftpm', () => {
  const projectRoot = '/foo/bar';
  const prebuildArgs = ['expo', 'prebuild', '--platform', 'ios', '--swiftpm'];
  const prebuildNextStep = `npx ${prebuildArgs.join(' ')}`;

  const loggedOutput = () =>
    asMock(console.log)
      .mock.calls.map((args) => args.join(' '))
      .join('\n');

  const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!;
  const setPlatform = (platform: NodeJS.Platform) =>
    Object.defineProperty(process, 'platform', { ...originalPlatform, value: platform });

  beforeEach(() => {
    setPlatform('darwin');
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });
    asMock(console.log).mockClear();
    asMock(installDependenciesAsync).mockReset();
    asMock(installPodsAsync).mockReset();
    asMock(spawnAsync).mockReset();
    asMock(console.error).mockClear();
  });
  afterEach(() => {
    Object.defineProperty(process, 'platform', originalPlatform);
    vol.reset();
  });

  it(`runs prebuild with --swiftpm after installing node modules`, async () => {
    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(asMock(spawnAsync).mock.calls).toEqual([
      ['npx', prebuildArgs, expect.objectContaining({ cwd: projectRoot })],
    ]);
    expect(asMock(installDependenciesAsync).mock.invocationCallOrder[0]).toBeLessThan(
      asMock(spawnAsync).mock.invocationCallOrder[0]!
    );
  });

  it(`runs the same prebuild command and never installs CocoaPods when the template ships an ios directory`, async () => {
    vol.mkdirSync(`${projectRoot}/ios`);

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(asMock(spawnAsync).mock.calls).toEqual([
      ['npx', prebuildArgs, expect.objectContaining({ cwd: projectRoot })],
    ]);
    expect(installPodsAsync).not.toHaveBeenCalled();
  });

  it(`warns not to run pod install and explains when to pass --swiftpm to a later prebuild`, async () => {
    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    const output = loggedOutput();
    expect(output).toMatch(/do not run `pod install`/i);
    expect(output).toMatch(/preview/i);
    expect(output).not.toContain(prebuildNextStep);
    expect(output).toContain('npx expo prebuild');
    expect(output).toMatch(/keeps? Swift Package Manager while `ios\/?` exists/);
    expect(output).toMatch(/--swiftpm` only when `ios\/?` is missing/);
  });

  it(`prints prebuild as a next step instead of running it when not on macOS`, async () => {
    setPlatform('linux');

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(spawnAsync).not.toHaveBeenCalled();
    const output = loggedOutput();
    expect(output).toContain(prebuildNextStep);
    expect(output).toMatch(/do not run `pod install`/i);
  });

  it(`prints prebuild as a next step instead of running it with --no-install`, async () => {
    vol.mkdirSync(`${projectRoot}/ios`);

    await setupDependenciesAsync(projectRoot, { install: false, swiftpm: true });

    expect(spawnAsync).not.toHaveBeenCalled();
    const output = loggedOutput();
    expect(output).toContain(prebuildNextStep);
    expect(output).not.toContain('npx pod-install');
    expect(output.indexOf(' install')).toBeLessThan(output.indexOf(prebuildNextStep));
  });

  it(`does not run prebuild when the node modules failed to install`, async () => {
    asMock(installDependenciesAsync).mockRejectedValueOnce(new Error('npm install failed'));

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(spawnAsync).not.toHaveBeenCalled();
    expect(loggedOutput()).toContain(prebuildNextStep);
  });

  it(`prints prebuild as the remaining step when it fails`, async () => {
    asMock(spawnAsync).mockRejectedValueOnce(
      Object.assign(new Error('npx exited with non-zero code: 1'), { stderr: 'prebuild broke' })
    );

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(asMock(spawnAsync).mock.calls).toHaveLength(1);
    expect(loggedOutput()).toContain(prebuildNextStep);
    expect(console.error).toHaveBeenCalledWith('prebuild broke');
  });

  it(`still installs CocoaPods without swiftpm when the ios directory exists`, async () => {
    vol.mkdirSync(`${projectRoot}/ios`);

    await setupDependenciesAsync(projectRoot, { install: true });

    expect(installPodsAsync).toHaveBeenCalledWith(projectRoot);
    expect(spawnAsync).not.toHaveBeenCalled();
    expect(loggedOutput()).not.toMatch(/pod install`/);
  });
});
