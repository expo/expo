const path = require('path');

const lintAsync = require('./tools/lint8Async');
const { toPosixPath } = require('./tools/testUtils');

const configFile = path.resolve(__dirname, '../default.js');

it('lints custom rules', async () => {
  const results = await lintAsync(
    {
      overrideConfigFile: configFile,
      ignore: false,
      useEslintrc: false,
    },
    ['fixtures/rule-*']
  );
  for (const result of results) {
    const relativeFilePath = toPosixPath(path.relative(__dirname, result.filePath));
    delete result.filePath;
    expect(result).toMatchSnapshot(relativeFilePath);
  }
}, 20000);
