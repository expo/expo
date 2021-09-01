const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const debug = require('debug')('workspaces');
const findYarnWorkspaceRoot = require('find-yarn-workspace-root');
const globModule = require('glob');
const path = require('path');
const util = require('util');

const glob = util.promisify(globModule);
const getSymlinkedNodeModulesForDirectory = require('./common/get-symlinked-modules');

/**
 * Returns a webpack configuration object that:
 *
 *    * transpiles symlinked workspace packages
 *    * watches for file changes in symlinked packages
 *    * allows for additional custom packages to be transpiled via env.babel argument
 */
exports.createWebpackConfigAsync = async function createWebpackConfigAsync(env, argv) {
  const workspacePackagesToTranspile = [];
  const workspaceRootPath = findYarnWorkspaceRoot(env.projectRoot);

  if (workspaceRootPath) {
    debug(`Found Yarn workspace root at %s`, workspaceRootPath);

    const symlinkedModules = getSymlinkedNodeModulesForDirectory(workspaceRootPath);
    const symlinkedModulePaths = Object.values(symlinkedModules);
    const workspacePackage = require(path.resolve(workspaceRootPath, 'package.json'));

    // discover workspace package directories via glob - source yarn:
    // https://github.com/yarnpkg/yarn/blob/a4708b29ac74df97bac45365cba4f1d62537ceb7/src/config.js#L812-L826
    const patterns = workspacePackage.workspaces?.packages ?? workspacePackage.workspaces ?? [];
    const registryFilenames = 'package.json';
    const trailingPattern = `/+(${registryFilenames})`;

    const files = await Promise.all(
      patterns.map((pattern) =>
        glob(pattern.replace(/\/?$/, trailingPattern), {
          cwd: workspaceRootPath,
          ignore: `/node_modules/**/+(${registryFilenames})`,
        })
      )
    );

    for (const file of new Set(files.flat())) {
      const packageDirectory = path.join(workspaceRootPath, path.dirname(file));
      if (symlinkedModulePaths.includes(packageDirectory)) {
        workspacePackagesToTranspile.push(packageDirectory);
      }
    }
  } else {
    debug(`Could not find Yarn workspace root`);
  }

  env.babel = env.babel ?? {};

  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          ...workspacePackagesToTranspile,
          ...(env.babel.dangerouslyAddModulePathsToTranspile ?? []),
        ],
      },
    },
    argv
  );

  // use symlink resolution so that webpack watches file changes
  config.resolve.symlinks = true;

  return config;
};
