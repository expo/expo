import { ExpoAppManifest } from '@expo/config';
import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

import * as Log from '../log';
import { CommandError } from '../utils/errors';
import { writeArtifactSafelyAsync } from './writeArtifact';

type SelfHostedIndex = ExpoAppManifest & {
  dependencies: string[];
};

function isSelfHostedIndex(obj: any): obj is SelfHostedIndex {
  return !!obj.sdkVersion;
}

// Takes multiple exported apps in sourceDirs and coalesces them to one app in outputDir
export async function mergeAppDistributions(
  projectRoot: string,
  sourceDirs: string[],
  outputDir: string
): Promise<void> {
  const assetPathToWrite = path.resolve(projectRoot, outputDir, 'assets');
  await fs.promises.mkdir(assetPathToWrite, { recursive: true });
  const bundlesPathToWrite = path.resolve(projectRoot, outputDir, 'bundles');
  await fs.promises.mkdir(bundlesPathToWrite, { recursive: true });

  // merge files from bundles and assets
  const androidIndexes: SelfHostedIndex[] = [];
  const iosIndexes: SelfHostedIndex[] = [];

  for (const sourceDir of sourceDirs) {
    const promises = [];

    // copy over assets/bundles from other src dirs to the output dir
    if (sourceDir !== outputDir) {
      // copy file over to assetPath
      const sourceAssetDir = path.resolve(projectRoot, sourceDir, 'assets');
      const outputAssetDir = path.resolve(projectRoot, outputDir, 'assets');
      const assetPromise = fs.copy(sourceAssetDir, outputAssetDir);
      promises.push(assetPromise);

      // copy files over to bundlePath
      const sourceBundleDir = path.resolve(projectRoot, sourceDir, 'bundles');
      const outputBundleDir = path.resolve(projectRoot, outputDir, 'bundles');
      const bundlePromise = fs.copy(sourceBundleDir, outputBundleDir);
      promises.push(bundlePromise);

      await Promise.all(promises);
    }

    // put index.jsons into memory
    const putJsonInMemory = async (indexPath: string, accumulator: SelfHostedIndex[]) => {
      const index = await JsonFile.readAsync(indexPath);

      if (!isSelfHostedIndex(index)) {
        throw new CommandError(
          'INVALID_MANIFEST',
          `Invalid index.json, must specify an sdkVersion at ${indexPath}`
        );
      }
      if (Array.isArray(index)) {
        // index.json could also be an array
        accumulator.push(...index);
      } else {
        accumulator.push(index);
      }
    };

    const androidIndexPath = path.resolve(projectRoot, sourceDir, 'android-index.json');
    await putJsonInMemory(androidIndexPath, androidIndexes);

    const iosIndexPath = path.resolve(projectRoot, sourceDir, 'ios-index.json');
    await putJsonInMemory(iosIndexPath, iosIndexes);
  }

  // sort indexes by descending sdk value
  const getSortedIndex = (indexes: SelfHostedIndex[]) => {
    return indexes.sort((index1: SelfHostedIndex, index2: SelfHostedIndex) => {
      if (semver.eq(index1.sdkVersion, index2.sdkVersion)) {
        Log.error(
          `Encountered multiple index.json with the same SDK version ${index1.sdkVersion}. This could result in undefined behavior.`
        );
      }
      return semver.gte(index1.sdkVersion, index2.sdkVersion) ? -1 : 1;
    });
  };

  const sortedAndroidIndexes = getSortedIndex(androidIndexes);
  const sortedIosIndexes = getSortedIndex(iosIndexes);

  // Save the json arrays to disk
  await writeArtifactSafelyAsync(
    projectRoot,
    null,
    path.join(outputDir, 'android-index.json'),
    JSON.stringify(sortedAndroidIndexes)
  );

  await writeArtifactSafelyAsync(
    projectRoot,
    null,
    path.join(outputDir, 'ios-index.json'),
    JSON.stringify(sortedIosIndexes)
  );
}
