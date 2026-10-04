import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import ora from 'ora';

import { downloadAndExtractExampleAsync } from '../Examples';
import { extractAndPrepareTemplateAppAsync, installPodsAsync } from '../Template';
import { createAsync, logNodeInstallWarning, setupDependenciesAsync } from '../createAsync';
import { installDependenciesAsync } from '../resolvePackageManager';

jest.mock('fs');
jest.mock('ora');
jest.mock('@expo/spawn-async', () => jest.fn());
jest.mock('../Examples', () => ({
  downloadAndExtractExampleAsync: jest.fn(),
  ensureExampleExists: jest.fn(),
  fetchMetadataAsync: jest.fn(async () => ({ aliases: {}, deprecated: {} })),
  promptExamplesAsync: jest.fn(),
}));
jest.mock('../promptSdkVersion', () => ({
  applySdkVersionToTemplateAsync: jest.fn(async (template: string) => template),
}));
jest.mock('../resolveProjectRoot', () => ({
  assertFolderEmpty: jest.fn(),
  assertValidName: jest.fn(),
  resolveProjectRootAsync: jest.fn(async (input: string) => input),
}));
jest.mock('../telemetry', () => ({
  AnalyticsEventPhases: {},
  AnalyticsEventTypes: {},
  identify: jest.fn(),
  initializeAnalyticsIdentityAsync: jest.fn(),
  track: jest.fn(),
}));
jest.mock('../utils/git', () => ({ initGitRepoAsync: jest.fn() }));

jest.mock('../configureWorkspaces', () => ({ configureWorkspacesAsync: jest.fn() }));
jest.mock('../resolvePackageManager', () => ({
  resolvePackageManager: jest.fn(() => 'npm'),
  configurePackageManager: jest.fn(),
  installDependenciesAsync: jest.fn(),
}));
jest.mock('../Template', () => ({
  extractAndPrepareTemplateAppAsync: jest.fn(),
  logProjectReady: jest.fn(),
  installPodsAsync: jest.fn(),
}));

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
  const prebuildArgs = ['expo', 'prebuild', '--platform', 'ios'];
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
    asMock(console.error).mockClear();
    asMock(installDependenciesAsync).mockReset();
    asMock(installPodsAsync).mockReset();
    asMock(spawnAsync).mockReset();
  });
  afterEach(() => {
    Object.defineProperty(process, 'platform', originalPlatform);
    vol.reset();
  });

  it(`runs prebuild for iOS in the project root after installing node modules`, async () => {
    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(asMock(spawnAsync).mock.calls).toEqual([
      ['npx', prebuildArgs, expect.objectContaining({ cwd: projectRoot })],
    ]);
    expect(asMock(installDependenciesAsync).mock.invocationCallOrder[0]).toBeLessThan(
      asMock(spawnAsync).mock.invocationCallOrder[0]!
    );
  });

  it(`never installs CocoaPods when the template ships an ios directory`, async () => {
    vol.mkdirSync(`${projectRoot}/ios`);

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(asMock(spawnAsync).mock.calls).toEqual([
      ['npx', prebuildArgs, expect.objectContaining({ cwd: projectRoot })],
    ]);
    expect(installPodsAsync).not.toHaveBeenCalled();
  });

  it(`explains the app.json setting and warns not to run pod install`, async () => {
    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    const output = loggedOutput();
    expect(output).toMatch(/Swift Package Manager for iOS instead of CocoaPods/);
    expect(output).toMatch(/preview/i);
    expect(output).toContain('experiments.swiftPackageManager');
    expect(output).toContain('app.json');
    expect(output).toMatch(/do not run `pod install`/i);
    expect(output).not.toContain('--swiftpm');
    expect(output).not.toContain(prebuildNextStep);
  });

  it(`prints prebuild as a next step instead of running it when not on macOS`, async () => {
    setPlatform('linux');

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    expect(spawnAsync).not.toHaveBeenCalled();
    const output = loggedOutput();
    expect(output).toContain(`cd ${projectRoot}/`);
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

  it(`tells the user how to finish the setup when prebuild fails`, async () => {
    asMock(ora).mockClear();
    asMock(spawnAsync).mockRejectedValueOnce(new Error('npx exited with non-zero code: 1'));

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: true });

    const failMessages = asMock(ora).mock.results.flatMap(
      ({ value }) => asMock(value.fail).mock.calls
    );
    expect(failMessages).toContainEqual([
      'Setting up Swift Package Manager for iOS failed. The app is still created. Run the command below to finish the setup.',
    ]);
  });

  it(`still installs CocoaPods and skips prebuild without swiftpm`, async () => {
    vol.mkdirSync(`${projectRoot}/ios`);

    await setupDependenciesAsync(projectRoot, { install: true, swiftpm: false });

    expect(installPodsAsync).toHaveBeenCalledWith(projectRoot);
    expect(spawnAsync).not.toHaveBeenCalled();
    expect(loggedOutput()).not.toContain('Swift Package Manager');
  });

  it(`skips prebuild when swiftpm is omitted`, async () => {
    await setupDependenciesAsync(projectRoot, { install: true });

    expect(spawnAsync).not.toHaveBeenCalled();
  });
});

describe(createAsync, () => {
  const projectRoot = '/foo/app';
  const options = { install: false, yes: true, agentsMd: false, swiftpm: true };

  beforeEach(() => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });
  });
  afterEach(() => {
    vol.reset();
  });

  it(`passes swiftpm to the template extraction`, async () => {
    await createAsync(projectRoot, { ...options, template: 'expo-template-blank' });

    expect(extractAndPrepareTemplateAppAsync).toHaveBeenCalledWith(
      projectRoot,
      expect.objectContaining({ swiftpm: true })
    );
  });

  it(`passes swiftpm to the example extraction`, async () => {
    await createAsync(projectRoot, { ...options, example: 'with-router' });

    expect(downloadAndExtractExampleAsync).toHaveBeenCalledWith(projectRoot, 'with-router', {
      swiftpm: true,
    });
  });
});
