/**
 * A list of the JavaScript features we support in Expo, and a function to
 * generate a Markdown table of them. Run this file with Node to print the
 * table.
 */
const assert = require('assert');

const features = [
  {
    name: 'Object rest/spread',
    support: {
      expo: true,
      jsc: [],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator',
      },
      {
        title: '2ality',
        url: 'http://2ality.com/2016/10/rest-spread-properties.html',
      },
    ],
    specification: 'Proposal',
  },
  {
    name: 'Class properties',
    support: {
      expo: true,
      jsc: [],
      babel: true,
    },
    links: [
      {
        title: 'TC39 Proposal',
        url: 'https://tc39.github.io/proposal-class-public-fields/',
      },
    ],
    specification: 'Proposal',
  },
  {
    name: 'Revised template literals (lenient escape sequences)',
    support: {
      expo: false,
      jsc: ['iOS 11'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals',
      },
      {
        title: '2ality',
        url: 'http://2ality.com/2016/09/template-literal-revision.html',
      },
    ],
    specification: 'ES2018',
  },
  {
    name: 'Async functions (`async`/`await`)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 10.3+'],
      babel: 'Babel with Regenerator',
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function',
      },
      {
        title: 'Exploring ES2017',
        url: 'http://exploringjs.com/es2016-es2017/ch_async-functions.html',
      },
    ],
    specification: 'ES2017',
  },
  {
    name: 'Trailing commas in function calls and signatures',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 10.3+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Trailing_commas',
      },
      {
        title: 'Exploring ES2017',
        url:
          'http://exploringjs.com/es2016-es2017/ch_trailing-comma-parameters.html',
      },
    ],
    specification: 'ES2017',
  },
  {
    name: 'Shared memory (SharedArrayBuffer, Atomics)',
    support: {
      expo: [
        '⚠️',
        `(Android and iOS 10.3+, iOS 10.3 doesn't implement byteLength)`,
      ],
      jsc: ['Android', 'iOS 10.3+'],
    },
    links: [
      {
        title: 'MDN (SharedArrayBuffer)',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer',
      },
      {
        title: 'MDN (Atomics)',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics',
      },
      {
        title: 'Exploring ES2017',
        url: 'http://exploringjs.com/es2016-es2017/ch_shared-array-buffer.html',
      },
    ],
    specification: 'ES2017',
  },
  {
    name: 'Object static methods (entries, values, getOwnPropertyDescriptors)',
    support: {
      expo: [
        '⚠️',
        '(Android and iOS 10+, and only Object.entries and Object.values on iOS 9)',
      ],
      jsc: ['Android', 'iOS 10.3+'],
      polyfill: 'Polyfills for Object.entries and Object.values',
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object',
      },
      {
        title: 'Exploring ES2017 (entries, values)',
        url:
          'http://exploringjs.com/es2016-es2017/ch_object-entries-object-values.html',
      },
      {
        title: 'Exploring ES2017 (getOwnPropertyDescriptors)',
        url:
          'http://exploringjs.com/es2016-es2017/ch_object-getownpropertydescriptors.html',
      },
    ],
    specification: 'ES2017',
  },
  {
    name: 'String instance methods (padStart, padEnd)',
    support: {
      expo: ['⚠️', '(Android and iOS 10+)'],
      jsc: ['Android', 'iOS 10+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
      },
      {
        title: 'Exploring ES2017',
        url: 'http://exploringjs.com/es2016-es2017/ch_string-padding.html',
      },
    ],
    specification: 'ES2017',
  },
  {
    name: 'Proxy `ownKeys` handler',
    support: {
      expo: ['⚠️', '(Android and iOS 10+)'],
      jsc: ['Android', 'iOS 10+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/ownKeys',
      },
    ],
    specification: 'ES2017',
  },
  {
    name: 'Exponentiation operator (`**`)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 10.3+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Exponentiation_(**)',
      },
      {
        title: 'Exploring ES2017',
        url:
          'http://exploringjs.com/es2016-es2017/ch_exponentiation-operator.html',
      },
    ],
    specification: 'ES2016',
  },
  {
    name: 'Destructuring nested rest declarations',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 10.3+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Nested_object_and_array_destructuring',
      },
    ],
    specification: 'ES2016',
  },
  {
    name: 'Array.prototype.includes',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      polyfill: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes',
      },
      {
        title: 'Exploring ES2016',
        url:
          'http://exploringjs.com/es2016-es2017/ch_array-prototype-includes.html',
      },
    ],
    specification: 'ES2016',
  },
  {
    name: '`for`...`of` loops',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_for-of.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name:
      'Array instance methods (entries, keys, values, find, findIndex, copyWithin, fill)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      polyfill: 'Some methods have polyfills',
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/',
      },
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_arrays.html#sec_new-array-prototype-methods',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Octal and binary literals',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      babel: true,
    },
    links: [
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_numbers.html#sec_new-integer-literals',
      },
    ],
    specification: 'ES2015',
  },
  {
    name:
      'Number static properties and methods (EPSILON, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER, isInteger, isSafeInteger, isNaN, isFinite, parseInt, parseFloat)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      polyfill: 'Some properties and methods have polyfills',
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number',
      },
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_numbers.html#sec_new-static-number-props',
      },
    ],
    specification: 'ES2015',
  },
  {
    name:
      'Math static methods (sign, trunc, cbrt, expm1, log1p, log2, log10, fround, imul, clz32, sinh, cosh, tanh, asinh, acosh, atanh, hypot)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_numbers.html#sec_new-math',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Unicode code point escapes',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      babel: 'Babel, in string literals',
    },
    links: [
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_unicode.html#sec_escape-sequences',
      },
    ],
    specification: 'ES2015',
  },
  {
    name:
      'String instance methods (codePointAt, normalize, startsWith, endsWith, includes, repeat)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      polyfill: 'Some methods have polyfills',
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_strings.html#sec_reference-strings',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'String static methods (raw, fromCodePoint)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_strings.html#sec_reference-strings',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Symbols',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_symbols.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Template literals (including tags)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_template-literals.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Block scoping (`let`, `const`)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/block',
      },
      {
        title: 'MDN (let)',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let',
      },
      {
        title: 'MDN (const)',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const',
      },
      {
        title: '2ality',
        url: 'http://www.2ality.com/2015/02/es6-scoping.html',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_variables.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Destructuring syntax',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9 (partially)', 'iOS 10+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_destructuring.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Default parameter values',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 10+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters',
      },
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_parameter-handling.html#sec_parameter-default-values',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Rest parameters (`...`)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 10+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters',
      },
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_parameter-handling.html#sec_rest-parameters',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Spread syntax (`...`)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9 (partially)', 'iOS 10+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator',
      },
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_parameter-handling.html#sec_spread-operator',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Function `name` property',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9 (partially)', 'iOS 10+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_callables.html#sec_function-names',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: '`new.target`',
    support: {
      expo: ['⚠️', '(Android and iOS 10+)'],
      jsc: ['Android', 'iOS 10+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target',
      },
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_callables.html#_how-do-i-determine-whether-a-function-was-invoked-via-new',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Arrow functions',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 10+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_arrow-functions.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name:
      'Object static methods (assign, is, setPrototypeOf, getOwnPropertySymbols)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      polyfill:
        'Polyfill for Object.assign (overrides native implementation with stricter one)',
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/',
      },
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_oop-besides-classes.html#sec_new-methods-object',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Shorthand for object methods',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions',
      },
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_oop-besides-classes.html#object-literal-method-definitions',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Shorthand for object properties',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Property_definitions',
      },
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_oop-besides-classes.html#_property-value-shorthands-1',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Computed properties and methods',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9 (partially)', 'iOS 10+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions',
      },
      {
        title: 'Exploring ES6 (properties)',
        url:
          'http://exploringjs.com/es6/ch_oop-besides-classes.html#_computed-property-keys-1',
      },
      {
        title: 'Exploring ES6 (methods)',
        url:
          'http://exploringjs.com/es6/ch_classes.html#_computed-method-names',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Classes',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9 (partially)', 'iOS 10+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_classes.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Modules (`import`, `export`)',
    support: {
      expo: true,
      jsc: `Natively supported on Android and iOS 10+ but we always use Babel's implementation`,
      babel: true,
    },
    links: [
      {
        title: 'MDN (import)',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import',
      },
      {
        title: 'MDN (export)',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_modules.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Map',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      polyfill: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_maps-sets.html#sec_map',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Set',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      polyfill: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_maps-sets.html#sec_set',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'WeakMap',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_maps-sets.html#sec_weakmap',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'WeakSet',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_maps-sets.html#sec_weakset',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Typed arrays (ArrayBuffers, DataViews)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9 (partially)', 'iOS 10+'],
      polyfill: 'Polyfilled on iOS 9',
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_typed-arrays.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Generators (`function*`)',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 10+'],
      babel: true,
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_generators.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'RegExp `y` and `u` flags',
    support: {
      expo: ['⚠️', '(Android and iOS 10+)'],
      jsc: ['Android', 'iOS 10+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp',
      },
      {
        title: 'Exploring ES6 (sticky "y")',
        url: 'http://exploringjs.com/es6/ch_regexp.html#sec_regexp-flag-y',
      },
      {
        title: 'Exploring ES6 (unicode "u")',
        url: 'http://exploringjs.com/es6/ch_regexp.html#sec_regexp-flag-u',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'RegExp.prototype.flags',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/flags',
      },
      {
        title: 'Exploring ES6',
        url:
          'http://exploringjs.com/es6/ch_regexp.html#sec_regexp-data-property-flags',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Promises',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
      polyfill: 'Polyfill overrides native implementation',
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_promises.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Proxy',
    support: {
      expo: ['⚠️', '(Android and iOS 10+)'],
      jsc: ['Android', 'iOS 10+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_proxies.html',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Reflect (object introspection)',
    support: {
      expo: ['⚠️', '(Android and iOS 10+)'],
      jsc: ['Android', 'iOS 10+'],
    },
    links: [
      {
        title: 'MDN',
        url:
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflex',
      },
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_proxies.html#_reflect',
      },
    ],
    specification: 'ES2015',
  },
  {
    name: 'Tail call optimization',
    support: {
      expo: true,
      jsc: ['Android', 'iOS 9+'],
    },
    links: [
      {
        title: 'Exploring ES6',
        url: 'http://exploringjs.com/es6/ch_tail-calls.html',
      },
      {
        title: '2ality',
        url: 'http://www.2ality.com/2015/06/tail-call-optimization.html',
      },
    ],
    specification: 'ES2015',
  },
];

function renderMarkdownTable() {
  let headers = [
    'Feature',
    'Works with Expo',
    'Links',
    'Spec',
    'Implementation',
  ];
  let headerRow = `|${headers.join('|')}|`;
  let separatorRow = `|${headers
    .map(header => '-'.repeat(header.length))
    .join('|')}|`;
  let rows = features.map(feature => `|${renderRowCells(feature).join('|')}|`);
  return [headerRow, separatorRow, ...rows].join('\n');
}

function renderRowCells(feature) {
  let cells = [feature.name];

  let { support } = feature;
  cells.push(renderWorksWithExpo(support.expo));

  if (Array.isArray(feature.links)) {
    let markdownLinks = feature.links.map(
      link => `[${link.title}](${link.url})`
    );
    cells.push(markdownLinks.join('<br />'));
  } else {
    assert(!feature.links, `Unknown links value: ${feature.links}`);
    cells.push('');
  }

  cells.push(feature.specification);

  let implementation = [];
  if (typeof support.babel === 'string') {
    implementation.push(support.babel);
  } else if (support.babel) {
    implementation.push('Babel');
  }

  if (typeof support.polyfill === 'string') {
    implementation.push(support.polyfill);
  } else if (support.polyfill) {
    implementation.push('Polyfilled');
  }

  if (typeof support.jsc === 'string') {
    implementation.push(support.jsc);
  } else if (Array.isArray(support.jsc)) {
    if (support.jsc.length) {
      implementation.push(`JSC support: ${support.jsc.join(', ')}`);
    } else {
      implementation.push('No JSC support');
    }
  } else {
    assert(!support.jsc, `Unknown support.jsc value: ${support.jsc}`);
    implementation.push('No JSC support');
  }

  cells.push(implementation.join('<hr class="vertical-divider" />'));

  return cells;
}

function renderWorksWithExpo(expoSupport) {
  if (!Array.isArray(expoSupport)) {
    expoSupport = [expoSupport];
  }
  expoSupport = expoSupport.map(item => {
    if (typeof item === 'string') {
      return item;
    }
    return item ? '✅' : '❌';
  });

  return (
    '<span class="centered-text-cell">' + expoSupport.join('<br />') + '</span>'
  );
}

if (require.main === module) {
  console.log();
  console.log(renderMarkdownTable());
  console.log();
}
