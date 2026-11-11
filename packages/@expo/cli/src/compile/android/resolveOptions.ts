import fs from 'fs';
import path from 'path';

import { hasRequiredAndroidFilesAsync } from '../../prebuild/clearNativeFolder';
import { CommandError } from '../../utils/errors';
import type { ResolvedOptions } from '../resolveOptions';
import { resolveOutputDir } from '../resolveOptions';

export type BuildProps = ResolvedOptions & {
  variant: string;
};

export async function resolveOptionsAsync(
  projectRoot: string,
  options: ResolvedOptions
): Promise<BuildProps> {
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
    outputDir: resolveOutputDir(projectRoot, options.outputDir),
    variant: options.mode === 'production' ? 'release' : 'debug',
  };
}
