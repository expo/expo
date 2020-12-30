import fs from 'fs-extra';
import minimatch from 'minimatch';
import path from 'path';

import { StringTransform, StringTransformMatch, transform } from '../StringTransforms';
import { arrayize } from '../Utils';

/**
 * A string transform extended by paths glob filter.
 */
export type ContentTransform = StringTransform & {
  /**
   * An array of glob patterns matching files to which the transform should be applied.
   * Patterns without slashes will be matched against the basename of the path.
   */
  paths?: string | string[];
};

/**
 * Simple string transform used to transform file paths.
 */
export type PathTransform = StringTransform;

export type CopyFilesTransforms = {
  /**
   * An array of transforms to apply on each file's content.
   */
  content?: ContentTransform[];

  /**
   * An array of transforms to apply on the relative file path.
   */
  path?: PathTransform[];
};

/**
 * Callback that is called when the file is about to be copied.
 */
export type OnCopyCallback = (
  /**
   * Relative path to the source file.
   */
  sourceFile: string,

  /**
   * Relative path, a result of transforming `sourceFile`.
   */
  targetFile: string,

  /**
   * An array of matches found when transforming file's content.
   */
  matches: StringTransformMatch[]
) => void;

/**
 * An object with options passed to `copyFilesWithTransformsAsync` function.
 */
export type CopyFilesOptions = {
  /**
   * Set of paths relative to `sourceDirectory`.
   */
  files: Set<string>;

  /**
   * A directory from which the files will be copied.
   */
  sourceDirectory: string;

  /**
   * A directory to which the transformed files will be copied.
   */
  targetDirectory: string;

  /**
   * An object with transform rules for file paths and contents.
   */
  transforms: CopyFilesTransforms;

  /**
   * Callback called when the file is about to be copied.
   */
  onCopy?: OnCopyCallback;
};

/**
 * Copies files from source directory to target directory with transformed relative path and content.
 */
export async function copyFilesWithTransformsAsync(options: CopyFilesOptions): Promise<void> {
  const { files, sourceDirectory, targetDirectory, transforms, onCopy } = options;

  for (const sourceFile of files) {
    const sourcePath = path.join(sourceDirectory, sourceFile);

    // Transform the target path according to rename rules.
    const targetFile = transform(sourceFile, transforms.path).output;
    const targetPath = path.join(targetDirectory, targetFile);

    // Filter out transforms that don't match paths patterns.
    const filteredContentTransforms =
      transforms.content?.filter(
        (transform) =>
          !transform.paths ||
          arrayize(transform.paths).some((pattern) =>
            minimatch(sourceFile, pattern, { matchBase: true })
          )
      ) ?? [];

    // Transform source content.
    const { output, matches } = transform(
      await fs.readFile(sourcePath, 'utf8'),
      filteredContentTransforms
    );

    // Notify the caller.
    onCopy?.(sourceFile, targetFile, matches);

    // Save transformed source file at renamed target path.
    await fs.outputFile(targetPath, output);
  }
}
