import { fromFixture } from './fromFixture';

const fixture = [
  '/apps/sandbox/index.js',
  [
    {
      dependencies: {},
      getSource: '[MOCK_FUNCTION]',
      inverseDependencies: [],
      path: '__prelude__',
      output: [
        {
          type: 'js/script/virtual',
          data: { code: '...', lineCount: 1, map: [], functionMap: {} },
        },
      ],
    },
    {
      dependencies: {},
      getSource: '[MOCK_FUNCTION]',
      inverseDependencies: [],
      path: '/node_modules/metro-runtime/src/polyfills/require.js',
      output: [
        {
          type: 'js/script',
          data: { code: '...', lineCount: 226, map: [], functionMap: {} },
        },
      ],
    },
    {
      dependencies: {},
      getSource: '[MOCK_FUNCTION]',
      inverseDependencies: [],
      path: '/apps/sandbox/.expo/metro/polyfill.js',
      output: [
        {
          type: 'js/script',
          data: { code: '...', lineCount: 5, map: [], functionMap: {} },
        },
      ],
    },
  ],
  {
    dependencies: {
      '/apps/sandbox/index.js': {
        dependencies: {
          'L7wGwGsCFqQPv6VNYFbtUyf3Ofg=': {
            absolutePath: '/apps/sandbox/app?ctx=00a49026d14296b554d166f173e51f0f674490dc',
            data: {
              name: './app',
              data: {
                asyncType: null,
                locs: [
                  {
                    start: { line: 4, column: 12, index: 63 },
                    end: { line: 4, column: 56, index: 107 },
                  },
                ],
                key: 'L7wGwGsCFqQPv6VNYFbtUyf3Ofg=',
                contextParams: {
                  recursive: true,
                  filter: { pattern: '.*', flags: '' },
                  mode: 'lazy',
                },
              },
            },
          },
        },
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: [],
        path: '/apps/sandbox/index.js',
        output: [
          {
            type: 'js/module',
            data: { code: '...', lineCount: 6, map: [], functionMap: {} },
          },
        ],
      },
      '/apps/sandbox/app?ctx=00a49026d14296b554d166f173e51f0f674490dc': {
        dependencies: {
          'NwET+S9mGPa81JcTpWvb3ddfYpc=': {
            absolutePath: '/apps/sandbox/app/index.tsx',
            data: {
              name: '/apps/sandbox/app/index.tsx',
              data: {
                asyncType: 'async',
                locs: [
                  {
                    start: { line: 3, column: 52, index: 164 },
                    end: { line: 3, column: 127, index: 239 },
                  },
                ],
                key: 'NwET+S9mGPa81JcTpWvb3ddfYpc=',
              },
            },
          },
          'CH2XZQoRgNDQSKLPM+lmAnJL8iU=': {
            absolutePath: '/node_modules/metro-runtime/src/modules/asyncRequire.js',
            data: {
              name: 'metro-runtime/src/modules/asyncRequire',
              data: {
                asyncType: null,
                locs: [
                  {
                    start: { line: 3, column: 45, index: 157 },
                    end: { line: 3, column: 128, index: 240 },
                  },
                  {
                    start: { line: 4, column: 43, index: 289 },
                    end: { line: 4, column: 124, index: 370 },
                  },
                ],
                key: 'CH2XZQoRgNDQSKLPM+lmAnJL8iU=',
              },
            },
          },
          'PF8kededT4dE+TZeteAwGOfxoEc=': {
            absolutePath: '/apps/sandbox/app/two.tsx',
            data: {
              name: '/apps/sandbox/app/two.tsx',
              data: {
                asyncType: 'async',
                locs: [
                  {
                    start: { line: 4, column: 50, index: 296 },
                    end: { line: 4, column: 123, index: 369 },
                  },
                ],
                key: 'PF8kededT4dE+TZeteAwGOfxoEc=',
              },
            },
          },
        },
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: ['/apps/sandbox/index.js'],
        path: '/apps/sandbox/app?ctx=00a49026d14296b554d166f173e51f0f674490dc',
        output: [
          {
            type: 'js/module',
            data: { code: '...', lineCount: 31, map: [], functionMap: {} },
          },
        ],
      },
      '/apps/sandbox/app/index.tsx': {
        dependencies: {
          '5dCMGbjkz1QWCPjOwzvy5ZBkuK8=': {
            absolutePath: '/node_modules/react/jsx-runtime.js',
            data: {
              name: 'react/jsx-runtime',
              data: {
                asyncType: null,
                locs: [
                  {
                    start: { line: 1, column: 0, index: 0 },
                    end: { line: 4, column: 0, index: 59 },
                  },
                ],
                key: '5dCMGbjkz1QWCPjOwzvy5ZBkuK8=',
              },
            },
          },
        },
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: ['/apps/sandbox/app?ctx=00a49026d14296b554d166f173e51f0f674490dc'],
        path: '/apps/sandbox/app/index.tsx',
        output: [
          {
            type: 'js/module',
            data: { code: '...', lineCount: 12, map: [], functionMap: {} },
          },
        ],
      },
      '/node_modules/react/jsx-runtime.js': {
        dependencies: {
          'JI/aUdYTEZiDDkFBQ05e5cANCSQ=': {
            absolutePath: '/node_modules/react/cjs/react-jsx-runtime.production.min.js',
            data: {
              name: './cjs/react-jsx-runtime.production.min.js',
              data: {
                asyncType: null,
                locs: [
                  {
                    start: { line: 4, column: 19, index: 79 },
                    end: { line: 4, column: 71, index: 131 },
                  },
                ],
                key: 'JI/aUdYTEZiDDkFBQ05e5cANCSQ=',
              },
            },
          },
        },
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: ['/apps/sandbox/app/two.tsx', '/apps/sandbox/app/index.tsx'],
        path: '/node_modules/react/jsx-runtime.js',
        output: [
          {
            type: 'js/module',
            data: { code: '...', lineCount: 7, map: [], functionMap: {} },
          },
        ],
      },
      '/node_modules/react/cjs/react-jsx-runtime.production.min.js': {
        dependencies: {
          'a4EMkKqamYWCMMPV7UeQlqGQ+ks=': {
            absolutePath: '/node_modules/react/index.js',
            data: {
              name: 'react',
              data: {
                asyncType: null,
                locs: [
                  {
                    start: { line: 10, column: 19, index: 268 },
                    end: { line: 10, column: 35, index: 284 },
                  },
                ],
                key: 'a4EMkKqamYWCMMPV7UeQlqGQ+ks=',
              },
            },
          },
        },
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: ['/node_modules/react/jsx-runtime.js'],
        path: '/node_modules/react/cjs/react-jsx-runtime.production.min.js',
        output: [
          {
            type: 'js/module',
            data: { code: '...', lineCount: 46, map: [], functionMap: {} },
          },
        ],
      },
      '/node_modules/react/index.js': {
        dependencies: {
          'o6LUmcGhGDGFmiS8H/cQ2YcU4VM=': {
            absolutePath: '/node_modules/react/cjs/react.production.min.js',
            data: {
              name: './cjs/react.production.min.js',
              data: {
                asyncType: null,
                locs: [
                  {
                    start: { line: 4, column: 19, index: 79 },
                    end: { line: 4, column: 59, index: 119 },
                  },
                ],
                key: 'o6LUmcGhGDGFmiS8H/cQ2YcU4VM=',
              },
            },
          },
        },
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: ['/node_modules/react/cjs/react-jsx-runtime.production.min.js'],
        path: '/node_modules/react/index.js',
        output: [
          {
            type: 'js/module',
            data: { code: '...', lineCount: 7, map: [], functionMap: {} },
          },
        ],
      },
      '/node_modules/react/cjs/react.production.min.js': {
        dependencies: {},
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: ['/node_modules/react/index.js'],
        path: '/node_modules/react/cjs/react.production.min.js',
        output: [
          {
            type: 'js/module',
            data: { code: '...', lineCount: 352, map: [], functionMap: {} },
          },
        ],
      },
      '/node_modules/metro-runtime/src/modules/asyncRequire.js': {
        dependencies: {
          '8I802z/QkQYw0PV6ZCqhBNDwn0Q=': {
            absolutePath: '/node_modules/@babel/runtime/helpers/asyncToGenerator.js',
            data: {
              name: '@babel/runtime/helpers/asyncToGenerator',
              data: {
                asyncType: null,
                locs: [
                  {
                    start: { line: 1, column: 0, index: 0 },
                    end: { line: 46, column: 0, index: 1166 },
                  },
                ],
                key: '8I802z/QkQYw0PV6ZCqhBNDwn0Q=',
              },
            },
          },
        },
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: ['/apps/sandbox/app?ctx=00a49026d14296b554d166f173e51f0f674490dc'],
        path: '/node_modules/metro-runtime/src/modules/asyncRequire.js',
        output: [
          {
            type: 'js/module',
            data: { code: '...', lineCount: 56, map: [], functionMap: {} },
          },
        ],
      },
      '/node_modules/@babel/runtime/helpers/asyncToGenerator.js': {
        dependencies: {},
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: ['/node_modules/metro-runtime/src/modules/asyncRequire.js'],
        path: '/node_modules/@babel/runtime/helpers/asyncToGenerator.js',
        output: [
          {
            type: 'js/module',
            data: { code: '...', lineCount: 33, map: [], functionMap: {} },
          },
        ],
      },
      '/apps/sandbox/app/two.tsx': {
        dependencies: {
          '5dCMGbjkz1QWCPjOwzvy5ZBkuK8=': {
            absolutePath: '/node_modules/react/jsx-runtime.js',
            data: {
              name: 'react/jsx-runtime',
              data: {
                asyncType: null,
                locs: [
                  {
                    start: { line: 1, column: 0, index: 0 },
                    end: { line: 4, column: 0, index: 59 },
                  },
                ],
                key: '5dCMGbjkz1QWCPjOwzvy5ZBkuK8=',
              },
            },
          },
        },
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: ['/apps/sandbox/app?ctx=00a49026d14296b554d166f173e51f0f674490dc'],
        path: '/apps/sandbox/app/two.tsx',
        output: [
          {
            type: 'js/module',
            data: { code: '...', lineCount: 12, map: [], functionMap: {} },
          },
        ],
      },
    },
    entryPoints: [['/apps/sandbox/index.js', '/apps/sandbox/index.js']],
    transformOptions: {
      customTransformOptions: { environment: 'client' },
      dev: false,
      hot: true,
      minify: false,
      platform: 'web',
      type: 'module',
      unstable_transformProfile: 'default',
    },
  },
  {
    asyncRequireModulePath: '/node_modules/metro-runtime/src/modules/asyncRequire.js',
    processModuleFilter: '[Function: processModuleFilter]',
    createModuleId: '[Function (anonymous)]',
    getRunModuleStatement: '[Function: getRunModuleStatement]',
    includeAsyncPaths: false,
    dev: false,
    projectRoot: '/apps/sandbox',
    modulesOnly: false,
    runBeforeMainModule: [
      '/node_modules/react-native/Libraries/Core/InitializeCore.js',
      '/packages/@expo/metro-runtime/build/index.js',
    ],
    runModule: true,
    sourceMapUrl:
      '//localhost:8081/apps/sandbox/index.map?platform=web&dev=false&hot=false&lazy=false&resolver.environment=client&transform.environment=client&serializer.output=static',
    sourceUrl:
      'http://localhost:8081/apps/sandbox/index.bundle//&platform=web&dev=false&hot=false&lazy=false&resolver.environment=client&transform.environment=client&serializer.output=static',
    inlineSourceMap: false,
    serverRoot: '/Users/evanbacon/Documents/GitHub/expo',
    shouldAddToIgnoreList: '[Function: shouldAddToIgnoreList]',
  },
] as const;

export default fromFixture(fixture);
