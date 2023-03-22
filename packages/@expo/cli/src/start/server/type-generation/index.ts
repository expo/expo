import fs from 'fs/promises';
import { Server } from 'metro';
import path from 'path';

import { env } from '../../../utils/env';
import { ensureDotExpoProjectDirectoryInitialized } from '../../project/dotExpo';
import { ServerLike } from '../BundlerDevServer';
import { setupTypedRoutes } from './routes';
import { forceUpdateTSConfig } from './tsconfig';

export interface TypeScriptTypeGenerationOptions {
  server: ServerLike;
  metro: Server | null;
  projectRoot: string;
}

export async function typescriptTypeGeneration({
  metro,
  projectRoot,
  server,
}: TypeScriptTypeGenerationOptions) {
  if (!env.EXPO_USE_TYPED_ROUTES) {
    return;
  }

  if (!metro) {
    return;
  }

  const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
  const typesDirectory = path.resolve(dotExpoDir, './types');

  // Ensure the types directory exists.
  await fs.mkdir(typesDirectory, { recursive: true });

  await forceUpdateTSConfig(projectRoot);
  await setupTypedRoutes({ metro, server, typesDirectory });
}
