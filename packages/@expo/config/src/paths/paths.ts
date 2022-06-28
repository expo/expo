import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getConfig } from '../Config';
import { ProjectConfig } from '../Config.types';
import { getBareExtensions } from './extensions';

// https://github.com/facebook/create-react-app/blob/9750738cce89a967cc71f28390daf5d4311b193c/packages/react-scripts/config/paths.js#L22
export function ensureSlash(inputPath: string, needsSlash: boolean): string {
  const hasSlash = inputPath.endsWith('/');
  if (hasSlash && !needsSlash) {
    return inputPath.substr(0, inputPath.length - 1);
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

export function resolveEntryPoint(
  projectRoot: string,
  { platform, projectConfig }: { platform: string; projectConfig?: ProjectConfig }
) {
  const platforms = nativePlatforms.includes(platform) ? [platform, 'native'] : [platform];
  return getEntryPoint(projectRoot, ['./index'], platforms, projectConfig);
}

export function getEntryPoint(
  projectRoot: string,
  entryFiles: string[],
  platforms: string[],
  projectConfig?: ProjectConfig
): string | null {
  const extensions = getBareExtensions(platforms);
  return getEntryPointWithExtensions(projectRoot, entryFiles, extensions, projectConfig);
}

// Used to resolve the main entry file for a project.
export function getEntryPointWithExtensions(
  projectRoot: string,
  entryFiles: string[],
  extensions: string[],
  projectConfig?: ProjectConfig
): string {
  const { exp, pkg } = projectConfig ?? getConfig(projectRoot, { skipSDKVersionRequirement: true });

  // This will first look in the `app.json`s `expo.entryPoint` field for a potential main file.
  // We check the Expo config first in case you want your project to start differently with Expo then in a standalone environment.
  if (exp && exp.entryPoint && typeof exp.entryPoint === 'string') {
    // If the field exists then we want to test it against every one of the supplied extensions
    // to ensure the bundler resolves the same way.
    let entry = getFileWithExtensions(projectRoot, exp.entryPoint, extensions);
    if (!entry) {
      // Allow for paths like: `{ "main": "expo/AppEntry" }`
      entry = resolveFromSilentWithExtensions(projectRoot, exp.entryPoint, extensions);

      // If it doesn't resolve then just return the entryPoint as-is. This makes
      // it possible for people who have an unconventional setup (eg: multiple
      // apps in monorepo with metro at root) to customize entry point without
      // us imposing our assumptions.
      if (!entry) {
        return exp.entryPoint;
      }
    }
    return entry;
  } else if (pkg) {
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
            `Cannot resolve entry file: The \`main\` field defined in your \`package.json\` points to a non-existent path.`
          );
      }
      return entry;
    }
  }

  // Now we will start looking for a default entry point using the provided `entryFiles` argument.
  // This will add support for create-react-app (src/index.js) and react-native-cli (index.js) which don't define a main.
  for (const fileName of entryFiles) {
    const entry = resolveFromSilentWithExtensions(projectRoot, fileName, extensions);
    if (entry) return entry;
  }

  try {
    // If none of the default files exist then we will attempt to use the main Expo entry point.
    // This requires `expo` to be installed in the project to work as it will use `node_module/expo/AppEntry.js`
    // Doing this enables us to create a bare minimum Expo project.

    // TODO(Bacon): We may want to do a check against `./App` and `expo` in the `package.json` `dependencies` as we can more accurately ensure that the project is expo-min without needing the modules installed.
    return resolveFrom(projectRoot, 'expo/AppEntry');
  } catch {
    throw new Error(
      `The project entry file could not be resolved. Please either define it in the \`package.json\` (main), \`app.json\` (expo.entryPoint), create an \`index.js\`, or install the \`expo\` package.`
    );
  }
}

// Resolve from but with the ability to resolve like a bundler
export function resolveFromSilentWithExtensions(
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
