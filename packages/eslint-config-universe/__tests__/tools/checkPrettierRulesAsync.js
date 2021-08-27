const spawnAsync = require('@expo/spawn-async');
const fs = require('fs');
const path = require('path');

module.exports = async function checkPrettierRulesAsync(configFile, testName) {
  const testProjectsPath = path.resolve(__dirname, '..', 'projects');
  const testProjectPath = path.resolve(testProjectsPath, testName);

  fs.mkdirSync(testProjectPath, { recursive: true });

  const { stdout: configString } = await spawnAsync('eslint', [
    '--config',
    configFile,
    '--no-eslintrc',
    '--print-config',
    path.resolve(testProjectPath, '.eslintrc'),
  ]);

  fs.writeFileSync(path.resolve(testProjectPath, '.eslintrc'), configString);
  fs.writeFileSync(path.resolve(testProjectPath, 'index.ts'), '');

  let result;
  try {
    result = await spawnAsync('eslint-config-prettier', ['index.ts'], {
      cwd: testProjectPath,
    });
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
