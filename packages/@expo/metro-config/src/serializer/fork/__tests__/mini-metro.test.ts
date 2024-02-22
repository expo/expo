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

it(`can create a micro Metro graph fixture`, () => {
  expect(microBundle({ fs })).toMatchInlineSnapshot(`
    [
      "/app/index.js",
      [],
      {
        "dependencies": Map {
          "/app/index.js" => {
            "dependencies": Map {
              "BMmp2IBk5bHEtqZLRWIvwl1M4ck=" => {
                "absolutePath": "/app/foo.js",
                "data": {
                  "data": {
                    "asyncType": null,
                    "key": "BMmp2IBk5bHEtqZLRWIvwl1M4ck=",
                    "locs": [
                      {
                        "end": {
                          "column": 32,
                          "index": 33,
                          "line": 2,
                        },
                        "filename": undefined,
                        "identifierName": undefined,
                        "start": {
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
                  "code": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
      var foo = _$$_REQUIRE(dependencyMap[0], "./foo").foo;
      console.log(foo);
    });",
                  "lineCount": 4,
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
                  "code": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      const foo = 'foo';
      exports.foo = foo;
    });",
                  "lineCount": 7,
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
          },
          "dev": true,
          "hot": false,
          "minify": false,
          "platform": "web",
          "type": "module",
          "unstable_transformProfile": "default",
        },
      },
      {
        "asyncRequireModulePath": "expo-mock/async-require",
        "createModuleId": [Function],
        "dev": true,
        "getRunModuleStatement": [Function],
        "includeAsyncPaths": true,
        "inlineSourceMap": undefined,
        "modulesOnly": false,
        "processModuleFilter": [Function],
        "projectRoot": "/app/",
        "runBeforeMainModule": [],
        "runModule": true,
        "serializerOptions": undefined,
        "serverRoot": "/app/",
        "shouldAddToIgnoreList": [Function],
        "sourceMapUrl": undefined,
      },
    ]
  `);
});
