import { IOSConfig } from '@expo/config-plugins';
import * as path from 'path';

import { OSType } from '../../../start/platforms/ios/simctl';
import { CommandError } from '../../../utils/errors';
import { resolvePortAsync } from '../../../utils/port';
import { profile } from '../../../utils/profile';
import { BuildProps, Options } from '../XcodeBuild.types';
import { isDeviceASimulator, resolveDeviceAsync } from './resolveDeviceAsync';
import { resolveNativeSchemeAsync } from './resolveNativeScheme';
import { resolveXcodeProject } from './resolveXcodeProject';

function getDefaultUserTerminal(): string | undefined {
  const { REACT_TERMINAL, TERM_PROGRAM, TERM } = process.env;

  if (REACT_TERMINAL) {
    return REACT_TERMINAL;
  }

  if (process.platform === 'darwin') {
    return TERM_PROGRAM;
  }

  return TERM;
}

export async function resolveOptionsAsync(
  projectRoot: string,
  options: Options
): Promise<BuildProps> {
  const xcodeProject = resolveXcodeProject(projectRoot);

  if (
    // If the user disables the bundler then they should not pass in the port property.
    !options.bundler &&
    options.port
  ) {
    throw new CommandError('BAD_ARGS', '--port and --no-bundler are mutually exclusive arguments');
  }

  // Resolve the port if the bundler is used.
  let port = options.bundler
    ? await resolvePortAsync(projectRoot, { reuseExistingPort: true, defaultPort: options.port })
    : null;

  // Skip bundling if the port is null
  options.bundler = !!port;
  if (!port) {
    // any random number
    port = 8081;
  }

  // Resolve the scheme before the device so we can filter devices based on
  // whichever scheme is selected (i.e. don't present TV devices if the scheme cannot be run on a TV).
  let resolvedScheme = await resolveNativeSchemeAsync(projectRoot, options);

  if (!resolvedScheme) {
    // If the resolution failed then we should just use the first runnable scheme that
    // matches the provided configuration.
    resolvedScheme = profile(IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj)(projectRoot, {
      configuration: options.configuration,
    })[0];

    // If we couldn't find the scheme, then we'll guess at it,
    // this is needed for cases where the native code hasn't been generated yet.
    if (!resolvedScheme) {
      resolvedScheme = {
        name: path.basename(xcodeProject.name, path.extname(xcodeProject.name)),
      };
    }
  }

  // Resolve the device based on the provided device id or prompt
  // from a list of devices (connected or simulated) that are filtered by the scheme.
  const device = await resolveDeviceAsync(options.device, {
    // It's unclear if there's any value to asserting that we haven't hardcoded the os type in the CLI.
    osType: resolvedScheme.osType as unknown as OSType,
  });

  const isSimulator = isDeviceASimulator(device);

  // Use the configuration or `Debug` if none is provided.
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
    configuration,
    shouldStartBundler: options.bundler ?? false,
    shouldSkipInitialBundling,
    port,
    buildCache: options.buildCache,
    terminal: getDefaultUserTerminal(),
    scheme: resolvedScheme.name,
  };
}
