import fs from 'fs';
import path from 'path';

import { hasRequiredAndroidFilesAsync } from '../../prebuild/clearNativeFolder';
import { CommandError } from '../../utils/errors';
import type { ResolvedOptions } from '../resolveOptions';

export type BuildProps = ResolvedOptions & {
  variant: string;
};

export async function resolveOptionsAsync(
  projectRoot: string,
  options: ResolvedOptions
): Promise<BuildProps> {
  if (options.device) {
    throw new CommandError(
      'BAD_ARGS',
      'Device builds are not supported yet. Omit --device to build for all architectures.'
    );
  }
  if (options.outputType !== 'apk') {
    throw new CommandError(
      'BAD_ARGS',
      `Building an ${options.outputType} is not supported yet. Omit --output-type to build an apk.`
    );
  }

  if (!fs.existsSync(path.join(projectRoot, 'android'))) {
    throw new CommandError(
      'ANDROID_MALFORMED',
      `Android project not found in project: ${projectRoot}. You can generate a project with \`npx expo prebuild\``
    );
  }
  if (!(await hasRequiredAndroidFilesAsync(projectRoot))) {
    throw new CommandError(
      'ANDROID_MALFORMED',
      'The android project is malformed. You can regenerate it with `npx expo prebuild`'
    );
  }

  return {
    ...options,
    variant: options.mode === 'production' ? 'release' : 'debug',
  };
}
