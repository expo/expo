import spawnAsync from '@expo/spawn-async';
import { glob } from 'glob';
import path from 'node:path';

/**
 * Create a tarball from `expo-brownfield` package
 */
export const createPackageTarball = async (packDestination: string): Promise<string> => {
  const brownfieldPackagePath = path.join(__dirname, '../..');
  await spawnAsync('npm', ['pack', '--pack-destination', packDestination], {
    cwd: brownfieldPackagePath,
    stdio: 'pipe',
  });

  const tarballs = await glob('*.tgz', { cwd: packDestination });
  if (tarballs.length !== 1) {
    throw new Error(`Expected a single tarball to be created, received: ${tarballs.length}`);
  }

  return tarballs[0];
};
