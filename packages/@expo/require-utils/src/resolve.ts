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

  const resolved = path.resolve(fromDirectory, moduleId);
  // (1) check direct path / exact match
  if (isResolvableSync(resolved)) {
    return resolved;
  }

  // (2) check against direct path matches with extensions
  for (let ext of exts) {
    ext = ext[0] !== '.' ? `.${ext}` : ext;
    const withExt = resolved + ext;
    if (isResolvableSync(withExt)) {
      return withExt;
    }
  }

  // NOTE: We allow file specifier (relative paths) to be passed in
  // We won't need to continue with Node resolution if we're only resolving paths
  const isFileSpecifier = /^\.\.?(?:$|[/\\])/.test(moduleId) || path.isAbsolute(moduleId);
  if (isFileSpecifier) {
    return null;
  }

  // (3) if we're not following symlinks, we try to resolve against `node_modules` folders unresolved
  if (!followSymlinks || skipNodePath) {
    const resolvedDir = path.resolve(fromDirectory);
    const moduleDirs = Module._nodeModulePaths(resolvedDir);
    for (const modulesDir of moduleDirs) {
      const candidate = path.join(modulesDir, moduleId);
      // (3.1) direct match
      if (isResolvableSync(candidate)) {
        return candidate;
      }
      // (3.2) check against match with extensions
      for (let ext of exts) {
        ext = ext[0] !== '.' ? `.${ext}` : ext;
        const candidateWithExt = candidate + ext;
        if (isResolvableSync(candidateWithExt)) {
          return followSymlinks ? maybeResolve(candidateWithExt) : candidateWithExt;
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

function isResolvableSync(target: string): boolean {
  try {
    const stat = fs.lstatSync(target, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) {
      return isRealpathFileSync(target);
    } else if (stat?.isFile()) {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
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
