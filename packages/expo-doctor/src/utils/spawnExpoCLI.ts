import { getOriginalEnv } from '@expo/env';
import spawnAsync from '@expo/spawn-async';
import resolveFrom from 'resolve-from';

export async function spawnExpoCLI(
  projectRoot: string,
  args: string[],
  options: Omit<spawnAsync.SpawnOptions, 'cwd'>
) {
  // Spawn a child `node`/`npx` with the pre-dotenv env. expo-doctor itself
  // loads `.env` files via @expo/env, so without this the child would inherit
  // any project-controlled overrides the parent loaded.
  const spawnOptions: spawnAsync.SpawnOptions = {
    cwd: projectRoot,
    env: getOriginalEnv(),
    ...options,
  };
  const expoCliPath = resolveFrom.silent(projectRoot, 'expo/bin/cli');
  if (expoCliPath) {
    return await spawnAsync('node', [expoCliPath, ...args], spawnOptions);
  } else {
    return await spawnAsync('npx', ['expo', ...args], spawnOptions);
  }
}
