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
  extensions?: readonly string[];
}

export function resolveFrom(
  fromDirectory: string,
  moduleId: string,
  params?: ResolveFromParams
): string | null {
  const exts = params?.extensions ?? Object.keys(Module._extensions);
  const resolved = path.resolve(fromDirectory, moduleId);
  // (1) check direct path / exact match
  if (fs.existsSync(resolved)) {
    return resolved;
  }

  // (2) check against direct path matches with extensions
  for (let ext of exts) {
    ext = ext[0] !== '.' ? `.${ext}` : ext;
    const withExt = resolved + ext;
    if (fs.existsSync(withExt)) {
      return withExt;
    }
  }

  // (3) if we're not following symlinks, we try to resolve against `node_modules` folders unresolved
  if (!params?.followSymlinks) {
    const resolvedDir = path.resolve(fromDirectory);
    const moduleDirs = Module._nodeModulePaths(resolvedDir);
    for (const modulesDir of moduleDirs) {
      const candidate = path.join(modulesDir, moduleId);
      // (3.1) direct match
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      // (3.2) check against match with extensions
      for (let ext of exts) {
        ext = ext[0] !== '.' ? `.${ext}` : ext;
        const candidateWithExt = candidate + ext;
        if (fs.existsSync(candidateWithExt)) {
          return candidateWithExt;
        }
      }
    }
  }

  // (4): Fallback to native Node resolution
  return nativeResolveFrom(fromDirectory, moduleId);
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

function maybeResolve(target: string): string {
  target = path.resolve(process.cwd(), target);
  try {
    return fs.realpathSync(target);
  } catch {
    return target;
  }
}
