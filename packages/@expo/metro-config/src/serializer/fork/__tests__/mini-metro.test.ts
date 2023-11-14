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
    Map {
      "index.js" => {
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
      "foo.js" => {
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
    }
  `);
});
