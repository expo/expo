const foo = 'hello';
const bar = 'world';

// See: https://babeljs.io/docs/babel-plugin-transform-computed-properties
export const obj = {
  ['x' + foo]: 'heh',
  ['y' + bar]: 'noo',
  foo: 'foo',
  bar: 'bar',
};
