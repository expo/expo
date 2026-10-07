import { hasRequiredIOSFilesAsync } from '../../prebuild/clearNativeFolder';
import type { ProjectInfo, XcodeConfiguration } from '../../run/ios/XcodeBuild.types';
import { resolveXcodeProject } from '../../run/ios/options/resolveXcodeProject';
import { CommandError } from '../../utils/errors';
import type { ResolvedOptions } from '../resolveOptions';

export type BuildProps = ResolvedOptions & {
  configuration: XcodeConfiguration;
  xcodeProject: ProjectInfo;
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

  const xcodeProject = resolveXcodeProject(projectRoot);
  if (!(await hasRequiredIOSFilesAsync(projectRoot))) {
    throw new CommandError(
      'IOS_MALFORMED',
      'The ios project is malformed. You can regenerate it with `npx expo prebuild`'
    );
  }

  return {
    ...options,
    configuration: options.mode === 'production' ? 'Release' : 'Debug',
    xcodeProject,
  };
}
