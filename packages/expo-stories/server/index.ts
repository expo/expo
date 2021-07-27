import { IServerConfig } from '../types';
import { createFileWatcher } from './createFileWatcher';
import { createHttpServer } from './createHttpServer';
import { mergeConfigs } from './shared';
import { writeRequiredFiles } from './writeRequiredFiles';

function startServer(serverConfig: IServerConfig) {
  const mergedConfigs = mergeConfigs(serverConfig);

  writeRequiredFiles(mergedConfigs);

  const server = createHttpServer(mergedConfigs);
  const watcher = createFileWatcher(mergedConfigs, server);

  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, () => {
      watcher.cleanup();
      server.cleanup();
    });
  });
}

export { startServer };
