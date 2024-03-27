import type { Server as ConnectServer } from 'connect';
import type { ConfigT as MetroConfig } from 'metro-config';

import { AtlasPrerequisite } from './AtlasPrerequisite';
import { env } from '../../../../utils/env';
import { type EnsureDependenciesOptions } from '../../../doctor/dependencies/ensureDependenciesAsync';

const debug = require('debug')('expo:metro:debugging:attachAtlasMiddleware') as typeof console.log;

type AttachAtlasOptions = Pick<EnsureDependenciesOptions, 'exp'> & {
  projectRoot: string;
  middleware: ConnectServer;
  metroConfig: MetroConfig;
};

export async function attachAtlasMiddlewareAsync({
  exp,
  projectRoot,
  middleware,
  metroConfig,
}: AttachAtlasOptions) {
  if (!env.EXPO_UNSTABLE_ATLAS) {
    return;
  }

  debug('Atlas is enabled, attaching to the dev server...');

  await new AtlasPrerequisite(projectRoot).bootstrapAsync({ exp });
  const atlas = importAtlasFromProject(projectRoot);

  if (!atlas) {
    return debug('Atlas is not installed in the project, skipping initialization');
  }

  if (!(typeof atlas.createExpoAtlasMiddleware === 'function')) {
    return debug('Atlas is outdated - missing cli entrypoint, skipping initialization');
  }

  const instance = atlas.createExpoAtlasMiddleware(metroConfig);
  middleware.use('/_expo/atlas', instance.middleware);
  debug('Attached Atlas middleware on: /_expo/atlas');

  return instance;
}

function importAtlasFromProject(projectRoot: string): null | typeof import('expo-atlas/cli') {
  try {
    return require(require.resolve('expo-atlas/cli', { paths: [projectRoot] }));
  } catch (error: any) {
    debug('Failed to load Atlas from project:', error);
    return null;
  }
}
