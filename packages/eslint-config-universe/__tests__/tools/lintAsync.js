const path = require('path');
const spawnAsync = require('@expo/spawn-async');

module.exports = async function lintAsync(cliOptions, sourceFiles) {
  let result = await spawnAsync(
    process.execPath,
    [path.resolve(__dirname, '__lint__.js'), JSON.stringify(cliOptions), ...sourceFiles],
    { cwd: path.resolve(__dirname, '../..') }
  );
  return JSON.parse(result.stdout);
};
