import fs from 'fs/promises';
import process from 'node:process';
import path from 'path';
import picomatch, { type PicomatchOptions } from 'picomatch';

export interface PathMatchObject {
  pattern: string;
  negate: boolean;
  match: (filePath: string) => boolean;
}

// NOTE(@kitten): Minimatch only gives parentheses and pipes special meaning inside extglobs.
function escapeLiteralParentheses(pattern: string, noext = false): string {
  const literalParentheses: boolean[] = [];
  return pattern.replace(/\\.|\[(?:\\.|[^\]\\])*\]|([?*+@!])?\(|\)|\|/g, (token, extglob) => {
    if (token.startsWith('\\') || token.startsWith('[')) return token;
    if (token === '|') return literalParentheses.at(-1) === false ? token : '\\|';
    if (token.endsWith('(')) {
      const literal = noext || (!extglob && literalParentheses.at(-1) !== false);
      literalParentheses.push(literal);
      return literal ? `${extglob ?? ''}\\(` : token;
    }
    return literalParentheses.pop() === false ? token : '\\)';
  });
}

function createPathMatchObject(pattern: string, options: PicomatchOptions): PathMatchObject {
  const comment = pattern.startsWith('#');
  let negate = false;
  while (pattern.startsWith('!')) {
    negate = !negate;
    pattern = pattern.slice(1);
  }
  // NOTE(@kitten): Compile regexes so literal brackets cannot bypass glob matching.
  const expression = pattern
    ? picomatch.makeRe(escapeLiteralParentheses(pattern, options.noext), {
        literalBrackets: false,
        posix: true,
        strictSlashes: true,
        ...options,
        nonegate: true,
      })
    : /^$/;
  return {
    pattern,
    negate,
    match: (filePath) => {
      if (comment) return false;
      if (options.basename) filePath = path.basename(filePath);
      const normalizedPath = pattern.endsWith('/') ? filePath : filePath.replace(/\/$/, '');
      const matches = expression.test(filePath) || expression.test(normalizedPath);
      return negate !== matches;
    },
  };
}

/**
 * Indicate the given `filePath` should be excluded by the `ignorePaths`.
 */
export function isIgnoredPath(
  filePath: string,
  ignorePaths: string[],
  matchOptions: PicomatchOptions = { dot: true }
): boolean {
  const matchObjects = buildPathMatchObjects(ignorePaths, matchOptions);
  return isIgnoredPathWithMatchObjects(filePath, matchObjects);
}

/**
 * Prebuild match objects for `isIgnoredPathWithMatchObjects` calls.
 */
export function buildPathMatchObjects(
  paths: string[],
  matchOptions: PicomatchOptions = { dot: true }
): PathMatchObject[] {
  return paths.map((filePath) => createPathMatchObject(filePath, matchOptions));
}

/**
 * Append a new ignore path to the given `matchObjects`.
 */
export function appendIgnorePath(
  matchObjects: PathMatchObject[],
  path: string,
  matchOptions: PicomatchOptions = { dot: true }
) {
  matchObjects.push(createPathMatchObject(path, matchOptions));
}

/**
 * Build an ignore match objects for directories based on the given `ignorePathMatchObjects`.
 */
export function buildDirMatchObjects(
  ignorePathMatchObjects: PathMatchObject[],
  matchOptions: PicomatchOptions = { dot: true }
): PathMatchObject[] {
  const dirIgnorePatterns: string[] = [];
  const ignorePaths = ignorePathMatchObjects.filter((obj) => !obj.negate).map((obj) => obj.pattern);
  const negatedIgnorePaths = ignorePathMatchObjects
    .filter((obj) => obj.negate)
    .map((obj) => obj.pattern);

  // [0] Add positive patterns to dirIgnorePatterns
  for (const pattern of ignorePaths) {
    if (pattern.endsWith('/**/*')) {
      // `/**/*` matches
      dirIgnorePatterns.push(pattern.slice(0, -5));
    } else if (pattern.endsWith('/**')) {
      // `/**` by default matches directories
      dirIgnorePatterns.push(pattern.slice(0, -3));
    } else if (pattern.endsWith('/')) {
      // `/` suffix matches directories
      dirIgnorePatterns.push(pattern.slice(0, -1));
    }
  }

  // [1] If there is a negate pattern in the same directory, we should remove the existing directory.
  for (const pattern of negatedIgnorePaths) {
    for (let i = 0; i < dirIgnorePatterns.length; ++i) {
      const existingPattern = dirIgnorePatterns[i];
      if (existingPattern != null && isSubDirectory(existingPattern, pattern)) {
        dirIgnorePatterns.splice(i, 1);
      }
    }
  }

  return dirIgnorePatterns.map((pattern) => createPathMatchObject(pattern, matchOptions));
}

/**
 * Indicate the given `filePath` should be excluded by the prebuilt `matchObjects`.
 */
export function isIgnoredPathWithMatchObjects(
  filePath: string,
  matchObjects: PathMatchObject[]
): boolean {
  let result = false;
  for (const matchObject of matchObjects) {
    const stripParentPrefix = matchObject.pattern.startsWith('**/');
    const normalizedFilePath = normalizeFilePath(filePath, { stripParentPrefix });
    const currMatch = matchObject.match(normalizedFilePath);
    if (matchObject.negate && result && !currMatch) {
      // Special handler for negate (!pattern).
      // As long as previous match result is true and not matched from the current negate pattern, we should early return.
      return false;
    }
    if (!matchObject.negate) {
      result ||= currMatch;
    }
  }
  return result;
}

/**
 * Returns true if `parent` is a parent directory of `child`.
 */
function isSubDirectory(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

const STRIP_PARENT_PREFIX_REGEX = /^(\.\.\/)+/g;

/**
 * Normalize the given `filePath` to be used for matching against `ignorePaths`.
 *
 * @param filePath The file path to normalize.
 * @param options.stripParentPrefix
 *   When people use fingerprint inside a monorepo, they may get source files from parent directories.
 *   However, '**' doesn't match the parent directories.
 *   We need to strip the `../` prefix to match the node_modules from parent directories.
 */
export function normalizeFilePath(filePath: string, options: { stripParentPrefix?: boolean }) {
  if (options.stripParentPrefix) {
    return filePath.replace(STRIP_PARENT_PREFIX_REGEX, '');
  }
  return filePath;
}

const REGEXP_REPLACE_SLASHES = /\\/g;

/**
 * Convert any platform-specific path to a POSIX path.
 */
export function toPosixPath(filePath: string): string {
  return process.platform === 'win32' ? filePath.replace(REGEXP_REPLACE_SLASHES, '/') : filePath;
}

/**
 * Check if the given `filePath` exists.
 */
export async function pathExistsAsync(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() || stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Given a posix path inside `node_modules`, return the owning package's `package.json` path.
 * Returns null when the path is not inside `node_modules`. Handles scoped packages (`@scope/name`).
 */
export function getNodeModulesPackageJsonPath(relativePosixPath: string): string | null {
  const marker = 'node_modules/';
  const markerIndex = relativePosixPath.lastIndexOf(marker);
  if (markerIndex === -1) {
    return null;
  }
  const prefix = relativePosixPath.slice(0, markerIndex + marker.length);
  const segments = relativePosixPath.slice(markerIndex + marker.length).split('/');
  if (!segments[0]) {
    return null;
  }
  let packageDir: string;
  if (segments[0].startsWith('@')) {
    if (!segments[1]) {
      return null;
    }
    packageDir = `${prefix}${segments[0]}/${segments[1]}`;
  } else {
    packageDir = `${prefix}${segments[0]}`;
  }
  return `${packageDir}/package.json`;
}
