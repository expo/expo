import resolveFrom from 'resolve-from';

import { CommandError } from '../../../utils/errors';

// These resolvers enable us to test the CLI in older projects.
// We may be able to get rid of this in the future.
// TODO: Maybe combine with AsyncResolver?
class WebpackImportError extends CommandError {
  constructor(projectRoot: string, moduleId: string) {
    super(
      'WEBPACK_IMPORT',
      `Missing package "${moduleId}" in the project. Try running the command again. (cwd: ${projectRoot})`
    );
  }
}

function resolveFromProject(projectRoot: string, moduleId: string) {
  const resolvedPath = resolveFrom.silent(projectRoot, moduleId);
  if (!resolvedPath) {
    throw new WebpackImportError(projectRoot, moduleId);
  }
  return resolvedPath;
}

function importFromProject(projectRoot: string, moduleId: string) {
  return require(resolveFromProject(projectRoot, moduleId));
}

/** Import `webpack` from the project. */
export function importWebpackFromProject(projectRoot: string): typeof import('webpack') {
  return importFromProject(projectRoot, 'webpack');
}

/** Import `@expo/webpack-config` from the project. */
export function importExpoWebpackConfigFromProject(
  projectRoot: string
): typeof import('@expo/webpack-config') {
  return importFromProject(projectRoot, '@expo/webpack-config');
}

/** Import `webpack-dev-server` from the project. */
export function importWebpackDevServerFromProject(
  projectRoot: string
): typeof import('webpack-dev-server') {
  return importFromProject(projectRoot, 'webpack-dev-server');
}
