import resolveFrom from 'resolve-from';

// These resolvers enable us to test the CLI in older projects.
// We may be able to get rid of this in the future.
// TODO: Maybe combine with AsyncResolver?
class MetroImportError extends Error {
  constructor(projectRoot: string, moduleId: string) {
    super(
      `Missing package "${moduleId}" in the project at: ${projectRoot}\n` +
        'This usually means `react-native` is not installed. ' +
        'Please verify that dependencies in package.json include "react-native" ' +
        'and run `yarn` or `npm install`.'
    );
  }
}

function resolveFromProject(projectRoot: string, moduleId: string) {
  const resolvedPath = resolveFrom.silent(projectRoot, moduleId);
  if (!resolvedPath) {
    throw new MetroImportError(projectRoot, moduleId);
  }
  return resolvedPath;
}

function importFromProject(projectRoot: string, moduleId: string) {
  return require(resolveFromProject(projectRoot, moduleId));
}

/** Import `metro` from the project. */
export function importMetroFromProject(projectRoot: string): typeof import('metro') {
  return importFromProject(projectRoot, 'metro');
}

/** Import `@expo/metro-config` from the project. */
export function importExpoMetroConfigFromProject(
  projectRoot: string
): typeof import('@expo/metro-config') {
  return importFromProject(projectRoot, '@expo/metro-config');
}
