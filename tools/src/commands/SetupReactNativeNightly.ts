import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

import { EXPO_DIR, EXPOTOOLS_DIR } from '../Constants';
import logger from '../Logger';
import { getPackageViewAsync } from '../Npm';
import { applyPatchAsync } from '../Utils';
import { installAsync as workspaceInstallAsync } from '../Workspace';

const PATCHES_ROOT = path.join(EXPOTOOLS_DIR, 'src', 'react-native-nightlies', 'patches');

export default (program: Command) => {
  program
    .command('setup-react-native-nightly')
    .description('Setup expo/expo monorepo to install react-native nightly build for testing')
    .asyncAction(main);
};

async function main() {
  const nightlyVersion = await queryNpmDistTagVersionAsync('react-native', 'nightly');

  await removePostinstallPatchAsync();

  logger.info('Adding bare-expo optional packages:');
  await addBareExpoOptionalPackagesAsync();

  logger.info('Adding pinned packages:');
  const pinnedPackages = {
    'react-native': nightlyVersion,
    '@react-native/assets-registry': await queryNpmDistTagVersionAsync(
      '@react-native/assets-registry',
      'nightly'
    ),

    // These 3rd party libraries are broken from react-native nightlies, trying to update them to newer versions.
    ...(await queryLatest3rdPartyLibrariesAsync({
      '@react-native-community/slider': 'latest',
      'lottie-react-native': 'latest',
      'react-native-pager-view': 'latest',
      'react-native-safe-area-context': 'latest',
      'react-native-screens': '3.29.0',
      'react-native-svg': 'latest',
      'react-native-webview': 'latest',
    })),
  };
  await addPinnedPackagesAsync(pinnedPackages);

  logger.info('Yarning...');
  await workspaceInstallAsync();

  const patches = [
    'datetimepicker.patch',
    'lottie-react-native.patch',
    'react-native-gesture-handler.patch',
    'react-native-pager-view.patch',
    'react-native-screens.patch',
    'react-native-reanimated.patch',
    'react-native-safe-area-context.patch',
  ];
  await Promise.all(
    patches.map(async (patch) => {
      const patchFile = path.join(PATCHES_ROOT, patch);
      const patchContent = await fs.readFile(patchFile, 'utf8');
      await applyPatchAsync({ patchContent, cwd: EXPO_DIR, stripPrefixNum: 1 });
    })
  );

  logger.info('Setting up Expo modules files');
  await updateExpoModulesAsync();

  logger.info('Setting up project files for bare-expo.');
  await updateBareExpoAsync(nightlyVersion);
}

async function removePostinstallPatchAsync() {
  const packageJsonPath = path.join(EXPO_DIR, 'package.json');
  const packageJson = await JsonFile.readAsync(packageJsonPath);
  packageJson.scripts = {
    ...((packageJson.scripts as Record<string, string> | undefined) ?? {}),
    postinstall:
      'yarn-deduplicate && yarn workspace @expo/cli prepare && node ./tools/bin/expotools.js validate-workspace-dependencies',
  };
  await JsonFile.writeAsync(packageJsonPath, packageJson);
}

/**
 * To save the CI build time, some third-party libraries are intentionally not listed as dependencies in bare-expo.
 * Adding these packages for nightly testing to increase coverage.
 */
async function addBareExpoOptionalPackagesAsync() {
  const bareExpoRoot = path.join(EXPO_DIR, 'apps', 'bare-expo');
  const OPTIONAL_PKGS = ['@shopify/react-native-skia', 'lottie-react-native', 'react-native-maps'];

  const packageJsonNCL = await JsonFile.readAsync(
    path.join(EXPO_DIR, 'apps', 'native-component-list', 'package.json')
  );
  const versionMap = {
    ...(packageJsonNCL.devDependencies as object),
    ...(packageJsonNCL.dependencies as object),
  };

  const installPackages = OPTIONAL_PKGS.map((pkg) => {
    const version = versionMap[pkg];
    assert(version);
    return `${pkg}@${version}`;
  });
  for (const pkg of installPackages) {
    logger.log('  ', pkg);
  }

  await spawnAsync('yarn', ['add', ...installPackages], { cwd: bareExpoRoot });
}

async function addPinnedPackagesAsync(packages: Record<string, string>) {
  const workspacePackageJsonPath = path.join(EXPO_DIR, 'package.json');
  const json = await JsonFile.readAsync(workspacePackageJsonPath);
  json.resolutions ||= {};
  for (const [name, version] of Object.entries(packages)) {
    logger.log('  ', `${name}@${version}`);
    json.resolutions[name] = version;
  }
  await JsonFile.writeAsync(workspacePackageJsonPath, json);
}

async function updateExpoModulesAsync() {
  // no-op currently
}

async function updateBareExpoAsync(nightlyVersion: string) {
  // no-op currently
}

async function queryNpmDistTagVersionAsync(pkg: string, distTag: string) {
  const view = await getPackageViewAsync(pkg);
  const version = view?.['dist-tags'][distTag];
  if (!version) {
    throw new Error(`Unable to get ${pkg} version for dist-tag: ${distTag}.`);
  }
  return version;
}

async function queryLatest3rdPartyLibrariesAsync(pkgTuple: Record<string, string>) {
  const pkgAndVersion: Record<string, string> = {};
  for (const [pkg, tagOrVersion] of Object.entries(pkgTuple)) {
    let version;
    if (semver.valid(tagOrVersion)) {
      version = tagOrVersion;
    } else {
      version = await queryNpmDistTagVersionAsync(pkg, tagOrVersion);
    }
    pkgAndVersion[pkg] = version;
  }
  return pkgAndVersion;
}
