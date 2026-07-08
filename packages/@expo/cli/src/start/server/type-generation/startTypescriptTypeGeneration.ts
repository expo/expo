import { events } from '2g';
import { getConfig } from '@expo/config';
import type Server from '@expo/metro/metro/Server';
import fs from 'fs/promises';
import path from 'path';

import { upsertGitIgnoreContents } from '../../../utils/mergeGitIgnorePaths';
import { ensureDotExpoProjectDirectoryInitialized } from '../../project/dotExpo';
import type { ServerLike } from '../BundlerDevServer';
import { getRouterDirectoryModuleIdWithManifest } from '../metro/router';
import { removeExpoEnvDTS, writeExpoEnvDTS } from './expo-env';
import { setupTypedRoutes } from './routes';
import { forceRemovalTSConfig, forceUpdateTSConfig } from './tsconfig';

export interface TypeScriptTypeGenerationOptions {
  server?: ServerLike;
  metro?: Server | null;
  projectRoot: string;
}

const debug = require('debug')('expo:typed-routes') as typeof console.log;

declare module '2g' {
  interface EventRegistry {
    'typegen:done': { enabled: boolean };
  }
}

const event = events('typegen');

/** Setup all requisite features for statically typed routes in Expo Router v2 / SDK +49. */
export async function startTypescriptTypeGenerationAsync({
  metro,
  projectRoot,
  server,
}: TypeScriptTypeGenerationOptions) {
  const done = event.span();
  const { exp } = getConfig(projectRoot);
  const enabled = !!exp.experiments?.typedRoutes;

  // If typed routes are disabled, remove any files that were added.
  if (!exp.experiments?.typedRoutes) {
    debug('Removing typed routes side-effects (experiments.typedRoutes: false)');
    await Promise.all([forceRemovalTSConfig(projectRoot), removeExpoEnvDTS(projectRoot)]);
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
        plugin: exp?.extra?.router,
      }),
    ]);
  }

  done('done', { enabled });
}
