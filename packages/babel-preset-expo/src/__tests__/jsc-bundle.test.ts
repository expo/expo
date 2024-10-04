import * as babel from '@babel/core';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

import preset from '..';

it('bundles `@react-native/js-polyfills/console.js` without imports', () => {
  const sourceFile = require.resolve('@react-native/js-polyfills/console.js');
  const result = babel.transformFileSync(
    sourceFile,
    getConfig({
      ast: true,
      caller: getCaller({
        name: 'metro',
        engine: 'default',
        platform: 'ios',
        isDev: false,
      }),
    })
  );

  // Ensure the AST is available
  expect(result?.ast).toBeDefined();

  // Collect all `import` or `require` statements from the AST
  const importRefs: Set<any> = new Set();
  traverse(result!.ast, {
    ImportDeclaration(path) {
      importRefs.add(path.node);
    },
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee, { name: 'require' })) {
        importRefs.add(path.node);
      }
    },
  });

  // Ensure there are no `import` or `require` statements
  expect([...importRefs]).toEqual([]);
});

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

function getConfig(props: babel.TransformOptions): babel.TransformOptions {
  return {
    babelrc: false,
    presets: [preset],
    sourceMaps: true,
    configFile: false,
    compact: false,
    comments: true,
    retainLines: true,
    ...props,
  };
}
