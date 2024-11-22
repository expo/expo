import fs from 'fs-extra';
import { createRequire } from 'node:module';
import path from 'node:path';

import { REACT_NATIVE_TRANSITIVE_DEPENDENCIES } from './Packages.js';
import { runAsync } from './Processes.js';

const require = createRequire(import.meta.url);
const { default: JsonFile } = require('@expo/json-file') as typeof import('@expo/json-file');

/**
 * Clone the expo/expo repository and install dependencies.
 */
export async function setupExpoRepoAsync(
  projectRoot: string,
  useExpoRepoPath: string | undefined,
  nightlyVersion: string
): Promise<string> {
  let expoRepoPath: string;
  const useExistingRepo = useExpoRepoPath && (await fs.pathExists(useExpoRepoPath));
  if (!useExistingRepo) {
    expoRepoPath = path.join(projectRoot, 'expo');
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
    expoRepoPath = useExpoRepoPath;
  }

  console.log(`Running \`yarn install\` in ${expoRepoPath}`);
  console.time('Installed dependencies in expo repository');
  await setupDependenciesAsync(expoRepoPath, nightlyVersion);
  await runAsync('yarn', ['install'], { cwd: expoRepoPath });
  console.timeEnd('Installed dependencies in expo repository');

  return expoRepoPath;
}

/**
 * Pack the expo-template-bare-minimum template into a tarball.
 */
export async function packExpoBareTemplateTarballAsync(
  expoRepoPath: string,
  outputRoot: string
): Promise<string> {
  await fs.ensureDir(outputRoot);
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
