const eslint = require('eslint8');
const path = require('path');

const lintAsync = require('./tools/lint8Async');

const configFile = path.resolve(__dirname, '../default.js');

it('has a default config', () => {
  expect(
    () =>
      new eslint.ESLint({
        overrideConfigFile: configFile,
        useEslintrc: false,
      })
  ).not.toThrow();
});

it('lints with the default config', async () => {
  const results = await lintAsync(
    {
      overrideConfigFile: configFile,
      ignore: false,
      useEslintrc: false,
    },
    ['fixtures/baseline/*']
  );
  for (const result of results) {
    const relativeFilePath = path.relative(__dirname, result.filePath);
    delete result.filePath;
    expect(result).toMatchSnapshot(relativeFilePath);
  }
}, 20000);
