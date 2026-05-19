import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';

declare module 'node:module' {
  export function _nodeModulePaths(base: string): readonly string[];
  export function _resolveFilename(mod: string, parent?: Partial<Module>): string;
  export const _extensions: Record<string, unknown>;
}

export interface ResolveFromParams {
  followSymlinks?: boolean;
  skipNodePath?: boolean;
  extensions?: readonly string[];
}

export function resolveFrom(
  fromDirectory: string,
  moduleId: string,
  params?: ResolveFromParams
): string | null {
  // We exclude extension resolution, if we're resolving a plain JSON file
  const isJSON = moduleId.endsWith('.json');
  const exts = !isJSON ? (params?.extensions ?? Object.keys(Module._extensions)) : [];

  const skipNodePath = !!params?.skipNodePath;
  const followSymlinks = params?.followSymlinks ?? skipNodePath;

  let resolved = path.resolve(fromDirectory, moduleId);

  // (1) check direct path / exact match
  const resolveType = resolveTypeSync(resolved);
  if (resolveType === ResolveType.FILE) {
    return resolved;
  }

  // (2) check against direct path matches with extensions
  for (let ext of exts) {
    ext = ext[0] !== '.' ? `.${ext}` : ext;
    const withExt = resolved + ext;
    if (resolveTypeSync(withExt) === ResolveType.FILE) {
      return withExt;
    }
  }

  const isFileSpecifier = /^\.\.?(?:$|[/\\])/.test(moduleId) || path.isAbsolute(moduleId);

  // (2.2) check against `/index` paths if we've disabled Node resolution or if we're resolving a relative path directly
  if ((isFileSpecifier || skipNodePath) && !isJSON && resolveType === ResolveType.DIR) {
    resolved = path.join(resolved, 'index');
    for (let ext of exts) {
      ext = ext[0] !== '.' ? `.${ext}` : ext;
      const withExt = resolved + ext;
      if (resolveTypeSync(withExt) === ResolveType.FILE) {
        // NOTE(@kitten): Like above, we don't resolve symlinks when we're not in a node_modules resolution path
        return withExt;
      }
    }
  }

  // We won't need to continue with Node resolution if we're only resolving paths
  if (isFileSpecifier) {
    return null;
  }

  // (3) if we're not following symlinks, we try to resolve against `node_modules` folders unresolved
  if (!followSymlinks || skipNodePath) {
    const resolvedDir = path.resolve(fromDirectory);
    const moduleDirs = Module._nodeModulePaths(resolvedDir);
    for (const modulesDir of moduleDirs) {
      let candidate = path.join(modulesDir, moduleId);
      const resolveType = resolveTypeSync(candidate);
      // (3.1) direct match
      if (resolveType === ResolveType.FILE) {
        return candidate;
      }
      // (3.2) check against match with extensions
      for (let ext of exts) {
        ext = ext[0] !== '.' ? `.${ext}` : ext;
        const candidateWithExt = candidate + ext;
        if (resolveTypeSync(candidateWithExt) === ResolveType.FILE) {
          return followSymlinks ? maybeResolve(candidateWithExt) : candidateWithExt;
        }
      }
      // (3.3) check against `/index` paths
      if (!isJSON && resolveType === ResolveType.DIR) {
        candidate = path.join(candidate, 'index');
        for (let ext of exts) {
          ext = ext[0] !== '.' ? `.${ext}` : ext;
          const candidateWithExt = candidate + ext;
          if (resolveTypeSync(candidateWithExt) === ResolveType.FILE) {
            return followSymlinks ? maybeResolve(candidateWithExt) : candidateWithExt;
          }
        }
      }
    }
  }

  // (4): Fallback to native Node resolution, if `skipNodePath` is disabled
  return !skipNodePath ? nativeResolveFrom(fromDirectory, moduleId) : null;
}

function nativeResolveFrom(fromDirectory: string, moduleId: string): string | null {
  try {
    const resolvedDir = maybeResolve(fromDirectory);
    const fromFile = path.join(resolvedDir, 'index.js');
    return Module._resolveFilename(moduleId, {
      id: fromFile,
      filename: fromFile,
      paths: [...Module._nodeModulePaths(resolvedDir)],
    });
  } catch {
    return null;
  }
}

function isRealpathFileSync(target: string): boolean {
  try {
    const realpath = fs.realpathSync(target);
    return !!fs.lstatSync(realpath, { throwIfNoEntry: false })?.isFile();
  } catch {
    return false;
  }
}

const enum ResolveType {
  FILE = 1,
  DIR = 2,
  ENOENT = 0,
}

function resolveTypeSync(target: string): ResolveType {
  try {
    const stat = fs.lstatSync(target, { throwIfNoEntry: false });
    if (stat) {
      if (stat.isSymbolicLink()) {
        return isRealpathFileSync(target) ? ResolveType.FILE : ResolveType.ENOENT;
      } else if (stat.isFile()) {
        return ResolveType.FILE;
      } else if (stat.isDirectory()) {
        // NOTE(@kitten): We don't support symlinked directories for resolution
        // Realistically, when we disable Node resolution, symlinked directory resolution
        // for `/index` is rare, and can be used to exploit symlinks
        return ResolveType.DIR;
      } else {
        return ResolveType.ENOENT;
      }
    } else {
      return ResolveType.ENOENT;
    }
  } catch {
    return ResolveType.ENOENT;
  }
}

function maybeResolve(target: string): string {
  target = path.resolve(process.cwd(), target);
  try {
    return fs.realpathSync(target);
  } catch {
    return target;
  }
}
