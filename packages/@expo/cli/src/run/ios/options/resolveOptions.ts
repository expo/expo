import { getConfig } from '@expo/config';

import type { OSType } from '../../../start/platforms/ios/simctl';
import { isOSType } from '../../../start/platforms/ios/simctl';
import { resolveBuildCacheProvider } from '../../../utils/build-cache-providers';
import type { EnvironmentMode } from '../../../utils/nodeEnv';
import { profile } from '../../../utils/profile';
import { resolveBundlerPropsAsync } from '../../resolveBundlerProps';
import type { BuildProps, Options } from '../XcodeBuild.types';
import { isSimulatorDevice, resolveDeviceAsync } from './resolveDevice';
import { resolveNativeSchemePropsAsync } from './resolveNativeScheme';
import { resolveXcodeProject } from './resolveXcodeProject';

/** Resolve arguments for the `run:ios` command. */
export async function resolveOptionsAsync(
  projectRoot: string,
  options: Options,
  mode: EnvironmentMode
): Promise<BuildProps> {
  const xcodeProject = resolveXcodeProject(projectRoot);

  const bundlerProps = await resolveBundlerPropsAsync(projectRoot, options);

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

  // Generic builds (device=null) are always simulator builds.
  // Otherwise check if the resolved device is a simulator.
  const isSimulator = device ? isSimulatorDevice(device) : true;

  const projectConfig = getConfig(projectRoot);
  const buildCacheProvider = await resolveBuildCacheProvider(
    projectConfig.exp?.buildCacheProvider ?? projectConfig.exp.experiments?.buildCacheProvider,
    projectRoot
  );

  const isDevelopment = mode === 'development';
  // React Native only recognizes case-sensitive `Debug` configurations. Skip native bundling for
  // other development configurations so the build keeps using Metro.
  const shouldSkipInitialBundling =
    isDevelopment && (!isSimulator || !configuration.includes('Debug'));

  return {
    ...bundlerProps,
    shouldStartBundler:
      (!!options.configuration && isDevelopment) || bundlerProps.shouldStartBundler,
    projectRoot,
    isSimulator,
    xcodeProject,
    device,
    osType,
    configuration,
    mode,
    shouldSkipInitialBundling,
    buildCache: options.buildCache !== false,
    scheme,
    buildCacheProvider,
  };
}
