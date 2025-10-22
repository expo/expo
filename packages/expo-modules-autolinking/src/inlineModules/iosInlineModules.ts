import { ModuleIosConfig } from '../types';
import { getMirrorStateObject } from './inlineModules';

export async function getIosInlineModulesClassNames(
  watchedDirs: string[]
): Promise<ModuleIosConfig[]> {
  return (await getMirrorStateObject(watchedDirs)).swiftModuleClassNames.map(
    (className: string) => {
      return {
        class: className,
        name: null,
      };
    }
  );
}
