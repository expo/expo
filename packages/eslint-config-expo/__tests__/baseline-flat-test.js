const eslint = require('eslint');
const path = require('path');

const lintAsync = require('./tools/lint9Async');
const { toPosixPath } = require('./tools/testUtils');

const configFile = path.resolve(__dirname, '../flat/default.js');

it('has a default config', () => {
  expect(
    () =>
      new eslint.ESLint({
        overrideConfigFile: configFile,
      })
  ).not.toThrow();
});

it('lints with the default config', async () => {
  const results = await lintAsync(
    {
      overrideConfigFile: configFile,
      ignore: false,
    },
    ['fixtures/baseline/*']
  );
  for (const result of results) {
    const relativeFilePath = toPosixPath(path.relative(__dirname, result.filePath));
    delete result.filePath;
    expect(result).toMatchSnapshot(relativeFilePath);
  }
}, 20000);
