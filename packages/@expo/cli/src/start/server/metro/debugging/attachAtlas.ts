import type { Server as ConnectServer } from 'connect';
import type { ConfigT as MetroConfig } from 'metro-config';

import { AtlasPrerequisite } from './AtlasPrerequisite';
import { env } from '../../../../utils/env';
import { type EnsureDependenciesOptions } from '../../../doctor/dependencies/ensureDependenciesAsync';

const debug = require('debug')('expo:metro:debugging:attachAtlas') as typeof console.log;

type AttachAtlasOptions = Pick<EnsureDependenciesOptions, 'exp'> & {
  isExporting: boolean;
  projectRoot: string;
  middleware?: ConnectServer;
  metroConfig: MetroConfig;
  resetAtlasFile?: boolean;
};

export async function attachAtlasAsync({
  exp,
  isExporting,
  projectRoot,
  middleware,
  metroConfig,
  resetAtlasFile,
}: AttachAtlasOptions): Promise<void | ReturnType<
  typeof import('expo-atlas/cli').createExpoAtlasMiddleware
>> {
  if (!env.EXPO_UNSTABLE_ATLAS) {
    return;
  }

  debug('Atlas is enabled, initializing for this project...');

  await new AtlasPrerequisite(projectRoot).bootstrapAsync({ exp });

  // Expo CLI instantiates multiple Metro instances when exporting static web.
  // Fully resetting this atlas file is therefore an opt-in.
  if (isExporting && resetAtlasFile) {
    const atlas = importAtlas(projectRoot);
    if (!atlas) return debug('Atlas is not installed in the project, skipping initialization');

    const atlasPath = atlas.getAtlasPath(projectRoot);
    await atlas?.createAtlasFile(atlasPath);
    debug('(Re)created Atlas file at:', atlasPath);
  }

  // Exporting only sets up Metro, without attaching middleware
  if (isExporting) {
    const atlas = importAtlasForExport(projectRoot);
    if (!atlas) return debug('Atlas is not installed in the project, skipping initialization');

    atlas.withExpoAtlas(metroConfig);
    debug('Attached Atlas to Metro config for exporting');
    return;
  }

  // Running in development mode requires middleware to be attached
  if (!isExporting && !middleware) {
    throw new Error(
      'Expected middleware to be provided for Atlas when running in development mode'
    );
  } else if (!isExporting && middleware) {
    const atlas = importAtlasForDev(projectRoot);
    if (!atlas) return debug('Atlas is not installed in the project, skipping initialization');

    const instance = atlas.createExpoAtlasMiddleware(metroConfig);
    middleware.use('/_expo/atlas', instance.middleware);
    debug('Attached Atlas middleware for development on: /_expo/atlas');
    return instance;
  }
}

function importAtlas(projectRoot: string): null | typeof import('expo-atlas') {
  try {
    return require(require.resolve('expo-atlas', { paths: [projectRoot] }));
  } catch (error: any) {
    debug('Failed to load Atlas from project:', error);
    return null;
  }
}

function importAtlasForDev(projectRoot: string): null | typeof import('expo-atlas/cli') {
  try {
    return require(require.resolve('expo-atlas/cli', { paths: [projectRoot] }));
  } catch (error: any) {
    debug('Failed to load Atlas from project:', error);
    return null;
  }
}

function importAtlasForExport(projectRoot: string): null | typeof import('expo-atlas/metro') {
  try {
    return require(require.resolve('expo-atlas/metro', { paths: [projectRoot] }));
  } catch (error: any) {
    debug('Failed to load Atlas from project:', error);
    return null;
  }
}
