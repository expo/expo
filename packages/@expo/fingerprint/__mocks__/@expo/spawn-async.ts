import spawnAsync from '@expo/spawn-async';
import { getConfig } from 'expo/config';
import path from 'path';

type SpawnAsyncType = typeof spawnAsync;

const origSpawnAsync = jest.requireActual('@expo/spawn-async') as SpawnAsyncType;
const mockSpawnAsync = jest
  .fn()
  .mockImplementation(
    async (
      command: Parameters<SpawnAsyncType>[0],
      args: Parameters<SpawnAsyncType>[1],
      options: Parameters<SpawnAsyncType>[2]
    ) => {
      if (args != null && args.length >= 2 && path.parse(args[0]).name === 'ExpoConfigLoader') {
        // For unit tests, we don't really spawn a process to execute the ExpoConfigLoader because the file system is just a memfs.
        // Rather than that, we just call `getConfig` directly.
        const projectRoot = args[1];
        const config = await getConfig(projectRoot, { skipSDKVersionRequirement: true });
        const stdout = JSON.stringify({ config, loadedModules: [] });
        return {
          stdout,
        };
      }
      return origSpawnAsync(command, args, options);
    }
  ) as SpawnAsyncType;

module.exports = mockSpawnAsync;
