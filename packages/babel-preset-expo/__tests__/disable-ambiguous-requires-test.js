const babel = require('@babel/core');

const plugin = require('../plugins/disable-ambiguous-requires');

const options = {
  babelrc: false,
  plugins: [plugin],
  filename: 'unknown',
};

it(`Remove chained require assignment`, () => {
  const sourceCode = `
require.Refresh = Refresh;
(require).Refresh = Refresh;
`;
  const { code } = babel.transform(sourceCode, options);
  expect(code).toBe('');
});

it(`Skip valid requires`, () => {
  const sourceCode = `
  const foo = require('bar');
  require('bar');
  require.resolve('bar');
`;
  const { code } = babel.transform(sourceCode, options);
  expect(code).toMatchSnapshot();
});
