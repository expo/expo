import { taskAll } from '../concurrency';
import {
  mockDependencyAtPath,
  isNativeModuleAsync as isDependencyNativeModuleAsync,
} from '../dependencies';
import { SupportedPlatform } from '../types';

/** Check if a path is potentially a native module */
export async function isNativeModuleAsync(maybeModulePath: string) {
  const resolution = await mockDependencyAtPath(maybeModulePath);
  const excludeNames = new Set<string>();
  const isNativeModules = await taskAll(['android', 'apple'] as SupportedPlatform[], (platform) =>
    isDependencyNativeModuleAsync(resolution, null, platform, excludeNames)
  );
  return isNativeModules.some((x) => !!x);
}
