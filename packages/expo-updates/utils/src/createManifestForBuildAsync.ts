import type { HashedAssetData } from '@expo/metro-config/build/transform-worker/getAssets';
import spawnAsync from '@expo/spawn-async';
import crypto from 'crypto';
import type { EmbeddedManifest } from 'expo-manifests';
import { resolveEntryPoint } from 'expo/config/paths';
import {
  drawableFileTypes,
  createMetroServerAndBundleRequestAsync,
  exportEmbedAssetsAsync,
} from 'expo/internal/unstable-expo-updates-cli-exports';
import fs from 'fs';
import path from 'path';

import { filterPlatformAssetScales } from './filterPlatformAssetScales';

export async function createManifestForBuildAsync(
  platform: 'ios' | 'android',
  projectRoot: string,
  destinationDir: string,
  entryFileArg?: string
): Promise<void> {
  const entryFile =
    entryFileArg ||
    process.env.ENTRY_FILE ||
    resolveEntryPoint(projectRoot, { platform }) ||
    'index.js';

  process.chdir(projectRoot);

  const options = {
    platform,
    entryFile,
    minify: false,
    dev: process.env.CONFIGURATION === 'Debug', // ensures debug assets packaged correctly for iOS and native debug
    sourcemapUseAbsolutePath: false,
    resetCache: false,
  };

  const { server, bundleRequest } = await createMetroServerAndBundleRequestAsync(
    projectRoot,
    options
  );

  let assets: HashedAssetData[];
  try {
    assets = await exportEmbedAssetsAsync(server, bundleRequest, projectRoot, options);
  } catch (e: any) {
    throw new Error(
      "Error loading assets JSON from Metro. Ensure you've followed all expo-updates installation steps correctly. " +
        e.message
    );
  } finally {
    server.end();
  }

  const manifest: EmbeddedManifest = {
    id: crypto.randomUUID(),
    commitTime: await resolveCommitTimeAsync(projectRoot, Date.now()),
    assets: [],
  };

  assets.forEach(function (asset) {
    if (!asset.fileHashes) {
      throw new Error(
        'The hashAssetFiles Metro plugin is not configured. You need to add a metro.config.js to your project that configures Metro to use this plugin. See https://github.com/expo/expo/blob/main/packages/expo-updates/README.md#metroconfigjs for an example.'
      );
    }
    filterPlatformAssetScales(platform, asset.scales).forEach(function (scale) {
      const baseAssetInfoForManifest = {
        name: asset.name,
        type: asset.type,
        scale,
        // `fileHashes` is parallel to the unfiltered `asset.scales`, so it must be indexed by the
        // scale's position there rather than by its position in the filtered list.
        packagerHash: asset.fileHashes[asset.scales.indexOf(scale)],
        subdirectory: asset.httpServerLocation,
      };
      if (platform === 'ios') {
        manifest.assets.push({
          ...baseAssetInfoForManifest,
          nsBundleDir: getIosDestinationDir(asset),
          nsBundleFilename: scale === 1 ? asset.name : asset.name + '@' + scale + 'x',
        });
      } else if (platform === 'android') {
        manifest.assets.push({
          ...baseAssetInfoForManifest,
          scales: asset.scales,
          resourcesFilename: getAndroidResourceIdentifier(asset),
          resourcesFolder: getAndroidResourceFolderName(asset),
        });
      }
    });
  });

  fs.writeFileSync(path.join(destinationDir, 'app.manifest'), JSON.stringify(manifest));
}

/**
 * The time to stamp the embedded bundle with, in epoch milliseconds.
 *
 * `commitTime` is what orders an update against every other update for the same
 * runtime version — `LauncherSelectionPolicyFilterAware` launches the newest and
 * `LoaderSelectionPolicyFilterAware` will not even download one that is not
 * strictly newer than what is running. A remote update's value is its manifest's
 * `createdAt`, i.e. when it was published.
 *
 * Stamping the embedded bundle with `Date.now()` therefore dates it to when the
 * native build happened to run rather than to the source it contains. A build
 * that takes longer than the gap between two commits finishes *newer* than an
 * update published from the later of them: same runtime version, so the update
 * is offered and downloaded, and then never launches. It is silent, because an
 * install running its own embedded bundle is not an error state.
 *
 * The source commit's committer date orders builds by the code they carry
 * instead, and a publish always happens after its commit exists — so an update
 * published after a commit outranks a build of that commit by construction.
 *
 * Only when the working tree is clean: a dirty tree's bundle corresponds to no
 * commit, and dating it earlier than it really is would let an older update win.
 * Everything else — git missing, no commits yet, or a source archive with no
 * `.git` such as an EAS Build workspace — keeps the previous behaviour.
 */
async function resolveCommitTimeAsync(projectRoot: string, now: number): Promise<number> {
  const commitTimeOverride = process.env.EXPO_UPDATES_COMMIT_TIME_OVERRIDE;
  if (commitTimeOverride) {
    const overriddenCommitTime = Number(commitTimeOverride);
    if (Number.isInteger(overriddenCommitTime) && overriddenCommitTime > 0) {
      console.log(
        `Using commit time from EXPO_UPDATES_COMMIT_TIME_OVERRIDE: ${commitTimeOverride}`
      );
      return overriddenCommitTime;
    }
    console.warn(
      `Ignoring EXPO_UPDATES_COMMIT_TIME_OVERRIDE: expected epoch milliseconds, got "${commitTimeOverride}".`
    );
  }

  let committerDate: string;
  let workingTreeChanges: string;
  try {
    // `%ct` is the committer date, not `%at`: the author date survives a rebase or
    // cherry-pick from the original write, which would order a backport ahead of
    // the work it already contains.
    committerDate = (await spawnAsync('git', ['log', '-1', '--format=%ct'], { cwd: projectRoot }))
      .stdout;
    workingTreeChanges = (await spawnAsync('git', ['status', '--porcelain'], { cwd: projectRoot }))
      .stdout;
  } catch {
    return now;
  }

  if (workingTreeChanges.trim() !== '') {
    return now;
  }

  const commitTime = Number(committerDate.trim()) * 1000;
  if (!Number.isInteger(commitTime) || commitTime <= 0) {
    return now;
  }
  // A commit dated in the future would outrank every update published after it,
  // which is the same failure with the sign flipped.
  return Math.min(commitTime, now);
}

function getAndroidResourceFolderName(asset: HashedAssetData) {
  return (drawableFileTypes as Set<string>).has(asset.type) ? 'drawable' : 'raw';
}

// copied from react-native/Libraries/Image/assetPathUtils.js
function getAndroidResourceIdentifier(asset: HashedAssetData) {
  const folderPath = getBasePath(asset);
  return (folderPath + '/' + asset.name)
    .toLowerCase()
    .replace(/\//g, '_') // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '') // Remove illegal chars
    .replace(/^assets_/, ''); // Remove "assets_" prefix
}

function getIosDestinationDir(asset: HashedAssetData) {
  // react-native-cli replaces `..` with `_` when embedding assets in the iOS app bundle
  // https://github.com/react-native-community/cli/blob/0a93be1a42ed1fb05bb0ebf3b82d58b2dd920614/packages/cli/src/commands/bundle/getAssetDestPathIOS.ts
  return getBasePath(asset).replace(/\.\.\//g, '_');
}

// copied from react-native/Libraries/Image/assetPathUtils.js
function getBasePath(asset: HashedAssetData) {
  let basePath = asset.httpServerLocation;
  if (basePath[0] === '/') {
    basePath = basePath.substr(1);
  }
  return basePath;
}
