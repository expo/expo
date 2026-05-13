import { resolveFrom } from '@expo/require-utils';
import fs from 'fs';
import path from 'path';
import { getWorkspaceGlobs, resolveWorkspaceRoot } from 'resolve-workspace-root';

import { env } from './env';
import { getBareExtensions } from './extensions';
import { getPackageJson } from '../Config';
import type { PackageJSONConfig } from '../Config.types';
import { ConfigError } from '../Errors';

// https://github.com/facebook/create-react-app/blob/9750738cce89a967cc71f28390daf5d4311b193c/packages/react-scripts/config/paths.js#L22
export function ensureSlash(inputPath: string, needsSlash: boolean): string {
  const hasSlash = inputPath.endsWith('/');
  if (hasSlash && !needsSlash) {
    return inputPath.substring(0, inputPath.length - 1);
  } else if (!hasSlash && needsSlash) {
    return `${inputPath}/`;
  } else {
    return inputPath;
  }
}

export function getPossibleProjectRoot(): string {
  return fs.realpathSync(process.cwd());
}

const nativePlatforms = ['ios', 'android'];

/** @returns the absolute entry file for an Expo project. */
export function resolveEntryPoint(
  projectRoot: string,
  {
    platform,
    pkg = getPackageJson(projectRoot),
  }: {
    platform?: string;
    pkg?: PackageJSONConfig;
  } = {}
): string {
  const platforms = !platform
    ? []
    : nativePlatforms.includes(platform)
      ? [platform, 'native']
      : [platform];
  const extensions = getBareExtensions(platforms);

  // If the config doesn't define a custom entry then we want to look at the `package.json`s `main` field, and try again.
  const { main } = pkg;
  if (main && typeof main === 'string') {
    // Allow for paths like: `{ "main": "expo/AppEntry" }`
    const entry = resolveFrom(projectRoot, main, { extensions });
    if (!entry) {
      throw new ConfigError(
        `Cannot resolve entry file: The \`main\` field defined in your \`package.json\` points to an unresolvable or non-existent path.`,
        'ENTRY_NOT_FOUND'
      );
    }
    return entry;
  }

  // Check for a root index.* file in the project root.
  let entry = resolveFrom(projectRoot, './index', { extensions });
  if (entry) {
    return entry;
  }

  // If none of the default files exist then we will attempt to use the main Expo entry point.
  // This requires `expo` to be installed in the project to work as it will use `node_module/expo/AppEntry.js`
  // Doing this enables us to create a bare minimum Expo project.

  // TODO(Bacon): We may want to do a check against `./App` and `expo` in the `package.json` `dependencies` as we can more accurately ensure that the project is expo-min without needing the modules installed.
  entry = resolveFrom(projectRoot, 'expo/AppEntry', { extensions });
  if (!entry) {
    throw new ConfigError(
      `The project entry file could not be resolved. Define it in the \`main\` field of the \`package.json\`, create an \`index.js\`, or install the \`expo\` package.`,
      'ENTRY_NOT_FOUND'
    );
  }

  return entry;
}

// Statically attempt to resolve a module but with the ability to resolve like a bundler.
// This won't use node module resolution.
/** @deprecated */
export function getFileWithExtensions(
  fromDirectory: string,
  moduleId: string,
  extensions: string[]
): string | null {
  const modulePath = path.join(fromDirectory, moduleId);
  if (fs.existsSync(modulePath)) {
    return modulePath;
  }
  for (const extension of extensions) {
    const modulePath = path.join(fromDirectory, `${moduleId}.${extension}`);
    if (fs.existsSync(modulePath)) {
      return modulePath;
    }
  }
  return null;
}

const _metroServerRootCache = new Map<string, string>();

/** Get the Metro server root, when working in monorepos */
export function getMetroServerRoot(projectRoot: string): string {
  if (env.EXPO_NO_METRO_WORKSPACE_ROOT) {
    return projectRoot;
  }

  projectRoot = path.resolve(projectRoot);

  let serverRoot: string | null | undefined = _metroServerRootCache.get(projectRoot);
  if (serverRoot != null) {
    return serverRoot;
  }

  serverRoot = resolveWorkspaceRoot(projectRoot);
  if (serverRoot != null) {
    serverRoot = path.resolve(serverRoot);
    _metroServerRootCache.set(projectRoot, serverRoot);
  }

  return serverRoot ?? projectRoot;
}

/**
 * Get the workspace globs for Metro's watchFolders.
 * @note This does not traverse the monorepo, and should be used with `getMetroServerRoot`
 */
export function getMetroWorkspaceGlobs(monorepoRoot: string): string[] | null {
  return getWorkspaceGlobs(monorepoRoot);
}

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

// TODO: Move to internals
/**
 * Convert an absolute entry point to a server or project root relative filepath.
 * This is useful on Android where the entry point is an absolute path.
 * @deprecated
 */
export function convertEntryPointToRelative(
  projectRoot: string,
  absolutePath: string,
  extname: string | null = '.js'
) {
  if (!path.isAbsolute(absolutePath)) {
    absolutePath = path.resolve(process.cwd(), projectRoot, absolutePath);
  }

  // The project root could be using a different root on MacOS (`/var` vs `/private/var`)
  // We need to make sure to get the non-symlinked path to the server or project root.
  let serverRoot = getMetroServerRoot(projectRoot);
  try {
    const realServerRoot = fs.realpathSync(serverRoot);
    // If the absolute path already starts with the resolved server root, use it directly
    if (absolutePath.startsWith(realServerRoot + path.sep)) {
      serverRoot = realServerRoot;
    } else if (absolutePath.startsWith(serverRoot + path.sep)) {
      // If the absolute path starts with the (possibly symlinked) server root, preserve it as-is
    } else {
      // Otherwise, resolve the absolute path to check if it matches the real server root.
      // This is only needed when absolutePath doesn't match either root representation,
      // and absolutePath may not be valid (e.g. non-existent file)
      try {
        const realAbsolutePath = fs.realpathSync(absolutePath);
        if (realAbsolutePath.startsWith(realServerRoot + path.sep)) {
          serverRoot = realServerRoot;
          absolutePath = realAbsolutePath;
        } else if (realServerRoot !== serverRoot || realAbsolutePath !== absolutePath) {
          // Last resort: fall back to the legacy behavior of using the realpath for both,
          // without knowing if the resulting relative path will be valid
          serverRoot = realServerRoot;
          absolutePath = realAbsolutePath;
        }
      } catch {}
    }
  } catch {
    // NOTE: `fs.realpathSync` can fail if `projectRoot` doesn't exist (e.g. mocked folder)
  }

  let entry = toPosixPath(path.relative(serverRoot, absolutePath));

  // Strip extname, if it's set and trivially resolvable by Metro
  if (extname != null) {
    if (extname[0] !== '.') {
      extname = `.${extname}`;
    }
    if (entry.endsWith(extname)) {
      entry = entry.slice(0, -extname.length);
    }
  }

  return entry;
}

// TODO: Move to internals
/**
 * Resolve the entry point relative to either the server or project root.
 * This relative entry path should be used to pass non-absolute paths to Metro,
 * accounting for possible monorepos and keeping the cache sharable (no absolute paths).
 * @deprecated
 */
export const resolveRelativeEntryPoint: typeof resolveEntryPoint = (projectRoot, options) => {
  return convertEntryPointToRelative(projectRoot, resolveEntryPoint(projectRoot, options));
};
