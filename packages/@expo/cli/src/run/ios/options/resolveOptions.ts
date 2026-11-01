import { getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';

import type { OSType } from '../../../start/platforms/ios/simctl';
import { isOSType } from '../../../start/platforms/ios/simctl';
import { resolveBuildCacheProvider } from '../../../utils/build-cache-providers';
import { CommandError } from '../../../utils/errors';
import { profile } from '../../../utils/profile';
import { resolveBundlerPropsAsync } from '../../resolveBundlerProps';
import type { BuildProps, Options } from '../XcodeBuild.types';
import { isSimulatorDevice, resolveDeviceAsync } from './resolveDevice';
import { resolveNativeSchemePropsAsync } from './resolveNativeScheme';
import { resolveXcodeProject } from './resolveXcodeProject';

type DeviceOptions = Pick<
  BuildProps,
  'device' | 'scheme' | 'osType' | 'configuration' | 'isSimulator'
> & { schemeIsTarget: boolean };

export async function resolveDeviceOptionsAsync(
  projectRoot: string,
  options: Options
): Promise<DeviceOptions> {
  const xcodeProject = resolveXcodeProject(projectRoot);

  // Resolve the scheme before the device so we can filter devices based on
  // whichever scheme is selected (i.e. don't present TV devices if the scheme cannot be run on a TV).
  const { osType: schemeOsType, name: scheme } = await resolveNativeSchemePropsAsync(
    projectRoot,
    options,
    xcodeProject
  );

  // Use the configuration or `Debug` if none is provided.
  const configuration = options.configuration || 'Debug';

  // Normalize the osType from the scheme, defaulting to iOS if not recognized.
  const osType: OSType = isOSType(schemeOsType) ? (schemeOsType as OSType) : 'iOS';

  // Resolve the device based on the provided device id or prompt
  // from a list of devices (connected or simulated) that are filtered by the scheme.
  // Returns null when device is "generic" for build-only workflows.
  const device = await profile(resolveDeviceAsync)(options.device, {
    osType,
    xcodeProject,
    scheme,
    configuration,
  });

  return {
    device,
    scheme,
    osType,
    configuration,
    isSimulator: device ? isSimulatorDevice(device) : true,
    schemeIsTarget: schemeOsType !== undefined,
  };
}

/** Resolve arguments for the `run:ios` command after native dependencies are prepared. */
export async function resolveOptionsAsync(
  projectRoot: string,
  options: Options,
  selection?: DeviceOptions
): Promise<BuildProps> {
  const xcodeProject = resolveXcodeProject(projectRoot);
  const bundlerProps = await resolveBundlerPropsAsync(projectRoot, options);
  const { device, scheme, osType, configuration, isSimulator } =
    selection ?? (await resolveDeviceOptionsAsync(projectRoot, options));

  if (selection) {
    const schemes = IOSConfig.BuildScheme.getRunnableSchemesFromXcodeproj(projectRoot, {
      configuration,
    });
    const preparedScheme = schemes.find(({ name }) => name === scheme);
    if (
      (!preparedScheme && selection.schemeIsTarget) ||
      (preparedScheme &&
        (isOSType(preparedScheme.osType) ? preparedScheme.osType : 'iOS') !== osType)
    ) {
      throw new CommandError(
        'IOS_SCHEME_CHANGED',
        `The selected scheme "${scheme}" changed during native dependency installation. Run the command again to select a compatible scheme and device.`
      );
    }
  }

  const projectConfig = getConfig(projectRoot);
  const buildCacheProvider = await resolveBuildCacheProvider(
    projectConfig.exp?.buildCacheProvider ?? projectConfig.exp.experiments?.buildCacheProvider,
    projectRoot
  );

  // This optimization skips resetting the Metro cache needlessly.
  // The cache is reset in `../node_modules/react-native/scripts/react-native-xcode.sh` when the
  // project is running in Debug and built onto a physical device. It seems that this is done because
  // the script is run from Xcode and unaware of the CLI instance.
  const shouldSkipInitialBundling = configuration === 'Debug' && !isSimulator;

  return {
    ...bundlerProps,
    shouldStartBundler: options.configuration === 'Debug' || bundlerProps.shouldStartBundler,
    projectRoot,
    isSimulator,
    xcodeProject,
    device,
    osType,
    configuration,
    shouldSkipInitialBundling,
    buildCache: options.buildCache !== false,
    scheme,
    buildCacheProvider,
  };
}
