import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'node:path';

import { REACT_NATIVE_TRANSITIVE_DEPENDENCIES } from './Packages';
import { runAsync } from './Processes';

/**
 * Clone the expo/expo repository and install dependencies.
 */
export async function setupExpoRepoAsync(expoRepoPath: string, nightlyVersion: string) {
  if (!(await fs.pathExists(expoRepoPath))) {
    console.log(`Cloning expo repository to ${expoRepoPath}`);
    console.time('Cloned expo repository');
    await runAsync(
      'git',
      ['clone', '--depth=1', 'https://github.com/expo/expo.git', path.basename(expoRepoPath)],
      {
        cwd: path.dirname(expoRepoPath),
      }
    );
    console.timeEnd('Cloned expo repository');
  } else {
    console.log(`Updating expo repository at ${expoRepoPath}`);
  }

  console.log(`Running \`yarn install\` in ${expoRepoPath}`);
  console.time('Installed dependencies in expo repository');
  await setupDependenciesAsync(expoRepoPath, nightlyVersion);
  await runAsync('yarn', ['install'], { cwd: expoRepoPath });
  console.timeEnd('Installed dependencies in expo repository');
}

/**
 * Pack the expo-template-bare-minimum template into a tarball.
 */
export async function packExpoBareTemplateTarballAsync(
  expoRepoPath: string,
  outputRoot: string
): Promise<string> {
  const { stdout } = await runAsync('npm', ['pack', '--json', '--pack-destination', outputRoot], {
    cwd: path.join(expoRepoPath, 'templates', 'expo-template-bare-minimum'),
  });
  const outputJson = JSON.parse(stdout);
  const tarballName = outputJson[0].filename;
  return path.join(outputRoot, tarballName);
}

async function setupDependenciesAsync(expoRepoPath: string, nightlyVersion: string) {
  const packageJsonPath = path.join(expoRepoPath, 'package.json');
  const packageJson = await JsonFile.readAsync(packageJsonPath);
  const resolutions: Record<string, string> =
    (packageJson.resolutions as Record<string, string>) ?? {};
  for (const name of REACT_NATIVE_TRANSITIVE_DEPENDENCIES) {
    resolutions[name] = `${nightlyVersion}`;
  }
  await JsonFile.mergeAsync(packageJsonPath, { resolutions });
}
