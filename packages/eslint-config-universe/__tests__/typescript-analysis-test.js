const path = require('node:path');

const lintAsync = require('./tools/lintAsync');

const overrideConfigFile = path.resolve(__dirname, '../shared/typescript-analysis.js');

const baseConfig = {
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.json'),
  },
};

it(`lints`, async () => {
  const results = await lintAsync(
    {
      baseConfig,
      overrideConfigFile,
      ignore: false,
      useEslintrc: false,
    },
    ['fixtures/typescript-analysis-*'],
  );

  for (const result of results) {
    const relativeFilePath = path.relative(__dirname, result.filePath);
    delete result.filePath;
    expect(result).toMatchSnapshot(relativeFilePath);
  }
}, 20000);
