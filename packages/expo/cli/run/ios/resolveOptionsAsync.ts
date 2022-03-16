import { IOSConfig } from '@expo/config-plugins';
import chalk from 'chalk';
import { sync as globSync } from 'glob';
import * as path from 'path';

import * as Log from '../../log';
import { OSType } from '../../start/platforms/ios/simctl';
import { CommandError } from '../../utils/errors';
import { resolvePortAsync } from '../../utils/port';
import { profile } from '../../utils/profile';
import { selectAsync } from '../../utils/prompts';
import { resolveDeviceAsync } from './resolveDeviceAsync';
import * as XcodeBuild from './XcodeBuild';

export type XcodeConfiguration = 'Debug' | 'Release';

export type Options = {
  /** iOS device to target. */
  device?: string | boolean;
  /** Dev server port to use, ignored if `bundler` is `false`. */
  port?: number;
  /** Xcode scheme to build. */
  scheme?: string;
  /** Xcode configuration to build. Default `Debug` */
  configuration?: XcodeConfiguration;
  /** Should start the bundler dev server. */
  bundler?: boolean;
  /** Should install missing dependencies before building. */
  install?: boolean;
  /** Should use derived data for builds. */
  buildCache: boolean;
};

export type ProjectInfo = {
  isWorkspace: boolean;
  name: string;
};

const ignoredPaths = ['**/@(Carthage|Pods|vendor|node_modules)/**'];

function findXcodeProjectPaths(
  projectRoot: string,
  extension: 'xcworkspace' | 'xcodeproj'
): string[] {
  return globSync(`ios/*.${extension}`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths,
  });
}

function resolveXcodeProject(projectRoot: string): ProjectInfo {
  let paths = findXcodeProjectPaths(projectRoot, 'xcworkspace');
  if (paths.length) {
    return {
      // Use full path instead of relative project root so that warnings and errors contain full paths as well, this helps with filtering.
      // Also helps keep things consistent in monorepos.
      name: paths[0],
      // name: path.relative(projectRoot, paths[0]),
      isWorkspace: true,
    };
  }
  paths = findXcodeProjectPaths(projectRoot, 'xcodeproj');
  if (paths.length) {
    return { name: paths[0], isWorkspace: false };
  }
  throw new CommandError(`Xcode project not found in project: ${projectRoot}`);
}

const isMac = process.platform === 'darwin';

function getDefaultUserTerminal(): string | undefined {
  const { REACT_TERMINAL, TERM_PROGRAM, TERM } = process.env;

  if (REACT_TERMINAL) {
    return REACT_TERMINAL;
  }

  if (isMac) {
    return TERM_PROGRAM;
  }

  return TERM;
}

async function resolveNativeSchemeAsync(
  projectRoot: string,
  { scheme, configuration }: { scheme?: string | true; configuration?: XcodeConfiguration }
): Promise<{ name: string; osType?: OSType } | null> {
  let resolvedScheme: { name: string; osType?: string } | null = null;
  // @ts-ignore
  if (scheme === true) {
    const schemes = IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj(projectRoot, {
      configuration,
    });
    if (!schemes.length) {
      throw new CommandError('No native iOS build schemes found');
    }
    resolvedScheme = schemes[0];
    if (schemes.length > 1) {
      const resolvedSchemeName = await selectAsync(
        'Select a scheme',
        schemes.map((value) => {
          const isApp =
            value.type === IOSConfig.Target.TargetType.APPLICATION && value.osType === 'iOS';
          return {
            value: value.name,
            title: isApp ? chalk.bold(value.name) + chalk.gray(' (app)') : value.name,
          };
        }),
        {
          nonInteractiveHelp: `--scheme: argument must be provided with a string in non-interactive mode. Valid choices are: ${schemes.join(
            ', '
          )}`,
        }
      );
      resolvedScheme = schemes.find(({ name }) => resolvedSchemeName === name) ?? null;
    } else {
      Log.log(`Auto selecting only available scheme: ${resolvedScheme.name}`);
    }
  } else if (scheme) {
    // Attempt to match the schemes up so we can open the correct simulator
    const schemes = IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj(projectRoot, {
      configuration,
    });
    resolvedScheme = schemes.find(({ name }) => name === scheme) || { name: scheme };
  }

  return resolvedScheme as { name: string; osType?: OSType };
}

export async function resolveOptionsAsync(
  projectRoot: string,
  options: Options
): Promise<XcodeBuild.BuildProps> {
  const xcodeProject = resolveXcodeProject(projectRoot);

  let port = options.bundler
    ? await resolvePortAsync(projectRoot, { reuseExistingPort: true, defaultPort: options.port })
    : null;
  // Skip bundling if the port is null
  options.bundler = !!port;
  if (!port) {
    // any random number
    port = 8081;
  }

  const resolvedScheme = ((await resolveNativeSchemeAsync(projectRoot, options)) ??
    profile(IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj)(projectRoot, {
      configuration: options.configuration,
    })[0] ?? {
      name: path.basename(xcodeProject.name, path.extname(xcodeProject.name)),
    }) as { name: string; osType?: OSType };

  const device = await resolveDeviceAsync(options.device, { osType: resolvedScheme.osType });

  const isSimulator =
    !('deviceType' in device) ||
    device.deviceType.startsWith('com.apple.CoreSimulator.SimDeviceType.');

  const configuration = options.configuration || 'Debug';
  // This optimization skips resetting the Metro cache needlessly.
  // The cache is reset in `../node_modules/react-native/scripts/react-native-xcode.sh` when the
  // project is running in Debug and built onto a physical device. It seems that this is done because
  // the script is run from Xcode and unaware of the CLI instance.
  const shouldSkipInitialBundling = configuration === 'Debug' && !isSimulator;
  return {
    projectRoot,
    isSimulator,
    xcodeProject,
    device,
    configuration: options.configuration || 'Debug',
    shouldStartBundler: options.bundler ?? false,
    shouldSkipInitialBundling,
    port,
    buildCache: options.buildCache,
    terminal: getDefaultUserTerminal(),
    scheme: resolvedScheme.name,
  };
}
