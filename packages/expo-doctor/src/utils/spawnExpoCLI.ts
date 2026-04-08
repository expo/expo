import spawnAsync from '@expo/spawn-async';
import resolveFrom from 'resolve-from';

export async function spawnExpoCLI(
  projectRoot: string,
  args: string[],
  options: Omit<spawnAsync.SpawnOptions, 'cwd'>
) {
  const expoCliPath = resolveFrom.silent(projectRoot, 'expo/bin/cli');
  if (expoCliPath) {
    return await spawnAsync('node', [expoCliPath, ...args], {
      cwd: projectRoot,
      ...options,
    });
  } else {
    return await spawnAsync('npx', ['expo', ...args], {
      cwd: projectRoot,
      ...options,
    });
  }
}
