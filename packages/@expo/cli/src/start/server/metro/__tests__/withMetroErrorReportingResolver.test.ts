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
              '/project/a.js', // origin module
              new Set([
                {
                  path: '/project/b.js',
                  request: 'b',
                },
              ]),
            ],
            [
              '/project/b.js', // origin module
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

  // Create a mock error and context
  const error = new Error('Module not found');
  const context = {
    originModulePath: '/project/b.js',
  } as ResolutionContext;

  // Call the function
  const result = mutateResolutionError(error, context, 'c', 'ios');

  // Check that the import stack was added
  expect(strip(expoImportStack(result))).toMatchInlineSnapshot(`
    "Import stack:

     b.js
     | import "c"

     a.js
     | import "b"
    "
  `);
});
