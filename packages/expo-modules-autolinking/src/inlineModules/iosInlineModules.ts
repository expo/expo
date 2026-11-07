import type { ModuleIosConfig } from '../types';
import type { InlineModulesScanOptions } from './inlineModules';
import { getMirrorStateObject } from './inlineModules';

/**
 * Returns all Swift inline modules in `modules`, and the ones declared with the `@ExpoModule` macro
 * (Expo Modules API 2.0) also in `expoModules`.
 */
export async function getIosInlineModulesClassNames(
  options: InlineModulesScanOptions
): Promise<{ modules: ModuleIosConfig[]; expoModules: ModuleIosConfig[] }> {
  const stateObject = await getMirrorStateObject(options);
  const toConfig = (className: string): ModuleIosConfig => ({ class: className, name: null });
  return {
    modules: stateObject.swiftModuleClassNames.map(toConfig),
    expoModules: stateObject.swiftExpoModuleClassNames.map(toConfig),
  };
}

function extractTargetNameFromPath(targetPath: string): string | undefined {
  const targetRegex = /\/Pods-(.+?)\/ExpoModulesProvider\.swift$/;
  return targetPath.match(targetRegex)?.[1];
}

export function isTargetInInlineModulesTargets({
  targetName,
  targetPath,
  inlineModulesTargets,
}: {
  targetName?: string;
  targetPath: string;
  inlineModulesTargets: { mainTarget?: string; targets: string[] };
}): boolean {
  const resolvedTargetName = targetName ?? extractTargetNameFromPath(targetPath);
  if (resolvedTargetName === undefined) {
    return false;
  }
  if (inlineModulesTargets.mainTarget) {
    return resolvedTargetName === inlineModulesTargets.mainTarget;
  }
  return inlineModulesTargets.targets.includes(resolvedTargetName);
}
