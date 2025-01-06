import { type SpawnOptions } from '@expo/spawn-async';
import { getConfig } from 'expo/config';
import path from 'node:path';

const origModule = jest.requireActual('../SpawnIPC');
const origSpawnWithIpcAsync = origModule.spawnWithIpcAsync;

export const spawnWithIpcAsync = jest
  .fn()
  .mockImplementation(async (command: string, args?: string[], options?: SpawnOptions) => {
    if (args != null && args.length >= 2 && path.parse(args[0]).name === 'ExpoConfigLoader') {
      // For unit tests, we don't really spawn a process to execute the ExpoConfigLoader because the file system is just a memfs.
      // Rather than that, we just call `getConfig` directly.
      const projectRoot = args[1];
      const config = await getConfig(projectRoot, { skipSDKVersionRequirement: true });
      const message = JSON.stringify({ config, loadedModules: [] });
      return {
        message,
      };
    }
    return origSpawnWithIpcAsync(command, args, options);
  });
