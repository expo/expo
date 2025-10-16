import { ModuleIosConfig } from '../types';
import { getMirrorStateObject } from './localModules';

export async function getIosLocalModulesClassNames(
  watchedDirs: string[]
): Promise<ModuleIosConfig[]> {
  return (await getMirrorStateObject(watchedDirs)).swiftModuleClassNames.map(
    (className: string) => {
      return {
        name: className,
        class: className,
      };
    }
  );
}
