const spawnAsync = require('@expo/spawn-async');
const path = require('path');

module.exports = async function lintAsync(eslintOptions, sourceFiles) {
  const lintProcess = spawnAsync(
    process.execPath,
    [
      '--trace-deprecation',
      path.resolve(__dirname, '__lint__.mjs'),
      JSON.stringify(eslintOptions),
      ...sourceFiles,
    ],
    { cwd: path.resolve(__dirname, '..') },
  );

  const childProcess = lintProcess.child;

  childProcess.stderr.on('data', (data) => {
    console.error(`[eslint]: ${data}`);
  });

  const result = await lintProcess;
  return JSON.parse(result.stdout);
};
