import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
import type { ResolutionContext } from '@expo/metro/metro-resolver';
import { stripVTControlCharacters } from 'node:util';

import { createMutateResolutionError, type DepGraph } from '../withMetroErrorReportingResolver';

const strip = (value: string) => stripVTControlCharacters(value);

const expoImportStack = (error: Error & { _expoImportStack?: string }): string | undefined =>
  error._expoImportStack;

it('adds import stack to error', () => {
  const config = {
    projectRoot: '/project',
    server: {
      unstable_serverRoot: '/project',
    },
  } as MetroConfig;

  // Create a simple dependency graph: a.js -> b.js -> c.js
  const depGraph: DepGraph = new Map([
    [
      '{}', // custom options (empty object serialized)
      new Map([
        [
          'ios', // platform
          new Map([
            [
              '/project/a.js',
              new Set([
                {
                  path: '/project/b.js',
                  request: 'b',
                },
              ]),
            ],
            [
              '/project/b.js',
              new Set([
                {
                  path: '/project/c.js',
                  request: 'c',
                },
              ]),
            ],
            [
              '/project/c.js', // unresolved module
              new Set<{ path: string; request: string }>(),
            ],
          ]),
        ],
      ]),
    ],
  ]);

  const mutateResolutionError = createMutateResolutionError(config, depGraph);

  const error = new Error('Module not found');
  const context = {
    originModulePath: '/project/b.js',
  } as ResolutionContext;

  const result = mutateResolutionError(error, context, 'c', 'ios');

  expect(strip(expoImportStack(result))).toMatchInlineSnapshot(`
    "Import stack:

     b.js
     | import "c"

     a.js
     | import "b"
    "
  `);
});

it('adds import stack with circular dependencies to error', () => {
  const config = {
    projectRoot: '/project',
    server: {
      unstable_serverRoot: '/project',
    },
  } as MetroConfig;

  // Create a circular dependency graph: foo.js -> bar.js -> foo.js
  const depGraph: DepGraph = new Map([
    [
      '{}', // custom options (empty object serialized)
      new Map([
        [
          'ios', // platform
          new Map([
            [
              '/project/foo.js',
              new Set([
                {
                  path: '/project/bar.js',
                  request: 'bar',
                },
              ]),
            ],
            [
              '/project/bar.js',
              new Set([
                {
                  path: '/project/foo.js',
                  request: 'foo',
                },
              ]),
            ],
          ]),
        ],
      ]),
    ],
  ]);

  const mutateResolutionError = createMutateResolutionError(config, depGraph);

  const error = new Error('Module not found');
  const context = {
    originModulePath: '/project/bar.js',
  } as ResolutionContext;

  const result = mutateResolutionError(error, context, 'foo', 'ios');

  expect(strip(expoImportStack(result))).toMatchInlineSnapshot(`
    "Import stack:

     bar.js
     | import "foo"

     foo.js
     | import "bar"

     bar.js
     | import "foo"
               ^ The import above creates circular dependency.
    "
  `);
});

it('adds import stack with stack depth limit to error', () => {
  const config = {
    projectRoot: '/project',
    server: {
      unstable_serverRoot: '/project',
    },
  } as MetroConfig;

  // Create a deep dependency graph: a.js -> b.js -> c.js -> d.js
  const depGraph: DepGraph = new Map([
    [
      '{}', // custom options (empty object serialized)
      new Map([
        [
          'ios', // platform
          new Map([
            [
              '/project/a.js',
              new Set([
                {
                  path: '/project/b.js',
                  request: 'b',
                },
              ]),
            ],
            [
              '/project/b.js',
              new Set([
                {
                  path: '/project/c.js',
                  request: 'c',
                },
              ]),
            ],
            [
              '/project/c.js',
              new Set([
                {
                  path: '/project/d.js',
                  request: 'd',
                },
              ]),
            ],
            [
              '/project/d.js', // unresolved module
              new Set<{ path: string; request: string }>(),
            ],
          ]),
        ],
      ]),
    ],
  ]);

  const mutateResolutionError = createMutateResolutionError(config, depGraph, 2);

  const error = new Error('Module not found');
  const context = {
    originModulePath: '/project/d.js',
  } as ResolutionContext;

  const result = mutateResolutionError(error, context, 'missing', 'ios');

  expect(strip(expoImportStack(result))).toMatchInlineSnapshot(`
    "Import stack:

     d.js
     | import "missing"

     c.js
     | import "d"

     Depth limit reached. The actual stack is longer than what you can see above.
    "
  `);
});

it('adds import stack with stack count limit to error', () => {
  const config = {
    projectRoot: '/project',
    server: {
      unstable_serverRoot: '/project',
    },
  } as MetroConfig;

  const depGraph: DepGraph = new Map([
    [
      '{}', // custom options (empty object serialized)
      new Map([
        [
          'ios', // platform
          new Map([
            [
              '/project/node_modules/a.js',
              new Set([
                {
                  path: '/project/b.js',
                  request: 'b',
                },
              ]),
            ],
            [
              '/project/a.js',
              new Set([
                {
                  path: '/project/b.js',
                  request: 'b',
                },
              ]),
            ],
            [
              '/project/b.js',
              new Set([
                {
                  path: '/project/c.js',
                  request: 'c',
                },
              ]),
            ],
            [
              '/project/c.js', // unresolved module
              new Set<{ path: string; request: string }>(),
            ],
          ]),
        ],
      ]),
    ],
  ]);

  const mutateResolutionError = createMutateResolutionError(config, depGraph, undefined, 2); // count limit of 2

  const error = new Error('Module not found');
  const context = {
    originModulePath: '/project/b.js',
  } as ResolutionContext;

  const result = mutateResolutionError(error, context, 'c', 'ios');

  expect(strip(expoImportStack(result))).toMatchInlineSnapshot(`
    "Import stack (2):

     b.js
     | import "c"

     node_modules/a.js
     | import "b"
    "
  `);
});

it('prioritizes project stack over node_modules, circular deps, and depth limited stacks', () => {
  const config = {
    projectRoot: '/project',
    server: {
      unstable_serverRoot: '/project',
    },
  } as MetroConfig;

  const depGraph: DepGraph = new Map([
    [
      '{}', // custom options (empty object serialized)
      new Map([
        [
          'ios', // platform
          new Map([
            // Node modules stack
            [
              '/project/node_modules/lib.js',
              new Set([
                {
                  path: '/project/utils.js',
                  request: 'utils',
                },
              ]),
            ],
            // Circular dependency stack
            [
              '/project/circular1.js',
              new Set([
                {
                  path: '/project/circular2.js',
                  request: 'circular2',
                },
              ]),
            ],
            [
              '/project/circular2.js',
              new Set([
                {
                  path: '/project/circular1.js',
                  request: 'circular1',
                },
                {
                  path: '/project/utils.js',
                  request: 'utils',
                },
              ]),
            ],
            // Deep stack that would hit depth limit
            [
              '/project/deep1.js',
              new Set([
                {
                  path: '/project/deep2.js',
                  request: 'deep2',
                },
              ]),
            ],
            [
              '/project/deep2.js',
              new Set([
                {
                  path: '/project/deep3.js',
                  request: 'deep3',
                },
              ]),
            ],
            [
              '/project/deep3.js',
              new Set([
                {
                  path: '/project/deep4.js',
                  request: 'deep4',
                },
              ]),
            ],
            [
              '/project/deep4.js',
              new Set([
                {
                  path: '/project/utils.js',
                  request: 'utils',
                },
              ]),
            ],
            // preferred project
            [
              '/project/app.js',
              new Set([
                {
                  path: '/project/utils.js',
                  request: 'utils',
                },
              ]),
            ],
            [
              '/project/utils.js',
              new Set([
                {
                  path: '/project/missing.js',
                  request: 'missing',
                },
              ]),
            ],
          ]),
        ],
      ]),
    ],
  ]);

  const mutateResolutionError = createMutateResolutionError(config, depGraph, 3);

  const error = new Error('Module not found');
  const context = {
    originModulePath: '/project/utils.js',
  } as ResolutionContext;

  const result = mutateResolutionError(error, context, 'missing', 'ios');

  expect(strip(expoImportStack(result))).toMatchInlineSnapshot(`
    "Import stack:

     utils.js
     | import "missing"

     app.js
     | import "utils"
    "
  `);
});

it('prioritizes projectRoot stack over server root stack', () => {
  const config = {
    projectRoot: '/server-root/project',
    server: {
      unstable_serverRoot: '/server-root',
    },
  } as MetroConfig;

  const depGraph: DepGraph = new Map([
    [
      '{}', // custom options (empty object serialized)
      new Map([
        [
          'ios', // platform
          new Map([
            // Server root stack
            [
              '/server-root/lib.js',
              new Set([
                {
                  path: '/server-root/project/utils.js',
                  request: 'utils',
                },
              ]),
            ],
            // Project root stack (should be preferred)
            [
              '/server-root/project/app.js',
              new Set([
                {
                  path: '/server-root/project/utils.js',
                  request: 'utils',
                },
              ]),
            ],
            [
              '/server-root/project/utils.js',
              new Set([
                {
                  path: '/server-root/project/missing.js',
                  request: 'missing',
                },
              ]),
            ],
          ]),
        ],
      ]),
    ],
  ]);

  const mutateResolutionError = createMutateResolutionError(config, depGraph);

  const error = new Error('Module not found');
  const context = {
    originModulePath: '/server-root/project/utils.js',
  } as ResolutionContext;

  const result = mutateResolutionError(error, context, 'missing', 'ios');

  expect(strip(expoImportStack(result))).toMatchInlineSnapshot(`
    "Import stack:

     project/utils.js
     | import "missing"

     project/app.js
     | import "utils"
    "
  `);
});
