const path = require('path');

const lintAsync = require('./tools/lint9Async');

const configFile = path.resolve(__dirname, '../flat/default.js');

it('lints custom rules', async () => {
  const results = await lintAsync(
    {
      overrideConfigFile: configFile,
      ignore: false,
    },
    ['fixtures/rule-*']
  );
  for (const result of results) {
    const relativeFilePath = path.relative(__dirname, result.filePath);
    delete result.filePath;
    expect(result).toMatchSnapshot(relativeFilePath);
  }
}, 20000);
