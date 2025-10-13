import { getLinkingImplementationForPlatform } from '../platforms';
import { ModuleDescriptor, ModuleDescriptorIos, SupportedPlatform } from '../types';

interface GenerateModulesProviderParams {
  platform: SupportedPlatform;
  targetPath: string;
  entitlementPath: string | null;
}

/** Generates ExpoModulesProvider file listing all packages to link (Apple-only)
 */
export async function generateModulesProviderAsync(
  modules: ModuleDescriptor[],
  params: GenerateModulesProviderParams
) {
  const platformLinking = getLinkingImplementationForPlatform(params.platform);
  if (!('generateModulesProviderAsync' in platformLinking)) {
    throw new Error(
      `Generating modules provider is not available for platform "${params.platform}"`
    );
  }
  await platformLinking.generateModulesProviderAsync(
    modules as ModuleDescriptorIos[],
    params.targetPath,
    params.entitlementPath
  );
}
