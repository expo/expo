const eslint = require('eslint8');
const path = require('path');

const getBaseConfig = require('./tools/getBaseConfig');
const lintAsync = require('./tools/lintAsync');

const configFile = path.resolve(__dirname, '../web.js');

it(`has a web config`, () => {
  expect(
    () =>
      new eslint.ESLint({
        baseConfig: getBaseConfig(),
        overrideConfigFile: configFile,
        useEslintrc: false,
      }),
  ).not.toThrow();
});

it(`lints with the web config`, async () => {
  const results = await lintAsync(
    {
      baseConfig: getBaseConfig(),
      overrideConfigFile: configFile,
      ignore: false,
      useEslintrc: false,
    },
    ['fixtures/*all*', 'fixtures/*web*'],
  );
  for (const result of results) {
    const platformIndependentPath = path.relative(__dirname, result.filePath).replace(/\\/g, '/');
    delete result.filePath;
    expect(result).toMatchSnapshot(platformIndependentPath);
  }
}, 20000);
