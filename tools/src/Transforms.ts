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

async function applyTransformsOnFileContentAsync(
  filePath: string,
  transforms: FileTransform[]
): Promise<{
  content: string;
  transformsUsed: Set<FileTransform>;
}> {
  // Transform source content.
  let result = await fs.readFile(filePath, 'utf8');
  const transformsUsed = new Set<FileTransform>();
  for (const transform of transforms) {
    const beforeTransformation = result;
    result = applySingleTransform(result, transform);
    await maybePrintDebugInfoAsync(beforeTransformation, result, filePath, transform);
    if (result !== beforeTransformation) {
      transformsUsed.add(transform);
    }
  }
  return { content: result, transformsUsed };
}

/**
 * Filters file contents transformations to only these that match path patterns.
 * `filePath` param should be a relative path.
 */
function getFilteredContentTransforms(transforms: FileTransform[], filePath: string) {
  return transforms.filter(
    ({ paths }) =>
      !paths || arrayize(paths).some((pattern) => minimatch(filePath, pattern, { matchBase: true }))
  );
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
export async function transformFilesAsync(
  files: string[],
  transforms: FileTransform[]
): Promise<Set<FileTransform>> {
  const transformsUsed = new Set<FileTransform>();
  for (const file of files) {
    const filteredContentTransforms = getFilteredContentTransforms(transforms ?? [], file);

    // Transform source content.
    const transformedFile = await applyTransformsOnFileContentAsync(
      file,
      filteredContentTransforms
    );
    transformedFile.transformsUsed.forEach((transform) => transformsUsed.add(transform));

    // Save transformed content
    await fs.outputFile(file, transformedFile.content);
  }
  return transformsUsed;
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

  const filteredContentTransforms = getFilteredContentTransforms(
    transforms.content ?? [],
    sourceFile
  );

  // Transform source content.
  const { content, transformsUsed } = await applyTransformsOnFileContentAsync(
    sourcePath,
    filteredContentTransforms
  );

  if (filteredContentTransforms.length > 0) {
    // Save transformed source file at renamed target path.
    await fs.outputFile(targetPath, content);
  } else {
    // When there are no transforms, it's safer to just copy the file.
    // Only then binary files will be copied properly since the `content` is utf8-encoded.
    await fs.copy(sourcePath, targetPath, { overwrite: true });
  }

  // Keep original file mode if needed.
  if (options.keepFileMode) {
    const { mode } = await fs.stat(sourcePath);
    await fs.chmod(targetPath, mode);
  }

  return {
    content,
    transformsUsed,
    targetFile,
  };
}
