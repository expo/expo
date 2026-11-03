import { hasRequiredIOSFilesAsync } from '../../prebuild/clearNativeFolder';
import type { ProjectInfo, XcodeConfiguration } from '../../run/ios/XcodeBuild.types';
import { resolveNativeSchemePropsAsync } from '../../run/ios/options/resolveNativeScheme';
import { resolveXcodeProject } from '../../run/ios/options/resolveXcodeProject';
import type { OSType } from '../../start/platforms/ios/simctl';
import { isOSType } from '../../start/platforms/ios/simctl';
import { CommandError } from '../../utils/errors';
import type { ResolvedOptions } from '../resolveOptions';

export type BuildProps = ResolvedOptions & {
  configuration: XcodeConfiguration;
  xcodeProject: ProjectInfo;
  scheme: string;
  osType: OSType;
};

export async function resolveOptionsAsync(
  projectRoot: string,
  options: ResolvedOptions
): Promise<BuildProps> {
  if (options.device) {
    throw new CommandError(
      'BAD_ARGS',
      'Device builds are not supported yet. Omit --device to build for the simulator.'
    );
  }
  if (options.outputType !== 'app') {
    throw new CommandError(
      'BAD_ARGS',
      `Building an ${options.outputType} is not supported yet. Omit --output-type to build an app.`
    );
  }

  const configuration: XcodeConfiguration = options.mode === 'production' ? 'Release' : 'Debug';
  const xcodeProject = resolveXcodeProject(projectRoot);
  if (!(await hasRequiredIOSFilesAsync(projectRoot))) {
    throw new CommandError(
      'IOS_MALFORMED',
      'The ios project is malformed. You can regenerate it with `npx expo prebuild`'
    );
  }
  const { osType: schemeOsType, name: scheme } = await resolveNativeSchemePropsAsync(
    projectRoot,
    { configuration },
    xcodeProject
  );
  const osType: OSType = isOSType(schemeOsType) ? (schemeOsType as OSType) : 'iOS';
  if (osType !== 'iOS') {
    throw new CommandError(
      'UNSUPPORTED_OS_TYPE',
      `The ${scheme} scheme builds a ${osType} app. compile:ios only supports iOS apps for now. Use \`npx expo run:ios\` to build it.`
    );
  }

  return { ...options, configuration, xcodeProject, scheme, osType };
}
