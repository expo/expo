import { events } from '2g';
import { getConfig } from '@expo/config';
import type Server from '@expo/metro/metro/Server';
import fs from 'fs/promises';
import path from 'path';

import { upsertGitIgnoreContents } from '../../../utils/mergeGitIgnorePaths';
import { ensureDotExpoProjectDirectoryInitialized } from '../../project/dotExpo';
import type { ServerLike } from '../BundlerDevServer';
import { getRouterDirectoryModuleIdWithManifest } from '../metro/router';
import { debugEvent } from '../metro/typegenEvents';
import { removeExpoEnvDTS, writeExpoEnvDTS } from './expo-env';
import { setupTypedRoutes } from './routes';
import { forceRemovalTSConfig, forceUpdateTSConfig } from './tsconfig';

export interface TypeScriptTypeGenerationOptions {
  server?: ServerLike;
  metro?: Server | null;
  projectRoot: string;
}

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
    debugEvent('removing_side_effects', {});
    await Promise.all([forceRemovalTSConfig(projectRoot), removeExpoEnvDTS(projectRoot)]);
  } else {
    const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
    const typesDirectory = path.resolve(dotExpoDir, './types');
    debugEvent('ensuring_side_effects', { typesDirectory: debugEvent.path(typesDirectory) });

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
