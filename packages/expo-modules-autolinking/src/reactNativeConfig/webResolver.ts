import fs from 'fs/promises';
import path from 'path';

import type { ExpoModuleConfig } from '../ExpoModuleConfig';
import {
  RNConfigReactNativePlatformsConfig,
  RNConfigDependencyWeb,
} from './reactNativeConfig.types';

export async function checkDependencyWebAsync(
  resolution: { path: string; version: string },
  reactNativeConfig: RNConfigReactNativePlatformsConfig | null | undefined,
  expoModuleConfig?: ExpoModuleConfig | null
): Promise<RNConfigDependencyWeb | null> {
  if (!reactNativeConfig || expoModuleConfig) {
    // Skip autolinking for this package.
    // Skip autolinking web when we have an expo module config
    return null;
  }

  const hasReactNativeConfig = !!reactNativeConfig && Object.keys(reactNativeConfig).length > 0;
  if (!hasReactNativeConfig) {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(resolution.path, 'package.json'), 'utf8')
    );
    const peerDependencies: Record<string, unknown> =
      packageJson.peerDependencies && typeof packageJson.peerDependencies === 'object'
        ? packageJson.peerDependencies
        : {};
    const codegenConfig: Record<string, unknown> | null =
      packageJson.codegenConfig && typeof packageJson.codegenConfig === 'object'
        ? packageJson.codegenConfig
        : null;
    const hasReactNativePeer = !!peerDependencies['react-native'];
    const hasCodegenConfig = !!codegenConfig && Object.keys(codegenConfig).length > 0;
    // NOTE(@kitten): This is a heuristic for React Native modules that don't have a config file
    // They'll still be considered a native module when they have a peer dependency on react-native
    // and contain a `codegenConfig` entry
    if (!hasReactNativePeer || !hasCodegenConfig) {
      return null;
    }
  }

  return {
    version: resolution.version,
  };
}
