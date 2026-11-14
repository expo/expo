// This file creates the implicit asset resolver
// The implicit asset resolver should be the last resolver in the chain. When a relative or
// absolute import with an extension that isn't in `resolver.sourceExts` or `resolver.assetExts`
// fails to resolve, it looks the file up on disk and, if it exists, resolves it as an asset.
// This means `resolver.assetExts` doesn't have to list every asset type, similar to how
// webpack treats any file it can find as a file that can be imported.

import type { ConfigT } from '@expo/metro/metro-config';
import type { Resolution } from '@expo/metro/metro-resolver';
import fs from 'fs';
import path from 'path';

import { isPathInside } from '../../../utils/dir';
import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';
import type { StrictResolverFactory } from './withMetroMultiPlatform';
import type { ExpoCustomMetroResolver } from './withMetroResolvers';

/** The subset of the Metro file map (`TreeFS`) used to register files found on disk */
export interface ImplicitAssetFileSystem {
  exists(filePath: string): boolean;
  addOrModify(filePath: string, metadata: [number | null, number, 0, null, 0, null]): void;
}

const isPathSpecifier = (moduleName: string) =>
  moduleName.startsWith('./') ||
  moduleName.startsWith('../') ||
  moduleName === '.' ||
  moduleName === '..' ||
  path.isAbsolute(moduleName);

export function createImplicitAssetResolver({
  config,
  roots,
  getStrictResolver,
  getFileSystem,
}: {
  config: Pick<ConfigT, 'resolver'>;
  roots: string[];
  getStrictResolver: StrictResolverFactory;
  getFileSystem: () => ImplicitAssetFileSystem;
}): ExpoCustomMetroResolver {
  return function requestImplicitAsset(context, moduleName, platform): Resolution | null {
    const ext = path.extname(moduleName).slice(1);
    if (
      !ext ||
      !isPathSpecifier(moduleName) ||
      context.sourceExts.includes(ext) ||
      context.assetExts.has(ext)
    ) {
      return null;
    }

    // Prefer the standard resolution, e.g. `./Button.web` may resolve to `./Button.web.tsx`
    try {
      return getStrictResolver(context, platform)(moduleName);
    } catch (error: any) {
      if (!isFailedToResolveNameError(error) && !isFailedToResolvePathError(error)) {
        throw error;
      }
    }

    const filePath = path.resolve(path.dirname(context.originModulePath), moduleName);
    if (!roots.some((root) => filePath === root || isPathInside(filePath, root))) {
      return null;
    }
    const stat = fs.statSync(filePath, { throwIfNoEntry: false });
    if (!stat?.isFile()) {
      return null;
    }

    // The file map only crawls known extensions, so add the file to it on demand.
    // This allows Metro to hash the file for transforming and to serve it from the dev server.
    const fileSystem = getFileSystem();
    if (!fileSystem.exists(filePath)) {
      fileSystem.addOrModify(filePath, [stat.mtime.getTime(), stat.size, 0, null, 0, null]);
    }

    // The dev server's asset endpoint rejects extensions that aren't in `assetExts`.
    // NOTE: This list is only read by the dev server. Adding to it doesn't change how
    // Metro resolves other imports, which is why this resolver runs after resolution fails.
    const assetExts = config.resolver.assetExts;
    if (!assetExts.includes(ext)) {
      (assetExts as string[]).push(ext);
    }

    return { type: 'assetFiles', filePaths: [filePath] };
  };
}
