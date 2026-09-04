import path from 'path';

import type { SPMPackageSource } from './ExternalPackage';

export const PACKAGE_LOCAL_BUILD_DIRECTORY = '.expo-prebuild';

export function getPackageLocalBuildPath(pkg: Pick<SPMPackageSource, 'path'>): string {
  return path.join(pkg.path, PACKAGE_LOCAL_BUILD_DIRECTORY);
}

export function usesPackageLocalBuildPath(pkg: SPMPackageSource): boolean {
  return path.resolve(pkg.buildPath) === path.resolve(getPackageLocalBuildPath(pkg));
}

export function withPackageLocalBuildPath(pkg: SPMPackageSource): SPMPackageSource {
  return new Proxy(pkg, {
    get(target, property, receiver) {
      if (property === 'buildPath') return getPackageLocalBuildPath(target);
      return Reflect.get(target, property, receiver);
    },
  });
}
