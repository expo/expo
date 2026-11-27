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
  formatSelfCommand: jest.fn(() => 'npx create-expo'),
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

    await setupDependenciesAsync('/foo/bar', { install: true, useCocoaPods: false });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('make sure you have modules installed')
    );
  });

  it(`does not warn when the install succeeds`, async () => {
    asMock(installDependenciesAsync).mockResolvedValueOnce(undefined);

    await setupDependenciesAsync('/foo/bar', { install: true, useCocoaPods: false });

    expect(console.log).not.toHaveBeenCalledWith(
      expect.stringContaining('make sure you have modules installed')
    );
  });
});

describe('setupDependenciesAsync for iOS', () => {
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

  describe('without an ios directory', () => {
    it(`sets up neither Swift Package Manager nor CocoaPods`, async () => {
      await setupDependenciesAsync(projectRoot, { install: true, useCocoaPods: false });

      expect(spawnAsync).not.toHaveBeenCalled();
      expect(installPodsAsync).not.toHaveBeenCalled();
      expect(vol.existsSync(`${projectRoot}/ios`)).toBe(false);
      expect(loggedOutput()).not.toContain('Swift Package Manager');
    });
  });

  describe('with an ios directory and Swift Package Manager', () => {
    const useSwiftPM = { install: true, useCocoaPods: false };

    beforeEach(() => {
      vol.mkdirSync(`${projectRoot}/ios`);
    });

    it(`runs prebuild for iOS after installing node modules instead of installing CocoaPods`, async () => {
      await setupDependenciesAsync(projectRoot, useSwiftPM);

      expect(asMock(spawnAsync).mock.calls).toEqual([
        ['npx', prebuildArgs, expect.objectContaining({ cwd: projectRoot })],
      ]);
      expect(asMock(installDependenciesAsync).mock.invocationCallOrder[0]).toBeLessThan(
        asMock(spawnAsync).mock.invocationCallOrder[0]!
      );
      expect(installPodsAsync).not.toHaveBeenCalled();
    });

    it(`names the CocoaPods opt-out without calling Swift Package Manager a preview`, async () => {
      await setupDependenciesAsync(projectRoot, useSwiftPM);

      const output = loggedOutput();
      expect(output).toMatch(/Swift Package Manager for iOS instead of CocoaPods/);
      expect(output).toContain('"ios": { "useCocoaPods": true }');
      expect(output).toMatch(/do not run `pod install`/i);
      expect(output).not.toMatch(/preview/i);
      expect(output).not.toContain('experiments.swiftPackageManager');
      expect(output).not.toContain(prebuildNextStep);
    });

    it(`prints prebuild as a next step instead of running it when not on macOS`, async () => {
      setPlatform('linux');

      await setupDependenciesAsync(projectRoot, useSwiftPM);

      expect(spawnAsync).not.toHaveBeenCalled();
      const output = loggedOutput();
      expect(output).toContain(`cd ${projectRoot}/`);
      expect(output).toContain(prebuildNextStep);
    });

    it(`prints prebuild as a next step instead of running it with --no-install`, async () => {
      await setupDependenciesAsync(projectRoot, { ...useSwiftPM, install: false });

      expect(spawnAsync).not.toHaveBeenCalled();
      const output = loggedOutput();
      expect(output).toContain(prebuildNextStep);
      expect(output).not.toContain('npx pod-install');
      expect(output.indexOf(' install')).toBeLessThan(output.indexOf(prebuildNextStep));
    });

    it(`does not run prebuild when the node modules failed to install`, async () => {
      asMock(installDependenciesAsync).mockRejectedValueOnce(new Error('npm install failed'));

      await setupDependenciesAsync(projectRoot, useSwiftPM);

      expect(spawnAsync).not.toHaveBeenCalled();
      expect(loggedOutput()).toContain(prebuildNextStep);
    });

    it(`prints prebuild as the remaining step when it fails`, async () => {
      asMock(spawnAsync).mockRejectedValueOnce(
        Object.assign(new Error('npx exited with non-zero code: 1'), { stderr: 'prebuild broke' })
      );

      await setupDependenciesAsync(projectRoot, useSwiftPM);

      expect(asMock(spawnAsync).mock.calls).toHaveLength(1);
      expect(loggedOutput()).toContain(prebuildNextStep);
      expect(console.error).toHaveBeenCalledWith('prebuild broke');
    });

    it(`tells the user how to finish the setup when prebuild fails`, async () => {
      asMock(ora).mockClear();
      asMock(spawnAsync).mockRejectedValueOnce(new Error('npx exited with non-zero code: 1'));

      await setupDependenciesAsync(projectRoot, useSwiftPM);

      const failMessages = asMock(ora).mock.results.flatMap(
        ({ value }) => asMock(value.fail).mock.calls
      );
      expect(failMessages).toContainEqual([
        'Setting up Swift Package Manager for iOS failed. The app is still created. Run the command below to finish the setup.',
      ]);
    });
  });

  describe('with an ios directory and CocoaPods', () => {
    it(`installs CocoaPods and skips prebuild`, async () => {
      vol.mkdirSync(`${projectRoot}/ios`);

      await setupDependenciesAsync(projectRoot, { install: true, useCocoaPods: true });

      expect(installPodsAsync).toHaveBeenCalledWith(projectRoot);
      expect(spawnAsync).not.toHaveBeenCalled();
      expect(loggedOutput()).not.toContain('Swift Package Manager');
    });
  });
});

describe(createAsync, () => {
  const projectRoot = '/foo/app';
  const options = { install: false, yes: true, agentsMd: false };

  beforeEach(() => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });
    asMock(extractAndPrepareTemplateAppAsync).mockResolvedValue({ useCocoaPods: false });
    asMock(downloadAndExtractExampleAsync).mockResolvedValue({ useCocoaPods: false });
  });
  afterEach(() => {
    vol.reset();
  });

  it(`passes cocoapods to the template extraction`, async () => {
    await createAsync(projectRoot, {
      ...options,
      cocoapods: true,
      template: 'expo-template-blank',
    });

    expect(extractAndPrepareTemplateAppAsync).toHaveBeenCalledWith(
      projectRoot,
      expect.objectContaining({ cocoapods: true })
    );
  });

  it(`passes cocoapods to the example extraction`, async () => {
    await createAsync(projectRoot, { ...options, cocoapods: true, example: 'with-router' });

    expect(downloadAndExtractExampleAsync).toHaveBeenCalledWith(projectRoot, 'with-router', {
      cocoapods: true,
    });
  });

  describe('with an ios directory', () => {
    beforeEach(() => {
      vol.mkdirSync(`${projectRoot}/ios`);
      asMock(installPodsAsync).mockReset();
      asMock(spawnAsync).mockReset();
    });

    it(`sets up Swift Package Manager when the template uses it`, async () => {
      await createAsync(projectRoot, { ...options, install: true, template: 'bare-minimum' });

      expect(installPodsAsync).not.toHaveBeenCalled();
      expect(spawnAsync).toHaveBeenCalledWith(
        'npx',
        ['expo', 'prebuild', '--platform', 'ios'],
        expect.objectContaining({ cwd: projectRoot })
      );
    });
  });

  it(`prefixes extraction errors`, async () => {
    asMock(ora).mockClear();
    asMock(extractAndPrepareTemplateAppAsync).mockRejectedValueOnce(new Error('404'));

    await expect(
      createAsync(projectRoot, { ...options, template: 'expo-template-blank' })
    ).rejects.toThrow('404');

    const failMessages = asMock(ora).mock.results.flatMap(({ value }) =>
      asMock(value.fail).mock.calls.flat()
    );
    expect(failMessages).toEqual([
      'Something went wrong in downloading and extracting the project files: 404',
    ]);
  });
});
