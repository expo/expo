const fs = require('fs');
const path = require('path');

/**
 * Returns a mapping from the names of symlinked packages to the physical paths of each package.
 */
module.exports = function getSymlinkedNodeModulesForDirectory(packagePath) {
  const nodeModulesPath = path.join(packagePath, 'node_modules');
  const directories = listDirectoryContents(nodeModulesPath);

  const modules = {};
  for (const directory of directories) {
    // The directory is either a scope or a package
    if (directory.startsWith('@')) {
      const scopePath = path.join(nodeModulesPath, directory);
      const scopedPackageDirectories = fs.readdirSync(scopePath);
      for (const subdirectory of scopedPackageDirectories) {
        const dependencyName = `${directory}/${subdirectory}`;
        const dependencyPath = path.join(scopePath, subdirectory);
        if (fs.lstatSync(dependencyPath).isSymbolicLink()) {
          modules[dependencyName] = fs.realpathSync(dependencyPath);
        }
      }
    } else {
      const dependencyName = directory;
      const dependencyPath = path.join(nodeModulesPath, directory);
      if (fs.lstatSync(dependencyPath).isSymbolicLink()) {
        modules[dependencyName] = fs.realpathSync(dependencyPath);
      }
    }
  }
  return modules;
};

function listDirectoryContents(directory) {
  try {
    return fs.readdirSync(directory);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return [];
    }
    throw e;
  }
}
