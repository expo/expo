const spawnAsync = require('@expo/spawn-async');
const path = require('path');

module.exports = async function lintAsync(cliOptions, sourceFiles) {
  const lintProcess = spawnAsync(
    process.execPath,
    [path.resolve(__dirname, '__lint__.js'), JSON.stringify(cliOptions), ...sourceFiles],
    { cwd: path.resolve(__dirname, '../..') }
  );
  const childProcess = lintProcess.child;
  childProcess.stderr.on('data', (data) => {
    console.error(`[eslint]: ${data}`);
  });
  const result = await lintProcess;
  return JSON.parse(result.stdout);
};
