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
                  "code": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      var _foo = require(_dependencyMap[0], "./foo");
      console.log(_foo.foo);
    });",
                  "expoCacheVary": undefined,
                  "expoDomComponentReference": undefined,
                  "functionMap": {
                    "mappings": "AAA",
                    "names": [
                      "<global>",
                    ],
                  },
                  "hasCjsExports": false,
                  "lineCount": 6,
                  "loaderReference": undefined,
                  "map": {
                    "mappings": ";;;EACI,IAAAA,IAAA,GAAAC,OAAA,CAAAC,cAAA;EACAC,OAAO,CAACC,GAAG,CAACC,IAAG,CAAAA,GAAA,CAAC;AAAC,G",
                    "names": [
                      "_foo",
                      "require",
                      "_dependencyMap",
                      "console",
                      "log",
                      "foo",
                    ],
                  },
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
                  "code": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      "use strict";

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      Object.defineProperty(exports, "foo", {
        enumerable: true,
        get: function () {
          return foo;
        }
      });
      const foo = 'foo';
    });",
                  "expoCacheVary": undefined,
                  "expoDomComponentReference": undefined,
                  "functionMap": {
                    "mappings": "AAA",
                    "names": [
                      "<global>",
                    ],
                  },
                  "hasCjsExports": false,
                  "lineCount": 14,
                  "loaderReference": undefined,
                  "map": {
                    "mappings": ";;;;;;EACIA,MAAA,CAAAC,cAAA,CAAAC,OAAA;IAAAC,UAAA;IAAAC,GAAA,WAAAA,CAAA;MAAA,OAAAC,GAAA;IAAA;EAAA;EAAO,MAAMA,GAAG,GAAG,KAAK;AAAC,G",
                    "names": [
                      "Object",
                      "defineProperty",
                      "exports",
                      "enumerable",
                      "get",
                      "foo",
                    ],
                  },
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
            "reactCompiler": undefined,
          },
          "dev": true,
          "experimentalImportSupport": true,
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
