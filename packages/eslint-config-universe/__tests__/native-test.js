const eslint = require('eslint');
const path = require('path');

const checkPrettierRulesAsync = require('./tools/checkPrettierRulesAsync');
const getBaseConfig = require('./tools/getBaseConfig');
const lintAsync = require('./tools/lintAsync');

const configFile = path.resolve(__dirname, '../native.js');

it(`has a React Native config`, () => {
  expect(
    () =>
      new eslint.ESLint({
        baseConfig: getBaseConfig(),
        overrideConfigFile: configFile,
        useEslintrc: false,
      }),
  ).not.toThrow();
});

it(`lints with the React Native config`, async () => {
  const results = await lintAsync(
    {
      baseConfig: getBaseConfig(),
      overrideConfigFile: configFile,
      ignore: false,
      useEslintrc: false,
    },
    ['fixtures/*all*', 'fixtures/*native*'],
  );
  for (const result of results) {
    const relativeFilePath = path.relative(__dirname, result.filePath);
    delete result.filePath;
    expect(result).toMatchSnapshot(relativeFilePath);
  }
}, 20000);

it(`doesn't conflict with Prettier`, async () => {
  const { success, message } = await checkPrettierRulesAsync(configFile, 'native');
  expect(success).toMatchSnapshot('success');
  expect(message).toMatchSnapshot('message');
}, 10000);
