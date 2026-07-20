import { events } from '2g';
import type { SerializedError } from '2g';
import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
import type { Server as ConnectServer } from 'connect';

import { env } from '../../../../utils/env';
import type { EnsureDependenciesOptions } from '../../../doctor/dependencies/ensureDependenciesAsync';
import { AtlasPrerequisite } from './AtlasPrerequisite';

declare module '2g' {
  interface EventRegistry {
    'atlas:attached': { path: string };
    'atlas:load_failed': { error: SerializedError };
    'atlas:file_reset': { path: string };
    'atlas:export_not_loaded': Record<string, never>;
    'atlas:export_outdated': Record<string, never>;
  }
}

const event = events('atlas');
const debugEvent = events.debug('atlas');

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
  if (!env.EXPO_ATLAS) {
    return;
  }

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
    return;
  }

  // TODO(@kitten): Atlas' typings don't match @expo/metro yet
  const instance = atlas.createExpoAtlasMiddleware(options.metroConfig as any);
  options.middleware.use('/_expo/atlas', instance.middleware);
  event('attached', { path: '/_expo/atlas' });
  return instance;
}

function importAtlasForDev(projectRoot: string): null | typeof import('expo-atlas/cli') {
  try {
    return require(require.resolve('expo-atlas/cli', { paths: [projectRoot] }));
  } catch (error: any) {
    debugEvent('load_failed', { error: debugEvent.error(error as Error) });
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
    return;
  }

  if (options.resetAtlasFile) {
    const filePath = await atlas.resetExpoAtlasFile(options.projectRoot);
    debugEvent('file_reset', { path: debugEvent.path(filePath) });
  }

  // TODO(@kitten): Atlas' typings don't match @expo/metro yet
  atlas.withExpoAtlas(options.metroConfig as any);
}

function importAtlasForExport(projectRoot: string): null | typeof import('expo-atlas/metro') {
  try {
    return require(require.resolve('expo-atlas/metro', { paths: [projectRoot] }));
  } catch (error: any) {
    debugEvent('load_failed', { error: debugEvent.error(error as Error) });
    return null;
  }
}

/**
 * Wait until the Atlas file has all data written.
 * Note, this is a workaround whenever `process.exit` is required, avoid if possible.
 * @internal
 */
export async function waitUntilAtlasExportIsReadyAsync(projectRoot: string) {
  if (!env.EXPO_ATLAS) return;

  const atlas = importAtlasForExport(projectRoot);

  if (!atlas) {
    debugEvent('export_not_loaded', {});
    return;
  }
  if (typeof atlas.waitUntilAtlasFileReady !== 'function') {
    debugEvent('export_outdated', {});
    return;
  }

  await atlas.waitUntilAtlasFileReady();
}
