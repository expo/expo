import { Command } from '@expo/commander';
import fs from 'fs-extra';
import path from 'path';

import { Package } from '../Packages';
import { runPrebuildPackagesAsync } from './PrebuildPackages';
import { getPackageLocalBuildPath } from '../prebuilds/PackageLocalBuild';
import { resolveHermesVersion } from '../prebuilds/Utils';

async function resolveNativePeerVersions(packagePath: string): Promise<{
  reactNativeVersion: string;
  hermesVersion: string;
}> {
  const reactNativeManifestPath = require.resolve('react-native/package.json', {
    paths: [packagePath],
  });
  const reactNativePath = path.dirname(reactNativeManifestPath);
  const reactNativeManifest = await fs.readJson(reactNativeManifestPath);

  const properties = Object.fromEntries(
    (await fs.readFile(path.join(reactNativePath, 'sdks/hermes-engine/version.properties'), 'utf8'))
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => line.split('=', 2).map((part) => part.trim()))
  );
  return {
    reactNativeVersion: reactNativeManifest.version,
    hermesVersion: resolveHermesVersion(properties, { classic: null, v1: null }, process.env),
  };
}

async function actionAsync() {
  const packagePath = process.cwd();
  const pkg = new Package(packagePath);
  const versions = await resolveNativePeerVersions(packagePath);
  // Turbo invokes this command only on a cache miss, so start from one canonical owned tree.
  await fs.remove(getPackageLocalBuildPath(pkg));
  const result = await runPrebuildPackagesAsync([pkg.packageName], {
    ...versions,
    clean: false,
    cleanCache: false,
    skipGenerate: false,
    skipArtifacts: false,
    skipBuild: false,
    skipCompose: false,
    skipVerify: false,
    verbose: false,
    concurrency: 1,
    exactPackage: true,
  });
  process.exitCode = result.exitCode;
}

export default (program: Command) => {
  program
    .command('prebuild-package-for-publish')
    .description('Builds exactly the current package into its package-local Turbo output.')
    .asyncAction(actionAsync);
};
