import execa from 'execa';
import { boolish } from 'getenv';
import fs from 'node:fs';
import path from 'node:path';

import { toPosixPath } from '../../src/utils/filePath';

export const EXPO_MONOREPO_ROOT = path.resolve(__dirname, '../../../../..');

/**
 * Create a tarball from a package within the Expo monorepo.
 * This creates the tarball from source, and moves it within the fixture directory using `_tarball`.
 * It can be used to test any of our packages directly from source, without publishing or leaking other dependencies.
 */
export async function createPackageTarball(fixtureRoot: string, packagePath: string) {
  // Resolve the package directory in the monorepo
  const packageDir = path.join(EXPO_MONOREPO_ROOT, packagePath);
  if (!fs.existsSync(packageDir)) {
    throw new Error(`Cannot find package "${packagePath}" in the Expo monorepo`);
  }

  // Prepare the destination of the tarball within the fixture
  const outputDir = path.join(fixtureRoot, '_tarballs');
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Create the tarball with npm pack
  const { stdout } = await execa(
    'npm',
    // Run `npm pack --json` without the script logging (see: https://github.com/npm/cli/issues/7354)
    ['--foreground-scripts=false', 'pack', '--json', '--pack-destination', outputDir],
    { cwd: packageDir, stdio: boolish('CI', false) ? 'pipe' : undefined }
  );

  // Validate the tarball output
  const output = JSON.parse(stdout);
  if (output.length !== 1) {
    throw new Error(`Expected a single tarball to be created, received: ${output.length}`);
  }

  // Return the tarball information
  const absolutePath = path.join(outputDir, output[0].filename);
  const relativePath = path.relative(fixtureRoot, absolutePath);

  return {
    name: output[0].name as string,
    version: output[0].version as string,
    relativePath,
    absolutePath,
    packageReference: `file:./${toPosixPath(relativePath)}`,
  };
}
