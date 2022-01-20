import { ExpoConfig, getConfig, ProjectTarget } from '@expo/config';
import {
  MessageSocket,
  MetroDevServerOptions,
  prependMiddleware,
  runMetroDevServerAsync,
} from '@expo/dev-server';
import http from 'http';

import { getFreePortAsync } from '../../utils/port';
import * as ProjectSettings from '../api/ProjectSettings';
import { getLogger } from '../logger';
import * as ExpoUpdatesManifestHandler from './ExpoUpdatesManifestHandler';
import * as LoadingPageHandler from './LoadingPageHandler';
import * as ManifestHandler from './ManifestHandler';

export type StartOptions = {
  metroPort?: number;
  webpackPort?: number;
  isWebSocketsEnabled?: boolean;
  devClient?: boolean;
  reset?: boolean;
  nonInteractive?: boolean;
  nonPersistent?: boolean;
  maxWorkers?: number;
  webOnly?: boolean;
  target?: ProjectTarget;
  platforms?: ExpoConfig['platforms'];
  forceManifestType?: 'expo-updates' | 'classic';
};

async function resolvePortAsync(
  startOptions: Pick<StartOptions, 'metroPort' | 'devClient'>
): Promise<number> {
  if (startOptions.metroPort != null) {
    // If the manually defined port is busy then an error should be thrown
    return startOptions.metroPort;
  } else {
    return startOptions.devClient
      ? Number(process.env.RCT_METRO_PORT) || 8081
      : await getFreePortAsync(startOptions.metroPort || 19000);
  }
}

export async function startDevServerAsync(
  projectRoot: string,
  startOptions: Pick<
    StartOptions,
    'metroPort' | 'devClient' | 'reset' | 'maxWorkers' | 'forceManifestType'
  >
): Promise<[http.Server, any, MessageSocket]> {
  const port = await resolvePortAsync(startOptions);

  await ProjectSettings.setPackagerInfoAsync(projectRoot, {
    packagerPort: port,
  });

  // TODO: reduce getConfig calls
  const projectConfig = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  const options: MetroDevServerOptions = {
    port,
    logger: getLogger(projectRoot),
    maxWorkers: startOptions.maxWorkers,
    resetCache: startOptions.reset,
    // Use the unversioned metro config.
    unversioned: !projectConfig.exp.sdkVersion || projectConfig.exp.sdkVersion === 'UNVERSIONED',
  };

  const { server, middleware, messageSocket } = await runMetroDevServerAsync(projectRoot, options);

  const useExpoUpdatesManifest = startOptions.forceManifestType === 'expo-updates';

  const manifestMiddleware = useExpoUpdatesManifest
    ? ExpoUpdatesManifestHandler.getManifestHandler(projectRoot)
    : ManifestHandler.getManifestHandler(projectRoot);
  // We need the manifest handler to be the first middleware to run so our
  // routes take precedence over static files. For example, the manifest is
  // served from '/' and if the user has an index.html file in their project
  // then the manifest handler will never run, the static middleware will run
  // and serve index.html instead of the manifest.
  // https://github.com/expo/expo/issues/13114
  prependMiddleware(middleware, manifestMiddleware);

  middleware.use(LoadingPageHandler.getLoadingPageHandler(projectRoot));

  return [server, middleware, messageSocket];
}
