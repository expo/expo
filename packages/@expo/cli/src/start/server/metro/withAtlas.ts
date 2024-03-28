import type { Server as ConnectServer } from 'connect';
import type { ConfigT as MetroConfig } from 'metro-config';

const debug = require('debug')('expo:metro:withAtlas') as typeof console.log;

type AtlasOptions = {
  projectRoot: string;
  middleware: ConnectServer;
  metroConfig: MetroConfig;
};

export function withAtlas({ projectRoot, middleware, metroConfig }: AtlasOptions) {
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
}

function importAtlasFromProject(projectRoot: string): null | typeof import('expo-atlas/cli') {
  try {
    return require(require.resolve('expo-atlas/cli', { paths: [projectRoot] }));
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') return null;
    debug('Failed to load Atlas from project:', error);
    return null;
  }
}
