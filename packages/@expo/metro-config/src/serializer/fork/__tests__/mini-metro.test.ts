import { microBundle } from './mini-metro';

const fs = {
  'index.js': `
    import { foo } from './foo';
    console.log(foo);
  `,
  'foo.js': `
    export const foo = 'foo';
  `,
};

it(`can create a micro Metro graph fixture`, async () => {
  expect(await microBundle({ fs })).toMatchInlineSnapshot(`
    [
      "/app/index.js",
      [],
      {
        "dependencies": Map {
          "/app/index.js" => {
            "dependencies": Map {
              "w3xsnP8GGa/kB56APw6c+VOi8X0=" => {
                "absolutePath": "/app/foo.js",
                "data": {
                  "data": {
                    "asyncType": null,
                    "exportNames": [
                      "*",
                    ],
                    "imports": 1,
                    "isESMImport": true,
                    "key": "w3xsnP8GGa/kB56APw6c+VOi8X0=",
                    "locs": [
                      SourceLocation {
                        "end": Position {
                          "column": 32,
                          "index": 33,
                          "line": 2,
                        },
                        "filename": undefined,
                        "identifierName": undefined,
                        "start": Position {
                          "column": 4,
                          "index": 5,
                          "line": 2,
                        },
                      },
                    ],
                  },
                  "name": "./foo",
                },
              },
            },
            "getSource": [Function],
            "inverseDependencies": [],
            "output": [
              {
                "data": {
                  "code": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      var _foo = _$$_REQUIRE(_dependencyMap[0], "./foo");
      console.log(_foo.foo);
    });",
                  "expoDomComponentReference": undefined,
                  "functionMap": {
                    "mappings": "AAA",
                    "names": [
                      "<global>",
                    ],
                  },
                  "hasCjsExports": false,
                  "lineCount": 6,
                  "map": [
                    [
                      4,
                      2,
                      2,
                      4,
                    ],
                    [
                      4,
                      6,
                      2,
                      4,
                      "_foo",
                    ],
                    [
                      4,
                      10,
                      2,
                      4,
                    ],
                    [
                      4,
                      13,
                      2,
                      4,
                      "_$$_REQUIRE",
                    ],
                    [
                      4,
                      24,
                      2,
                      4,
                    ],
                    [
                      4,
                      25,
                      2,
                      4,
                      "_dependencyMap",
                    ],
                    [
                      4,
                      39,
                      2,
                      4,
                    ],
                    [
                      5,
                      2,
                      3,
                      4,
                      "console",
                    ],
                    [
                      5,
                      9,
                      3,
                      11,
                    ],
                    [
                      5,
                      10,
                      3,
                      12,
                      "log",
                    ],
                    [
                      5,
                      13,
                      3,
                      15,
                    ],
                    [
                      5,
                      14,
                      3,
                      15,
                      "_foo",
                    ],
                    [
                      5,
                      18,
                      3,
                      15,
                    ],
                    [
                      5,
                      19,
                      3,
                      15,
                      "foo",
                    ],
                    [
                      5,
                      22,
                      3,
                      19,
                    ],
                    [
                      5,
                      23,
                      3,
                      20,
                    ],
                    [
                      6,
                      0,
                      3,
                      21,
                    ],
                    [
                      6,
                      3,
                    ],
                  ],
                  "reactClientReference": undefined,
                  "reactServerReference": undefined,
                },
                "type": "js/module",
              },
            ],
            "path": "/app/index.js",
          },
          "/app/foo.js" => {
            "dependencies": Map {},
            "getSource": [Function],
            "inverseDependencies": [
              "/app/index.js",
            ],
            "output": [
              {
                "data": {
                  "code": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      const foo = 'foo';
      exports.foo = foo;
    });",
                  "expoDomComponentReference": undefined,
                  "functionMap": {
                    "mappings": "AAA",
                    "names": [
                      "<global>",
                    ],
                  },
                  "hasCjsExports": false,
                  "lineCount": 9,
                  "map": [
                    [
                      7,
                      2,
                      2,
                      11,
                    ],
                    [
                      7,
                      8,
                      2,
                      17,
                      "foo",
                    ],
                    [
                      7,
                      11,
                      2,
                      20,
                    ],
                    [
                      7,
                      14,
                      2,
                      23,
                    ],
                    [
                      7,
                      19,
                      2,
                      28,
                    ],
                    [
                      8,
                      2,
                      2,
                      4,
                      "exports",
                    ],
                    [
                      8,
                      9,
                      2,
                      4,
                    ],
                    [
                      8,
                      10,
                      2,
                      4,
                      "foo",
                    ],
                    [
                      8,
                      13,
                      2,
                      4,
                    ],
                    [
                      8,
                      16,
                      2,
                      4,
                      "foo",
                    ],
                    [
                      8,
                      19,
                      2,
                      4,
                    ],
                    [
                      9,
                      0,
                      2,
                      29,
                    ],
                    [
                      9,
                      3,
                    ],
                  ],
                  "reactClientReference": undefined,
                  "reactServerReference": undefined,
                },
                "type": "js/module",
              },
            ],
            "path": "/app/foo.js",
          },
        },
        "entryPoints": Set {
          "/app/index.js",
        },
        "transformOptions": {
          "customTransformOptions": {
            "baseUrl": undefined,
            "bytecode": undefined,
            "engine": undefined,
            "environment": undefined,
            "optimize": undefined,
          },
          "dev": true,
          "experimentalImportSupport": true,
          "hot": false,
          "inlineRequires": false,
          "minify": false,
          "platform": "web",
          "type": "module",
          "unstable_transformProfile": "default",
        },
      },
      {
        "_test_getPackageJson": [Function],
        "asyncRequireModulePath": "expo-mock/async-require",
        "createModuleId": [Function],
        "dev": true,
        "getRunModuleStatement": [Function],
        "includeAsyncPaths": true,
        "inlineSourceMap": undefined,
        "modulesOnly": false,
        "processModuleFilter": [Function],
        "projectRoot": "/app",
        "runBeforeMainModule": [],
        "runModule": true,
        "serializerOptions": undefined,
        "serverRoot": "/app",
        "shouldAddToIgnoreList": [Function],
        "sourceMapUrl": undefined,
        "sourceUrl": undefined,
      },
    ]
  `);
});
