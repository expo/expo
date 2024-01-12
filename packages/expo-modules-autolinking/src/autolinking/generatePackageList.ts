import chalk from 'chalk';

import { getLinkingImplementationForPlatform } from './utils';
import { GenerateOptions, ModuleDescriptor } from '../types';

/**
 * Generates a source file listing all packages to link.
 * Right know it works only for Android platform.
 */
export async function generatePackageListAsync(
  modules: ModuleDescriptor[],
  options: GenerateOptions
) {
  try {
    const platformLinking = getLinkingImplementationForPlatform(options.platform);
    await platformLinking.generatePackageListAsync(modules, options.target, options.namespace);
  } catch (e) {
    console.error(
      chalk.red(`Generating package list is not available for platform: ${options.platform}`)
    );
    throw e;
  }
}
