import type { XcodeConfiguration } from '../../run/ios/XcodeBuild.types';
import { CommandError } from '../../utils/errors';
import type { ResolvedOptions } from '../resolveOptions';

export type BuildProps = ResolvedOptions & {
  configuration: XcodeConfiguration;
};

export function resolveOptions(projectRoot: string, options: ResolvedOptions): BuildProps {
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
  return {
    ...options,
    configuration: options.mode === 'production' ? 'Release' : 'Debug',
  };
}
