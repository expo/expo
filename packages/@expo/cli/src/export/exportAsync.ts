import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import temporary from 'tempy';

import * as Log from '../log';
import { resolvePlatformOption } from '../prebuild/resolveOptions';
import { downloadAndDecompressAsync } from '../utils/tar';
import { assertFolderEmptyAsync } from './assertFolderEmpty';
import { exportAppAsync } from './exportAppAsync';
import { mergeAppDistributions } from './mergeAppDistributions';
import { Options } from './resolveOptions';

// TODO: We shouldn't need to wrap a method that is only used for one purpose.
async function exportFilesAsync(
  projectRoot: string,
  options: Pick<
    Options,
    'dumpAssetmap' | 'dumpSourcemap' | 'dev' | 'clear' | 'outputDir' | 'platform'
  >
) {
  const platforms = resolvePlatformOption(options.platform, { loose: true });

  // Make outputDir an absolute path if it isnt already
  const exportOptions = {
    dumpAssetmap: options.dumpAssetmap,
    dumpSourcemap: options.dumpSourcemap,
    isDev: options.dev,
    platforms,
    publishOptions: {
      resetCache: !!options.clear,
    },
  };
  return await exportAppAsync(projectRoot, options.outputDir, exportOptions);
}

async function mergeSourceDirectoriesAsync(
  projectRoot: string,
  mergeSrcDirs: string[],
  options: Pick<Options, 'mergeSrcUrl' | 'mergeSrcDir' | 'outputDir'>
): Promise<void> {
  if (!mergeSrcDirs.length) {
    return;
  }
  const srcDirs = options.mergeSrcDir.concat(options.mergeSrcUrl).join(' ');
  Log.log(`Starting project merge of ${srcDirs} into ${options.outputDir}`);

  // Merge app distributions
  await mergeAppDistributions(
    projectRoot,
    [...mergeSrcDirs, options.outputDir], // merge stuff in srcDirs and outputDir together
    options.outputDir
  );
  Log.log(`Project merge was successful. Your merged files can be found in ${options.outputDir}`);
}

export async function collectMergeSourceUrlsAsync(mergeSrcUrl: string[]): Promise<string[]> {
  if (!mergeSrcUrl.length) {
    return [];
  }

  // src urls were specified to merge in, so download and decompress them
  const tmp = temporary.directory();

  Log.debug('Downloading and decompressing source directories:', tmp);

  // Download the urls into a tmp dir
  return await Promise.all(
    // Merge src dirs/urls into a multimanifest if specified
    mergeSrcUrl.map(async (url: string): Promise<string> => {
      // Add the absolute paths to srcDir
      const uniqFilename = `${path.basename(url, '.tar.gz')}_${crypto
        .randomBytes(16)
        .toString('hex')}`;

      const tmpFolderUncompressed = path.resolve(tmp, uniqFilename);
      await fs.promises.mkdir(tmpFolderUncompressed, { recursive: true });
      await downloadAndDecompressAsync(url, tmpFolderUncompressed);
      // add the decompressed folder to be merged
      return tmpFolderUncompressed;
    })
  );
}

export async function exportAsync(projectRoot: string, options: Options) {
  // Ensure the output directory is created
  const outputPath = path.resolve(projectRoot, options.outputDir);
  await fs.promises.mkdir(outputPath, { recursive: true });

  await assertFolderEmptyAsync({
    projectRoot: outputPath,
    folderName: options.outputDir,
    // Always overwrite files, this is inline with most bundler tooling.
    overwrite: true,
  });

  // Wrap the XDL method for exporting assets
  await exportFilesAsync(projectRoot, options);

  // Extra merge work
  await mergeSourceDirectoriesAsync(
    projectRoot,
    [
      // Merge src dirs/urls into a multimanifest if specified
      ...(await collectMergeSourceUrlsAsync(options.mergeSrcUrl)),
      // add any local src dirs to be merged
      ...options.mergeSrcDir,
    ],
    options
  );

  // Final notes
  Log.log(`Export was successful. Your exported files can be found in ${options.outputDir}`);
}
