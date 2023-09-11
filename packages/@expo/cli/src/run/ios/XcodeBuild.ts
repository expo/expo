import { ExpoRunFormatter } from '@expo/xcpretty';
import chalk from 'chalk';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { BuildProps, ProjectInfo } from './XcodeBuild.types';
import { ensureDeviceIsCodeSignedForDeploymentAsync } from './codeSigning/configureCodeSigning';
import { simulatorBuildRequiresCodeSigning } from './codeSigning/simulatorCodeSigning';
import * as Log from '../../log';
import { ensureDirectory } from '../../utils/dir';
import { env } from '../../utils/env';
import { AbortCommandError, CommandError } from '../../utils/errors';
import { getUserTerminal } from '../../utils/terminal';
export function logPrettyItem(message: string) {
  Log.log(chalk`{whiteBright \u203A} ${message}`);
}

/**
 *
 * @returns '/Users/evanbacon/Library/Developer/Xcode/DerivedData/myapp-gpgjqjodrxtervaufttwnsgimhrx/Build/Products/Debug-iphonesimulator/myapp.app'
 */
export function getAppBinaryPath(buildOutput: string) {
  // Matches what's used in "Bundle React Native code and images" script.
  // Requires that `-hideShellScriptEnvironment` is not included in the build command (extra logs).

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
    CONFIGURATION_BUILD_DIR[0],
    // Use the last defined env variable.
    UNLOCALIZED_RESOURCES_FOLDER_PATH[UNLOCALIZED_RESOURCES_FOLDER_PATH.length - 1]
  );

  // If the app has a space in the name it'll fail because it isn't escaped properly by Xcode.
  return getEscapedPath(binaryPath);
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
    `Unexpected: Generated app at path "${filePath}" cannot be read, the app cannot be installed. Please report this and build onto a simulator.`
  );
}

export function extractEnvVariableFromBuild(buildOutput: string, variableName: string) {
  // Xcode can sometimes escape `=` with a backslash or put the value in quotes
  const reg = new RegExp(`export ${variableName}\\\\?=(.*)$`, 'mg');
  const matched = [...buildOutput.matchAll(reg)];

  if (!matched || !matched.length) {
    throw new CommandError(
      'XCODE_BUILD',
      `Malformed xcodebuild results: "${variableName}" variable was not generated in build output. Please report this issue and run your project with Xcode instead.`
    );
  }
  return matched.map((value) => value[1]).filter(Boolean) as string[];
}

export function getProcessOptions({
  packager,
  shouldSkipInitialBundling,
  terminal,
  port,
}: {
  packager: boolean;
  shouldSkipInitialBundling?: boolean;
  terminal: string | undefined;
  port: number;
}): SpawnOptionsWithoutStdio {
  const SKIP_BUNDLING = shouldSkipInitialBundling ? '1' : undefined;
  if (packager) {
    return {
      env: {
        ...process.env,
        RCT_TERMINAL: terminal,
        SKIP_BUNDLING,
        RCT_METRO_PORT: port.toString(),
      },
    };
  }

  return {
    env: {
      ...process.env,
      RCT_TERMINAL: terminal,
      SKIP_BUNDLING,
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
    | 'isSimulator'
  >
): Promise<string[]> {
  const args = [
    props.xcodeProject.isWorkspace ? '-workspace' : '-project',
    props.xcodeProject.name,
    '-configuration',
    props.configuration,
    '-scheme',
    props.scheme,
    '-destination',
    `id=${props.device.udid}`,
  ];

  if (!props.isSimulator || simulatorBuildRequiresCodeSigning(props.projectRoot)) {
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
      // Process data.
      for (const line of formatter.pipe(data)) {
        // Log parsed results.
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

  const { projectRoot, xcodeProject, shouldSkipInitialBundling, port } = props;

  const { code, results, formatter, error } = await spawnXcodeBuildWithFormat(
    args,
    getProcessOptions({
      packager: false,
      terminal: getUserTerminal(),
      shouldSkipInitialBundling,
      port,
    }),
    {
      projectRoot,
      xcodeProject,
    }
  );

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
