/**
 * Get the relative path of a file within a vendored package.
 * This uses the absolute path of the file, and splits it from the actual package name.
 */
function relativePackagePath(file, { packageName }) {
  const relativeFilePath = `${file.dir}/${file.base}`.split(packageName).pop();
  return `${packageName}${relativeFilePath}`;
}

module.exports = {
  relativePackagePath,
};
