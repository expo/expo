const path = require('path');

const getBaseConfig = require('./tools/getBaseConfig');
const lintAsync = require('./tools/lintAsync');

const configFile = path.resolve(__dirname, '../shared/typescript-analysis.js');

const alteredBaseConfig = {
  ...getBaseConfig(),
  parserOptions: {
    project: './__tests__/fixtures/tsconfig.json',
  },
};

it(`lints`, async () => {
  let report = await lintAsync(
    {
      baseConfig: alteredBaseConfig,
      configFile,
      fix: true,
      ignore: false,
      useEslintrc: false,
    },
    ['__tests__/fixtures/*typescript-analysis*']
  );
  let { results } = report;
  for (let result of results) {
    let relativeFilePath = path.relative(__dirname, result.filePath);
    delete result.filePath;
    expect(result).toMatchSnapshot(relativeFilePath);
  }
}, 20000);
