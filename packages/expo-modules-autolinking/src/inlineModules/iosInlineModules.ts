import type { ModuleIosConfig } from '../types';
import { getMirrorStateObject } from './inlineModules';

export async function getIosInlineModulesClassNames(
  watchedDirectories: string[],
  appRoot: string
): Promise<ModuleIosConfig[]> {
  return (await getMirrorStateObject(watchedDirectories, appRoot)).swiftModuleClassNames.map(
    (className: string) => {
      return {
        class: className,
        name: null,
      };
    }
  );
}

export function isTargetInInlineModulesTargets({
  targetPath,
  inlineModulesTargets,
}: {
  targetPath: string;
  inlineModulesTargets: { all: boolean; targets: string[] };
}): boolean {
  if (inlineModulesTargets.all) {
    return true;
  }
  const targetRegex = /\/Pods-(.+?)\/ExpoModulesProvider\.swift$/;
  const match = targetPath.match(targetRegex);
  if (!match) {
    return false;
  }
  const targetName = match[1];
  return targetName !== undefined && inlineModulesTargets.targets.includes(targetName);
}
