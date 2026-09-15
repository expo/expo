import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'node:path';
import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import { runTurboTasksAsync } from '../Turbo';
import { getReleaseTagAsync, packChangesetsAsync, runChangesetsAsync } from './Changesets';
import {
  refreshPnpmLockfileAsync,
  updateVersionDerivedFilesAsync,
  type VersionDerivedPackage,
} from './Versioning';

type CanaryOptions = { branchName: string; dryRun: boolean };
type Manifest = { name: string; version: string; private?: boolean; path: string };

export async function runCanaryAsync(options: CanaryOptions): Promise<void> {
  const manifests = await readPublicManifestsAsync(EXPO_DIR);
  const expoVersion = manifests.find((manifest) => manifest.name === 'expo')?.version;
  if (!expoVersion) throw new Error('Unable to determine the Expo SDK version for canaries.');
  const sdkMajor = semver.major(expoVersion);
  await normalizeCanaryVersionsAsync(manifests, sdkMajor, options.branchName);

  // Snapshot versioning only includes packages represented in its release plan. Add every public
  // package because Expo canaries intentionally publish a complete, internally consistent set.
  const releaseIntent = manifests
    .map((manifest) => {
      const bump = getCanaryBumpType(manifest.version, sdkMajor, options.branchName);
      return `"${manifest.name}": ${bump}`;
    })
    .join('\n');
  await fs.writeFile(
    path.join(EXPO_DIR, '.changeset/expo-canary.md'),
    `---\n${releaseIntent}\n---\n\n[Internal] Publish an Expo canary snapshot.\n`
  );

  await runChangesetsAsync(['version', '--snapshot', 'canary']);
  const versionedPackages: VersionDerivedPackage[] = (await readPublicManifestsAsync(EXPO_DIR)).map(
    (manifest) => ({
      name: manifest.name,
      path: manifest.path,
      after: manifest.version,
    })
  );
  await updateVersionDerivedFilesAsync(versionedPackages, true);
  await refreshPnpmLockfileAsync();
  await runTurboTasksAsync(['build']);
  await runTurboTasksAsync(['precompile-ios', 'precompile-android']);

  if (options.dryRun) {
    await packChangesetsAsync('expo-canary-pack-');
  } else {
    const tag = await getReleaseTagAsync(options.branchName, 'canary');
    await runChangesetsAsync(['publish', '--tag', tag, '--no-git-tag']);
  }
}

export function getCanaryBumpType(
  packageVersion: string,
  sdkMajor: number,
  branchName: string
): 'major' | 'patch' {
  return branchName === 'main' && semver.major(packageVersion) === sdkMajor ? 'major' : 'patch';
}

export async function normalizeCanaryVersionsAsync(
  manifests: Manifest[],
  sdkMajor: number,
  branchName: string
): Promise<void> {
  if (branchName !== 'main') return;
  for (const manifest of manifests) {
    if (semver.major(manifest.version) !== sdkMajor || !semver.prerelease(manifest.version)) {
      continue;
    }
    const parsed = semver.parse(manifest.version)!;
    const packageJsonPath = path.join(manifest.path, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.version = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    manifest.version = packageJson.version;
  }
}

async function readPublicManifestsAsync(root: string): Promise<Manifest[]> {
  const manifestPaths = await glob(
    ['packages/*/package.json', 'packages/@expo/*/package.json', 'templates/*/package.json'],
    { cwd: root, absolute: true }
  );
  const manifests = await Promise.all(
    manifestPaths.map(async (file) => ({ ...(await fs.readJson(file)), path: path.dirname(file) }))
  );
  return manifests.filter(
    (manifest): manifest is Manifest =>
      !manifest.private && typeof manifest.name === 'string' && typeof manifest.version === 'string'
  );
}
