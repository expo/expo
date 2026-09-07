// WARN: Internal re-export, don't rely on this to be a public API or use it outside of `expo/expo`'s monorepo
// NOTE for Expo Maintainers: Do not add to this file. We want to remove this

import type { HashedAssetData } from '@expo/metro-config/build/transform-worker/getAssets';
import type Server from 'metro/private/Server';
import type { BundleOptions } from 'metro/private/shared/types';

export const drawableFileTypes: Set<string>;

export function createMetroServerAndBundleRequestAsync(
  projectRoot: string,
  options: {
    maxWorkers?: number;
    config?: string;
    platform: string;
    sourcemapOutput?: string;
    sourcemapUseAbsolutePath: boolean;
    entryFile: string;
    minify?: boolean;
    dev: boolean;
    resetCache: boolean;
    unstableTransformProfile?: string;
  }
): Promise<{ server: Server; bundleRequest: BundleOptions }>;

export function exportEmbedAssetsAsync(
  server: Server,
  bundleRequest: BundleOptions,
  projectRoot: string,
  options: { platform: string }
): Promise<HashedAssetData[]>;
