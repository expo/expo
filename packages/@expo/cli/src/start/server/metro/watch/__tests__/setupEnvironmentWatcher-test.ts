import type { ConfigT } from '@expo/metro/metro-config';
import type MetroServer from '@expo/metro/metro/Server';
import type { Server } from 'node:http';

import { reloadEnvFiles } from '../../../../../utils/nodeEnv';
import { injectMetroFileMapWatcher } from '../injectMetroFileMapWatcher';
import { setupEnvironmentWatcher } from '../setupEnvironmentWatcher';

jest.mock('../injectMetroFileMapWatcher');
jest.mock('../../../../../utils/nodeEnv', () => ({ reloadEnvFiles: jest.fn() }));

test.each([
  { watch: true, reloadEnvironment: true },
  { watch: true, reloadEnvironment: false },
  { watch: false, reloadEnvironment: true },
])('discovers dotenv files with watch=$watch and reload=$reloadEnvironment', (options) => {
  const runner = { metro: {} as MetroServer, server: {} as Server };
  const config = { projectRoot: '/workspace' } as ConfigT;
  const watcher = { ready: Promise.resolve(), onChange: jest.fn(), dispose: jest.fn() };
  jest.mocked(injectMetroFileMapWatcher).mockReturnValueOnce(watcher);

  setupEnvironmentWatcher(runner, config, {
    projectRoot: '/workspace/app',
    mode: 'production',
    ...options,
  });

  expect(injectMetroFileMapWatcher).toHaveBeenCalledWith(runner, config, {
    files: [
      '/workspace/app/.env.production.local',
      '/workspace/app/.env.local',
      '/workspace/app/.env.production',
      '/workspace/app/.env',
    ],
    watch: options.watch,
  });

  if (options.watch && options.reloadEnvironment) {
    expect(watcher.onChange).toHaveBeenCalledTimes(1);
    watcher.onChange.mock.calls[0]![0]();
    expect(reloadEnvFiles).toHaveBeenCalledWith('/workspace/app', 'production');
  } else {
    expect(watcher.onChange).not.toHaveBeenCalled();
    expect(reloadEnvFiles).not.toHaveBeenCalled();
  }
});
