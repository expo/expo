const babel = require('@babel/core');
const { wrap } = require('jest-snapshot-serializer-raw');

const preset = require('..');

function transform(input, options = {}) {
  return wrap(
    babel.transform(input, {
      filename: 'file.ts',
      babelrc: false,
      presets: [preset],
      sourceMaps: true,
    }).code
  );
}

it('optional-chaining', () => {
  expect(
    transform(`
      foo?.bar;
    `)
  ).toMatchSnapshot();
});
it('nullish-coalescing', () => {
  expect(
    transform(`
      var foo = object.foo ?? "default";
    `)
  ).toMatchSnapshot();
});
it('class-properties', () => {
  expect(
    transform(`
      class Bork {
        //Property initializer syntax
        instanceProperty = "bork";
        boundFunction = () => {
          return this.instanceProperty;
        };
    
        //Static class properties
        static staticProperty = "babelIsCool";
        static staticFunction = function() {
          return Bork.staticProperty;
        };
      }
    `)
  ).toMatchSnapshot();
});
it('preset-typescript', () => {
  expect(
    transform(`
      const x: number = 0;
    `)
  ).toMatchSnapshot();
});
it('plugin-transform-modules-commonjs', () => {
  expect(
    transform(`
      export default 42;
    `)
  ).toMatchSnapshot();
});
