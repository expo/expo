import type { ConfigT as MetroConfig } from '@bycedric/metro/metro-config';
import type { Server as ConnectServer } from 'connect';

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

export async function attachAtlasAsync(
  options: AttachAtlasOptions
): Promise<void | ReturnType<typeof import('expo-atlas/cli').createExpoAtlasMiddleware>> {
  if (!env.EXPO_UNSTABLE_ATLAS) {
    return;
  }

  debug('Atlas is enabled, initializing for this project...');
  await new AtlasPrerequisite(options.projectRoot).bootstrapAsync({ exp: options.exp });

  return !options.isExporting
    ? attachAtlasToDevServer(options)
    : await attachAtlasToExport(options);
}

/**
 * Attach Atlas to the Metro bundler for development mode.
 * This includes attaching to Metro's middleware stack to host the Atlas UI.
 */
function attachAtlasToDevServer(
  options: Pick<AttachAtlasOptions, 'projectRoot' | 'middleware' | 'metroConfig'>
): void | ReturnType<typeof import('expo-atlas/cli').createExpoAtlasMiddleware> {
  if (!options.middleware) {
    throw new Error(
      'Expected middleware to be provided for Atlas when running in development mode'
    );
  }

  const atlas = importAtlasForDev(options.projectRoot);
  if (!atlas) {
    return debug('Atlas is not installed in the project, skipping initialization');
  }

  // @ts-expect-error: still using `metro-config` instead of `@expo/metro/metro-config`
  const instance = atlas.createExpoAtlasMiddleware(options.metroConfig);
  options.middleware.use('/_expo/atlas', instance.middleware);
  debug('Attached Atlas middleware for development on: /_expo/atlas');
  return instance;
}

function importAtlasForDev(projectRoot: string): null | typeof import('expo-atlas/cli') {
  try {
    return require(require.resolve('expo-atlas/cli', { paths: [projectRoot] }));
  } catch (error: any) {
    debug('Failed to load Atlas from project:', error);
    return null;
  }
}

/**
 * Attach Atlas to the Metro bundler for exporting mode.
 * This only includes attaching the custom serializer to the Metro config.
 */
async function attachAtlasToExport(
  options: Pick<AttachAtlasOptions, 'projectRoot' | 'metroConfig' | 'resetAtlasFile'>
): Promise<void> {
  const atlas = importAtlasForExport(options.projectRoot);
  if (!atlas) {
    return debug('Atlas is not installed in the project, skipping initialization');
  }

  if (options.resetAtlasFile) {
    const filePath = await atlas.resetExpoAtlasFile(options.projectRoot);
    debug('(Re)created Atlas file at:', filePath);
  }

  // @ts-expect-error: still using `metro-config` instead of `@expo/metro/metro-config`
  atlas.withExpoAtlas(options.metroConfig);
  debug('Attached Atlas to Metro config for exporting');
}

function importAtlasForExport(projectRoot: string): null | typeof import('expo-atlas/metro') {
  try {
    return require(require.resolve('expo-atlas/metro', { paths: [projectRoot] }));
  } catch (error: any) {
    debug('Failed to load Atlas from project:', error);
    return null;
  }
}

/**
 * Wait until the Atlas file has all data written.
 * Note, this is a workaround whenever `process.exit` is required, avoid if possible.
 * @internal
 */
export async function waitUntilAtlasExportIsReadyAsync(projectRoot: string) {
  if (!env.EXPO_UNSTABLE_ATLAS) return;

  const atlas = importAtlasForExport(projectRoot);

  if (!atlas) {
    return debug('Atlas is not loaded, cannot wait for export to finish');
  }
  if (typeof atlas.waitUntilAtlasFileReady !== 'function') {
    return debug('Atlas is outdated, cannot wait for export to finish');
  }

  debug('Waiting for Atlas to finish exporting...');
  await atlas.waitUntilAtlasFileReady();
  debug('Atlas export is ready');
}
