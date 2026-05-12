import spawnAsync from '@expo/spawn-async';
import { ExpoRunFormatter } from '@expo/xcpretty';
import chalk from 'chalk';
import type { SpawnOptionsWithoutStdio } from 'child_process';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import type { BuildProps, ProjectInfo } from './XcodeBuild.types';
import { ensureDeviceIsCodeSignedForDeploymentAsync } from './codeSigning/configureCodeSigning';
import { simulatorBuildRequiresCodeSigning } from './codeSigning/simulatorCodeSigning';
import * as Log from '../../log';
import type { OSType } from '../../start/platforms/ios/simctl';
import { ensureDirectory } from '../../utils/dir';
import { env } from '../../utils/env';
import { AbortCommandError, CommandError } from '../../utils/errors';
import { getUserTerminal } from '../../utils/terminal';

// Error messages that indicate concurrent Xcode build failures.
// When multiple builds run simultaneously, Xcode's build database can become locked.
const CONCURRENT_BUILD_ERROR_MESSAGE_1 = 'database is locked';
const CONCURRENT_BUILD_ERROR_MESSAGE_2 = 'there are two concurrent builds running';

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

export function matchEstimatedBinaryPath(buildOutput: string): string | null {
  // Match the full path that contains `/(.*)/Developer/Xcode/DerivedData/(.*)/Build/Products/(.*)/(.*).app`
  const appBinaryPathMatch = buildOutput.match(
    /(\/(?:\\\s|[^ ])+\/Developer\/Xcode\/DerivedData\/(?:\\\s|[^ ])+\/Build\/Products\/(?:Debug|Release)-(?:[^\s/]+)\/(?:\\\s|[^ ])+\.app)/
  );
  const pathFiltered = appBinaryPathMatch?.filter((a) => typeof a === 'string' && a);
  if (!pathFiltered?.length) {
    throw new CommandError(
      'XCODE_BUILD',
      `Malformed xcodebuild results: app binary path was not generated in build output. Report this issue and run your project with Xcode instead.`
    );
  } else {
    // Sort for the shortest
    const shortestPath = pathFiltered
      .sort((a: string, b: string) => a.length - b.length)[0]
      ?.trim();
    Log.debug(`Found app binary path: ${shortestPath}`);
    return shortestPath ?? null;
  }
}
/**
 *
 * @returns '/Users/evanbacon/Library/Developer/Xcode/DerivedData/myapp-gpgjqjodrxtervaufttwnsgimhrx/Build/Products/Debug-iphonesimulator/myapp.app'
 */
export function getAppBinaryPath(buildOutput: string) {
  // Matches what's used in "Bundle React Native code and images" script.
  // Requires that `-hideShellScriptEnvironment` is not included in the build command (extra logs).

  try {
    // Like `\=/Users/evanbacon/Library/Developer/Xcode/DerivedData/Exponent-anpuosnglkxokahjhfszejloqfvo/Build/Products/Debug-iphonesimulator`
    const CONFIGURATION_BUILD_DIR = extractEnvVariableFromBuild(
      buildOutput,
      'CONFIGURATION_BUILD_DIR'
    ).sort(
      // Longer name means more suffixes, we want the shortest possible one to be first.
      // Massive projects (like Expo Go) can sometimes print multiple different sets of environment variables.
      // This can become an issue with some
      (a, b) => a.length - b.length
    );
    // Like `Exponent.app`
    const UNLOCALIZED_RESOURCES_FOLDER_PATH = extractEnvVariableFromBuild(
      buildOutput,
      'UNLOCALIZED_RESOURCES_FOLDER_PATH'
    );

    const binaryPath = path.join(
      // Use the shortest defined env variable (usually there's just one).
      CONFIGURATION_BUILD_DIR[0]!,
      // Use the last defined env variable.
      UNLOCALIZED_RESOURCES_FOLDER_PATH[UNLOCALIZED_RESOURCES_FOLDER_PATH.length - 1]!
    );

    // If the app has a space in the name it'll fail because it isn't escaped properly by Xcode.
    return getEscapedPath(binaryPath);
  } catch (error) {
    if (error instanceof CommandError && error.code === 'XCODE_BUILD') {
      const possiblePath = matchEstimatedBinaryPath(buildOutput);
      if (possiblePath) {
        return possiblePath;
      }
    }
    throw error;
  }
}

export function getEscapedPath(filePath: string): string {
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  const unescapedPath = filePath.split(/\\ /).join(' ');
  if (fs.existsSync(unescapedPath)) {
    return unescapedPath;
  }
  throw new CommandError(
    'XCODE_BUILD',
    `Unexpected: Generated app at path "${filePath}" cannot be read, the app cannot be installed. Report this and build onto a simulator.`
  );
}

export function extractEnvVariableFromBuild(buildOutput: string, variableName: string) {
  // Xcode can sometimes escape `=` with a backslash or put the value in quotes
  const reg = new RegExp(`export ${variableName}\\\\?=(.*)$`, 'mg');
  const matched = [...buildOutput.matchAll(reg)]
    .map((value) => value[1])
    .filter((value): value is string => !!value);
  if (!matched || !matched.length) {
    throw new CommandError(
      'XCODE_BUILD',
      `Malformed xcodebuild results: "${variableName}" variable was not generated in build output. Report this issue and run your project with Xcode instead.`
    );
  }
  return matched;
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

export async function getXcodeBuildArgsAsync(
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
): Promise<string[]> {
  // Use specific device UDID when available, otherwise use generic simulator destination
  // for build-only workflows (e.g., --device generic).
  const destination = props.device
    ? `id=${props.device.udid}`
    : getGenericSimulatorDestination(props.osType);

  const args = [
    props.xcodeProject.isWorkspace ? '-workspace' : '-project',
    props.xcodeProject.name,
    '-configuration',
    props.configuration,
    '-scheme',
    props.scheme,
    '-destination',
    destination,

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

  // Add last
  if (props.buildCache === false) {
    args.push(
      // Will first clean the derived data folder.
      'clean',
      // Then build step must be added otherwise the process will simply clean and exit.
      'build'
    );
  }

  if (env.EXPO_PROFILE) {
    args.push('-showBuildTimingSummary');
  }

  return args;
}

function spawnXcodeBuild(
  args: string[],
  options: SpawnOptionsWithoutStdio,
  { onData }: { onData: (data: string) => void }
): Promise<{ code: number | null; results: string; error: string }> {
  const buildProcess = spawn('xcodebuild', args, options);

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

  return new Promise(async (resolve, reject) => {
    buildProcess.on('close', (code: number) => {
      resolve({ code, results, error });
    });
  });
}

async function spawnXcodeBuildWithFlush(
  args: string[],
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

  const data = await spawnXcodeBuild(args, options, {
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
  args: string[],
  options: SpawnOptionsWithoutStdio,
  { projectRoot, xcodeProject }: { projectRoot: string; xcodeProject: ProjectInfo }
): Promise<{ code: number | null; results: string; error: string; formatter: ExpoRunFormatter }> {
  Log.debug(`  xcodebuild ${args.join(' ')}`);

  logPrettyItem(chalk.bold`Planning build`);

  const formatter = ExpoRunFormatter.create(projectRoot, {
    xcodeProject,
    isDebug: env.EXPO_DEBUG,
  });

  const results = await spawnXcodeBuildWithFlush(args, options, {
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
  const args = await getXcodeBuildArgsAsync(props);

  const { projectRoot, xcodeProject, shouldSkipInitialBundling, port, eagerBundleOptions } = props;

  // Remove extended attributes that can cause code signing failures before building.
  // These are added by Finder, cloud storage services, or when downloading files.
  await removeExtendedAttributesAsync(projectRoot);

  const processOptions = getProcessOptions({
    packager: false,
    terminal: getUserTerminal(),
    shouldSkipInitialBundling,
    port,
    eagerBundleOptions,
  });

  // Retry logic for concurrent build failures.
  // When multiple Xcode builds run simultaneously (e.g., in CI), the build database
  // can become locked. We retry with exponential backoff to handle this.
  const maxRetries = 3;
  let retryDelaySeconds = 1;
  let lastResults: {
    code: number | null;
    results: string;
    error: string;
    formatter: ExpoRunFormatter;
  } | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { code, results, formatter, error } = await spawnXcodeBuildWithFormat(
      args,
      processOptions,
      { projectRoot, xcodeProject }
    );

    lastResults = { code, results, error, formatter };

    // If build succeeded or failed for a reason other than concurrent builds, stop retrying
    if (code === 0 || !isConcurrentBuildError(results)) {
      break;
    }

    // If we have retries left, wait and try again
    if (attempt < maxRetries) {
      Log.warn(
        `Xcode build failed due to concurrent builds, retrying in ${retryDelaySeconds}s... (attempt ${attempt + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelaySeconds * 1000));
      retryDelaySeconds *= 2; // Exponential backoff
    } else {
      Log.warn('Xcode build failed due to concurrent builds after maximum retries.');
    }
  }

  const { code, results, formatter, error } = lastResults!;
  const logFilePath = writeBuildLogs(projectRoot, results, error);

  if (code !== 0) {
    // Determine if the logger found any errors;
    const wasErrorPresented = !!formatter.errors.length;

    if (wasErrorPresented) {
      // This has a flaw, if the user is missing a file, and there is a script error, only the missing file error will be shown.
      // They will only see the script error if they fix the missing file and rerun.
      // The flaw can be fixed by catching script errors in the custom logger.
      throw new CommandError(
        `Failed to build iOS project. "xcodebuild" exited with error code ${code}.`
      );
    }

    _assertXcodeBuildResults(code, results, error, xcodeProject, logFilePath);
  }
  return results;
}

// Exposed for testing.
export function _assertXcodeBuildResults(
  code: number | null,
  results: string,
  error: string,
  xcodeProject: { name: string },
  logFilePath: string
): void {
  const errorTitle = `Failed to build iOS project. "xcodebuild" exited with error code ${code}.`;

  const throwWithMessage = (message: string): never => {
    throw new CommandError(
      `${errorTitle}\nTo view more error logs, try building the app with Xcode directly, by opening ${xcodeProject.name}.\n\n` +
        message +
        `Build logs written to ${chalk.underline(logFilePath)}`
    );
  };

  const localizedError = error.match(/NSLocalizedFailure = "(.*)"/)?.[1];

  if (localizedError) {
    throwWithMessage(chalk.bold(localizedError) + '\n\n');
  }
  // Show all the log info because often times the error is coming from a shell script,
  // that invoked a node script, that started metro, which threw an error.

  throwWithMessage(results + '\n\n' + error);
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
