const fs = require('fs');
const path = require('path');

const { toPosixPath } = require('./testUtils');

// ESLint 9 expands glob patterns with a dynamic `import()`, which Jest's CommonJS runtime
// rejects, so the fixtures are listed here and passed to ESLint as plain paths.
function listFixtures(cwd, pattern) {
  const directory = path.dirname(pattern);
  const escaped = path.basename(pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
  return fs
    .readdirSync(path.join(cwd, directory), { withFileTypes: true })
    .filter((entry) => entry.isFile() && matcher.test(entry.name))
    .map((entry) => path.join(directory, entry.name))
    .sort();
}

/**
 * Lints fixture files with one of the entry points from `configs.js` and returns the results
 * with `filePath` relative to the `__tests__` directory, so they are stable across machines.
 */
module.exports = async function lintFixtures({ ESLint, options }, pattern) {
  const eslint = new ESLint({ ...options, ignore: false });
  const results = await eslint.lintFiles(listFixtures(options.cwd, pattern));
  return results.map((result) => ({
    ...result,
    filePath: toPosixPath(path.relative(options.cwd, result.filePath)),
  }));
};
