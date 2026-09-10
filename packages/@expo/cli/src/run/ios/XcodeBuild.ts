import spawnAsync from '@expo/spawn-async';
import { ExpoRunFormatter } from '@expo/xcpretty';
import { buildIos, CompileError, runProcess } from '@ramonclaudio/compile';
import type {
  IosBuildPlatform,
  IosBuildRequest,
  ProcessResult,
  RunProcessOptions,
} from '@ramonclaudio/compile';
import chalk from 'chalk';
import type { SpawnOptionsWithoutStdio } from 'child_process';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import * as Log from '../../log';
import type { OSType } from '../../start/platforms/ios/simctl';
import { ensureDirectory } from '../../utils/dir';
import { env } from '../../utils/env';
import { AbortCommandError, CommandError } from '../../utils/errors';
import { getUserTerminal } from '../../utils/terminal';
import type { BuildProps, ProjectInfo } from './XcodeBuild.types';
import { ensureDeviceIsCodeSignedForDeploymentAsync } from './codeSigning/configureCodeSigning';
import { simulatorBuildRequiresCodeSigning } from './codeSigning/simulatorCodeSigning';
import { resolveInstallAppPathAsync } from './resolveInstallAppPath';

// Error messages that indicate concurrent Xcode build failures.
// When multiple builds run simultaneously, Xcode's build database can become locked.
const CONCURRENT_BUILD_ERROR_MESSAGE_1 = 'database is locked';
const CONCURRENT_BUILD_ERROR_MESSAGE_2 = 'there are two concurrent builds running';
// Xcode prints this after a command fails, but it does not show the cause.
const XCODE_BUILD_NO_OUTPUT_ERROR_MESSAGE =
  /error: the following command failed with exit code \d+ but produced no further output/;

/** Get the generic Xcode destination string for a given OS type.
 * Used when building without targeting a specific device (build-only workflow).
 */
export function getGenericSimulatorDestination(osType: OSType): string {
  switch (osType) {
    case 'tvOS':
      return 'generic/platform=tvOS Simulator';
    case 'watchOS':
      return 'generic/platform=watchOS Simulator';
    case 'xrOS':
      return 'generic/platform=visionOS Simulator';
    case 'iOS':
    default:
      return 'generic/platform=iOS Simulator';
  }
}
export function logPrettyItem(message: string) {
  Log.log(chalk`{whiteBright \u203A} ${message}`);
}

export function getProcessOptions({
  packager,
  shouldSkipInitialBundling,
  terminal,
  port,
  eagerBundleOptions,
}: {
  packager: boolean;
  shouldSkipInitialBundling?: boolean;
  terminal: string | undefined;
  port: number;
  eagerBundleOptions?: string;
}): SpawnOptionsWithoutStdio {
  const SKIP_BUNDLING = shouldSkipInitialBundling ? '1' : undefined;
  if (packager) {
    return {
      env: {
        ...process.env,
        RCT_TERMINAL: terminal,
        SKIP_BUNDLING,
        RCT_METRO_PORT: port.toString(),
        __EXPO_EAGER_BUNDLE_OPTIONS: eagerBundleOptions,
      },
    };
  }

  return {
    env: {
      ...process.env,
      RCT_TERMINAL: terminal,
      SKIP_BUNDLING,
      __EXPO_EAGER_BUNDLE_OPTIONS: eagerBundleOptions,
      // Always skip launching the packager from a build script.
      // The script is used for people building their project directly from Xcode.
      // This essentially means "› Running script 'Start Packager'" does nothing.
      RCT_NO_LAUNCH_PACKAGER: 'true',
      // FORCE_BUNDLING: '0'
    },
  };
}

export async function getIosBuildRequestAsync(
  props: Pick<
    BuildProps,
    | 'buildCache'
    | 'projectRoot'
    | 'xcodeProject'
    | 'configuration'
    | 'scheme'
    | 'device'
    | 'osType'
    | 'isSimulator'
  >
): Promise<IosBuildRequest> {
  const platform = getBuildPlatform(props.osType, props.isSimulator);
  // Use specific device UDID when available, otherwise use generic simulator destination
  // for build-only workflows (e.g., --device generic).
  const destination = props.device
    ? `id=${props.device.udid}`
    : getGenericSimulatorDestination(props.osType);

  const args = [
    // Enable parallel code signing for CocoaPods frameworks to speed up device builds.
    // When building for device, multiple frameworks need to be code signed. By default this
    // happens sequentially. This flag allows them to run in parallel.
    // https://github.com/CocoaPods/CocoaPods/pull/6088
    'COCOAPODS_PARALLEL_CODE_SIGN=true',

    // Disable the Xcode compiler index store during CLI builds.
    // The index store is used for code completion, refactoring, and navigation in Xcode IDE.
    // Since CLI builds don't need these features, disabling it saves build time and disk I/O.
    'COMPILER_INDEX_STORE_ENABLE=NO',
  ];

  // Skip code signing setup for generic simulator builds (no device).
  if (
    props.device &&
    (!props.isSimulator || simulatorBuildRequiresCodeSigning(props.projectRoot))
  ) {
    const developmentTeamId = await ensureDeviceIsCodeSignedForDeploymentAsync(props.projectRoot);
    if (developmentTeamId) {
      args.push(
        `DEVELOPMENT_TEAM=${developmentTeamId}`,
        '-allowProvisioningUpdates',
        '-allowProvisioningDeviceRegistration'
      );
    }
  }

  if (env.EXPO_PROFILE) {
    args.push('-showBuildTimingSummary');
  }

  return {
    cwd: props.projectRoot,
    source: {
      kind: props.xcodeProject.isWorkspace ? 'workspace' : 'project',
      path: props.xcodeProject.name,
    },
    scheme: props.scheme,
    configuration: props.configuration,
    destination,
    platform,
    buildArgs: args,
    clean: props.buildCache === false,
  };
}

function getBuildPlatform(osType: OSType, isSimulator: boolean): IosBuildPlatform {
  switch (osType) {
    case 'tvOS':
      return isSimulator ? 'appletvsimulator' : 'appletvos';
    case 'watchOS':
      return isSimulator ? 'watchsimulator' : 'watchos';
    case 'xrOS':
      return isSimulator ? 'xrsimulator' : 'xros';
    case 'macOS':
      throw new CommandError('UNSUPPORTED_PLATFORM', 'Run iOS does not support macOS app builds.');
    default:
      return isSimulator ? 'iphonesimulator' : 'iphoneos';
  }
}

function spawnXcodeBuild(
  command: string,
  args: readonly string[],
  options: SpawnOptionsWithoutStdio,
  { onData }: { onData: (data: string) => void }
): Promise<{ code: number | null; results: string; error: string }> {
  const buildProcess = spawn(command, args, options);

  let results = '';
  let error = '';

  buildProcess.stdout.on('data', (data: Buffer) => {
    const stringData = data.toString();
    results += stringData;
    onData(stringData);
  });

  buildProcess.stderr.on('data', (data: Buffer) => {
    const stringData = data instanceof Buffer ? data.toString() : data;
    error += stringData;
  });

  return new Promise((resolve, reject) => {
    buildProcess.on('error', reject);
    buildProcess.on('close', (code: number | null) => {
      resolve({ code, results, error });
    });
  });
}

async function spawnXcodeBuildWithFlush(
  command: string,
  args: readonly string[],
  options: SpawnOptionsWithoutStdio,
  { onFlush }: { onFlush: (data: string) => void }
): Promise<{ code: number | null; results: string; error: string }> {
  let currentBuffer = '';

  // Data can be sent in chunks that would have no relevance to our regex
  // this can cause massive slowdowns, so we need to ensure the data is complete before attempting to parse it.
  function flushBuffer() {
    if (!currentBuffer) {
      return;
    }

    const data = currentBuffer;
    // Reset buffer.
    currentBuffer = '';
    // Process data.
    onFlush(data);
  }

  const data = await spawnXcodeBuild(command, args, options, {
    onData(stringData) {
      currentBuffer += stringData;
      // Only flush the data if we have a full line.
      if (currentBuffer.endsWith(os.EOL)) {
        flushBuffer();
      }
    },
  });

  // Flush log data at the end just in case we missed something.
  flushBuffer();
  return data;
}

async function spawnXcodeBuildWithFormat(
  command: string,
  args: readonly string[],
  options: SpawnOptionsWithoutStdio,
  { projectRoot, xcodeProject }: { projectRoot: string; xcodeProject: ProjectInfo }
): Promise<{ code: number | null; results: string; error: string; formatter: ExpoRunFormatter }> {
  Log.debug(`  ${command} ${args.join(' ')}`);

  logPrettyItem(chalk.bold`Planning build`);

  const formatter = ExpoRunFormatter.create(projectRoot, {
    xcodeProject,
    isDebug: env.EXPO_DEBUG,
  });

  const results = await spawnXcodeBuildWithFlush(command, args, options, {
    onFlush(data) {
      // Process data through formatter for display
      for (const line of formatter.pipe(data)) {
        Log.log(line);
      }
    },
  });

  Log.debug(`Exited with code: ${results.code}`);

  if (
    // User cancelled with ctrl-c
    results.code === null ||
    // Build interrupted
    results.code === 75
  ) {
    throw new AbortCommandError();
  }

  Log.log(formatter.getBuildSummary());

  return { ...results, formatter };
}

export async function buildAsync(props: BuildProps): Promise<string> {
  const request = await getIosBuildRequestAsync(props);
  const { projectRoot, shouldSkipInitialBundling, port, eagerBundleOptions } = props;

  await removeExtendedAttributesAsync(projectRoot);

  const { env: buildEnv } = getProcessOptions({
    packager: false,
    terminal: getUserTerminal(),
    shouldSkipInitialBundling,
    port,
    eagerBundleOptions,
  });

  let appPaths: readonly string[];
  try {
    appPaths = await buildIos(request, {
      env: buildEnv,
      runProcess(command, args, options) {
        if (
          command === '/usr/bin/xcrun' &&
          args[0] === 'xcodebuild' &&
          options.outputMode !== 'capture'
        ) {
          return runFormattedBuildAsync(command, args, options, props);
        }
        return runProcess(command, args, options);
      },
    });
  } catch (error) {
    if (error instanceof CompileError) {
      if (error.signal) throw new AbortCommandError();
      const commandError = new CommandError('XCODE_BUILD', error.message);
      commandError.cause = error;
      throw commandError;
    }
    throw error;
  }

  return resolveInstallAppPathAsync(props, appPaths);
}

async function runFormattedBuildAsync(
  command: string,
  args: readonly string[],
  options: RunProcessOptions,
  { projectRoot, xcodeProject }: BuildProps
): Promise<ProcessResult> {
  const maxRetries = 3;
  let retryDelaySeconds = 1;

  for (let attempt = 0; ; attempt++) {
    const { code, results, formatter, error } = await spawnXcodeBuildWithFormat(
      command,
      args,
      { cwd: options.cwd, env: options.env, signal: options.signal },
      { projectRoot, xcodeProject }
    );

    if (code !== 0 && isConcurrentBuildError(results)) {
      if (attempt < maxRetries) {
        Log.warn(
          `Xcode build failed due to concurrent builds, retrying in ${retryDelaySeconds}s... (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelaySeconds * 1000));
        retryDelaySeconds *= 2;
        continue;
      }
      Log.warn('Xcode build failed due to concurrent builds after maximum retries.');
    }

    const logFilePath = writeBuildLogs(projectRoot, results, error);
    if (code !== 0) {
      if (_hasXcodeBuildErrorDetails(formatter.errors)) {
        throw new CommandError(_formatXcodeBuildFailure(code, logFilePath));
      }
      _assertXcodeBuildResults(code, results, error, xcodeProject, logFilePath);
    }
    return { status: 'exited', exitCode: 0, stdout: results, stderr: error };
  }
}

// Exposed for testing.
export function _formatXcodeBuildFailure(code: number | null, logFilePath: string): string {
  return `Failed to build iOS project. "xcodebuild" exited with error code ${code}.\nBuild logs written to ${chalk.underline(
    logFilePath
  )}`;
}

// Exposed for testing.
export function _hasXcodeBuildErrorDetails(errors: string[]): boolean {
  return errors.some((error) => !isXcodeBuildNoOutputErrorLine(error));
}

// Exposed for testing.
export function _assertXcodeBuildResults(
  code: number | null,
  results: string,
  error: string,
  xcodeProject: { name: string },
  logFilePath: string
): void {
  const errorHeader = _formatXcodeBuildFailure(code, logFilePath);

  const throwWithMessage = (message: string): never => {
    throw new CommandError(
      `${errorHeader}\nTo view more error logs, try building the app with Xcode directly, by opening ${xcodeProject.name}.\n\n` +
        message
    );
  };

  const localizedError = error.match(/NSLocalizedFailure = "(.*)"/)?.[1];

  if (localizedError) {
    throwWithMessage(chalk.bold(localizedError) + '\n\n');
  }

  // `@expo/xcpretty` only reads stdout and can miss some Xcode errors.
  // Show useful error lines first so CI does not cut them off.
  const errorLines = _extractXcodeBuildErrorLines(results + '\n' + error);
  if (errorLines.length) {
    throwWithMessage(chalk.red(errorLines.join('\n')) + '\n\n' + results + '\n\n' + error);
  }

  // Show all the log info because often times the error is coming from a shell script,
  // that invoked a node script, that started metro, which threw an error.

  throwWithMessage(results + '\n\n' + error);
}

// Exposed for testing.
export function _extractXcodeBuildErrorLines(output: string): string[] {
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const raw of output.split(/\r?\n/)) {
    const line = raw.trim();
    if (/(?:^|\s)error:\s/.test(line) && !seen.has(line)) {
      seen.add(line);
      errors.push(line);
    }
  }
  return errors;
}

function isXcodeBuildNoOutputErrorLine(line: string): boolean {
  return XCODE_BUILD_NO_OUTPUT_ERROR_MESSAGE.test(line);
}

function writeBuildLogs(projectRoot: string, buildOutput: string, errorOutput: string) {
  const [logFilePath, errorFilePath] = getErrorLogFilePath(projectRoot);

  fs.writeFileSync(logFilePath, buildOutput);
  fs.writeFileSync(errorFilePath, errorOutput);
  return logFilePath;
}

function getErrorLogFilePath(projectRoot: string): [string, string] {
  const folder = path.join(projectRoot, '.expo');
  ensureDirectory(folder);
  return [path.join(folder, 'xcodebuild.log'), path.join(folder, 'xcodebuild-error.log')];
}

/**
 * Remove extended attributes that can cause code signing failures.
 *
 * Attributes like `com.apple.FinderInfo` and `com.apple.provenance` are added by Finder,
 * cloud storage services (OneDrive, iCloud, Dropbox), or when files are downloaded.
 * These must be removed before code signing or the build may fail.
 *
 * @see https://developer.apple.com/library/archive/qa/qa1940/_index.html
 */
async function removeExtendedAttributesAsync(projectRoot: string): Promise<void> {
  // These specific attributes are known to cause code signing issues.
  // We preserve com.apple.xcode.CreatedByBuildSystem which Xcode uses to manage build directories.
  const attributesToRemove = ['com.apple.FinderInfo', 'com.apple.provenance'];

  const iosProjectPath = path.join(projectRoot, 'ios');

  // Only proceed if the ios directory exists
  if (!fs.existsSync(iosProjectPath)) {
    return;
  }

  for (const attribute of attributesToRemove) {
    try {
      // -r: recursive, -d: delete attribute
      await spawnAsync('xattr', ['-r', '-d', attribute, iosProjectPath]);
    } catch {
      // Ignore errors - attribute may not exist or directory may be missing.
      // This is expected behavior and not a problem.
      Log.debug(`Failed to remove extended attribute ${attribute} (this is usually fine)`);
    }
  }
}

/**
 * Check if the build failure is due to concurrent Xcode builds.
 * When multiple builds run simultaneously, Xcode's build database can become locked.
 */
function isConcurrentBuildError(results: string): boolean {
  return (
    results.includes(CONCURRENT_BUILD_ERROR_MESSAGE_1) &&
    results.includes(CONCURRENT_BUILD_ERROR_MESSAGE_2)
  );
}
