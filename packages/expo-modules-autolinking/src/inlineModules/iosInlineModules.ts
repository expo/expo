import { ModuleIosConfig } from '../types';
import { getMirrorStateObject } from './inlineModules';

export async function getIosInlineModulesClassNames(
  watchedDirectories: string[]
): Promise<ModuleIosConfig[]> {
  return (await getMirrorStateObject(watchedDirectories)).swiftModuleClassNames.map(
    (className: string) => {
      return {
        class: className,
        name: null,
      };
    }
  );
}
