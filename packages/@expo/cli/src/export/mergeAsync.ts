import temporary from 'tempy';

import * as Log from '../log';
import { downloadAndDecompressAsync } from '../utils/tar';
import { mergeAppDistributions } from './mergeAppDistributions';
import { Options } from './resolveOptions';

/** Merge sources together. */
export async function mergeAsync(
  projectRoot: string,
  {
    mergeSrcDir,
    mergeSrcUrl,
    outputDir,
  }: Pick<Options, 'mergeSrcUrl' | 'mergeSrcDir' | 'outputDir'>
): Promise<void> {
  // Combine file paths to merge
  const mergeFilePaths = mergeSrcDir.concat(await downloadSourcesAsync(mergeSrcUrl));

  if (!mergeFilePaths.length) {
    return;
  }

  // Extra merge work
  const sources = mergeSrcDir.concat(mergeSrcUrl).join(' ');
  Log.log(`Starting project merge of ${sources} into ${outputDir}`);

  // Merge content in srcDirs and outputDir together
  mergeFilePaths.push(outputDir);

  // Merge app distributions
  await mergeAppDistributions(projectRoot, mergeFilePaths, outputDir);
}

/** Download source URLs to a temporary directory and return a list of file paths pointing to sources to merge. Exposed for testing. */
export async function downloadSourcesAsync(sourceUrls: string[]): Promise<string[]> {
  return Promise.all(
    sourceUrls.map((url) => downloadAndDecompressAsync(url, temporary.directory()))
  );
}
