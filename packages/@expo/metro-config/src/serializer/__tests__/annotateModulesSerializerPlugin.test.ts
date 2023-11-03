import { annotateModule } from '../annotateModulesSerializerPlugin';
import { JSModule } from '../getCssDeps';

const fooModule: JSModule = {
  dependencies: new Map([
    [
      './bar',
      {
        absolutePath: '/root/bar',
        data: { data: { asyncType: null, locs: [], key: './bar' }, name: './bar' },
      },
    ],
  ]),
  // @ts-expect-error
  inverseDependencies: new Set(),
  output: [
    {
      type: 'js/module',
      data: {
        code: '__d(function() {/* code for foo */});',
        map: null,
        lineCount: 1,
      },
    },
  ],
  path: '/bacon/foobar.js',
  getSource: () => Buffer.from('__d(function() {/* code for foo */});'),
};

it(`annotates a module`, () => {
  expect(annotateModule('/bacon', fooModule).output[0].data).toEqual({
    code: `
// foobar.js
__d(function() {/* code for foo */});`,
    lineCount: 3,
    map: null,
  });
});
