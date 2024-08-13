/* eslint-env node */
const path = require('node:path');

/**
 * @typedef {Object} TaskrFile
 * @property {string} dir - The directory of the file.
 * @property {string} base - The (base) file name of the file.
 * @property {import('node:buffer').Buffer} data - The contents of the file.
 */

/**
 * Generate, expand, or validate missing typescript types from the vendored plugin.
 * This iterates through all vendored files, finds the missing typescript definitons,
 * and add these in `@expo/metro/types/metro.d.ts`.
 */
module.exports = function augmentPlugin(task) {
  /** @param {TaskrFile} file */
  task.plugin('augment', { every: false }, function* (files, { packageDir }) {
    const fileMap = createFileMap(files, packageDir);

    console.log(fileMap);

    // for (const file of files) {
    //   // Calculate the types based on the existing JS files
    //   if (!file.endsWith(file.base, '.js')) continue;

    //   // 1. Create a re-exporting file for the whole library
    //   // 2. Re-export the definition if it exists from `export type * from 'metro*'`
    //   // 3. Check, per file export, if the definition exists in the custom typing,
    //   //   - If not add it with a comment
    // }

    // Create a new file through
    // this._.files.push({
    //   dir: '', // o.dir,
    //   base: '', // o.base,
    //   data: '', // data.map
    // });
  });
};

/** @param {TaskrFile[]} files */
function createFileMap(files, packageDir) {
  const fileMap = new Map();

  const getFilePath = (file) => path.relative(packageDir, `${file.dir}/${file.base}`);

  for (const file of files) {
    if (!file.base.endsWith('.js')) continue;

    fileMap.set(getFilePath(file), { js: file, ts: null });
  }

  for (const file of files) {
    if (!file.base.endsWith('.d.ts')) continue;

    const jsFilePath = getFilePath(file).replace('.d.ts', '.js');
    const entry = fileMap.get(jsFilePath);
    entry.ts = file;
  }

  return fileMap;
}
