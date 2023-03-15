import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getPackageJson } from '../Config';
import { PackageJSONConfig } from '../Config.types';
import { getBareExtensions } from './extensions';

const nativePlatforms = ['ios', 'android'];

/** @returns the absolute entry file for an Expo project. */
export function resolveEntryPoint(
  projectRoot: string,
  { platform, pkg }: { platform: string; pkg?: PackageJSONConfig }
): string {
  const platforms = nativePlatforms.includes(platform) ? [platform, 'native'] : [platform];
  const extensions = getBareExtensions(platforms);
  return getEntryPointWithExtensions(projectRoot, { extensions, pkg });
}

// Used to resolve the main entry file for a project.
export function getEntryPointWithExtensions(
  projectRoot: string,
  {
    extensions,
    pkg = getPackageJson(projectRoot),
  }: {
    extensions: string[];
    pkg?: PackageJSONConfig;
  }
): string {
  // If the config doesn't define a custom entry then we want to look at the `package.json`s `main` field, and try again.
  const { main } = pkg;
  if (main && typeof main === 'string') {
    // Testing the main field against all of the provided extensions - for legacy reasons we can't use node module resolution as the package.json allows you to pass in a file without a relative path and expect it as a relative path.
    let entry = getFileWithExtensions(projectRoot, main, extensions);
    if (!entry) {
      // Allow for paths like: `{ "main": "expo/AppEntry" }`
      entry = resolveFromSilentWithExtensions(projectRoot, main, extensions);
      if (!entry)
        throw new Error(
          `Cannot resolve entry file: The \`main\` field defined in your \`package.json\` points to an unresolvable or non-existent path.`
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
    throw new Error(
      `The project entry file could not be resolved. Please define it in the \`main\` field of the \`package.json\`, create an \`index.js\`, or install the \`expo\` package.`
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
    if (modulePath && modulePath.endsWith(extension)) {
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
