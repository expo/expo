import type { ConfigT as MetroConfig } from 'metro-config';

import { AtlasPrerequisite } from './AtlasPrerequisite';
import { env } from '../../../../utils/env';
import { type EnsureDependenciesOptions } from '../../../doctor/dependencies/ensureDependenciesAsync';

const debug = require('debug')('expo:metro:debugging:attachAtlasMetroConfig') as typeof console.log;

type AttachAtlasOptions = Pick<EnsureDependenciesOptions, 'exp'> & {
  projectRoot: string;
  metroConfig: MetroConfig;
};

export async function attachAtlasMetroConfigAsync({
  exp,
  projectRoot,
  metroConfig,
}: AttachAtlasOptions): Promise<MetroConfig> {
  if (!env.EXPO_UNSTABLE_ATLAS) {
    return metroConfig;
  }

  await new AtlasPrerequisite(projectRoot).bootstrapAsync({ exp });
  const atlas = importAtlasFromProject(projectRoot);

  if (!atlas) {
    debug('Atlas is not installed in the project, skipping initialization');
    return metroConfig;
  }

  if (!(typeof atlas.withExpoAtlas === 'function')) {
    debug('Atlas is outdated - missing metro entrypoint, skipping initialization');
    return metroConfig;
  }

  return atlas.withExpoAtlas(metroConfig) as MetroConfig;
}

function importAtlasFromProject(projectRoot: string): null | typeof import('expo-atlas/metro') {
  try {
    return require(require.resolve('expo-atlas/metro', { paths: [projectRoot] }));
  } catch (error: any) {
    debug('Failed to load Atlas from project:', error);
    return null;
  }
}
