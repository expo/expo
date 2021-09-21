const babel = require('@babel/core');

function createOptions() {
  const plugin = require('../plugins/no-anonymous-default-export');
  const options = {
    babelrc: false,
    plugins: [plugin],
    filename: 'unknown',
    caller: {
      name: 'metro',
    },
  };
  // Surface a warning function so babel linters can be used.
  Object.defineProperty(options.caller, 'onWarning', {
    enumerable: false,
    writable: false,
    value: jest.fn(),
  });
  return options;
}

let options = createOptions();

it(`Warns about default export as a function`, () => {
  const sourceCode = `export default function () {}`;

  const { code } = babel.transform(sourceCode, options);
  // no transform
  expect(code).toBe(sourceCode);
  // warnings were sent
  expect(options.caller.onWarning).toHaveBeenLastCalledWith(
    expect.stringMatching(
      /Anonymous functions cannot be used as React components with React Refresh/
    )
  );
});

it(`Warns about default export as an anonymous function`, () => {
  const sourceCode = `export default (() => {});`;

  const { code } = babel.transform(sourceCode, options);
  // no transform
  expect(code).toBe(sourceCode);
  // warnings were sent
  expect(options.caller.onWarning).toHaveBeenLastCalledWith(
    expect.stringMatching(
      /Anonymous arrow functions cannot be used as React components with React Refresh/
    )
  );
});

it(`Does not warn about named default export`, () => {
  const sourceCode = `export default function Custom() {}`;
  options = createOptions();
  const { code } = babel.transform(sourceCode, options);
  // no transform
  expect(code).toBe(sourceCode);
  // warnings were sent
  expect(options.caller.onWarning).toHaveBeenCalledTimes(0);
});
