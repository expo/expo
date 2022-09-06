import fs from 'fs-extra';
import inquirer from 'inquirer';
import minimatch from 'minimatch';
import path from 'path';

import { printDiff } from './Diff';
import {
  CopyFileOptions,
  CopyFileResult,
  FileTransform,
  RawTransform,
  ReplaceTransform,
  StringTransform,
} from './Transforms.types';
import { arrayize } from './Utils';

export * from './Transforms.types';

function isRawTransform(transform: any): transform is RawTransform {
  return transform.transform;
}

function isReplaceTransform(transform: any): transform is ReplaceTransform {
  return transform.find !== undefined && transform.replaceWith !== undefined;
}

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
  return transforms.reduce((acc, transform) => {
    return applySingleTransform(acc, transform);
  }, input);
}

async function getTransformedFileContentAsync(
  filePath: string,
  transforms: FileTransform[]
): Promise<string> {
  let result = await fs.readFile(filePath, 'utf8');
  for (const transform of transforms) {
    const beforeTransformation = result;
    result = applySingleTransform(result, transform);
    await maybePrintDebugInfoAsync(beforeTransformation, result, filePath, transform);
  }
  return result;
}

async function maybePrintDebugInfoAsync(
  contentBefore: string,
  contentAfter: string,
  filePath: string,
  transform: FileTransform
): Promise<void> {
  if (!transform.debug || contentAfter === contentBefore) {
    return;
  }
  const transformName =
    typeof transform.debug === 'string' ? transform.debug : JSON.stringify(transform, null, 2);

  printDiff(contentBefore, contentAfter);

  const { isCorrect } = await inquirer.prompt<{ isCorrect: boolean }>([
    {
      type: 'confirm',
      name: 'isCorrect',
      message: `Changes in file ${filePath} introduced by transform ${transformName}`,
      default: true,
    },
  ]);
  if (!isCorrect) {
    throw new Error('ABORTING');
  }
}

function applySingleTransform(input: string, transform: StringTransform): string {
  if (isRawTransform(transform)) {
    return transform.transform(input);
  } else if (isReplaceTransform(transform)) {
    const { find, replaceWith } = transform;
    // @ts-ignore @tsapeta: TS gets crazy on `replaceWith` being a function.
    return input.replace(find, replaceWith);
  }
  throw new Error(`Unknown transform type`);
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
 * Transforms multiple files' content in-place.
 */
export async function transformFilesAsync(files: string[], transforms: FileTransform[]) {
  for (const file of files) {
    // Filter out transforms that don't match paths patterns.
    const filteredContentTransforms =
      transforms.filter(
        ({ paths }) =>
          !paths || arrayize(paths).some((pattern) => minimatch(file, pattern, { matchBase: true }))
      ) ?? [];

    // Transform source content.
    const content = await getTransformedFileContentAsync(file, filteredContentTransforms);

    // Save transformed source file at renamed target path.
    await fs.outputFile(file, content);
  }
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
  const content = await getTransformedFileContentAsync(sourcePath, filteredContentTransforms);

  // Save transformed source file at renamed target path.
  await fs.outputFile(targetPath, content);

  // Keep original file mode if needed.
  if (options.keepFileMode) {
    const { mode } = await fs.stat(sourcePath);
    await fs.chmod(targetPath, mode);
  }

  return {
    content,
    targetFile,
  };
}
