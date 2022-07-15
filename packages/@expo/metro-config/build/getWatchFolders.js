"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWatchFolders = getWatchFolders;
exports.globAllPackageJsonPaths = globAllPackageJsonPaths;
exports.resolveAllWorkspacePackageJsonPaths = resolveAllWorkspacePackageJsonPaths;

function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));

  _jsonFile = function () {
    return data;
  };

  return data;
}

function _assert() {
  const data = _interopRequireDefault(require("assert"));

  _assert = function () {
    return data;
  };

  return data;
}

function _glob() {
  const data = require("glob");

  _glob = function () {
    return data;
  };

  return data;
}

function _path() {
  const data = _interopRequireDefault(require("path"));

  _path = function () {
    return data;
  };

  return data;
}

function _getModulesPaths() {
  const data = require("./getModulesPaths");

  _getModulesPaths = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param workspaceProjectRoot Root file path for the yarn workspace
 * @param linkedPackages List of folders that contain linked node modules, ex: `['packages/*', 'apps/*']`
 * @returns List of valid package.json file paths, ex: `['/Users/me/app/apps/my-app/package.json', '/Users/me/app/packages/my-package/package.json']`
 */
function globAllPackageJsonPaths(workspaceProjectRoot, linkedPackages) {
  return linkedPackages.map(glob => {
    return (0, _glob().sync)(_path().default.join(glob, 'package.json').replace(/\\/g, '/'), {
      cwd: workspaceProjectRoot,
      absolute: true,
      ignore: ['**/@(Carthage|Pods|node_modules)/**']
    }).map(pkgPath => {
      try {
        _jsonFile().default.read(pkgPath);

        return pkgPath;
      } catch {// Skip adding path if the package.json is invalid or cannot be read.
      }

      return null;
    });
  }).flat().filter(Boolean).map(p => _path().default.join(p));
}

function getWorkspacePackagesArray({
  workspaces
}) {
  if (Array.isArray(workspaces)) {
    return workspaces;
  }

  (0, _assert().default)(workspaces === null || workspaces === void 0 ? void 0 : workspaces.packages, 'Could not find a `workspaces` object in the root package.json');
  return workspaces.packages;
}
/**
 * @param workspaceProjectRoot root file path for a yarn workspace.
 * @returns list of package.json file paths that are linked to the yarn workspace.
 */


function resolveAllWorkspacePackageJsonPaths(workspaceProjectRoot) {
  try {
    const rootPackageJsonFilePath = _path().default.join(workspaceProjectRoot, 'package.json'); // Could throw if package.json is invalid.


    const rootPackageJson = _jsonFile().default.read(rootPackageJsonFilePath); // Extract the "packages" array or use "workspaces" as packages array (yarn workspaces spec).


    const packages = getWorkspacePackagesArray(rootPackageJson); // Glob all package.json files and return valid paths.

    return globAllPackageJsonPaths(workspaceProjectRoot, packages);
  } catch {
    return [];
  }
}
/**
 * @param projectRoot file path to app's project root
 * @returns list of node module paths to watch in Metro bundler, ex: `['/Users/me/app/node_modules/', '/Users/me/app/apps/my-app/', '/Users/me/app/packages/my-package/']`
 */


function getWatchFolders(projectRoot) {
  const workspaceRoot = (0, _getModulesPaths().getWorkspaceRoot)(_path().default.resolve(projectRoot)); // Rely on default behavior in standard projects.

  if (!workspaceRoot) {
    return [];
  }

  const packages = resolveAllWorkspacePackageJsonPaths(workspaceRoot);

  if (!packages.length) {
    return [];
  }

  return uniqueItems([_path().default.join(workspaceRoot, 'node_modules'), ...packages.map(pkg => _path().default.dirname(pkg))]);
}

function uniqueItems(items) {
  return [...new Set(items)];
}
//# sourceMappingURL=getWatchFolders.js.map