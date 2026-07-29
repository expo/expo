const eslint = require('eslint');
const path = require('path');

const getBaseConfig = require('./tools/getBaseConfig');
const lintAsync = require('./tools/lintAsync');

const configFile = path.resolve(__dirname, '../default.js');

it(`has a default config`, () => {
  expect(
    () =>
      new eslint.ESLint({
        baseConfig: getBaseConfig(),
        overrideConfigFile: configFile,
      }),
  ).not.toThrow();
});

it(`lints with the default config`, async () => {
  const results = await lintAsync(
    {
      baseConfig: getBaseConfig(),
      overrideConfigFile: configFile,
      ignore: false,
    },
    ['fixtures/*all*'],
  );
  for (const result of results) {
    const platformIndependentPath = path.relative(__dirname, result.filePath).replace(/\\/g, '/');
    delete result.filePath;
    expect(result).toMatchSnapshot(platformIndependentPath);
  }
}, 20000);
