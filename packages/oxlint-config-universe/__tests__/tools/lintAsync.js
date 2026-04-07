const spawnAsync = require('@expo/spawn-async');
const path = require('path');

module.exports = async function lintAsync(configFile, sourceFiles) {
  let result;
  try {
    result = await spawnAsync(
      'npx',
      ['oxlint', '-c', configFile, '--format=json', ...sourceFiles],
      { cwd: path.resolve(__dirname, '..') },
    );
  } catch (e) {
    // oxlint exits with non-zero when it finds lint errors, but still outputs JSON
    if (e.stdout) {
      result = e;
    } else {
      throw e;
    }
  }

  const output = JSON.parse(result.stdout);

  // Group diagnostics by file (similar to ESLint's per-file format) and strip
  // non-deterministic fields for stable snapshots
  const byFile = {};
  for (const diagnostic of output.diagnostics || []) {
    const filename = diagnostic.filename;
    if (!byFile[filename]) {
      byFile[filename] = [];
    }
    byFile[filename].push({
      code: diagnostic.code,
      severity: diagnostic.severity,
      message: diagnostic.message,
      help: diagnostic.help || undefined,
      labels: (diagnostic.labels || []).map((label) => ({
        span: { line: label.span.line, column: label.span.column },
      })),
    });
  }

  return Object.entries(byFile).map(([filePath, messages]) => ({
    filePath,
    messages,
    errorCount: messages.filter((m) => m.severity === 'error').length,
    warningCount: messages.filter((m) => m.severity === 'warning').length,
  }));
};
