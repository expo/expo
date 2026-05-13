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
