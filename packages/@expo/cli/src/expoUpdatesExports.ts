// NOTE(@kitten): These are currently only used by expo-updates (expo-updates/utols/src/createManifestForBuildAsync)
// They're re-exported via `expo/internal/cli-unstable-expo-updates-exports` to establish a valid dependency chain

import { getMetroServerRoot } from '@expo/config/paths';
import fs from 'node:fs';
import path from 'node:path';

import { createMetroServerAndBundleRequestAsync as internal_createMetroServerAndBundleRequestAsync } from './export/embed/exportEmbedAsync';

// NOTE for Expo Maintainers: Do not add to this file. We want to remove this
export { drawableFileTypes } from './export/metroAssetLocalPath';
export { exportEmbedAssetsAsync } from './export/embed/exportEmbedAsync';

/** Older versions of expo-updates may pass a path relative to the server root. But relative paths are expected to be relative to `projectRoot`, so we turn them into absolute paths */
function fixupServerRelativePath(projectRoot: string, entryFile: string) {
  const serverRoot = getMetroServerRoot(projectRoot);
  if (!path.isAbsolute(entryFile)) {
    let candidate: string;
    if (fs.existsSync((candidate = path.resolve(serverRoot, entryFile)))) {
      entryFile = candidate;
    } else if (
      !entryFile.endsWith('.js') &&
      fs.existsSync((candidate = path.resolve(serverRoot, entryFile + '.js')))
    ) {
      entryFile = candidate;
    }
  }
  return entryFile;
}

export const createMetroServerAndBundleRequestAsync: typeof internal_createMetroServerAndBundleRequestAsync =
  async (projectRoot, options) => {
    return await internal_createMetroServerAndBundleRequestAsync(projectRoot, {
      ...options,
      entryFile: fixupServerRelativePath(projectRoot, options.entryFile),
    });
  };
