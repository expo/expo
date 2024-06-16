import { getConfig } from '@expo/config';
import fs from 'fs/promises';
import { Server } from 'metro';
import path from 'path';

import { removeExpoEnvDTS, writeExpoEnvDTS } from './expo-env';
import { setupTypedRoutes } from './routes';
import { forceRemovalTSConfig, forceUpdateTSConfig } from './tsconfig';
import { removeFromGitIgnore, upsertGitIgnoreContents } from '../../../utils/mergeGitIgnorePaths';
import { ensureDotExpoProjectDirectoryInitialized } from '../../project/dotExpo';
import { ServerLike } from '../BundlerDevServer';
import { getRouterDirectoryModuleIdWithManifest } from '../metro/router';

export interface TypeScriptTypeGenerationOptions {
  server?: ServerLike;
  metro?: Server | null;
  projectRoot: string;
}

const debug = require('debug')('expo:typed-routes') as typeof console.log;

/** Setup all requisite features for statically typed routes in Expo Router v2 / SDK +49. */
export async function startTypescriptTypeGenerationAsync({
  metro,
  projectRoot,
  server,
}: TypeScriptTypeGenerationOptions) {
  const { exp } = getConfig(projectRoot);

  // If typed routes are disabled, remove any files that were added.
  if (!exp.experiments?.typedRoutes) {
    debug('Removing typed routes side-effects (experiments.typedRoutes: false)');
    const gitIgnorePath = path.join(projectRoot, '.gitignore');
    await Promise.all([
      forceRemovalTSConfig(projectRoot),
      removeExpoEnvDTS(projectRoot),
      removeFromGitIgnore(gitIgnorePath, 'expo-env.d.ts'),
    ]);
  } else {
    const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
    const typesDirectory = path.resolve(dotExpoDir, './types');
    debug(
      'Ensuring typed routes side-effects are setup (experiments.typedRoutes: true, typesDirectory: %s)',
      typesDirectory
    );

    // Ensure the types directory exists.
    await fs.mkdir(typesDirectory, { recursive: true });

    await Promise.all([
      upsertGitIgnoreContents(path.join(projectRoot, '.gitignore'), 'expo-env.d.ts'),
      writeExpoEnvDTS(projectRoot),
      forceUpdateTSConfig(projectRoot),
      setupTypedRoutes({
        metro,
        server,
        typesDirectory,
        projectRoot,
        routerDirectory: path.join(
          projectRoot,
          getRouterDirectoryModuleIdWithManifest(projectRoot, exp)
        ),
      }),
    ]);
  }
}
