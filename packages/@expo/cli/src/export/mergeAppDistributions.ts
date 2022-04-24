import { ExpoAppManifest } from '@expo/config';
import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

import * as Log from '../log';
import { copyAsync, ensureDirectoryAsync } from '../utils/dir';
import { CommandError } from '../utils/errors';

type SelfHostedIndex = ExpoAppManifest & {
  dependencies: string[];
};

function isSelfHostedIndex(obj: any): obj is SelfHostedIndex {
  return !!obj.sdkVersion;
}

async function readSelfHostedIndexFilesAsync(indexPath: string): Promise<SelfHostedIndex[]> {
  const index = await JsonFile.readAsync(indexPath);

  if (!isSelfHostedIndex(index)) {
    throw new CommandError(
      'INVALID_MANIFEST',
      `Invalid index.json, must specify an sdkVersion at ${indexPath}`
    );
  }
  if (Array.isArray(index)) {
    // index.json could also be an array
    return index;
  } else {
    return [index];
  }
}

// Takes multiple exported apps in sourceDirs and coalesces them to one app in outputDir
export async function mergeAppDistributions(
  projectRoot: string,
  sourceDirs: string[],
  outputDir: string
): Promise<void> {
  const targetFolders = ['assets', 'bundles'];
  const platforms = ['ios', 'android'];
  // Ensure target folders exist
  await Promise.all(
    targetFolders.map((name) => ensureDirectoryAsync(path.resolve(projectRoot, outputDir, name)))
  );

  // Copy over platform agnostic `bundles` and `assets` folders.
  await Promise.all(
    sourceDirs.map(async (sourceDir) => {
      // copy over assets/bundles from other src dirs to the output dir
      if (sourceDir !== outputDir) {
        await copyFoldersAsync(
          path.resolve(projectRoot, sourceDir),
          path.resolve(projectRoot, outputDir),
          targetFolders
        );
      }
    })
  );

  // Copy over all platform specific json files, sorted by version.
  await Promise.all(
    platforms.map((platform) =>
      mergePlatformIndexFilesAsync(projectRoot, {
        fileName: `${platform}-index.json`,
        sourceDirs,
        outputDir,
      })
    )
  );
}

async function copyFoldersAsync(source: string, output: string, names: string[]) {
  return Promise.all(
    names.map((name) => copyAsync(path.resolve(source, name), path.resolve(output, name)))
  );
}

async function mergePlatformIndexFilesAsync(
  projectRoot: string,
  { fileName, sourceDirs, outputDir }: { fileName: string; sourceDirs: string[]; outputDir: string }
) {
  // merge files from bundles and assets
  const indexFiles = (
    await Promise.all(
      sourceDirs.map((sourceDir) =>
        readSelfHostedIndexFilesAsync(path.resolve(projectRoot, sourceDir, fileName))
      )
    )
  ).flat();

  const artifactDirectory = path.join(projectRoot, outputDir);
  const artifactPath = path.join(artifactDirectory, fileName);

  await fs.promises.mkdir(artifactDirectory, { recursive: true });
  await fs.promises.writeFile(artifactPath, JSON.stringify(getSortedIndex(indexFiles)));
}

// sort indexes by descending sdk value
function getSortedIndex(indexFiles: SelfHostedIndex[]): SelfHostedIndex[] {
  return indexFiles.sort((a: SelfHostedIndex, b: SelfHostedIndex) => {
    if (semver.eq(a.sdkVersion, b.sdkVersion)) {
      Log.error(
        `Encountered multiple index.json with the same SDK version ${a.sdkVersion}. This could result in undefined behavior.`
      );
    }
    return semver.gte(a.sdkVersion, b.sdkVersion) ? -1 : 1;
  });
}
