var tests = [
  'import "foo";',
  'import foo from "foo";',
  'import {default as foo2} from "foo";',
  'import * as foo from "foo";',
  'import {bar} from "foo";',
  'import {bar2, baz} from "foo";',
  'import {bar as baz2} from "foo";',
  'import {bar as baz3, xyz} from "foo";',
  'import bar, * as bar2 from "foo";',
  'import bar, {bar2, bar3 as bar4} from "foo";',

  'export var a;',
  'export default function(){};',
  'export default function f(){};',
  'export default 42;',
  'export {foo}; var foo;',
  'export { foo as default }; var foo;',
  'export * from "foo";',
  'export {foo} from "foo";',
  'export {default as foo} from "foo";',
];

return Promise.all(tests.map(code =>
  transformAsync(code, {
    configFile: false,
    sourceMap: true,
    plugins: opts.plugins
  }).then(res => {
    // Should create mapping
    expect(res.map.mappings).not.toBe('');
  })
));
