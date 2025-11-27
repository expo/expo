const REGEXP_REPLACE_SLASHES = /\\/g;

function toPosixPath(filePath) {
  return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}

module.exports = {
  toPosixPath,
};
