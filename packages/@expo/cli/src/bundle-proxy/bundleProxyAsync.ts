import { Terminal } from 'metro-core';

import { MetroTerminalReporter } from '../start/server/metro/MetroTerminalReporter';
import {
  importCliBuildBundleWithConfigFromProject,
  importExpoMetroConfigFromProject,
} from '../start/server/metro/resolveFromProject';
import { Options } from './resolveOptions';

async function loadExpoMetroConfigAsync(
  projectRoot: string,
  options: Pick<Options, 'maxWorkers' | 'resetCache' | 'config'>
) {
  const terminal = new Terminal(process.stdout);
  const terminalReporter = new MetroTerminalReporter(projectRoot, terminal);

  const reporter = {
    update(event: any) {
      terminalReporter.update(event);
    },
  };

  const ExpoMetroConfig = importExpoMetroConfigFromProject(projectRoot);

  // Load the Metro config using `@expo/metro-config` as a default.
  return await ExpoMetroConfig.loadAsync(projectRoot, {
    reporter,
    maxWorkers: options.maxWorkers,
    resetCache: options.resetCache,
    config: options.config,
  });
}

export async function bundleProxyAsync(projectRoot: string, options: Options) {
  const metroConfig = await loadExpoMetroConfigAsync(projectRoot, options);

  const buildBundleWithConfig = importCliBuildBundleWithConfigFromProject(projectRoot);

  await buildBundleWithConfig(
    options,
    // @ts-expect-error: MetroConfig type mismatch.
    metroConfig
  );
}
