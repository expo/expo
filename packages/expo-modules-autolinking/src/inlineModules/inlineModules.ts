import fs from 'fs';
import path from 'path';

import { taskAll } from '../concurrency';
import { maybeRealpath, scanFilesRecursively } from '../utils';

/**
 * For a given project contains information about all of the inline modules inside.
 * - files: array of files and the watchedDirectories they come from
 * - swiftModuleClassNames: array of swift inline modules class names.
 * - kotlinClasses: array of kotlin inline modules in format `<package>.<className>`
 */
export interface InlineModulesMirror {
  files: { filePath: string; watchedDirRoot: string }[];
  swiftModuleClassNames: string[];
  kotlinClasses: string[];
}

function findUpProjectRoot(cwd: string): string | null {
  const packageJsonPath = path.resolve(cwd, './package.json');
  if (fs.existsSync(packageJsonPath)) {
    return path.dirname(packageJsonPath);
  }

  const parent = path.dirname(cwd);
  if (parent === cwd) return null;

  return findUpProjectRoot(parent);
}

/**
 * Finds the project root - the closest ancestor directory with package.json.
 * @returns path to the project root.
 */
export async function getAppRoot(): Promise<string> {
  const cwd = process.cwd();
  const result = findUpProjectRoot(cwd);
  if (!result) {
    throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
  }
  return result;
}

const nativeExtensions = ['.kt', '.swift'];

/**
 * Checks if the fileName is valid for an inline module.
 * It needs to have suported extension and no dots in the basename as the basename has to match the module name.
 */
function inlineModuleFileNameInformation(fileName: string): { valid: boolean; ext: string } {
  const ext = path.extname(fileName);
  if (!nativeExtensions.includes(ext)) {
    return { valid: false, ext };
  }

  const baseName = path.basename(fileName, ext);
  return { valid: !baseName.includes('.'), ext };
}

async function getKotlinFileNameWithItsPackage(absoluteFilePath: string): Promise<string> {
  const HEADER_SIZE = 512;
  const buffer = Buffer.alloc(HEADER_SIZE);

  const fileHandle = await fs.promises.open(absoluteFilePath, 'r');
  try {
    const { bytesRead } = await fileHandle.read(buffer, 0, HEADER_SIZE, 0);
    const header = buffer.toString('utf8', 0, bytesRead);

    // We want to find `package some.package` and capture the `some.package` from it.
    const pacakgeRegex = /^package\s+([\w.]+)/m;
    const packageMatch = header.match(pacakgeRegex);
    if (!packageMatch) {
      return '';
    }

    return `${packageMatch[1]}.${path.basename(absoluteFilePath, path.extname(absoluteFilePath))}`;
  } finally {
    await fileHandle.close();
  }
}

function getSwiftModuleClassName(absoluteFilePath: string): string {
  return path.basename(absoluteFilePath, path.extname(absoluteFilePath));
}

/**
 * Scans the project and returns information about all of the inline modules inside in an InlineModulesMirror object.
 */
export async function getMirrorStateObject(
  watchedDirectories: string[]
): Promise<InlineModulesMirror> {
  const appRoot = await getAppRoot();
  const inlineModulesMirror: InlineModulesMirror = {
    kotlinClasses: [],
    swiftModuleClassNames: [],
    files: [],
  };

  const taskInputs: string[] = [];
  for (const dir of watchedDirectories ?? []) {
    const absoluteDirPath = path.resolve(appRoot, dir);
    taskInputs.push(absoluteDirPath);
  }

  await taskAll(taskInputs, async (absoluteDirPath) => {
    for await (const { name, path } of scanFilesRecursively(absoluteDirPath)) {
      const { valid, ext } = inlineModuleFileNameInformation(name);
      if (!valid) {
        continue;
      }

      const absoluteFilePath = await maybeRealpath(path);
      if (!absoluteFilePath) {
        continue;
      }

      inlineModulesMirror.files.push({
        filePath: absoluteFilePath,
        watchedDirRoot: absoluteDirPath,
      });
      if (ext === '.kt') {
        const kotlinFileWithPackage = await getKotlinFileNameWithItsPackage(absoluteFilePath);
        inlineModulesMirror.kotlinClasses.push(kotlinFileWithPackage);
      } else {
        const swiftClassName = getSwiftModuleClassName(absoluteFilePath);
        inlineModulesMirror.swiftModuleClassNames.push(swiftClassName);
      }
    }
  });
  // Sort the kotlin and swift classes as later we want to use them to generate module providers and it's better to do it consistently for caching.
  inlineModulesMirror.kotlinClasses.sort();
  inlineModulesMirror.swiftModuleClassNames.sort();
  return inlineModulesMirror;
}
