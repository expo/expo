import { getEnvFiles } from '@expo/env';
import type { ConfigT } from '@expo/metro/metro-config';
import type MetroServer from '@expo/metro/metro/Server';
import type { Server } from 'node:http';
import path from 'node:path';

import { type EnvironmentMode, reloadEnvFiles } from '../../../../utils/nodeEnv';
import { debugEvent } from '../metroDebugEvents';
import { injectMetroFileMapWatcher } from './injectMetroFileMapWatcher';

export function setupEnvironmentWatcher(
  runner: { metro: MetroServer; server: Server },
  config: ConfigT,
  {
    projectRoot,
    mode,
    watch,
    reloadEnvironment,
  }: {
    projectRoot: string;
    mode: EnvironmentMode;
    watch: boolean;
    reloadEnvironment?: boolean;
  }
): void {
  const watcher = injectMetroFileMapWatcher(runner, config, {
    files: getEnvFiles({ mode, silent: true }).map((name) => path.join(projectRoot, name)),
    watch,
  });

  if (watch && reloadEnvironment) {
    watcher.onChange(() => {
      debugEvent('env_reload', {});
      reloadEnvFiles(projectRoot, mode);
    });
  }
}
