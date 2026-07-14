import type { ModuleIosConfig } from '../types';
import type { InlineModulesScanOptions } from './inlineModules';
import { getMirrorStateObject } from './inlineModules';

export async function getIosInlineModulesClassNames(
  options: InlineModulesScanOptions
): Promise<ModuleIosConfig[]> {
	const stateObject = await getMirrorStateObject(options);
  return stateObject.swiftModuleClassNames.map((className: string) => {
    return {
      class: className,
      name: null,
    };
  });
}

export function isTargetInInlineModulesTargets({
  targetPath,
  inlineModulesTargets,
}: {
  targetPath: string;
  inlineModulesTargets: { mainTarget?: string; targets: string[] };
}): boolean {
  const targetRegex = /\/Pods-(.+?)\/ExpoModulesProvider\.swift$/;
  const match = targetPath.match(targetRegex);
  if (!match) {
    return false;
  }
  const targetName = match[1];
  if (targetName === undefined) {
    return false;
  }
  if (inlineModulesTargets.mainTarget) {
    return targetName === inlineModulesTargets.mainTarget;
  }
  return inlineModulesTargets.targets.includes(targetName);
}
