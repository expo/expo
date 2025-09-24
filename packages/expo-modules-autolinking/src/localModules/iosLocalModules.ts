import { getMirrorStateObject } from './localModules';

export async function getIosLocalModulesClassNames(watchedDirs: string[]): Promise<string[]> {
  return (await getMirrorStateObject(watchedDirs)).swiftModuleClassNames;
}
