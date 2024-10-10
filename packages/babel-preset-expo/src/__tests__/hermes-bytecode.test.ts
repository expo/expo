import * as babel from '@babel/core';

import preset from '..';
import { compileToHermesBytecodeAsync } from './hermes-util';

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
  unhandledInBabel?: boolean;
}[] = [
  // Unsupported features
  {
    name: `destructuring in catch statement (ES10)`,
    code: SAMPLE_CODE,
    getCompiledCode({ platform }) {
      if (platform === 'web') {
        return 'try{}catch({message}){}';
      }
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
      if (platform === 'web') {
        return 'class Test{constructor(name){this.name=name;}logger(){console.log("Hello",this.name);}}';
      }
      return 'var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _classCallCheck2=_interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));var _createClass2=_interopRequireDefault(require("@babel/runtime/helpers/createClass"));var Test=function(){function Test(name){(0,_classCallCheck2.default)(this,Test);this.name=name;}return(0,_createClass2.default)(Test,[{key:"logger",value:function logger(){console.log("Hello",this.name);}}]);}();';
    },
    hermesError: /invalid statement encountered\./,
  },
  {
    // https://babeljs.io/docs/babel-plugin-transform-async-generator-functions
    // Hermes docs say this is supported, but I can't get it to work (March 27, 2024). https://hermesengine.dev/docs/language-features#supported
    name: `async-generator-functions`,
    code: `async function* agf() {
        await 1;
        yield 2;
      }`,
    getCompiledCode({ platform }) {
      if (platform === 'web') {
        return 'async function*agf(){await 1;yield 2;}';
      }
      return 'var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _awaitAsyncGenerator2=_interopRequireDefault(require("@babel/runtime/helpers/awaitAsyncGenerator"));var _wrapAsyncGenerator2=_interopRequireDefault(require("@babel/runtime/helpers/wrapAsyncGenerator"));function agf(){return _agf.apply(this,arguments);}function _agf(){_agf=(0,_wrapAsyncGenerator2.default)(function*(){yield(0,_awaitAsyncGenerator2.default)(1);yield 2;});return _agf.apply(this,arguments);}';
    },
    hermesError: /async generators are unsupported/,
  },
  {
    // https://babeljs.io/docs/babel-plugin-transform-private-methods
    name: `private-methods`,
    code: `class Counter {
        #foo() {}

      }`,
    getCompiledCode({ platform }) {
      if (platform === 'web') {
        return 'var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _classPrivateFieldLooseKey2=_interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseKey"));var _foo=(0,_classPrivateFieldLooseKey2.default)("foo");class Counter{constructor(){Object.defineProperty(this,_foo,{value:_foo2});}}function _foo2(){}';
      }
      return 'var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _createClass2=_interopRequireDefault(require("@babel/runtime/helpers/createClass"));var _classCallCheck2=_interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));var _classPrivateFieldLooseKey2=_interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseKey"));var _foo=(0,_classPrivateFieldLooseKey2.default)("foo");var Counter=(0,_createClass2.default)(function Counter(){(0,_classCallCheck2.default)(this,Counter);Object.defineProperty(this,_foo,{value:_foo2});});function _foo2(){}';
    },
    hermesError: /private properties are not supported/,
  },
  {
    // https://babeljs.io/docs/babel-plugin-transform-private-property-in-object
    name: `private-property-in-object`,
    code: `class Foo {
        #bar = "bar";

        test(obj) {
          return #bar in obj;
        }
      }`,
    getCompiledCode({ platform }) {
      if (platform === 'web') {
        return `function _checkInRHS(e){if(Object(e)!==e)throw TypeError("right-hand side of 'in' should be an object, got "+(null!==e?typeof e:"null"));return e;}var _barBrandCheck=new WeakSet();class Foo{#bar=(_barBrandCheck.add(this),"bar");test(obj){return _barBrandCheck.has(_checkInRHS(obj));}}`;
      }
      return 'var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _classCallCheck2=_interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));var _createClass2=_interopRequireDefault(require("@babel/runtime/helpers/createClass"));var _classPrivateFieldLooseKey2=_interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseKey"));function _checkInRHS(e){if(Object(e)!==e)throw TypeError("right-hand side of \'in\' should be an object, got "+(null!==e?typeof e:"null"));return e;}var _bar=(0,_classPrivateFieldLooseKey2.default)("bar");var Foo=function(){function Foo(){(0,_classCallCheck2.default)(this,Foo);Object.defineProperty(this,_bar,{writable:true,value:"bar"});}return(0,_createClass2.default)(Foo,[{key:"test",value:function test(obj){return Object.prototype.hasOwnProperty.call(_checkInRHS(obj),_bar);}}]);}();';
    },
    hermesError: /private properties are not supported/,
  },
  {
    // Sanity check. It appears Hermes can parse JSX optionally.
    name: `JSX`,
    code: `const value = (<div />)`,
    getCompiledCode({ platform }) {
      if (platform === 'web') {
        return `var _jsxDevRuntime=require("react/jsx-dev-runtime");var _jsxFileName="/unknown";const value=(0,_jsxDevRuntime.jsxDEV)("div",{},void 0,false,{fileName:_jsxFileName,lineNumber:1,columnNumber:16},this);`;
      }
      return `var _jsxDevRuntime=require("react/jsx-dev-runtime");var _jsxFileName="/unknown";var value=(0,_jsxDevRuntime.jsxDEV)("div",{},void 0,false,{fileName:_jsxFileName,lineNumber:1,columnNumber:16},this);`;
    },
    hermesError: /possible JSX: pass -parse-jsx to parse/,
  },
  {
    // https://babeljs.io/docs/babel-plugin-transform-export-namespace-from
    // babel-preset-expo adds support for this.
    name: `export-namespace-from`,
    code: `export * as ns from "mod";`,
    getCompiledCode() {
      return `Object.defineProperty(exports,"__esModule",{value:true});exports.ns=void 0;var _ns=_interopRequireWildcard(require("mod"));exports.ns=_ns;function _getRequireWildcardCache(e){if("function"!=typeof WeakMap)return null;var r=new WeakMap(),t=new WeakMap();return(_getRequireWildcardCache=function(e){return e?t:r;})(e);}function _interopRequireWildcard(e,r){if(!r&&e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var t=_getRequireWildcardCache(r);if(t&&t.has(e))return t.get(e);var n={__proto__:null},a=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var u in e)if("default"!==u&&{}.hasOwnProperty.call(e,u)){var i=a?Object.getOwnPropertyDescriptor(e,u):null;i&&(i.get||i.set)?Object.defineProperty(n,u,i):n[u]=e[u];}return n.default=e,t&&t.set(e,n),n;}`;
    },
    hermesError: /error: 'export' statement requires module mode/,
  },
  {
    // https://babeljs.io/docs/babel-plugin-proposal-export-default-from
    // Web preset doesn't transform this
    name: `export-default-from`,
    code: `export v from "mod";`,
    getCompiledCode() {
      return `var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports,"__esModule",{value:true});Object.defineProperty(exports,"v",{enumerable:true,get:function(){return _mod.default;}});var _mod=_interopRequireDefault(require("mod"));`;
    },
    hermesError: /error: expected declaration in export/,
  },
  {
    // https://babeljs.io/docs/babel-plugin-syntax-dynamic-import
    name: `dynamic-import`,
    code: `import("mod").then(function(){});`,
    getCompiledCode() {
      return `import("mod").then(function(){});`;
    },
    hermesError: /error: Invalid expression encountered/,
    // This syntax is handled by the bundler (Metro) and not the compiler (Babel).
    unhandledInBabel: true,
  },

  // Supported natively
  // This isn't transformed but also should be handled since the current minimum iOS version is 13.4 and logical assignment operators are iOS +14.
  {
    name: 'logical-assignment-operators',
    code: `var a = 1;
    a &&= 2;
    a ||= 3;
    a ??= 4;`,

    getCompiledCode({ platform }) {
      return `var a=1;a&&=2;a||=3;a??=4;`;
    },
  },
  {
    name: 'computed-properties',
    code: `var obj = {
        ["x" + foo]: "heh",
        ["y" + bar]: "noo",
        foo: "foo",
        bar: "bar"
      };`,
    getCompiledCode({ platform }) {
      return `var obj={["x"+foo]:"heh",["y"+bar]:"noo",foo:"foo",bar:"bar"};`;
    },
  },
  {
    // No babel transform is run on this but we did observe runtime issues with Reflect when adopting bridgeless mode and the new architecture.
    // These tests will likely not be capable of replicating the failure but it's a public reference to the issue in case anything changes in the future.
    name: 'Reflect',
    code: `const obj = Reflect.get({ foo: 'bar' }, 'foo');`,
    getCompiledCode({ platform }) {
      if (platform === 'web') {
        return `const obj=Reflect.get({foo:'bar'},'foo');`;
      }
      return `var obj=Reflect.get({foo:'bar'},'foo');`;
    },
  },
  {
    name: 'shorthand-properties',
    code: `var a1 = 0;
    var c = { a1 };`,
    getCompiledCode() {
      return `var a1=0;var c={a1};`;
    },
  },
  {
    name: 'optional-catch-binding',
    code: `try {
        throw 0;
      } catch {
      }`,
    getCompiledCode() {
      return `try{throw 0;}catch{}`;
    },
  },
  {
    name: 'literals',
    code: `const d = 0b11; // binary integer literal
    const e = 0o7; // octal integer literal
    const f = "Hello\\u{000A}\\u{0009}!"; // unicode string literals, newline and tab`,
    getCompiledCode({ platform }) {
      if (platform === 'web') {
        return `const d=0b11;const e=0o7;const f="Hello\\u{000A}\\u{0009}!";`;
      }
      return `var d=0b11;var e=0o7;var f="Hello\\u{000A}\\u{0009}!";`;
    },
  },
  {
    name: 'sticky-regex',
    code: `var regex = /foo+/y;`,
    getCompiledCode() {
      return `var regex=/foo+/y;`;
    },
  },
  {
    name: 'spread',
    code: `var h = ["a", "b", "c"];

    var i = [...h, "foo"];

    var j = foo(...h);`,
    getCompiledCode() {
      return `var h=["a","b","c"];var i=[...h,"foo"];var j=foo(...h);`;
    },
  },
  {
    name: 'object-rest-spread',
    code: `var y = {};
    var x = 1;
    var k = { x, ...y };`,
    getCompiledCode() {
      return `var y={};var x=1;var k={x,...y};`;
    },
  },
  {
    name: 'optional-chaining',
    code: `var m = {}?.x;`,
    getCompiledCode() {
      return `var m={}?.x;`;
    },
  },
  {
    name: 'nullish-coalescing-operator',
    code: `var obj2 = {};
    var foo = obj2.foo ?? "default";`,
    getCompiledCode() {
      return `var obj2={};var foo=obj2.foo??"default";`;
    },
  },
  {
    // https://babeljs.io/docs/babel-plugin-transform-async-to-generator
    // Hermes says this isn't supported but it appears to work when compiled.
    name: `async/await`,
    code: `async function foo() {
        await bar();
      }`,
    getCompiledCode({ platform }) {
      if (platform === 'web') {
        return 'async function foo(){await bar();}';
      }
      return 'var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _asyncToGenerator2=_interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));function foo(){return _foo.apply(this,arguments);}function _foo(){_foo=(0,_asyncToGenerator2.default)(function*(){yield bar();});return _foo.apply(this,arguments);}';
    },
  },
  {
    // https://babeljs.io/docs/babel-plugin-transform-named-capturing-groups-regex
    // Hermes says this isn't supported but it appears to work when compiled.
    name: `named-capturing-groups-regex`,
    code: `var re = /(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})/;
    console.log(re.exec("1999-02-29").groups.year);`,
    getCompiledCode({ platform }) {
      if (platform === 'web') {
        return 'var re=/(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})/;console.log(re.exec("1999-02-29").groups.year);';
      }
      return 'var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _inherits2=_interopRequireDefault(require("@babel/runtime/helpers/inherits"));var _setPrototypeOf2=_interopRequireDefault(require("@babel/runtime/helpers/setPrototypeOf"));function _wrapRegExp(){_wrapRegExp=function(e,r){return new BabelRegExp(e,void 0,r);};var e=RegExp.prototype,r=new WeakMap();function BabelRegExp(e,t,p){var o=RegExp(e,t);return r.set(o,p||r.get(e)),(0,_setPrototypeOf2.default)(o,BabelRegExp.prototype);}function buildGroups(e,t){var p=r.get(t);return Object.keys(p).reduce(function(r,t){var o=p[t];if("number"==typeof o)r[t]=e[o];else{for(var i=0;void 0===e[o[i]]&&i+1<o.length;)i++;r[t]=e[o[i]];}return r;},Object.create(null));}return(0,_inherits2.default)(BabelRegExp,RegExp),BabelRegExp.prototype.exec=function(r){var t=e.exec.call(this,r);if(t){t.groups=buildGroups(t,this);var p=t.indices;p&&(p.groups=buildGroups(p,this));}return t;},BabelRegExp.prototype[Symbol.replace]=function(t,p){if("string"==typeof p){var o=r.get(this);return e[Symbol.replace].call(this,t,p.replace(/\\$<([^>]+)>/g,function(e,r){var t=o[r];return"$"+(Array.isArray(t)?t.join("$"):t);}));}if("function"==typeof p){var i=this;return e[Symbol.replace].call(this,t,function(){var e=arguments;return"object"!=typeof e[e.length-1]&&(e=[].slice.call(e)).push(buildGroups(e,i)),p.apply(this,e);});}return e[Symbol.replace].call(this,t,p);},_wrapRegExp.apply(this,arguments);}var re=_wrapRegExp(/(\\d{4})\\x2D(\\d{2})\\x2D(\\d{2})/,{year:1,month:2,day:3});console.log(re.exec("1999-02-29").groups.year);';
    },
  },

  {
    // https://babeljs.io/docs/babel-plugin-transform-unicode-regex
    // Hermes doesn't claim that this doesn't work but it is in the upstream transform.
    name: `unicode-regex`,
    code: `var string = "foo🥓bar";
    var match = string.match(/foo(.)bar/u);`,
    getCompiledCode({ platform }) {
      if (platform === 'web') {
        return 'var string="foo🥓bar";var match=string.match(/foo(.)bar/u);';
      }
      return 'var string="foo🥓bar";var match=string.match(/foo((?:[\\0-\\t\\x0B\\f\\x0E-\\u2027\\u202A-\\uD7FF\\uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))bar/);';
    },
  },
  {
    // https://babeljs.io/docs/babel-plugin-transform-arrow-functions
    // This works with Hermes but we seem to transpile it out anyways, presumably for fast refresh?
    // https://github.com/facebook/react-native/blob/b1047d49ff45f0f795c9e336e18deb9e09c34887/packages/react-native-babel-preset/src/configs/main.js#L89
    name: `arrow-functions`,
    code: `var a = () => {};
    var a = b => b;`,
    getCompiledCode() {
      return `var a=()=>{};var a=b=>b;`;
    },
  },
  {
    // Requires module mode to be enabled, which we don't currently do in React Native.
    name: `export`,
    code: `export {}`,
    getCompiledCode() {
      return 'Object.defineProperty(exports,"__esModule",{value:true});';
    },
    hermesError: /'export' statement requires module mode/,
  },
];

LANGUAGE_SAMPLES.forEach((sample) => {
  describe(sample.name, () => {
    ['ios', 'web'].forEach((platform) => {
      it(`babel-preset-expo ensures Hermes compiles (platform: ${platform})`, async () => {
        const options = {
          babelrc: false,
          presets: [preset],
          filename: '/unknown',
          sourceMaps: true,
          caller: getCaller({ name: 'metro', platform, isDev: true, engine: 'hermes' }),
        };

        const babelResults = babel.transform(sample.code, options)!;
        expect(babelResults.code).toEqual(sample.getCompiledCode({ platform }));

        if (platform !== 'web') {
          if (sample.unhandledInBabel) {
            await expect(
              compileToHermesBytecodeAsync({ code: babelResults.code! })
            ).rejects.toThrow();
          } else {
            // Will not throw on native
            await compileToHermesBytecodeAsync({ code: babelResults.code! });
          }
        }
      });
    });

    if (sample.hermesError) {
      it(`Hermes does not have native support`, async () => {
        await expect(compileToHermesBytecodeAsync({ code: sample.code })).rejects.toThrowError(
          sample.hermesError
        );
      });
    } else {
      it(`Hermes compiles directly`, async () => {
        await compileToHermesBytecodeAsync({ code: sample.code });
      });
    }
  });
});
