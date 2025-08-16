import chalk from 'chalk';

import { getLinkingImplementationForPlatform } from './utils';
import { ModuleDescriptor, SupportedPlatform } from '../types';

interface GeneratePackageListParams {
  platform: SupportedPlatform;
  targetPath: string;
  namespace: string;
}

/** Generates a source file listing all packages to link (Android-only) */
export async function generatePackageListAsync(
  modules: ModuleDescriptor[],
  params: GeneratePackageListParams
) {
  try {
    const platformLinking = getLinkingImplementationForPlatform(params.platform);
    await platformLinking.generatePackageListAsync(modules, params.targetPath, params.namespace);
  } catch (e) {
    console.error(
      chalk.red(`Generating package list is not available for platform: ${params.platform}`)
    );
    throw e;
  }
}

interface GenerateModulesProviderParams {
  platform: SupportedPlatform;
  targetPath: string;
  entitlementPath: string | null | undefined;
}

/** Generates ExpoModulesProvider file listing all packages to link (Apple-only)
 */
export async function generateModulesProviderAsync(
  modules: ModuleDescriptor[],
  params: GenerateModulesProviderParams
) {
  try {
    const platformLinking = getLinkingImplementationForPlatform(params.platform);
    await platformLinking.generateModulesProviderAsync(
      modules,
      params.targetPath,
      params.entitlementPath
    );
  } catch (e) {
    console.error(
      chalk.red(`Generating modules provider is not available for platform: ${params.platform}`)
    );
    throw e;
  }
}
