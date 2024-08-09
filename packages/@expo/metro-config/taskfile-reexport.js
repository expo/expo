/* eslint-env node */

/**
 * @typedef {Object} TaskrFile
 * @property {string} dir - The directory of the file.
 * @property {string} base - The (base) file name of the file.
 * @property {import('node:buffer').Buffer} data - The contents of the file.
 */

/** Generate all files that re-exports a single package. */
module.exports = function reexportPlugin(task) {
  /** @param {TaskrFile} file */
  task.plugin('reexport', { every: false }, function* (files, { packageDir, packageName } = {}) {
    for (const file of files) {
      // Find the relative path from the start of the package name
      const fileRelativePath = `${file.dir}/${file.base}`.split(packageName).pop();

      if (file.base.endsWith('.js')) {
        file.data = createJsFile(packageName, fileRelativePath);
      } else if (file.base.endsWith('.d.ts')) {
        file.data = createTsDefinitionFile(packageName, fileRelativePath);
      } else if (file.base === 'package.json') {
        file.data = createPackageFile(file);
      } else {
        throw new Error(`Unknown file "${file.base}", can't create a re-exported module file.`);
      }
    }
  });
};

function createJsFile(packageName, relativePath) {
  return `module.exports = require('${packageName}${relativePath.replace('.js', '')}');\n`;
}

function createTsDefinitionFile(packageName, relativePath) {
  return `export * from '${packageName}${relativePath.replace('.d.ts', '')}';\n`;
}

/** @param {TaskrFile} file */
function createPackageFile(file) {
  const packageFile = JSON.parse(file.data.toString());
  const packageSimple = {
    private: true,
    name: '@expo/' + packageFile.name,
    version: packageFile.version,
  };

  return JSON.stringify(packageSimple, null, 2);
}
