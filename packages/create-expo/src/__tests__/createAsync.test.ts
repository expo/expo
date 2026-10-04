import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import path from 'path';

import { installPodsAsync } from '../Template';
import { logNodeInstallWarning, setupDependenciesAsync } from '../createAsync';
import { installDependenciesAsync } from '../resolvePackageManager';
import { resolveSetupAppleSpmScript } from '../utils/swiftpm';

jest.mock('fs');
jest.mock('../utils/swiftpm', () => ({ resolveSetupAppleSpmScript: jest.fn() }));
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
  const inProject = expect.objectContaining({ cwd: projectRoot });
  const prebuildArgs = ['expo', 'prebuild', '--platform', 'ios', '--no-install'];
  const prebuildNextStep = `npx ${prebuildArgs.join(' ')}`;
  const setupScript = `${projectRoot}/node_modules/react-native/scripts/setup-apple-spm.js`;
  const configCommandJson =
    '["node","--no-warnings","--eval","require(\'expo/bin/autolinking\')","expo-modules-autolinking","react-native-config","--json","--platform","ios"]';
  const spmAddArgs = [
    setupScript,
    'add',
    '--deintegrate',
    '--yes',
    '--config-command',
    configCommandJson,
  ];
  const spmAddNextStep =
    'node node_modules/react-native/scripts/setup-apple-spm.js add --deintegrate --yes --config-command ' +
    `'["node","--no-warnings","--eval","require('\\''expo/bin/autolinking'\\'')","expo-modules-autolinking","react-native-config","--json","--platform","ios"]'`;
  const podInstallWarning = /do not run `pod install`/i;

  const loggedOutput = (log: typeof console.log = console.log) =>
    asMock(log)
      .mock.calls.map((args) => args.join(' '))
      .join('\n');

  const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!;
  const setPlatform = (platform: NodeJS.Platform) =>
    Object.defineProperty(process, 'platform', { ...originalPlatform, value: platform });

  beforeEach(() => {
    setPlatform('darwin');
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });
    asMock(console.log).mockClear();
    asMock(console.error).mockClear();
    asMock(installDependenciesAsync).mockReset();
    asMock(installPodsAsync).mockReset();
    asMock(spawnAsync).mockReset();
    asMock(resolveSetupAppleSpmScript).mockReset().mockReturnValue(setupScript);
  });
  afterEach(() => {
    Object.defineProperty(process, 'platform', originalPlatform);
    vol.reset();
  });

  it(`prints the commands as next steps instead of running them when not on macOS`, async () => {
    setPlatform('linux');

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(spawnAsync).not.toHaveBeenCalled();
    const output = loggedOutput();
    expect(output).toContain(prebuildNextStep);
    expect(output).toContain(spmAddNextStep);
    expect(output).toMatch(podInstallWarning);
  });

  it(`prebuilds iOS, adds SwiftPM, and warns against pod install when there is no ios directory`, async () => {
    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(asMock(spawnAsync).mock.calls).toEqual([
      ['npx', prebuildArgs, inProject],
      [process.execPath, spmAddArgs, inProject],
    ]);
    expect(asMock(installDependenciesAsync).mock.invocationCallOrder[0]).toBeLessThan(
      asMock(spawnAsync).mock.invocationCallOrder[0]!
    );
    expect(loggedOutput()).toMatch(podInstallWarning);
  });

  it(`only adds SwiftPM, without CocoaPods, when the project already has an ios directory`, async () => {
    vol.mkdirSync(`${projectRoot}/ios`);

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(asMock(spawnAsync).mock.calls).toEqual([[process.execPath, spmAddArgs, inProject]]);
    expect(resolveSetupAppleSpmScript).toHaveBeenCalledWith(projectRoot);
    expect(installPodsAsync).not.toHaveBeenCalled();
  });

  it(`explains the React Native requirement when the setup script is missing`, async () => {
    vol.mkdirSync(`${projectRoot}/ios`);
    asMock(resolveSetupAppleSpmScript).mockReturnValue(null);

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(spawnAsync).not.toHaveBeenCalled();
    const errors = loggedOutput(console.error);
    expect(errors).toContain('React Native 0.88 or later');
    expect(errors).toContain('--swiftpm');
    const output = loggedOutput();
    expect(output).toContain(spmAddNextStep);
    expect(output).toMatch(podInstallWarning);
  });

  it(`prints the commands as next steps instead of running them with --no-install`, async () => {
    await setupDependenciesAsync(projectRoot, { install: false, swiftpm: true });

    expect(spawnAsync).not.toHaveBeenCalled();
    const output = loggedOutput();
    expect(output).toContain(prebuildNextStep);
    expect(output).toContain(spmAddNextStep);
    expect(output.indexOf(prebuildNextStep)).toBeLessThan(output.indexOf(spmAddNextStep));
    expect(output).not.toContain('npx pod-install');
  });

  it(`omits the prebuild next step with --no-install when the ios directory exists`, async () => {
    vol.mkdirSync(`${projectRoot}/ios`);

    await setupDependenciesAsync(projectRoot, { install: false, swiftpm: true });

    expect(spawnAsync).not.toHaveBeenCalled();
    const output = loggedOutput();
    expect(output).not.toContain('npx expo prebuild');
    expect(output).toContain(spmAddNextStep);
    expect(output).not.toContain('npx pod-install');
  });

  it(`prints the hoisted setup script relative to the project root`, async () => {
    vol.mkdirSync(`${projectRoot}/ios`);
    const hoistedScript = path.join(
      projectRoot,
      '../../node_modules/react-native/scripts/setup-apple-spm.js'
    );
    asMock(resolveSetupAppleSpmScript).mockReturnValue(hoistedScript);
    asMock(spawnAsync).mockRejectedValueOnce(new Error('node exited with non-zero code: 1'));

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(asMock(spawnAsync).mock.calls).toEqual([
      [process.execPath, [hoistedScript, ...spmAddArgs.slice(1)], inProject],
    ]);
    expect(loggedOutput()).toContain(
      spmAddNextStep.replace(
        'node node_modules/react-native/',
        'node ../../node_modules/react-native/'
      )
    );
  });

  it(`skips adding SwiftPM and prints the remaining steps when prebuild fails`, async () => {
    asMock(spawnAsync).mockRejectedValueOnce(new Error('npx exited with non-zero code: 1'));

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(asMock(spawnAsync).mock.calls).toEqual([['npx', prebuildArgs, inProject]]);
    const output = loggedOutput();
    expect(output).toContain(prebuildNextStep);
    expect(output).toContain(spmAddNextStep);
  });

  it(`does not run the iOS commands when the node modules failed to install`, async () => {
    asMock(installDependenciesAsync).mockRejectedValueOnce(new Error('npm install failed'));

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(spawnAsync).not.toHaveBeenCalled();
    expect(loggedOutput()).toContain(spmAddNextStep);
  });

  it(`still installs CocoaPods without swiftpm when the ios directory exists`, async () => {
    vol.mkdirSync(`${projectRoot}/ios`);

    await setupDependenciesAsync(projectRoot, { install: true });

    expect(installPodsAsync).toHaveBeenCalledWith(projectRoot);
    expect(spawnAsync).not.toHaveBeenCalled();
    expect(loggedOutput()).not.toMatch(/pod install`/);
  });
});
