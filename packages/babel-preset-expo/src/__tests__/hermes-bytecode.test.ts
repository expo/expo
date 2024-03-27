import * as babel from '@babel/core';
import * as fs from 'node:fs';
import * as path from 'node:path';

import preset from '..';
import { hermesAsync } from './hermes-util';

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

jest.mock('../common.ts', () => ({
  ...jest.requireActual('../common.ts'),
  hasModule: jest.fn((moduleId) => {
    if (['react-native-reanimated', 'expo-router', '@expo/vector-icons'].includes(moduleId)) {
      return true;
    }
    return false;
  }),
}));

const SAMPLE_CODE = `
try {

} catch ({ message }) {

}
`;

const LANGUAGE_SAMPLES: {
  name: string;
  code: string;
  getCompiledCode: (props: { platform: string }) => string;
  hermesError?: RegExp;
}[] = [
  // Unsupported features
  {
    name: `destructuring in catch statement (ES10)`,
    code: SAMPLE_CODE,
    getCompiledCode({ platform }) {
      return 'try{}catch(_ref){var message=_ref.message;}';
    },
    hermesError: /Destructuring in catch parameters is currently unsupported/,
  },
  {
    name: `classes`,
    code: `class Test {
        constructor(name) {
          this.name = name;
        }
      
        logger() {
          console.log("Hello", this.name);
        }
      }`,
    getCompiledCode({ platform }) {
      return 'var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _classCallCheck2=_interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));var _createClass2=_interopRequireDefault(require("@babel/runtime/helpers/createClass"));var Test=function(){function Test(name){(0,_classCallCheck2.default)(this,Test);this.name=name;}(0,_createClass2.default)(Test,[{key:"logger",value:function logger(){console.log("Hello",this.name);}}]);return Test;}();';
    },
    hermesError: /invalid statement encountered\./,
  },

  // Supported natively
  {
    name: 'numeric-separator',
    code: `var budget = 1_000_000_000_000;
    var nibbles = 0b1010_0001_1000_0101;
    var message = 0xa0_b0_c0;`,
    getCompiledCode({ platform }) {
      return `var budget=1_000_000_000_000;var nibbles=0b1010_0001_1000_0101;var message=0xa0_b0_c0;`;
    },
  },
  {
    name: 'sticky-regex',
    code: `var regex = /foo+/y;`,
    getCompiledCode({ platform }) {
      return `var regex=/foo+/y;`;
    },
  },
  {
    name: 'spread',
    code: `var h = ["a", "b", "c"];

    var i = [...h, "foo"];
    
    var j = foo(...h);`,
    getCompiledCode({ platform }) {
      return `var h=["a","b","c"];var i=[...h,"foo"];var j=foo(...h);`;
    },
  },
];

LANGUAGE_SAMPLES.forEach((sample) => {
  describe(sample.name, () => {
    ['ios', 'web'].forEach((platform) => {
      it(`babel-preset-expo shims support (platform: ${platform})`, async () => {
        const options = {
          babelrc: false,
          presets: [preset],
          filename: '/unknown',
          sourceMaps: true,
          caller: getCaller({ name: 'metro', platform, engine: 'hermes' }),
        };

        const babelResults = babel.transform(sample.code, options)!;
        expect(babelResults.code).toEqual(sample.getCompiledCode({ platform }));

        // Will not throw
        await hermesAsync({ code: babelResults.code! });
      });
    });

    if (sample.hermesError) {
      it(`Hermes does not have native support`, async () => {
        await expect(hermesAsync({ code: sample.code })).rejects.toThrowError(sample.hermesError);
      });
    } else {
      it(`Hermes compiles directly`, async () => {
        await hermesAsync({ code: sample.code });
      });
    }
  });
});
