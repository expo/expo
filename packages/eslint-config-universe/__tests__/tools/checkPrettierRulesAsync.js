const spawnAsync = require('@expo/spawn-async');
const path = require('path');
const process = require('process');

module.exports = async function checkPrettierRulesAsync(configFile) {
  const env = Object.assign(process.env, {
    PATH: path.resolve(__dirname, '../../node_modules/.bin') + path.delimiter + process.env.PATH,
  });

  const resultPromise = spawnAsync('eslint-config-prettier', [configFile], { env });

  let result;
  try {
    result = await resultPromise;
  } catch (e) {
    if (e.status === 2) {
      result = e;
    } else {
      throw e;
    }
  }

  return {
    success: result.status === 0,
    message: result.stderr,
  };
};
