import { ProjectConfig } from '@expo/config';
import { getEntryPoint } from '@expo/config/paths';
import chalk from 'chalk';
import path from 'path';

import { CommandError } from '../../../utils/errors';

const supportedPlatforms = ['ios', 'android', 'web', 'none'];

/** @returns the relative entry file for the project.  */
export function resolveEntryPoint(
  projectRoot: string,
  platform?: string,
  projectConfig?: ProjectConfig
): string {
  return path.relative(
    projectRoot,
    resolveAbsoluteEntryPoint(projectRoot, platform, projectConfig)
  );
}

/** @returns the absolute entry file for the project.  */
export function resolveAbsoluteEntryPoint(
  projectRoot: string,
  platform?: string,
  projectConfig?: ProjectConfig
): string {
  if (platform && !supportedPlatforms.includes(platform)) {
    throw new CommandError(
      `Failed to resolve the project's entry file: The platform "${platform}" is not supported.`
    );
  }
  // TODO(Bacon): support platform extension resolution like .ios, .native
  // const platforms = [platform, 'native'].filter(Boolean) as string[];
  const platforms: string[] = [];

  const entry = getEntryPoint(projectRoot, ['./index'], platforms, projectConfig);
  if (!entry) {
    // NOTE(Bacon): I purposefully don't mention all possible resolutions here since the package.json is the most standard and users should opt towards that.
    throw new CommandError(
      chalk`The project entry file could not be resolved. Please define it in the {bold package.json} "main" field.`
    );
  }

  return entry;
}
