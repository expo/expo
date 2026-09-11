import spawnAsync from '@expo/spawn-async';
import { ExpoRunFormatter } from '@expo/xcpretty';
import { buildIos, CompileError } from '@ramonclaudio/compile';
import type { NativeBuildOptions, ProcessRunner } from '@ramonclaudio/compile';
import { spawn } from 'child_process';
import { vol } from 'memfs';
import path from 'path';
import { PassThrough } from 'stream';

import * as Log from '../../../log';
import { env } from '../../../utils/env';
import { AbortCommandError, CommandError } from '../../../utils/errors';
import {
  getProcessOptions,
  getIosBuildRequestAsync,
  buildAsync,
  _assertXcodeBuildResults,
  _extractXcodeBuildErrorLines,
  _formatXcodeBuildFailure,
  _hasXcodeBuildErrorDetails,
} from '../XcodeBuild';
import type { BuildProps } from '../XcodeBuild.types';
import { ensureDeviceIsCodeSignedForDeploymentAsync } from '../codeSigning/configureCodeSigning';
import { simulatorBuildRequiresCodeSigning } from '../codeSigning/simulatorCodeSigning';
import { runXcodeProcessAsync } from '../runXcodeProcess';

jest.mock('../codeSigning/configureCodeSigning');
jest.mock('../codeSigning/simulatorCodeSigning');
jest.mock('../runXcodeProcess');
jest.mock('../../../log');
jest.mock('@ramonclaudio/compile', () => ({
  ...jest.requireActual('@ramonclaudio/compile'),
  buildIos: jest.fn(),
}));

const fs = jest.requireActual('fs') as typeof import('fs');

const baseProps: BuildProps = {
  projectRoot: '/path/to/project',
  buildCache: true,
  configuration: 'Debug',
  isSimulator: true,
  scheme: 'MyApp',
  device: { udid: 'demo-udid', name: 'iPhone', osType: 'iOS' },
  osType: 'iOS',
  xcodeProject: { isWorkspace: true, name: '/path/to/project/ios/MyApp.xcworkspace' },
  shouldSkipInitialBundling: false,
  shouldStartBundler: true,
  port: 8081,
};

const simulatorRequest = {
  cwd: baseProps.projectRoot,
  source: { kind: 'workspace', path: baseProps.xcodeProject.name },
  scheme: 'MyApp',
  configuration: 'Debug',
  destination: 'id=demo-udid',
  platform: 'iphonesimulator',
  buildArgs: ['COCOAPODS_PARALLEL_CODE_SIGN=true', 'COMPILER_INDEX_STORE_ENABLE=NO'],
  clean: false,
};

describe(getIosBuildRequestAsync, () => {
  afterEach(() => jest.restoreAllMocks());
  it('passes resolved workspace, configuration, and device to Compile', async () => {
    await expect(getIosBuildRequestAsync(baseProps)).resolves.toEqual(simulatorRequest);
    expect(ensureDeviceIsCodeSignedForDeploymentAsync).not.toHaveBeenCalled();
  });

  it('preserves physical-device signing and disabled build cache', async () => {
    jest.mocked(ensureDeviceIsCodeSignedForDeploymentAsync).mockResolvedValueOnce('my-dev-team');
    await expect(
      getIosBuildRequestAsync({ ...baseProps, isSimulator: false, buildCache: false })
    ).resolves.toEqual({
      ...simulatorRequest,
      platform: 'iphoneos',
      clean: true,
      buildArgs: [
        ...simulatorRequest.buildArgs,
        'DEVELOPMENT_TEAM=my-dev-team',
        '-allowProvisioningUpdates',
        '-allowProvisioningDeviceRegistration',
      ],
    });
  });

  it('preserves signing when simulator entitlements require it', async () => {
    jest.mocked(simulatorBuildRequiresCodeSigning).mockReturnValueOnce(true);
    jest.mocked(ensureDeviceIsCodeSignedForDeploymentAsync).mockResolvedValueOnce('simulator-team');
    await expect(getIosBuildRequestAsync(baseProps)).resolves.toMatchObject({
      buildArgs: expect.arrayContaining(['DEVELOPMENT_TEAM=simulator-team']),
    });
  });

  it('passes build timing diagnostics through to Compile', async () => {
    jest.spyOn(env, 'EXPO_PROFILE', 'get').mockReturnValueOnce(true);
    await expect(getIosBuildRequestAsync(baseProps)).resolves.toMatchObject({
      buildArgs: [...simulatorRequest.buildArgs, '-showBuildTimingSummary'],
    });
  });

  it('preserves Xcode project input and Release configuration', async () => {
    await expect(
      getIosBuildRequestAsync({
        ...baseProps,
        configuration: 'Release',
        xcodeProject: { name: '/project/MyApp.xcodeproj', isWorkspace: false },
      })
    ).resolves.toEqual({
      ...simulatorRequest,
      source: { kind: 'project', path: '/project/MyApp.xcodeproj' },
      configuration: 'Release',
    });
  });

  it.each([
    ['iOS', 'iOS', 'iphonesimulator'],
    ['tvOS', 'tvOS', 'appletvsimulator'],
    ['watchOS', 'watchOS', 'watchsimulator'],
    ['xrOS', 'visionOS', 'xrsimulator'],
  ] as const)('preserves generic %s simulator builds', async (osType, destination, platform) => {
    await expect(getIosBuildRequestAsync({ ...baseProps, device: null, osType })).resolves.toEqual({
      ...simulatorRequest,
      destination: `generic/platform=${destination} Simulator`,
      platform,
    });
    expect(ensureDeviceIsCodeSignedForDeploymentAsync).not.toHaveBeenCalled();
  });

  it.each([
    ['tvOS', 'appletvos'],
    ['watchOS', 'watchos'],
    ['xrOS', 'xros'],
  ] as const)('preserves physical %s destinations', async (osType, platform) => {
    await expect(
      getIosBuildRequestAsync({ ...baseProps, osType, isSimulator: false })
    ).resolves.toMatchObject({ destination: 'id=demo-udid', platform });
  });

  it('builds an iOS app for a Mac destination designed for iPad', async () => {
    await expect(
      getIosBuildRequestAsync({
        ...baseProps,
        isSimulator: false,
        device: { udid: 'mac-udid', name: 'My Mac', osType: 'macOS' },
      })
    ).resolves.toMatchObject({ destination: 'id=mac-udid', platform: 'iphoneos' });
    expect(ensureDeviceIsCodeSignedForDeploymentAsync).toHaveBeenCalledWith(baseProps.projectRoot);
  });

  it('reports unsupported macOS builds before invoking Compile', async () => {
    await expect(
      getIosBuildRequestAsync({ ...baseProps, osType: 'macOS', isSimulator: false })
    ).rejects.toThrow('does not support macOS');
    expect(buildIos).not.toHaveBeenCalled();
    expect(ensureDeviceIsCodeSignedForDeploymentAsync).not.toHaveBeenCalled();
  });
});

describe(getProcessOptions, () => {
  it('preserves Run bundling inputs without mutating the parent environment', () => {
    const envBefore = { ...process.env };
    expect(
      getProcessOptions({
        packager: false,
        shouldSkipInitialBundling: true,
        terminal: 'terminal',
        port: 8082,
        eagerBundleOptions: '{"bundle":true}',
      })
    ).toEqual({
      env: {
        ...envBefore,
        RCT_TERMINAL: 'terminal',
        SKIP_BUNDLING: '1',
        __EXPO_EAGER_BUNDLE_OPTIONS: '{"bundle":true}',
        RCT_NO_LAUNCH_PACKAGER: 'true',
      },
    });
    expect(process.env).toEqual(envBefore);
  });
});

function getRunner(options: NativeBuildOptions | undefined): ProcessRunner {
  if (!options?.runProcess) throw new Error('Compile runner was not provided');
  return options.runProcess;
}

function mockNativeBuild(code: number | null, stdout: string, stderr = '') {
  const { ChildProcess } = jest.requireActual('child_process') as typeof import('child_process');
  jest.mocked(spawn).mockImplementationOnce(() => {
    const child = Object.assign(new ChildProcess(), {
      stdin: new PassThrough(),
      stdout: new PassThrough(),
      stderr: new PassThrough(),
    });
    queueMicrotask(() => {
      child.stdout.write(stdout);
      child.stderr.write(stderr);
      child.emit('close', code, code === null ? 'SIGINT' : null);
    });
    return child;
  });
}

function mockCompileBuild() {
  jest.mocked(buildIos).mockImplementationOnce(async (request, options) => {
    await getRunner(options)('/usr/bin/xcrun', ['xcodebuild', '-scheme', request.scheme, 'build'], {
      cwd: request.cwd,
      env: options?.env,
      outputMode: 'stderr',
      signal: undefined,
    });
    return ['/built/My App.app'];
  });
}

describe(buildAsync, () => {
  beforeEach(() => {
    vol.fromJSON({ '/path/to/project/package.json': '{}' });
    jest.mocked(buildIos).mockReset().mockResolvedValue(['/built/My App.app']);
    jest.mocked(runXcodeProcessAsync).mockReset();
  });
  afterEach(() => {
    vol.reset();
    jest.useRealTimers();
  });

  it('returns the checked artifact path without reading build logs', async () => {
    await expect(buildAsync(baseProps)).resolves.toBe('/built/My App.app');
    expect(buildIos).toHaveBeenCalledWith(simulatorRequest, {
      env: expect.objectContaining({ RCT_NO_LAUNCH_PACKAGER: 'true' }),
      runProcess: expect.any(Function),
    });
  });

  it('keeps extended-attribute cleanup before building', async () => {
    vol.fromJSON({ '/path/to/project/ios/project.pbxproj': '' });
    await buildAsync(baseProps);
    expect(spawnAsync).toHaveBeenCalledWith('xattr', [
      '-r',
      '-d',
      'com.apple.FinderInfo',
      '/path/to/project/ios',
    ]);
    expect(spawnAsync).toHaveBeenCalledWith('xattr', [
      '-r',
      '-d',
      'com.apple.provenance',
      '/path/to/project/ios',
    ]);
  });

  it('captures metadata with the attached Xcode process runner', async () => {
    const metadataOptions = {
      cwd: baseProps.projectRoot,
      env: { NODE_ENV: 'development' },
      outputMode: 'capture',
      signal: undefined,
    } as const;
    jest.mocked(runXcodeProcessAsync).mockResolvedValueOnce({
      status: 'exited',
      exitCode: 0,
      stdout: '[]',
      stderr: '',
    });
    jest.mocked(buildIos).mockImplementationOnce(async (_request, options) => {
      await expect(
        getRunner(options)(
          '/usr/bin/xcrun',
          ['xcodebuild', '-showBuildSettings', '-json'],
          metadataOptions
        )
      ).resolves.toEqual({ status: 'exited', exitCode: 0, stdout: '[]', stderr: '' });
      return ['/built/My App.app'];
    });
    await buildAsync(baseProps);
    expect(runXcodeProcessAsync).toHaveBeenCalledWith(
      '/usr/bin/xcrun',
      ['xcodebuild', '-showBuildSettings', '-json'],
      metadataOptions
    );
    expect(spawn).not.toHaveBeenCalled();
  });

  it('lets Compile report malformed metadata before resolving the runnable', async () => {
    jest.mocked(runXcodeProcessAsync).mockResolvedValueOnce({
      status: 'exited',
      exitCode: 0,
      stdout: 'invalid JSON',
      stderr: '',
    });
    const metadataError = new CompileError('Xcode build settings returned invalid JSON.');
    jest.mocked(buildIos).mockImplementationOnce(async (request, options) => {
      await getRunner(options)('/usr/bin/xcrun', ['xcodebuild', '-showBuildSettings', '-json'], {
        cwd: request.cwd,
        env: options?.env,
        outputMode: 'capture',
        signal: undefined,
      });
      throw metadataError;
    });
    await expect(buildAsync(baseProps)).rejects.toMatchObject({
      code: 'XCODE_BUILD',
      message: metadataError.message,
      cause: metadataError,
    });
  });

  it.each(['Debug', 'Release'] as const)(
    'selects the runnable using captured %s build settings when product names change',
    async (configuration) => {
      const projectPath = '/path/to/project/ios/MyApp.xcodeproj';
      const appPath = `/built/MyApp-${configuration}.app`;
      vol.fromJSON({
        [`${projectPath}/project.pbxproj`]: `{
          objects = {
/* Begin PBXNativeTarget section */
            A10000000000000000000001 = { isa = PBXNativeTarget; name = MyApp; };
/* End PBXNativeTarget section */
          };
        }
`,
        '/path/to/project/ios/MyApp.xcworkspace/xcshareddata/xcschemes/MyApp.xcscheme': `
          <Scheme version="1.3">
            <LaunchAction>
              <BuildableProductRunnable>
                <BuildableReference
                  BuildableName="MyApp.app"
                  BlueprintName="CachedTargetName"
                  BlueprintIdentifier="A10000000000000000000001"
                  ReferencedContainer="container:MyApp.xcodeproj"/>
              </BuildableProductRunnable>
            </LaunchAction>
          </Scheme>`,
      });
      jest.mocked(runXcodeProcessAsync).mockResolvedValueOnce({
        status: 'exited',
        exitCode: 0,
        stdout: JSON.stringify([
          {
            target: 'Clip',
            buildSettings: {
              PROJECT_FILE_PATH: projectPath,
              TARGET_BUILD_DIR: '/built',
              WRAPPER_NAME: 'Clip.app',
            },
          },
          {
            target: 'MyApp',
            buildSettings: {
              PROJECT_FILE_PATH: projectPath,
              TARGET_BUILD_DIR: '/built',
              WRAPPER_NAME: `MyApp-${configuration}.app`,
            },
          },
        ]),
        stderr: '',
      });
      jest.mocked(buildIos).mockImplementationOnce(async (request, options) => {
        await getRunner(options)(
          '/usr/bin/xcrun',
          ['xcodebuild', '-configuration', request.configuration, '-showBuildSettings', '-json'],
          { cwd: request.cwd, env: options?.env, outputMode: 'capture', signal: undefined }
        );
        return ['/built/Clip.app', appPath];
      });

      await expect(buildAsync({ ...baseProps, configuration })).resolves.toBe(appPath);
      expect(runXcodeProcessAsync).toHaveBeenCalledTimes(1);
    }
  );

  it('keeps native build formatting and full build logs', async () => {
    mockCompileBuild();
    mockNativeBuild(0, '** BUILD SUCCEEDED **\n', 'native warning\n');
    await expect(buildAsync(baseProps)).resolves.toBe('/built/My App.app');
    expect(spawn).toHaveBeenCalledWith(
      '/usr/bin/xcrun',
      ['xcodebuild', '-scheme', 'MyApp', 'build'],
      {
        cwd: baseProps.projectRoot,
        env: expect.objectContaining({ RCT_NO_LAUNCH_PACKAGER: 'true' }),
        signal: undefined,
      }
    );
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Planning build'));
    expect(vol.readFileSync('/path/to/project/.expo/xcodebuild.log', 'utf8')).toBe(
      '** BUILD SUCCEEDED **\n'
    );
    expect(vol.readFileSync('/path/to/project/.expo/xcodebuild-error.log', 'utf8')).toBe(
      'native warning\n'
    );
  });

  it('retries a locked Xcode database and returns the successful artifact', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    mockCompileBuild();
    mockNativeBuild(65, 'database is locked; there are two concurrent builds running\n');
    mockNativeBuild(0, '** BUILD SUCCEEDED **\n');
    const result = expect(buildAsync(baseProps)).resolves.toBe('/built/My App.app');
    await jest.runAllTimersAsync();
    await result;
    expect(spawn).toHaveBeenCalledTimes(2);
    expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('retrying in 1s'));
  });

  it('reports stderr failures and keeps the build log path', async () => {
    mockCompileBuild();
    mockNativeBuild(65, '** BUILD FAILED **\n', 'error: native build failed\n');
    await expect(buildAsync(baseProps)).rejects.toThrow('native build failed');
    expect(vol.readFileSync('/path/to/project/.expo/xcodebuild-error.log', 'utf8')).toBe(
      'error: native build failed\n'
    );
  });

  it.each([null, 75])('treats native build code %s as an interruption', async (code) => {
    mockCompileBuild();
    mockNativeBuild(code, '** BUILD INTERRUPTED **\n');
    await expect(buildAsync(baseProps)).rejects.toBeInstanceOf(AbortCommandError);
  });

  it('reports package metadata or verification failures as Run errors', async () => {
    const error = new CompileError('The selected scheme has no .app product');
    jest.mocked(buildIos).mockRejectedValueOnce(error);
    const result = buildAsync(baseProps);
    await expect(result).rejects.toMatchObject({
      code: 'XCODE_BUILD',
      message: error.message,
      cause: error,
    });
    await expect(result).rejects.toBeInstanceOf(CommandError);
  });

  it('preserves cancellation from the package process runner', async () => {
    jest
      .mocked(buildIos)
      .mockRejectedValueOnce(new CompileError('cancelled', { signal: 'SIGTERM' }));
    await expect(buildAsync(baseProps)).rejects.toBeInstanceOf(AbortCommandError);
  });

  it.each([{ paths: [] }, { paths: ['/built/A.app', '/built/B.app'] }])(
    'rejects ambiguous or absent artifacts $paths',
    async ({ paths }) => {
      jest.mocked(buildIos).mockResolvedValueOnce(paths);
      await expect(buildAsync(baseProps)).rejects.toThrow('Cannot select an app to install');
    }
  );
});

describe(_assertXcodeBuildResults, () => {
  it(`asserts invalid Xcode version`, () => {
    expect(() =>
      _assertXcodeBuildResults(
        70,
        'foobar',
        fs.readFileSync(path.resolve(__dirname, './fixtures/outdated-xcode-error.log'), 'utf8'),
        { name: 'name' },
        './output.log'
      )
    ).toThrow(
      'This operation can fail if the version of the OS on the device is newer than the version of Xcode that is running.'
    );
  });

  it(`shows the log path and compile error before the full build output`, () => {
    let message = '';
    try {
      _assertXcodeBuildResults(
        65,
        fs.readFileSync(path.resolve(__dirname, './fixtures/unhandled-compile-error.log'), 'utf8'),
        '',
        { name: 'BareExpo' },
        './output.log'
      );
    } catch (error: any) {
      message = error.message;
    }
    expect(message).toContain(
      "call to undeclared function 'RCTBundleURLProviderAllowPackagerServerAccess'"
    );
    expect(message).toContain('./output.log');
    expect(message.indexOf('./output.log')).toBeLessThan(
      message.indexOf('ComputeTargetDependencyGraph')
    );
    expect(message.indexOf('call to undeclared function')).toBeLessThan(
      message.indexOf('ComputeTargetDependencyGraph')
    );
  });

  it(`surfaces an error line that only appeared on stderr`, () => {
    let message = '';
    try {
      _assertXcodeBuildResults(
        65,
        'ComputeTargetDependencyGraph\nnote: Building targets in dependency order\n** BUILD FAILED **',
        '/path/Script-ABC123.sh: error: config generation failed\n',
        { name: 'BareExpo' },
        './output.log'
      );
    } catch (error: any) {
      message = error.message;
    }
    expect(message).toContain('error: config generation failed');
  });
});

describe(_formatXcodeBuildFailure, () => {
  it(`includes the build log path`, () => {
    expect(_formatXcodeBuildFailure(65, '/app/.expo/xcodebuild.log')).toContain(
      '/app/.expo/xcodebuild.log'
    );
  });
});

describe(_hasXcodeBuildErrorDetails, () => {
  it(`returns false for Xcode's no-output message`, () => {
    const formatter = ExpoRunFormatter.create('/', {
      xcodeProject: { name: 'BareExpo' },
      isDebug: false,
    });
    formatter.pipe(
      'error: the following command failed with exit code 1 but produced no further output\n'
    );

    expect(formatter.errors).toHaveLength(1);
    expect(_hasXcodeBuildErrorDetails(formatter.errors)).toBe(false);
  });

  it(`returns true for other errors`, () => {
    expect(_hasXcodeBuildErrorDetails(['error: config generation failed'])).toBe(true);
  });
});

describe(_extractXcodeBuildErrorLines, () => {
  it(`extracts and dedupes compiler error lines`, () => {
    const output = [
      'CompileC Foo.o Foo.m normal arm64',
      '/path/Foo.m:1:2: error: use of undeclared identifier',
      '/path/Foo.m:1:2: error: use of undeclared identifier',
      '› 0 error(s), and 3 warning(s)',
      "note: expanded from macro 'BAR'",
    ].join('\n');
    expect(_extractXcodeBuildErrorLines(output)).toEqual([
      '/path/Foo.m:1:2: error: use of undeclared identifier',
    ]);
  });

  it(`returns nothing when no error lines are present`, () => {
    expect(_extractXcodeBuildErrorLines('** BUILD SUCCEEDED **\n› 0 error(s)')).toEqual([]);
  });

  it(`keeps Xcode's no-output message when it is the only error`, () => {
    const message =
      'error: the following command failed with exit code 1 but produced no further output';

    expect(_extractXcodeBuildErrorLines(message)).toEqual([message]);
  });

  it(`keeps Xcode's no-output message with another error`, () => {
    const output = [
      'script.sh: error: config generation failed',
      'error: the following command failed with exit code 1 but produced no further output',
    ].join('\n');

    expect(_extractXcodeBuildErrorLines(output)).toEqual([
      'script.sh: error: config generation failed',
      'error: the following command failed with exit code 1 but produced no further output',
    ]);
  });
});
