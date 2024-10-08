import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';
import { resolveWorkspaceRoot } from 'resolve-workspace-root';

import { env } from './env';
import { getBareExtensions } from './extensions';
import { getPackageJson } from '../Config';
import { PackageJSONConfig } from '../Config.types';
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
    // Testing the main field against all of the provided extensions - for legacy reasons we can't use node module resolution as the package.json allows you to pass in a file without a relative path and expect it as a relative path.
    let entry = getFileWithExtensions(projectRoot, main, extensions);
    if (!entry) {
      // Allow for paths like: `{ "main": "expo/AppEntry" }`
      entry = resolveFromSilentWithExtensions(projectRoot, main, extensions);
      if (!entry)
        throw new ConfigError(
          `Cannot resolve entry file: The \`main\` field defined in your \`package.json\` points to an unresolvable or non-existent path.`,
          'ENTRY_NOT_FOUND'
        );
    }
    return entry;
  }

  // Check for a root index.* file in the project root.
  const entry = resolveFromSilentWithExtensions(projectRoot, './index', extensions);
  if (entry) {
    return entry;
  }

  try {
    // If none of the default files exist then we will attempt to use the main Expo entry point.
    // This requires `expo` to be installed in the project to work as it will use `node_module/expo/AppEntry.js`
    // Doing this enables us to create a bare minimum Expo project.

    // TODO(Bacon): We may want to do a check against `./App` and `expo` in the `package.json` `dependencies` as we can more accurately ensure that the project is expo-min without needing the modules installed.
    return resolveFrom(projectRoot, 'expo/AppEntry');
  } catch {
    throw new ConfigError(
      `The project entry file could not be resolved. Define it in the \`main\` field of the \`package.json\`, create an \`index.js\`, or install the \`expo\` package.`,
      'ENTRY_NOT_FOUND'
    );
  }
}

// Resolve from but with the ability to resolve like a bundler
function resolveFromSilentWithExtensions(
  fromDirectory: string,
  moduleId: string,
  extensions: string[]
): string | null {
  for (const extension of extensions) {
    const modulePath = resolveFrom.silent(fromDirectory, `${moduleId}.${extension}`);
    if (modulePath?.endsWith(extension)) {
      return modulePath;
    }
  }
  return resolveFrom.silent(fromDirectory, moduleId) || null;
}

// Statically attempt to resolve a module but with the ability to resolve like a bundler.
// This won't use node module resolution.
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

/** Get the Metro server root, when working in monorepos */
export function getMetroServerRoot(projectRoot: string): string {
  if (env.EXPO_NO_METRO_WORKSPACE_ROOT) {
    return projectRoot;
  }

  return resolveWorkspaceRoot(projectRoot) ?? projectRoot;
}

/**
 * Convert an absolute entry point to a server or project root relative filepath.
 * This is useful on Android where the entry point is an absolute path.
 */
export function convertEntryPointToRelative(projectRoot: string, absolutePath: string) {
  // The project root could be using a different root on MacOS (`/var` vs `/private/var`)
  // We need to make sure to get the non-symlinked path to the server or project root.
  return path.relative(
    fs.realpathSync(getMetroServerRoot(projectRoot)),
    fs.realpathSync(absolutePath)
  );
}

/**
 * Resolve the entry point relative to either the server or project root.
 * This relative entry path should be used to pass non-absolute paths to Metro,
 * accounting for possible monorepos and keeping the cache sharable (no absolute paths).
 */
export const resolveRelativeEntryPoint: typeof resolveEntryPoint = (projectRoot, options) => {
  return convertEntryPointToRelative(projectRoot, resolveEntryPoint(projectRoot, options));
};
