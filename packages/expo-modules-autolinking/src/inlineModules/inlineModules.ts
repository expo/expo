import { warn } from 'console';
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
  files: { filePath: string; watchedDir: string }[];
  swiftModuleClassNames: string[];
  kotlinClasses: string[];
}

const nativeExtensions = ['.kt', '.swift'];
// Checks for func definition() -> <anything>ModuleDefinition. <anything> because ExpoModulesCore.ModuleDefinition is a valid usage
const swiftModuleDefinitionRegex = /\bfunc\s+definition\s*\(\s*\)\s*->\s*[\w.]*ModuleDefinition\b/;
// Checks for `override fun definition() = <anything>ModuleDefinition`
const kotlinModuleDefinitionRegex =
  /\boverride\s+fun\s+definition\s*\(\s*\)\s*=\s*[\w.]*ModuleDefinition\b/;

/**
 * Checks if the fileName is valid for inline module scanning.
 * Swift and Kotlin files are classified as modules by reading their contents.
 */
export function inlineModuleFileNameInformation(fileName: string): {
  valid: boolean;
  ext: string;
} {
  const ext = path.extname(fileName);
  if (!nativeExtensions.includes(ext)) {
    return { valid: false, ext };
  }

  return { valid: true, ext };
}

export async function getKotlinFileNameWithItsPackage(
  absoluteFilePath: string
): Promise<string | null> {
  const HEADER_SIZE = 512;
  const buffer = Buffer.alloc(HEADER_SIZE);

  let fileHandle;
  try {
    fileHandle = await fs.promises.open(absoluteFilePath, 'r');
  } catch (e) {
    warn(`Kotlin inline module '${absoluteFilePath}' couldn't be opened.`);
    return null;
  }
  try {
    const { bytesRead } = await fileHandle.read(buffer, 0, HEADER_SIZE, 0);
    const header = buffer.toString('utf8', 0, bytesRead);

    // We want to find `package some.package` and capture the `some.package` from it.
    const pacakgeRegex = /^package\s+([\w.]+)/m;
    const packageMatch = header.match(pacakgeRegex);
    if (!packageMatch) {
      warn(`Package name couldn't be found in ${absoluteFilePath}.`);
      return null;
    }

    return `${packageMatch[1]}.${path.basename(absoluteFilePath, path.extname(absoluteFilePath))}`;
  } catch (e) {
    console.warn(`Couldn't read inline module '${absoluteFilePath}' package.`);
    return null;
  } finally {
    await fileHandle.close();
  }
}

export function getSwiftModuleClassName(absoluteFilePath: string): string {
  return path.basename(absoluteFilePath, path.extname(absoluteFilePath));
}

export async function hasKotlinModuleDefinition(absoluteFilePath: string): Promise<boolean> {
  try {
    const contents = await fs.promises.readFile(absoluteFilePath, 'utf8');
    return kotlinModuleDefinitionRegex.test(contents);
  } catch {
    warn(`Kotlin inline module '${absoluteFilePath}' could not be opened.`);
    return false;
  }
}

export async function hasSwiftModuleDefinition(absoluteFilePath: string): Promise<boolean> {
  try {
    const contents = await fs.promises.readFile(absoluteFilePath, 'utf8');
    return swiftModuleDefinitionRegex.test(contents);
  } catch {
    warn(`Swift inline module '${absoluteFilePath}' could not be opened.`);
    return false;
  }
}

/**
 * Scans the project and returns information about all of the inline modules inside in an InlineModulesMirror object.
 */
export async function getMirrorStateObject(
  watchedDirectories: string[],
  appRoot: string
): Promise<InlineModulesMirror> {
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
    for await (const { name, path: filePath } of scanFilesRecursively(absoluteDirPath)) {
      const { valid, ext } = inlineModuleFileNameInformation(name);
      if (!valid) {
        continue;
      }

      const absoluteFilePath = await maybeRealpath(filePath);
      if (!absoluteFilePath) {
        continue;
      }

      const hasKotlinDefinition =
        ext === '.kt' && (await hasKotlinModuleDefinition(absoluteFilePath));
      const hasSwiftDefinition =
        ext === '.swift' && (await hasSwiftModuleDefinition(absoluteFilePath));

      if (hasKotlinDefinition) {
        const kotlinFileWithPackage = await getKotlinFileNameWithItsPackage(absoluteFilePath);
        if (kotlinFileWithPackage === null) {
          continue;
        }
        inlineModulesMirror.kotlinClasses.push(kotlinFileWithPackage);
      } else if (hasSwiftDefinition) {
        const swiftClassName = getSwiftModuleClassName(absoluteFilePath);
        inlineModulesMirror.swiftModuleClassNames.push(swiftClassName);
      }
      inlineModulesMirror.files.push({
        filePath: absoluteFilePath,
        watchedDir: absoluteDirPath,
      });
    }
  });
  // Sort the kotlin and swift classes as later we want to use them to generate module providers and it's better to do it consistently for caching.
  inlineModulesMirror.kotlinClasses.sort();
  inlineModulesMirror.swiftModuleClassNames.sort();
  return inlineModulesMirror;
}
