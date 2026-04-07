const path = require('path');
const { globSync } = require('glob');

const lintAsync = require('./tools/lintAsync');

const configFile = path.resolve(__dirname, '../node.js');

it(`has a valid Node config`, async () => {
  const results = await lintAsync(configFile, ['fixtures/all-00.js']);
  expect(results).toBeDefined();
}, 20000);

it(`lints with the Node config`, async () => {
  const allFiles = globSync(path.resolve(__dirname, 'fixtures/*all*'));
  const nodeFiles = globSync(path.resolve(__dirname, 'fixtures/*node*'));
  const results = await lintAsync(configFile, [...allFiles, ...nodeFiles]);
  for (const result of results) {
    const relativeFilePath = path.relative(__dirname, result.filePath);
    delete result.filePath;
    expect(result).toMatchSnapshot(relativeFilePath);
  }
}, 20000);
