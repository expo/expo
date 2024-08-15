/* eslint-env node */
const { relativePackagePath } = require('./utils/vendor');

/**
 * @typedef {Object} TaskrFile
 * @property {string} dir - The directory of the file.
 * @property {string} base - The (base) file name of the file.
 * @property {import('node:buffer').Buffer} data - The contents of the file.
 */

/** Generate all vendored Metro package files. */
module.exports = function vendorPlugin(task) {
  /** @param {TaskrFile} file */
  task.plugin('vendor', { every: false }, function* (files, { packageName } = {}) {
    for (const file of files) {
      const fileData = createVendorFile(packageName, file);
      if (fileData !== undefined) {
        file.data = fileData;
      }
    }
  });
};

/**
 * Generate the output of a vendored file.
 *
 * @param {string} packageName
 * @param {TaskrFile} file
 */
function createVendorFile(packageName, file) {
  if (file.base === 'package.json') {
    const packageFile = JSON.parse(file.data.toString());
    const packageSimple = {
      private: true,
      name: '@expo/metro-' + packageFile.name,
      version: packageFile.version,
    };

    return JSON.stringify(packageSimple, null, 2);
  }

  // Find the relative path from the start of the package name
  const relativeFilePath = relativePackagePath(file, { packageName });

  if (file.base.endsWith('.js')) {
    return `module.exports = require('${relativeFilePath.replace('.js', '')}');\n`;
  }

  if (file.base.endsWith('.d.ts')) {
    return `export * from '${relativeFilePath.replace('.d.ts', '')}';\n`;
  }

  throw new Error(`Unknown file "${file.base}" received, can't vendor file.`);
}
