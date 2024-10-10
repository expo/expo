/**
 * Copyright 2024-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * The Metro upstream tests for collect dependencies but converted to TypeScript.
 * This helps establish a baseline of support.
 */
import { codeFrameColumns } from '@babel/code-frame';
import { transformFromAstSync } from '@babel/core';
import generate from '@babel/generator';
import * as babylon from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import dedent from 'dedent';
import assert from 'node:assert';

import type {
  Dependency,
  DependencyTransformer,
  InternalDependency,
  Options,
  State,
} from '../collect-dependencies';
import collectDependencies, { InvalidRequireCallError } from '../collect-dependencies';

const generateOptions = { concise: true, sourceType: 'module' };
const codeFromAst = (ast) => generate(ast, generateOptions).code;
const comparableCode = (code) => code.trim().replace(/\s+/g, ' ');
const { any, objectContaining } = expect;

const opts: Options = {
  asyncRequireModulePath: 'asyncRequire',
  dynamicRequires: 'reject',
  inlineableCalls: [],
  keepRequireNames: true,
  allowOptionalDependencies: false,
  dependencyMapName: null,
  unstable_allowRequireContext: false,
};

// asserts non-null
function nullthrows<T extends object>(x: T | null, message?: string): NonNullable<T> {
  assert(x != null, message);
  return x;
}

const originalWarn = console.warn;

beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});

describe(`require.context`, () => {
  const optsWithoutContext = { ...opts, unstable_allowRequireContext: false };
  const optsWithContext = { ...opts, unstable_allowRequireContext: true };

  it('does not extract/transform if feature is disabled', () => {
    // TODO: Should this error/warn?
    const ast = astFromCode(`
      require.context('./', false, /foobar/m, 'eager');
    `);
    const { dependencies } = collectDependencies(ast, optsWithoutContext);
    expect(dependencies).toEqual([]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        require.context('./', false, /foobar/m, 'eager');
      `)
    );
  });

  it('can omit 2nd-4th arguments', () => {
    const ast = astFromCode(`
      const a = require.context('./');
      const b = require.context('./', false);
      const c = require.context('./', true, /custom/i);
      const d = require.context('./', true, /.*/, 'eager')
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: false,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: 'custom',
              flags: 'i',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'eager',
            recursive: true,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require(${dependencyMapName}[0], "./");
        const b = require(${dependencyMapName}[1], "./");
        const c = require(${dependencyMapName}[2], "./");
        const d = require(${dependencyMapName}[3], "./");
      `)
    );
  });

  it('can pass undefined for 2nd-4th arguments', () => {
    const ast = astFromCode(`
      const a = require.context('./', undefined, undefined, undefined);
      const b = require.context('./', false, undefined, undefined);
      const c = require.context('./', undefined, /custom/i, undefined);
      const d = require.context('./', undefined, undefined, 'eager');
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: false,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: 'custom',
              flags: 'i',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'eager',
            recursive: true,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require(${dependencyMapName}[0], "./");
        const b = require(${dependencyMapName}[1], "./");
        const c = require(${dependencyMapName}[2], "./");
        const d = require(${dependencyMapName}[3], "./");
      `)
    );
  });

  it('can understand constant assignments', () => {
    const ast = astFromCode(`
      const DOT_SLASH_FOO = './foo';
      const FALSE = false;
      const EAGER = 'eager';
      const a = require.context(DOT_SLASH_FOO, FALSE, /pattern/, EAGER);
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: './foo',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: 'pattern',
              flags: '',
            },
            mode: 'eager',
            recursive: false,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const DOT_SLASH_FOO = './foo';
        const FALSE = false;
        const EAGER = 'eager';
        const a = require(${dependencyMapName}[0], "./foo");
      `)
    );
  });

  it.skip('can understand regex constant assignments', () => {
    // TODO: augment Babel's path.evaluate() with regex support
    const ast = astFromCode(`
      const DOT_SLASH_FOO = './foo';
      const FALSE = false;
      const EAGER = 'eager';
      const PATTERN = /pattern/;
      const a = require.context(DOT_SLASH_FOO, FALSE, PATTERN, EAGER);
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: './foo',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: 'pattern',
              flags: '',
            },
            mode: 'eager',
            recursive: false,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const DOT_SLASH_FOO = "./foo";
        const FALSE = false;
        const EAGER = "eager";
        const PATTERN = /pattern/;
        const a = require(${dependencyMapName}[0], "./foo");
      `)
    );
  });

  it('can preserve the require.context AST in collection mode', () => {
    const ast = astFromCode(`
      const a = require.context('./');
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, {
      ...optsWithContext,
      collectOnly: true,
    });
    expect(dependencies).toEqual([
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require.context(${dependencyMapName}[0], "./");
      `)
    );
  });

  it('distinguishes require from require.context', () => {
    const ast = astFromCode(`
      const a = require.context('./');
      const anotherA = require.context('./');
      const b = require('./');
      const anotherB = require('./');
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: expect.not.objectContaining({
          contextParams: expect.anything(),
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require(${dependencyMapName}[0], "./");
        const anotherA = require(${dependencyMapName}[0], "./");
        const b = require(${dependencyMapName}[1], "./");
        const anotherB = require(${dependencyMapName}[1], "./");
      `)
    );
  });

  it('distinguishes require.context based on path', () => {
    const ast = astFromCode(`
      const a = require.context('./a/');
      const anotherA = require.context('./a/');
      const b = require.context('./b/');
      const anotherB = require.context('./b/');
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: './a/',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './b/',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require(${dependencyMapName}[0], "./a/");
        const anotherA = require(${dependencyMapName}[0], "./a/");
        const b = require(${dependencyMapName}[1], "./b/");
        const anotherB = require(${dependencyMapName}[1], "./b/");
      `)
    );
  });

  it('distinguishes require.context based on trailing slash in path', () => {
    // TODO: Can/should we merge these two?
    const ast = astFromCode(`
      const a = require.context('.');
      const anotherA = require.context('.');
      const b = require.context('./');
      const anotherB = require.context('./');
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: '.',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require(${dependencyMapName}[0], ".");
        const anotherA = require(${dependencyMapName}[0], ".");
        const b = require(${dependencyMapName}[1], "./");
        const anotherB = require(${dependencyMapName}[1], "./");
      `)
    );
  });

  it('distinguishes between backslash and slash in path', () => {
    // TODO: Can/should we merge these two?
    const ast = astFromCode(`
      const a = require.context('.\\\\');
      const anotherA = require.context('.\\\\');
      const b = require.context('./');
      const anotherB = require.context('./');
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: '.\\',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require(${dependencyMapName}[0], ".\\\\");
        const anotherA = require(${dependencyMapName}[0], ".\\\\");
        const b = require(${dependencyMapName}[1], "./");
        const anotherB = require(${dependencyMapName}[1], "./");
      `)
    );
  });

  it('distinguishes require.context based on `recursive`', () => {
    const ast = astFromCode(`
      const a = require.context('./', true);
      const anotherA = require.context('./');
      const b = require.context('./', false);
      const anotherB = require.context('./', false);
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: false,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require(${dependencyMapName}[0], "./");
        const anotherA = require(${dependencyMapName}[0], "./");
        const b = require(${dependencyMapName}[1], "./");
        const anotherB = require(${dependencyMapName}[1], "./");
      `)
    );
  });

  it('distinguishes require.context based on filter pattern', () => {
    const ast = astFromCode(`
      const a = require.context('./', true, /foo/);
      const anotherA = require.context('./', true, /foo/);
      const b = require.context('./', true, /.*/);
      const anotherB = require.context('./', true);
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: 'foo',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require(${dependencyMapName}[0], "./");
        const anotherA = require(${dependencyMapName}[0], "./");
        const b = require(${dependencyMapName}[1], "./");
        const anotherB = require(${dependencyMapName}[1], "./");
      `)
    );
  });

  it('distinguishes require.context based on filter flags', () => {
    const ast = astFromCode(`
      const a = require.context('./', true, /foo/m);
      const anotherA = require.context('./', true, /foo/m);
      const b = require.context('./', true, /foo/);
      const anotherB = require.context('./', true, /foo/);
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: 'foo',
              flags: 'm',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: 'foo',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require(${dependencyMapName}[0], "./");
        const anotherA = require(${dependencyMapName}[0], "./");
        const b = require(${dependencyMapName}[1], "./");
        const anotherB = require(${dependencyMapName}[1], "./");
      `)
    );
  });

  it('distinguishes require.context based on mode', () => {
    const ast = astFromCode(`
      const a = require.context('./', true, /.*/, 'sync');
      const anotherA = require.context('./', true, /.*/);
      const b = require.context('./', true, /.*/, 'eager');
      const anotherB = require.context('./', true, /.*/, 'eager');
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, optsWithContext);
    expect(dependencies).toEqual([
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'sync',
            recursive: true,
          },
        }),
      },
      {
        name: './',
        data: objectContaining({
          contextParams: {
            filter: {
              pattern: '.*',
              flags: '',
            },
            mode: 'eager',
            recursive: true,
          },
        }),
      },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        const a = require(${dependencyMapName}[0], "./");
        const anotherA = require(${dependencyMapName}[0], "./");
        const b = require(${dependencyMapName}[1], "./");
        const anotherB = require(${dependencyMapName}[1], "./");
      `)
    );
  });

  it(`asserts invalid first argument`, () => {
    const ast = astFromCode(`
  const a = require.context(42);
`);
    expect(() => collectDependencies(ast, optsWithContext)).toThrowErrorMatchingInlineSnapshot(`
      "Invalid call at line 2: 42
      First argument of \`require.context\` should be a string denoting the directory to require."
    `);
  });
  it(`asserts invalid second argument`, () => {
    const ast = astFromCode(`
  const a = require.context('./dir', 'hey');
`);
    expect(() => collectDependencies(ast, optsWithContext)).toThrowErrorMatchingInlineSnapshot(`
      "Invalid call at line 2: 'hey'
      Second argument of \`require.context\` should be an optional boolean indicating if files should be imported recursively or not."
    `);
  });
  it(`asserts invalid third argument`, () => {
    const ast = astFromCode(`
  const a = require.context('./dir', false, new RegExp('foobar'));
`);
    expect(() => collectDependencies(ast, optsWithContext)).toThrowErrorMatchingInlineSnapshot(`
      "Invalid call at line 2: new RegExp('foobar')
      Third argument of \`require.context\` should be an optional RegExp pattern matching all of the files to import, instead found node of type: NewExpression."
    `);
  });
  it(`asserts invalid fourth argument`, () => {
    const ast = astFromCode(`
  const a = require.context('./dir', false, /foobar/, 34);
`);
    expect(() => collectDependencies(ast, optsWithContext)).toThrowErrorMatchingInlineSnapshot(`
      "Invalid call at line 2: 34
      Fourth argument of \`require.context\` should be an optional string "mode" denoting how the modules will be resolved."
    `);
  });
  it(`asserts invalid fourth argument enum value`, () => {
    const ast = astFromCode(`
  const a = require.context('./dir', false, /foobar/, 'hello');
`);
    expect(() => collectDependencies(ast, optsWithContext)).toThrowErrorMatchingInlineSnapshot(`
      "Invalid call at line 2: 'hello'
      require.context "hello" mode is not supported. Expected one of: sync, eager, lazy, lazy-once"
    `);
  });
  it(`asserts too many arguments`, () => {
    const ast = astFromCode(`
  const a = require.context('./dir', false, /foobar/, 'sync', 'hey');
`);
    expect(() => collectDependencies(ast, optsWithContext)).toThrowErrorMatchingInlineSnapshot(`
      "Invalid call at line 2: require.context('./dir', false, /foobar/, 'sync', 'hey')
      Too many arguments provided to \`require.context\` call. Expected 4, got: 5"
    `);
  });
  it(`asserts no arguments`, () => {
    const ast = astFromCode(`
  const a = require.context();
`);
    expect(() => collectDependencies(ast, optsWithContext)).toThrowErrorMatchingInlineSnapshot(
      `"Invalid call at line 2: require.context()"`
    );
  });
});

it('collects unique dependency identifiers and transforms the AST', () => {
  const ast = astFromCode(`
    const a = require('b/lib/a');
    exports.do = () => require("do");
    if (!something) {
      require("setup/something");
    }
    require('do');
  `);
  const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
  expect(dependencies).toEqual([
    { name: 'b/lib/a', data: objectContaining({ asyncType: null }) },
    { name: 'do', data: objectContaining({ asyncType: null }) },
    { name: 'setup/something', data: objectContaining({ asyncType: null }) },
  ]);
  expect(codeFromAst(ast)).toEqual(
    comparableCode(`
      const a = require(${dependencyMapName}[0], "b/lib/a");
      exports.do = () => require(${dependencyMapName}[1], "do");
      if (!something) {
        require(${dependencyMapName}[2], "setup/something");
      }
      require(${dependencyMapName}[1], "do");
    `)
  );
});

it('uses dependencyMapName parameter as-is if provided', () => {
  const ast = astFromCode(`
    const a = require('b/lib/a');
    exports.do = () => require("do");
    if (!something) {
      require("setup/something");
    }
    require('do');
  `);
  const { dependencies, dependencyMapName } = collectDependencies(ast, {
    ...opts,
    dependencyMapName: '_$$_TEST_DEP_MAP',
  });
  expect(dependencyMapName).toBe('_$$_TEST_DEP_MAP');
  expect(dependencies).toEqual([
    { name: 'b/lib/a', data: objectContaining({ asyncType: null }) },
    { name: 'do', data: objectContaining({ asyncType: null }) },
    { name: 'setup/something', data: objectContaining({ asyncType: null }) },
  ]);
  expect(codeFromAst(ast)).toEqual(
    comparableCode(`
      const a = require(_$$_TEST_DEP_MAP[0], "b/lib/a");
      exports.do = () => require(_$$_TEST_DEP_MAP[1], "do");
      if (!something) {
        require(_$$_TEST_DEP_MAP[2], "setup/something");
      }
      require(_$$_TEST_DEP_MAP[1], "do");
    `)
  );
});

it('respects magic comments when collecting', () => {
  const ast = astFromCode(`
    import(/* @metro-ignore */ "some/async/module").then(foo => {});
  `);
  const { dependencies } = collectDependencies(ast, opts);
  expect(dependencies).toEqual([
    // Should be empty
  ]);
  expect(codeFromAst(ast)).toEqual(
    comparableCode(`
      import( /* @metro-ignore */"some/async/module").then(foo => {});
    `)
  );
});

it('respects magic comments after the import tokens', () => {
  expect(
    codeFromAst(
      astFromCode(`
    import("some/async/module" /* @metro-ignore */).then(foo => {});
  `)
    )
  ).toEqual(
    comparableCode(`
      import("some/async/module" /* @metro-ignore */).then(foo => {});
    `)
  );
});

it('collects asynchronous dependencies', () => {
  const ast = astFromCode(`
    import("some/async/module").then(foo => {});
  `);
  const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
  expect(dependencies).toEqual([
    { name: 'some/async/module', data: objectContaining({ asyncType: 'async' }) },
    { name: 'asyncRequire', data: objectContaining({ asyncType: null }) },
  ]);
  expect(codeFromAst(ast)).toEqual(
    comparableCode(`
      require(${dependencyMapName}[1], "asyncRequire")(${dependencyMapName}[0], _dependencyMap.paths, "some/async/module").then(foo => {});
    `)
  );
});

it('collects asynchronous dependencies with keepRequireNames: false', () => {
  const ast = astFromCode(`
    import("some/async/module").then(foo => {});
  `);
  const { dependencies, dependencyMapName } = collectDependencies(ast, {
    ...opts,
    keepRequireNames: false,
  });
  expect(dependencies).toEqual([
    { name: 'some/async/module', data: objectContaining({ asyncType: 'async' }) },
    { name: 'asyncRequire', data: objectContaining({ asyncType: null }) },
  ]);
  expect(codeFromAst(ast)).toEqual(
    comparableCode(`
      require(${dependencyMapName}[1])(${dependencyMapName}[0], _dependencyMap.paths).then(foo => {});
    `)
  );
});

it('distinguishes sync and async dependencies on the same module', () => {
  const ast = astFromCode(`
    const a = require("some/async/module");
    import("some/async/module").then(foo => {});
  `);
  const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
  expect(dependencies).toEqual([
    { name: 'some/async/module', data: objectContaining({ asyncType: null }) },
    { name: 'some/async/module', data: objectContaining({ asyncType: 'async' }) },
    { name: 'asyncRequire', data: objectContaining({ asyncType: null }) },
  ]);
  expect(codeFromAst(ast)).toEqual(
    comparableCode(`
      const a = require(${dependencyMapName}[0], "some/async/module");
      require(${dependencyMapName}[2], "asyncRequire")(${dependencyMapName}[1], _dependencyMap.paths, "some/async/module").then(foo => {});
    `)
  );
});

it('distinguishes sync and async dependencies on the same module; reverse order', () => {
  const ast = astFromCode(`
    import("some/async/module").then(foo => {});
    const a = require("some/async/module");
  `);
  const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
  expect(dependencies).toEqual([
    { name: 'some/async/module', data: objectContaining({ asyncType: 'async' }) },
    { name: 'asyncRequire', data: objectContaining({ asyncType: null }) },
    { name: 'some/async/module', data: objectContaining({ asyncType: null }) },
  ]);
  expect(codeFromAst(ast)).toEqual(
    comparableCode(`
      require(${dependencyMapName}[1], "asyncRequire")(${dependencyMapName}[0], _dependencyMap.paths, "some/async/module").then(foo => {});
      const a = require(${dependencyMapName}[2], "some/async/module");
    `)
  );
});

describe('import() prefetching', () => {
  it('collects prefetch calls', () => {
    const ast = astFromCode(`
      __prefetchImport("some/async/module");
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      {
        name: 'some/async/module',
        data: objectContaining({ asyncType: 'prefetch' }),
      },
      { name: 'asyncRequire', data: objectContaining({ asyncType: null }) },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        require(${dependencyMapName}[1], "asyncRequire").prefetch(${dependencyMapName}[0], _dependencyMap.paths, "some/async/module");
      `)
    );
  });

  it('keepRequireNames: false', () => {
    const ast = astFromCode(`
      __prefetchImport("some/async/module");
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, {
      ...opts,
      keepRequireNames: false,
    });
    expect(dependencies).toEqual([
      {
        name: 'some/async/module',
        data: objectContaining({ asyncType: 'prefetch' }),
      },
      { name: 'asyncRequire', data: objectContaining({ asyncType: null }) },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        require(${dependencyMapName}[1]).prefetch(${dependencyMapName}[0], _dependencyMap.paths);
      `)
    );
  });

  it('distinguishes between import and prefetch dependncies on the same module', () => {
    const ast = astFromCode(`
      __prefetchImport("some/async/module");
      import("some/async/module").then(() => {});
    `);
    const { dependencies } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      {
        name: 'some/async/module',
        data: objectContaining({ asyncType: 'prefetch' }),
      },
      { name: 'asyncRequire', data: objectContaining({ asyncType: null }) },
      { name: 'some/async/module', data: objectContaining({ asyncType: 'async' }) },
    ]);
  });
});

describe('require.unstable_importMaybeSync()', () => {
  it('collects require.unstable_importMaybeSync calls', () => {
    const ast = astFromCode(`
      require.unstable_importMaybeSync("some/async/module");
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      {
        name: 'some/async/module',
        data: objectContaining({ asyncType: 'maybeSync' }),
      },
      { name: 'asyncRequire', data: objectContaining({ asyncType: null }) },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        require(${dependencyMapName}[1], "asyncRequire").unstable_importMaybeSync(${dependencyMapName}[0], _dependencyMap.paths, "some/async/module");
      `)
    );
  });

  it('keepRequireNames: false', () => {
    const ast = astFromCode(`
      require.unstable_importMaybeSync("some/async/module");
    `);
    const { dependencies, dependencyMapName } = collectDependencies(ast, {
      ...opts,
      keepRequireNames: false,
    });
    expect(dependencies).toEqual([
      {
        name: 'some/async/module',
        data: objectContaining({ asyncType: 'maybeSync' }),
      },
      { name: 'asyncRequire', data: objectContaining({ asyncType: null }) },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        require(${dependencyMapName}[1]).unstable_importMaybeSync(${dependencyMapName}[0], _dependencyMap.paths);
      `)
    );
  });

  it('distinguishes between require.unstable_importMaybeSync and prefetch dependencies on the same module', () => {
    const ast = astFromCode(`
      __prefetchImport("some/async/module");
      require.unstable_importMaybeSync("some/async/module").then(() => {});
    `);
    const { dependencies } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      {
        name: 'some/async/module',
        data: objectContaining({ asyncType: 'prefetch' }),
      },
      { name: 'asyncRequire', data: objectContaining({ asyncType: null }) },
      {
        name: 'some/async/module',
        data: objectContaining({ asyncType: 'maybeSync' }),
      },
    ]);
  });
});

describe('Evaluating static arguments', () => {
  beforeEach(() => {
    jest.mocked(console.warn).mockReset();
  });
  it('supports template literals as arguments', () => {
    const ast = astFromCode('require(`left-pad`)');
    const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      { name: 'left-pad', data: objectContaining({ asyncType: null }) },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`require(${dependencyMapName}[0], "left-pad");`)
    );
  });

  it('supports template literals with static interpolations', () => {
    const ast = astFromCode('require(`left${"-"}pad`)');
    const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      { name: 'left-pad', data: objectContaining({ asyncType: null }) },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`require(${dependencyMapName}[0], "left-pad");`)
    );
  });

  it('throws template literals with dyncamic interpolations', () => {
    const ast = astFromCode('let foo;require(`left${foo}pad`)');
    try {
      collectDependencies(ast, opts);
      throw new Error('should not reach');
    } catch (error) {
      if (!(error instanceof InvalidRequireCallError)) {
        throw error;
      }
      expect(error.message).toMatchSnapshot();
    }
  });

  it('throws on tagged template literals', () => {
    const ast = astFromCode('require(tag`left-pad`)');
    try {
      collectDependencies(ast, opts);
      throw new Error('should not reach');
    } catch (error) {
      if (!(error instanceof InvalidRequireCallError)) {
        throw error;
      }
      expect(error.message).toMatchSnapshot();
    }
  });

  it('supports multiple static strings concatenated', () => {
    const ast = astFromCode('require("foo_" + "bar")');
    const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      { name: 'foo_bar', data: objectContaining({ asyncType: null }) },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`require(${dependencyMapName}[0], "foo_bar");`)
    );
  });

  it('supports concatenating strings and template literasl', () => {
    const ast = astFromCode('require("foo_" + "bar" + `_baz`)');
    const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      { name: 'foo_bar_baz', data: objectContaining({ asyncType: null }) },
    ]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`require(${dependencyMapName}[0], "foo_bar_baz");`)
    );
  });

  it('supports using static variables in require statements', () => {
    const ast = astFromCode('const myVar="my"; require("foo_" + myVar)');
    const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([{ name: 'foo_my', data: objectContaining({ asyncType: null }) }]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`const myVar = "my"; require(${dependencyMapName}[0], "foo_my");`)
    );
  });

  it('throws when requiring non-strings', () => {
    const ast = astFromCode('require(1)');
    try {
      collectDependencies(ast, opts);
      throw new Error('should not reach');
    } catch (error) {
      if (!(error instanceof InvalidRequireCallError)) {
        throw error;
      }
      expect(error.message).toMatchSnapshot();
    }
  });

  it('throws at runtime when requiring non-strings with special option', () => {
    const ast = astFromCode('require(1)');
    const opts: Options = {
      asyncRequireModulePath: 'asyncRequire',
      dynamicRequires: 'throwAtRuntime',
      inlineableCalls: [],
      keepRequireNames: true,
      allowOptionalDependencies: false,
      dependencyMapName: null,
      unstable_allowRequireContext: false,
    };
    const { dependencies } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        (function (line) {
          throw new Error('Dynamic require defined at line ' + line + '; not supported by Metro');
        })(1);
      `)
    );
  });
  it('warns at build-time when requiring non-strings with special option', () => {
    const ast = astFromCode('require(someVariable)');
    const opts: Options = {
      asyncRequireModulePath: 'asyncRequire',
      dynamicRequires: 'warn',
      inlineableCalls: [],
      keepRequireNames: true,
      allowOptionalDependencies: false,
      dependencyMapName: null,
      unstable_allowRequireContext: false,
    };
    const { dependencies } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        require(someVariable);
      `)
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      'Dynamic import at line 1: require(someVariable). This module may not work as intended when deployed to a runtime.'
    );
  });
  it('warns at build-time when async import of non-strings with special option', () => {
    const ast = astFromCode('import(someVariable)');
    const opts: Options = {
      asyncRequireModulePath: 'asyncRequire',
      dynamicRequires: 'warn',
      inlineableCalls: [],
      keepRequireNames: true,
      allowOptionalDependencies: false,
      dependencyMapName: null,
      unstable_allowRequireContext: false,
    };
    const { dependencies } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([]);
    expect(codeFromAst(ast)).toEqual(
      comparableCode(`
        import(someVariable);
      `)
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      'Dynamic import at line 1: import(someVariable). This module may not work as intended when deployed to a runtime.'
    );
  });
});

it('exposes a string as `dependencyMapName` even without collecting dependencies', () => {
  const ast = astFromCode('');
  expect(collectDependencies(ast, opts).dependencyMapName).toEqual(any(String));
});

it('ignores require functions defined defined by lower scopes', () => {
  const ast = astFromCode(`
    const a = require('b/lib/a');
    exports.do = () => require("do");
    if (!something) {
      require("setup/something");
    }
    require('do');
    function testA(require) {
      const b = require('nonExistantModule');
    }
    {
      const require = function(foo) {
        return;
      }
      require('nonExistantModule');
    }
  `);
  const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
  expect(dependencies).toEqual([
    { name: 'b/lib/a', data: objectContaining({ asyncType: null }) },
    { name: 'do', data: objectContaining({ asyncType: null }) },
    { name: 'setup/something', data: objectContaining({ asyncType: null }) },
  ]);
  expect(codeFromAst(ast)).toEqual(
    comparableCode(`
      const a = require(${dependencyMapName}[0], "b/lib/a");
      exports.do = () => require(${dependencyMapName}[1], "do");
      if (!something) {
        require(${dependencyMapName}[2], "setup/something");
      }
      require(${dependencyMapName}[1], "do");
      function testA(require) {
        const b = require('nonExistantModule');
      }
      {
        const require = function (foo) { return; };
        require('nonExistantModule');
      }
    `)
  );
});

it('collects imports', () => {
  const ast = astFromCode(`
    import b from 'b/lib/a';
    import * as d from 'do';
    import type {s} from 'setup/something';
  `);

  const { dependencies } = collectDependencies(ast, opts);

  expect(dependencies).toEqual([
    { name: 'b/lib/a', data: objectContaining({ asyncType: null }) },
    { name: 'do', data: objectContaining({ asyncType: null }) },
    { name: 'setup/something', data: objectContaining({ asyncType: null }) },
  ]);
});

it('collects export from', () => {
  const ast = astFromCode(`
    export type {Apple} from 'Apple';
    export {Banana} from 'Banana';
    export * from 'Kiwi';
  `);

  const { dependencies } = collectDependencies(ast, opts);
  expect(dependencies).toEqual([
    { name: 'Apple', data: objectContaining({ asyncType: null, exportNames: ['Apple'] }) },
    { name: 'Banana', data: objectContaining({ asyncType: null, exportNames: ['Banana'] }) },
    { name: 'Kiwi', data: objectContaining({ asyncType: null, exportNames: ['*'] }) },
  ]);
});

it('records locations of dependencies', () => {
  const code = dedent`
    import b from 'b/lib/a';
    import * as d from 'do';
    import type {s} from 'setup/something';
    import('some/async/module').then(foo => {});



    require('foo'); __prefetchImport('baz');
    interopRequireDefault(require('quux')); // Simulated Babel output
  `;
  const ast = astFromCode(code);

  // Babel does not guarantee a loc on generated `require()`s.
  // @ts-expect-error: Discovered when typing @babel/parser
  delete ast.program.body[ast.program.body.length - 1].expression.arguments[0].loc;

  const { dependencies } = collectDependencies(ast, opts);

  for (const dep of dependencies) {
    expect(dep).toEqual(objectContaining({ data: objectContaining({ locs: any(Array) }) }));
  }
  expect(formatDependencyLocs(dependencies, code)).toMatchInlineSnapshot(`
    "
    > 1 | import b from 'b/lib/a';
        | ^^^^^^^^^^^^^^^^^^^^^^^^ dep #0 (b/lib/a)
    > 2 | import * as d from 'do';
        | ^^^^^^^^^^^^^^^^^^^^^^^^ dep #1 (do)
    > 3 | import type {s} from 'setup/something';
        | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #2 (setup/something)
    > 4 | import('some/async/module').then(foo => {});
        | ^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #3 (some/async/module)
    > 4 | import('some/async/module').then(foo => {});
        | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #4 (asyncRequire)
    > 8 | require('foo'); __prefetchImport('baz');
        |                 ^^^^^^^^^^^^^^^^^^^^^^^^ dep #4 (asyncRequire)
    > 8 | require('foo'); __prefetchImport('baz');
        | ^^^^^^^^^^^^^^ dep #5 (foo)
    > 8 | require('foo'); __prefetchImport('baz');
        |                 ^^^^^^^^^^^^^^^^^^^^^^^ dep #6 (baz)
    > 9 | interopRequireDefault(require('quux')); // Simulated Babel output
        | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #7 (quux)"
  `);
});

test('integration: records locations of inlined dependencies (Metro ESM)', () => {
  const code = dedent`
    import a from 'a';
    import {b as b1} from 'b';
    import * as c from 'c';
    const d = require('d');

    console.log([a, b1, c, d]);
  `;
  const ast = astFromCode(code);

  const importDefault = 'importDefault';
  const importAll = 'importAll';

  const inlineableCalls = [importDefault, importAll];

  const { ast: transformedAst } = transformFromAstSync(ast, code, {
    ast: true,
    plugins: [
      [
        require('metro-transform-plugins').importExportPlugin,
        {
          importDefault,
          importAll,
        },
      ],
      [require('metro-transform-plugins').inlineRequiresPlugin, { inlineableCalls }],
    ],
    babelrc: false,
    configFile: false,
  })!;

  const { dependencies } = collectDependencies(nullthrows(transformedAst), {
    ...opts,
    inlineableCalls,
  });
  expect(formatDependencyLocs(dependencies, code)).toMatchInlineSnapshot(`
    "
    > 1 | import a from 'a';
        | ^^^^^^^^^^^^^^^^^^ dep #0 (a)
    > 2 | import {b as b1} from 'b';
        | ^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #1 (b)
    > 3 | import * as c from 'c';
        | ^^^^^^^^^^^^^^^^^^^^^^^ dep #2 (c)
    > 4 | const d = require('d');
        |           ^^^^^^^^^^^^ dep #3 (d)"
  `);

  // Verify that dependencies have been inlined into the console.log call.
  expect(codeFromAst(transformedAst)).toMatch(/^console\.log/);
});

test('integration: records locations of inlined dependencies (Babel ESM)', () => {
  const code = dedent`
    import a from 'a';
    import {b as b1} from 'b';
    import * as c from 'c';

    console.log([a, b1, c]);
  `;
  const ast = astFromCode(code);

  const { ast: transformedAst } = transformFromAstSync(ast, code, {
    ast: true,
    plugins: [
      [
        require('@babel/plugin-transform-modules-commonjs'),
        {
          lazy: true,
        },
      ],
    ],
    babelrc: false,
    configFile: false,
  })!;

  const { dependencies } = collectDependencies(nullthrows(transformedAst), opts);
  expect(formatDependencyLocs(dependencies, code)).toMatchInlineSnapshot(`
    "
    > 1 | import a from 'a';
        | ^^^^^^^^^^^^^^^^^^ dep #0 (a)
    > 2 | import {b as b1} from 'b';
        | ^^^^^^^^^^^^^^^^^^^^^^^^^^ dep #1 (b)
    > 3 | import * as c from 'c';
        | ^^^^^^^^^^^^^^^^^^^^^^^ dep #2 (c)"
  `);
});

describe('optional dependencies', () => {
  const opts: Options = {
    asyncRequireModulePath: 'asyncRequire',
    dynamicRequires: 'reject',
    inlineableCalls: [],
    keepRequireNames: true,
    allowOptionalDependencies: true,
    dependencyMapName: null,
    unstable_allowRequireContext: false,
  };
  const validateDependencies = (dependencies: readonly Dependency[], expectedCount: number) => {
    let hasAsync = false;
    let checked = 0;
    dependencies.forEach((d) => {
      if (d.name.includes('-async')) {
        expect(d.data.asyncType).toBe('async');
        hasAsync = true;
      } else {
        expect(d.data.asyncType).toBe(null);
      }
      if (d.name.startsWith('optional') || d.name.startsWith('@somescope/optional')) {
        checked += 1;
        expect(d.data.isOptional).toBeTruthy();
      } else if (
        d.name.startsWith('not-optional') ||
        d.name.startsWith('@somescope/not-optional')
      ) {
        checked += 1;
        expect(d.data.isOptional).toBeFalsy();
      }
    });
    expect(dependencies).toHaveLength(checked + (hasAsync ? 1 : 0));
    expect(dependencies).toHaveLength(expectedCount);
  };
  it('dependency in try-block within 1-level will be optional', () => {
    const ast = astFromCode(`
      function fFunc() {
        import('not-optional-async-f').then();
      }
      try {
        const a = require('optional-a');
        if(true) {
          const b = require('not-optional-b');
        }
        const cFunc = () => {
          const c = require('not-optional-c');
        }
        fFunc();
        cFunc();

        import('optional-async-d');
      } catch(e) {
        require('not-optional-e');
      } finally {
        require('not-optional-g');
      }
      `);

    const { dependencies } = collectDependencies(ast, opts);
    validateDependencies(dependencies, 8);
  });
  it('nested try-block follows the inner-most scope', () => {
    const ast = astFromCode(`
    try {
      const a = require('optional-a');
      try{
        const b = import('optional-async-b');
      } finally {}
      const c = require('optional-c');
    } catch(e) {}
    `);

    const { dependencies } = collectDependencies(ast, opts);
    validateDependencies(dependencies, 4);
  });
  it('can handle single-line statement', () => {
    const ast = astFromCode("try { const a = require('optional-a') } catch (e) {}");
    const { dependencies } = collectDependencies(ast, opts);
    validateDependencies(dependencies, 1);
  });
  it('independent of sibling context', () => {
    const ast = astFromCode(`
      try {
        const x = whatever;
        const a = x ? require('optional-a') : require('optional-b');
      } catch (e) {}
    `);
    const { dependencies } = collectDependencies(ast, opts);
    validateDependencies(dependencies, 2);
  });
  it('ignores require functions defined by lower scopes', () => {
    const ast = astFromCode(`
      const f = (require) => {
        try {
          const c = require('not-dependency');
        } catch (e) {}
      };
    `);
    const { dependencies } = collectDependencies(ast, opts);
    expect(dependencies).toHaveLength(0);
  });
  it('supports using static variables in require statements', () => {
    const ast = astFromCode(`
      const myVar="my";
      try {
        require("foo_" + myVar);
        require(\`bar_\${5 + 2}\`);
      } catch (e) {}
      `);
    const { dependencies } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      {
        name: 'foo_my',
        data: objectContaining({ asyncType: null, isOptional: true }),
      },
      {
        name: 'bar_7',
        data: objectContaining({ asyncType: null, isOptional: true }),
      },
    ]);
  });
  it('can exclude optional dependency', () => {
    const ast = () =>
      astFromCode(`
      const n = 2;
      try {
        const a = require(\`A-\${1 + n}\`);
        const b = require(\`A-\${3 + n}\`);
      } catch (e) {}
    `);
    const { dependencies: deps1 } = collectDependencies(ast(), opts);
    expect(deps1).toEqual([
      { name: 'A-3', data: objectContaining({ isOptional: true }) },
      { name: 'A-5', data: objectContaining({ isOptional: true }) },
    ]);

    const { dependencies: deps2 } = collectDependencies(ast(), {
      ...opts,
      allowOptionalDependencies: false,
    });
    expect(deps2).toEqual([
      { name: 'A-3', data: expect.not.objectContaining({ isOptional: true }) },
      { name: 'A-5', data: expect.not.objectContaining({ isOptional: true }) },
    ]);

    const { dependencies: deps3 } = collectDependencies(ast(), {
      ...opts,
      allowOptionalDependencies: { exclude: ['A-5'] },
    });
    expect(deps3).toEqual([
      { name: 'A-3', data: objectContaining({ isOptional: true }) },
      { name: 'A-5', data: expect.not.objectContaining({ isOptional: true }) },
    ]);
  });
  it('collapses optional and non-optional requires of the same module', () => {
    const ast = astFromCode(`
      const nonOptional = require('foo');
      try {
        const optional = require('foo');
      } catch {}
    `);
    const { dependencies } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      { name: 'foo', data: expect.not.objectContaining({ isOptional: true }) },
    ]);
  });
});

it('uses the dependency transformer specified in the options to transform the dependency calls', () => {
  const ast = astFromCode(`
    const a = require('b/lib/a');
    require(1)
    import b from 'b/lib/b';
    export {Banana} from 'Banana';

    import("some/async/module").then(foo => {});
    __prefetchImport("some/async/module");
  `);

  const { ast: transformedAst } = collectDependencies(ast, {
    ...opts,
    dynamicRequires: 'throwAtRuntime',
    dependencyTransformer: MockDependencyTransformer,
  });

  expect(codeFromAst(transformedAst)).toEqual(
    comparableCode(`
      const a = require(_dependencyMap[0], "b/lib/a");
      requireIllegalDynamicRequire();
      import b from 'b/lib/b';
      export { Banana } from 'Banana';
      require("asyncRequire").async(_dependencyMap[3], "some/async/module").then(foo => {});
      require("asyncRequire").prefetch(_dependencyMap[4], "some/async/module");
      `)
  );
});

it('collects require.resolveWeak calls', () => {
  const ast = astFromCode(`
    require.resolveWeak("some/async/module");
  `);
  const { dependencies, dependencyMapName } = collectDependencies(ast, opts);
  expect(dependencies).toEqual([
    { name: 'some/async/module', data: objectContaining({ asyncType: 'weak' }) },
  ]);
  expect(codeFromAst(ast)).toEqual(
    comparableCode(`
      ${dependencyMapName}[0];
    `)
  );
});

describe('export names', () => {
  it('collects export names from multiple imports', () => {
    const ast = astFromCode(`
    import {A} from 'Apple';
    export { A }
    export { B, C } from 'Apple';
  `);

    const { dependencies } = collectDependencies(ast, opts);
    expect(dependencies).toEqual([
      { name: 'Apple', data: objectContaining({ asyncType: null, exportNames: ['A', 'B', 'C'] }) },
    ]);
  });
});

function formatDependencyLocs(dependencies: readonly Dependency[], code: any) {
  return (
    '\n' +
    dependencies
      .map((dep, depIndex) =>
        dep.data.locs.length
          ? dep.data.locs.map((loc) => formatLoc(loc, depIndex, dep, code)).join('\n')
          : `dep #${depIndex} (${dep.name}): no location recorded`
      )
      .join('\n')
  );
}

function adjustPosForCodeFrame(pos: { column: number; line: number }) {
  return pos ? { ...pos, column: pos.column + 1 } : pos;
}

function adjustLocForCodeFrame(loc: t.SourceLocation) {
  return {
    start: adjustPosForCodeFrame(loc.start),
    end: adjustPosForCodeFrame(loc.end),
  };
}

function formatLoc(loc: t.SourceLocation, depIndex: number, dep: Dependency, code: any) {
  return codeFrameColumns(code, adjustLocForCodeFrame(loc), {
    message: `dep #${depIndex} (${dep.name})`,
    linesAbove: 0,
    linesBelow: 0,
  });
}

function astFromCode(code: string) {
  return babylon.parse(code, {
    plugins: ['dynamicImport', 'flow'],
    sourceType: 'module',
  });
}

// Mock transformer for dependencies. Uses a "readable" format
// require() -> require(id, module name)
// import() -> require(async moudle name).async(id, module name)
// prefetch -> require(async moudle name).prefetch(id, module name)
const MockDependencyTransformer: DependencyTransformer = {
  transformSyncRequire(path: NodePath, dependency: InternalDependency, state: State): void {
    path.replaceWith(
      t.callExpression(t.identifier('require'), [
        createModuleIDExpression(dependency, state),
        t.stringLiteral(dependency.name),
      ])
    );
  },

  transformImportCall(path: NodePath, dependency: InternalDependency, state: State): void {
    transformAsyncRequire(path, dependency, state, 'async');
  },

  transformImportMaybeSyncCall(path: NodePath, dependency: InternalDependency, state: State): void {
    transformAsyncRequire(path, dependency, state, 'unstable_importMaybeSync');
  },

  transformPrefetch(path: NodePath, dependency: InternalDependency, state: State): void {
    transformAsyncRequire(path, dependency, state, 'prefetch');
  },

  transformIllegalDynamicRequire(path: NodePath, state: State): void {
    path.replaceWith(t.callExpression(t.identifier('requireIllegalDynamicRequire'), []));
  },
};

function createModuleIDExpression(dependency: InternalDependency, state: State) {
  return t.memberExpression(
    nullthrows(state.dependencyMapIdentifier),
    t.numericLiteral(dependency.index),
    true
  );
}

function transformAsyncRequire(
  path: NodePath,
  dependency: InternalDependency,
  state: State,
  methodName: string
): void {
  const moduleID = createModuleIDExpression(dependency, state);

  const asyncRequireCall = t.callExpression(t.identifier('require'), [
    nullthrows(state.asyncRequireModulePathStringLiteral),
  ]);

  path.replaceWith(
    t.callExpression(t.memberExpression(asyncRequireCall, t.identifier(methodName)), [
      moduleID,
      t.stringLiteral(dependency.name),
    ])
  );

  // Don't transform e.g. the require('asyncRequire') calls. Requiring the transformation of the
  // `require(asyncrRequireModule) is an implementation detail of the requires transformer and should
  // be tested with the concrete implementations.
  path.skip();
}
