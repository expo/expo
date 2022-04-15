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

// put index.jsons into memory
async function putJsonInMemory(indexPath: string) {
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
  const indexes = (
    await Promise.all(
      sourceDirs.map((sourceDir) => putJsonInMemory(path.resolve(projectRoot, sourceDir, fileName)))
    )
  ).flat();

  // Save the json arrays to disk
  await writeArtifactSafelyAsync(
    path.join(projectRoot, outputDir, fileName),
    JSON.stringify(getSortedIndex(indexes))
  );
}

// sort indexes by descending sdk value
function getSortedIndex(indexes: SelfHostedIndex[]): SelfHostedIndex[] {
  return indexes.sort((index1: SelfHostedIndex, index2: SelfHostedIndex) => {
    if (semver.eq(index1.sdkVersion, index2.sdkVersion)) {
      Log.error(
        `Encountered multiple index.json with the same SDK version ${index1.sdkVersion}. This could result in undefined behavior.`
      );
    }
    return semver.gte(index1.sdkVersion, index2.sdkVersion) ? -1 : 1;
  });
}

// TODO: Remove this unrelated stuff..
export async function writeArtifactSafelyAsync(
  artifactPath: string,
  artifact: string | Uint8Array
) {
  if (fs.existsSync(path.dirname(artifactPath))) {
    await fs.promises.writeFile(artifactPath, artifact);
  } else {
    Log.warn(`Could not write artifact ${artifactPath} because the directory does not exist.`);
  }
}
