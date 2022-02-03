import fs from 'fs-extra';
import minimatch from 'minimatch';
import path from 'path';

import { CopyFileOptions, CopyFileResult, StringTransform } from './Transforms.types';
import { arrayize } from './Utils';

export * from './Transforms.types';

/**
 * Transforms input string according to the given transform rules.
 */
export function transformString(
  input: string,
  transforms: StringTransform[] | null | undefined
): string {
  if (!transforms) {
    return input;
  }
  return transforms.reduce(
    // @ts-ignore @tsapeta: TS gets crazy on `replaceWith` being a function.
    (acc, { find, replaceWith }) => acc.replace(find, replaceWith),
    input
  );
}

/**
 * Transforms file's content in-place.
 */
export async function transformFileAsync(
  filePath: string,
  transforms: StringTransform[] | null | undefined
): Promise<void> {
  const content = await fs.readFile(filePath, 'utf8');
  await fs.outputFile(filePath, transformString(content, transforms));
}

/**
 * Copies a file from source directory to target directory with transformed relative path and content.
 */
export async function copyFileWithTransformsAsync(
  options: CopyFileOptions
): Promise<CopyFileResult> {
  const { sourceFile, sourceDirectory, targetDirectory, transforms } = options;
  const sourcePath = path.join(sourceDirectory, sourceFile);

  // Transform the target path according to rename rules.
  const targetFile = transformString(sourceFile, transforms.path);
  const targetPath = path.join(targetDirectory, targetFile);

  // Filter out transforms that don't match paths patterns.
  const filteredContentTransforms =
    transforms.content?.filter(
      ({ paths }) =>
        !paths ||
        arrayize(paths).some((pattern) => minimatch(sourceFile, pattern, { matchBase: true }))
    ) ?? [];

  // Transform source content.
  const content = transformString(await fs.readFile(sourcePath, 'utf8'), filteredContentTransforms);

  // Save transformed source file at renamed target path.
  await fs.outputFile(targetPath, content);

  return {
    content,
    targetFile,
  };
}
