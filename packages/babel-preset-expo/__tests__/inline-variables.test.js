const babel = require('@babel/core');

const plugin = require('../plugins/inline-variables');

const METRO_CALLER = { name: 'metro', bundler: 'metro', platform: 'ios' };

const options = {
  babelrc: false,
  filename: 'unknown',
  caller: METRO_CALLER,
};

it(`asserts invalid options`, () => {
  expect(() =>
    babel.transform('', {
      ...options,
      plugins: [[plugin, { variables: [{ name: 'EXPO_VALUE', value: null }] }]],
    })
  ).toThrow();
});
it(`inlines variables`, () => {
  expect(
    babel.transform('process.env.EXPO_VALUE', {
      ...options,
      plugins: [[plugin, { variables: [{ name: 'EXPO_VALUE', value: 'value' }] }]],
    }).code
  ).toMatchInlineSnapshot(`""value";"`);
});
it(`skips undefined variables`, () => {
  expect(
    babel.transform('process.env.EXPO_VALUE_2', {
      ...options,
      plugins: [[plugin, { variables: [{ name: 'EXPO_VALUE', value: 'value' }] }]],
    }).code
  ).toMatchInlineSnapshot(`"process.env.EXPO_VALUE_2;"`);
});
it(`does not inline variables that are destructured`, () => {
  expect(
    babel.transform('const { EXPO_VALUE } = process.env;', {
      ...options,
      plugins: [[plugin, { variables: [{ name: 'EXPO_VALUE', value: 'value' }] }]],
    }).code
  ).toMatchInlineSnapshot(`
    "const {
      EXPO_VALUE
    } = process.env;"
  `);
});
