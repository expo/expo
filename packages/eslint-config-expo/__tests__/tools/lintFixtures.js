const fs = require('fs');
const path = require('path');

const { toPosixPath } = require('./testUtils');

const SEVERITIES = { 1: 'warn', 2: 'error' };

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
 * Lints fixture files with one of the entry points from `configs.js`. Each result is reduced
 * to the file, relative to the `__tests__` directory, and the messages a user would see: rule,
 * severity, position and text. Fix ranges, suggestions, counts and the source are left out so
 * a snapshot changes only when a rule, its severity or its target changes.
 */
module.exports = async function lintFixtures({ ESLint, options }, pattern) {
  const eslint = new ESLint({ ...options, ignore: false });
  const results = await eslint.lintFiles(listFixtures(options.cwd, pattern));
  return results.map((result) => ({
    filePath: toPosixPath(path.relative(options.cwd, result.filePath)),
    messages: result.messages.map(({ ruleId, severity, fatal, line, column, message }) => ({
      ruleId,
      severity: SEVERITIES[severity],
      ...(fatal ? { fatal } : {}),
      line,
      column,
      // Some rules name the file they refer to by absolute path.
      message: message.split(options.cwd).join('<tests>'),
    })),
  }));
};
