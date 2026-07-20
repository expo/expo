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

export interface InlineModulesScanOptions {
  watchedDirectories: string[];
  appRoot: string;
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

/**
 * Information about a Kotlin file relevant to inline module registration.
 */
export interface KotlinInlineModuleInfo {
  /** Whether the file defines an inline module (contains an `override fun definition() = .*ModuleDefinition`). */
  hasModuleDefinition: boolean;
  /** `<package>.<fileName>` when the file is a module and its `package` was found, otherwise `null`. */
  classNameWithPackage: string | null;
}

/**
 * Reads a Kotlin file once and derives both whether it defines an inline module and, if so, its
 * `<package>.<fileName>` class name.
 */
export async function getKotlinInlineModuleInfo(
  absoluteFilePath: string
): Promise<KotlinInlineModuleInfo> {
  let contents: string;
  try {
    contents = await fs.promises.readFile(absoluteFilePath, 'utf8');
  } catch {
    warn(`Kotlin inline module '${absoluteFilePath}' could not be opened.`);
    return { hasModuleDefinition: false, classNameWithPackage: null };
  }

  if (!kotlinModuleDefinitionRegex.test(contents)) {
    return { hasModuleDefinition: false, classNameWithPackage: null };
  }

  // We want to find `package some.package` and capture the `some.package` from it.
  const pacakgeRegex = /^package\s+([\w.]+)/m;
  const packageMatch = contents.match(pacakgeRegex);
  if (!packageMatch) {
    warn(`Package name couldn't be found in ${absoluteFilePath}.`);
    return { hasModuleDefinition: true, classNameWithPackage: null };
  }

  const classNameWithPackage = `${packageMatch[1]}.${path.basename(
    absoluteFilePath,
    path.extname(absoluteFilePath)
  )}`;
  return { hasModuleDefinition: true, classNameWithPackage };
}

export function getSwiftModuleClassName(absoluteFilePath: string): string {
  return path.basename(absoluteFilePath, path.extname(absoluteFilePath));
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
  options: InlineModulesScanOptions
): Promise<InlineModulesMirror> {
  const { watchedDirectories, appRoot } = options;
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

      if (ext === '.kt') {
        const { hasModuleDefinition, classNameWithPackage } =
          await getKotlinInlineModuleInfo(absoluteFilePath);
        if (hasModuleDefinition) {
          if (classNameWithPackage === null) {
            continue;
          }
          inlineModulesMirror.kotlinClasses.push(classNameWithPackage);
        }
      } else if (ext === '.swift' && (await hasSwiftModuleDefinition(absoluteFilePath))) {
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
