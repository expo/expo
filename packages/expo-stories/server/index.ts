import { ServerConfig } from '../types';
import { createFileWatcher } from './createFileWatcher';
import { createHttpServer } from './createHttpServer';
import { mergeConfigs } from './shared';
import { writeRequiredFiles } from './writeRequiredFiles';

function startServer(serverConfig: ServerConfig) {
  const mergedConfigs = mergeConfigs(serverConfig);

  writeRequiredFiles(mergedConfigs);

  const server = createHttpServer(mergedConfigs);
  const watcher = createFileWatcher(mergedConfigs, server);

  [`SIGINT`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, () => {
      watcher.cleanup();
      server.cleanup();
      process.exit(1);
    });
  });
}

export { startServer };
