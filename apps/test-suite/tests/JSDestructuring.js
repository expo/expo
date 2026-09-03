/* eslint-disable */
'use strict';

// Comprehensive runtime compliance tests for ES6+ destructuring.
// Validates that destructuring works correctly at runtime in the Hermes engine.
// Cases sourced from @babel/plugin-transform-destructuring exec.js fixtures
// and supplemented with additional coverage for all destructuring forms.

export const name = 'JS Destructuring';

// Keep object rest in an exported declaration to cover the export-specific transform path.
export const { exportedValue, ...exportedRest } = { exportedValue: 1, exportedOther: 2 };

export function test({ describe, it, expect }) {
  describe('JS Destructuring', () => {
    describe('object patterns', () => {
      it('extracts basic properties', () => {
        const { a, b } = { a: 1, b: 2, c: 3 };
        expect(a).toBe(1);
        expect(b).toBe(2);
      });

      it('renames properties', () => {
        const { a: x, b: y } = { a: 1, b: 2 };
        expect(x).toBe(1);
        expect(y).toBe(2);
      });

      it('applies default values for missing properties', () => {
        const { a = 10, b = 20 } = { a: 1 };
        expect(a).toBe(1);
        expect(b).toBe(20);
      });

      it('applies default values only for undefined, not null', () => {
        const { a = 10, b = 20 } = { a: null, b: undefined };
        expect(a).toBe(null);
        expect(b).toBe(20);
      });

      it('renames with default values', () => {
        const { a: x = 10, b: y = 20 } = { a: 1 };
        expect(x).toBe(1);
        expect(y).toBe(20);
      });

      it('extracts computed property keys', () => {
        const key = 'hello';
        const { [key]: val } = { hello: 42 };
        expect(val).toBe(42);
      });

      it('extracts computed property keys with side effects', () => {
        let counter = 0;
        const keyFn = () => 'k' + counter++;
        const obj = { k0: 'a', k1: 'b' };
        const { [keyFn()]: first, [keyFn()]: second } = obj;
        expect(first).toBe('a');
        expect(second).toBe('b');
        expect(counter).toBe(2);
      });

      it('collects rest properties', () => {
        const { a, ...rest } = { a: 1, b: 2, c: 3 };
        expect(a).toBe(1);
        expect(rest).toEqual({ b: 2, c: 3 });
      });

      it('rest does not include extracted keys', () => {
        const { x, y, ...rest } = { x: 1, y: 2, z: 3, w: 4 };
        expect(x).toBe(1);
        expect(y).toBe(2);
        expect(rest).toEqual({ z: 3, w: 4 });
        expect(rest.x).toBeUndefined();
        expect(rest.y).toBeUndefined();
      });

      it('rest produces an empty object when all keys extracted', () => {
        const { a, b, ...rest } = { a: 1, b: 2 };
        expect(a).toBe(1);
        expect(b).toBe(2);
        expect(rest).toEqual({});
      });

      it('collects a rest-only object pattern', () => {
        const { ...copy } = { a: 1, b: 2 };
        expect(copy).toEqual({ a: 1, b: 2 });
      });

      it('handles nested object patterns', () => {
        const {
          a: { b },
        } = { a: { b: 42 } };
        expect(b).toBe(42);
      });

      it('handles nested objects with defaults', () => {
        const {
          a: { b = 99 },
        } = { a: {} };
        expect(b).toBe(99);
      });

      it('collects nested object rest at multiple levels', () => {
        const {
          outer: {
            inner: { selected, ...innerRest },
            ...outerRest
          },
          ...rootRest
        } = {
          outer: { inner: { selected: 1, kept: 2 }, sibling: 3 },
          root: 4,
        };
        expect(selected).toBe(1);
        expect(innerRest).toEqual({ kept: 2 });
        expect(outerRest).toEqual({ sibling: 3 });
        expect(rootRest).toEqual({ root: 4 });
      });

      it('collects object rest behind a computed nested object reference', () => {
        let key = 0;
        const {
          [key++]: { selected, ...rest },
        } = { 0: { selected: 1, kept: 2 } };
        expect(key).toBe(1);
        expect(selected).toBe(1);
        expect(rest).toEqual({ kept: 2 });
      });

      it('handles shorthand for prototype properties', () => {
        const { toString } = {};
        expect(typeof toString).toBe('function');
      });

      it('handles string keys with special characters', () => {
        const { 'foo-bar': val } = { 'foo-bar': 42 };
        expect(val).toBe(42);
      });

      it('handles numeric keys', () => {
        const { 0: first, 1: second } = { 0: 'a', 1: 'b' };
        expect(first).toBe('a');
        expect(second).toBe('b');
      });

      it('extracts from nested defaults at multiple levels', () => {
        const { a: { b: { c = 3 } = {} } = {} } = {};
        expect(c).toBe(3);
      });

      it('does not copy prototype properties into rest', () => {
        function Parent() {}
        Parent.prototype.inherited = true;
        const obj = Object.create(Parent.prototype);
        obj.own = 1;
        const { own, ...rest } = obj;
        expect(own).toBe(1);
        expect(rest.inherited).toBeUndefined();
      });

      // From: destructuring/number-key-with-object-rest-spread/exec.js
      it('number key with object rest spread', () => {
        const foo = {
          1: 'a',
          2: 'b',
          3: 'c',
        };
        const { [1]: bar, ...rest } = foo;
        expect(bar).toBe('a');
        expect(rest).toEqual({ 2: 'b', 3: 'c' });
      });

      // From: destructuring/function-key-with-object-rest-spread/exec.js
      it('function key with object rest spread', () => {
        const { [(() => 1)()]: a, ...rest } = { 1: 'a' };
        expect(a).toBe('a');
        expect(rest).toEqual({});
      });

      // From: transform-object-rest-spread/object-rest/remove-unused-computed-key-loose/exec.js
      // Regression test for https://github.com/babel/babel/pull/18197
      it('object rest preserves an unused computed-key exclusion', () => {
        function omit(obj, spec) {
          const { [spec.key]: unused, ...rest } = obj;
          return rest;
        }

        expect(omit({ a: 1, b: 2 }, { key: 'a' })).toEqual({ b: 2 });
      });

      it('object rest excludes unused computed element and call keys', () => {
        const spec = { keys: ['b'] };
        const getKey = () => 'c';
        const {
          [spec.keys[0]]: _element,
          [getKey()]: _call,
          ...rest
        } = {
          b: 2,
          c: 3,
          keep: 4,
        };
        expect(rest).toEqual({ keep: 4 });
      });

      it('object rest excludes computed symbol keys and retains other symbols', () => {
        const excluded = Symbol('excluded');
        const retained = Symbol('retained');
        const { [excluded]: _excluded, ...rest } = { [excluded]: 1, [retained]: 2, kept: 3 };
        expect(rest[excluded]).toBeUndefined();
        expect(rest[retained]).toBe(2);
        expect(rest.kept).toBe(3);
      });

      it('object rest coerces non-string computed exclusion keys', () => {
        const keys = [null, undefined, true, false];
        const source = { null: 1, undefined: 2, true: 3, false: 4, kept: 5 };
        const {
          [keys[0]]: nullValue,
          [keys[1]]: undefinedValue,
          [keys[2]]: trueValue,
          [keys[3]]: falseValue,
          ...rest
        } = source;
        expect([nullValue, undefinedValue, trueValue, falseValue]).toEqual([1, 2, 3, 4]);
        expect(rest).toEqual({ kept: 5 });
      });

      it('object rest excludes template-literal computed keys', () => {
        const prefix = 'user';
        const { [`${prefix}_name`]: name, ...rest } = { user_name: 'Ada', role: 'admin' };
        expect(name).toBe('Ada');
        expect(rest).toEqual({ role: 'admin' });
      });

      it('evaluates an excluded getter even when its binding is unused', () => {
        let called = 0;
        const source = {
          get excluded() {
            called++;
            return 1;
          },
          kept: 2,
        };
        const { excluded: unused, ...rest } = source;
        expect(called).toBe(1);
        expect(rest).toEqual({ kept: 2 });
      });

      // From: destructuring/object-rest-impure-computed-keys/exec.js
      it('object rest with impure computed keys', () => {
        var key, x, y, z;

        // impure key
        key = 1;
        ({ [key++]: y, ...x } = { 1: 1, a: 1 });
        expect(x).toEqual({ a: 1 });
        expect(key).toBe(2);
        expect(y).toBe(1);

        // takes care of the order
        key = 1;
        ({ [++key]: y, [++key]: z, ...x } = { 2: 2, 3: 3 });
        expect(y).toBe(2);
        expect(z).toBe(3);

        // pure computed property should remain as-is
        key = 2;
        ({ [key]: y, z, ...x } = { 2: 'two', z: 'zee' });
        expect(y).toBe('two');
        expect(x).toEqual({});
        expect(z).toBe('zee');

        // rhs evaluated before lhs
        var order = [];
        function left() {
          order.push('left');
          return 0;
        }
        function right() {
          order.push('right');
          return {};
        }
        ({ [left()]: y, ...x } = right());
        expect(order).toEqual(['right', 'left']);
      });

      // From: destructuring/empty-object-pattern/exec.js
      it('empty object pattern throws on null', () => {
        expect(function () {
          var {} = null;
        }).toThrow();
      });

      it('rest-only object pattern throws on null and undefined', () => {
        expect(() => {
          const { ...rest } = null;
        }).toThrow();
        expect(() => {
          const { ...rest } = undefined;
        }).toThrow();
      });
    });

    describe('object spread', () => {
      it('copies properties and applies sources from left to right', () => {
        const result = {
          first: 1,
          shared: 'initial',
          ...{ second: 2, shared: 'middle' },
          shared: 'last',
        };
        expect(result).toEqual({ first: 1, second: 2, shared: 'last' });
      });

      it('combines multiple spread sources', () => {
        const result = { ...{ a: 1 }, b: 2, ...{ c: 3 }, ...{ d: 4 } };
        expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
      });

      it('transforms object spread in assignment and nested expression contexts', () => {
        let assigned;
        assigned = { before: 1, ...{ middle: 2 }, after: 3 };
        const nested = { value: { ...assigned, final: 4 } };
        expect(assigned).toEqual({ before: 1, middle: 2, after: 3 });
        expect(nested).toEqual({ value: { before: 1, middle: 2, after: 3, final: 4 } });
      });

      it('evaluates spread source expressions once from left to right', () => {
        const calls = [];
        const source = (name, value) => {
          calls.push(name);
          return value;
        };
        const result = { ...source('first', { a: 1 }), ...source('second', { b: 2 }) };
        expect(result).toEqual({ a: 1, b: 2 });
        expect(calls).toEqual(['first', 'second']);
      });

      it('ignores null and undefined spread sources', () => {
        expect({ before: 1, ...null, ...undefined, after: 2 }).toEqual({ before: 1, after: 2 });
      });

      it('copies own enumerable properties but not inherited or non-enumerable properties', () => {
        const source = Object.create({ inherited: 1 });
        source.enumerable = 2;
        Object.defineProperty(source, 'hidden', { enumerable: false, value: 3 });
        const result = { ...source };
        expect(result).toEqual({ enumerable: 2 });
        expect(result.inherited).toBeUndefined();
        expect(result.hidden).toBeUndefined();
      });

      it('copies enumerable symbol properties', () => {
        const symbol = Symbol('spread');
        const result = { ...{ visible: 1, [symbol]: 2 } };
        expect(result.visible).toBe(1);
        expect(result[symbol]).toBe(2);
      });

      it('evaluates spread getters once and in source order', () => {
        const order = [];
        const first = {
          get a() {
            order.push('first');
            return 1;
          },
        };
        const second = {
          get b() {
            order.push('second');
            return 2;
          },
        };
        expect({ ...first, ...second }).toEqual({ a: 1, b: 2 });
        expect(order).toEqual(['first', 'second']);
      });

      it('spreads enumerable properties from primitive values', () => {
        expect({ ...'abc' }).toEqual({ 0: 'a', 1: 'b', 2: 'c' });
        expect({ ...42, ...true }).toEqual({});
      });
    });

    describe('array patterns', () => {
      it('extracts basic elements', () => {
        const [a, b, c] = [1, 2, 3];
        expect(a).toBe(1);
        expect(b).toBe(2);
        expect(c).toBe(3);
      });

      it('skips elements with elision', () => {
        const [, second, , fourth] = [1, 2, 3, 4];
        expect(second).toBe(2);
        expect(fourth).toBe(4);
      });

      it('applies default values for missing elements', () => {
        const [a = 10, b = 20, c = 30] = [1];
        expect(a).toBe(1);
        expect(b).toBe(20);
        expect(c).toBe(30);
      });

      it('applies default values only for undefined, not null or 0', () => {
        const [a = 10, b = 20, c = 30] = [null, 0, undefined];
        expect(a).toBe(null);
        expect(b).toBe(0);
        expect(c).toBe(30);
      });

      it('collects rest elements', () => {
        const [head, ...tail] = [1, 2, 3, 4];
        expect(head).toBe(1);
        expect(tail).toEqual([2, 3, 4]);
      });

      it('rest produces empty array when no remaining elements', () => {
        const [a, ...rest] = [1];
        expect(a).toBe(1);
        expect(rest).toEqual([]);
      });

      it('handles nested array patterns', () => {
        const [a, [b, c]] = [1, [2, 3]];
        expect(a).toBe(1);
        expect(b).toBe(2);
        expect(c).toBe(3);
      });

      it('destructures string as iterable', () => {
        const [a, b, c] = 'xyz';
        expect(a).toBe('x');
        expect(b).toBe('y');
        expect(c).toBe('z');
      });

      it('destructures string with rest', () => {
        const [first, ...rest] = 'hello';
        expect(first).toBe('h');
        expect(rest).toEqual(['e', 'l', 'l', 'o']);
      });

      it('handles holes in source array', () => {
        // eslint-disable-next-line no-sparse-arrays
        const [a, b, c] = [1, , 3];
        expect(a).toBe(1);
        expect(b).toBeUndefined();
        expect(c).toBe(3);
      });

      it('handles holes with defaults', () => {
        // eslint-disable-next-line no-sparse-arrays
        const [a = 10, b = 20, c = 30] = [, , 3];
        expect(a).toBe(10);
        expect(b).toBe(20);
        expect(c).toBe(3);
      });

      it('destructures Set iterable', () => {
        const [a, b, c] = new Set([1, 2, 3]);
        expect(a).toBe(1);
        expect(b).toBe(2);
        expect(c).toBe(3);
      });

      it('destructures Map iterable', () => {
        const map = new Map();
        map.set('x', 1);
        map.set('y', 2);
        const [[k1, v1], [k2, v2]] = map;
        expect(k1).toBe('x');
        expect(v1).toBe(1);
        expect(k2).toBe('y');
        expect(v2).toBe(2);
      });

      it('destructures generator iterable', () => {
        function* gen() {
          yield 10;
          yield 20;
          yield 30;
        }
        const [a, b] = gen();
        expect(a).toBe(10);
        expect(b).toBe(20);
      });

      it('rest with generator consumes remaining yields', () => {
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const [first, ...rest] = gen();
        expect(first).toBe(1);
        expect(rest).toEqual([2, 3]);
      });

      it('destructures custom iterable', () => {
        const iterable = {
          [Symbol.iterator]() {
            let i = 0;
            return {
              next() {
                return i < 3 ? { value: i++, done: false } : { done: true };
              },
            };
          },
        };
        const [a, b, c] = iterable;
        expect(a).toBe(0);
        expect(b).toBe(1);
        expect(c).toBe(2);
      });

      // From: destructuring/empty-string/exec.js
      it('destructures empty string', () => {
        let [a] = '';
        expect(a).toBe(undefined);
      });

      // From: destructuring/spread-generator/exec.js
      it('spread from generator into rest', () => {
        function* f() {
          for (var i = 0; i < 3; i++) {
            yield i;
          }
        }
        var [...xs] = f();
        expect(xs).toEqual([0, 1, 2]);
      });

      // From: destructuring/inherited-array/exec.js
      it('rest from extended array produces plain Array', () => {
        class ExtendedArray extends Array {
          constructor(...args) {
            super(...args);
          }
        }
        let extArr = new ExtendedArray(1, 2, 3, 4, 5);
        let [first, second, ...rest] = extArr;
        expect(first).toBe(1);
        expect(second).toBe(2);
        expect(rest).toEqual([3, 4, 5]);
        expect(Object.getPrototypeOf(rest).constructor.name).toBe('Array');
      });

      // From: destructuring/issue-5090/exec.js
      it('array rest in params does not mutate original (issue-5090)', () => {
        const assign = function ([...arr], index, value) {
          arr[index] = value;
          return arr;
        };
        const arr = [1, 2, 3];
        const result = assign(arr, 1, 42);
        expect(arr).toEqual([1, 2, 3]);
        expect(result).toEqual([1, 42, 3]);
      });

      // From: destructuring/next-eval-once/exec.js
      it('iterator .next getter is evaluated only once per destructuring', () => {
        let gets = 0;
        let it = {
          [Symbol.iterator]: () => ({
            get next() {
              gets++;
              let i = 0;
              return () => ({ done: false, value: i++ });
            },
          }),
        };

        // eslint-disable-next-line no-empty-pattern
        let [] = it;
        expect(gets).toBe(1);

        let [a] = it;
        expect(gets).toBe(2);
        expect(a).toBe(0);

        let [b, c] = it;
        expect(gets).toBe(3);
        expect(b).toBe(0);
        expect(c).toBe(1);
      });
    });

    describe('mixed patterns', () => {
      it('array pattern inside object', () => {
        const {
          items: [x, y],
        } = { items: [1, 2] };
        expect(x).toBe(1);
        expect(y).toBe(2);
      });

      it('object pattern inside array', () => {
        const [{ a, b }] = [{ a: 1, b: 2 }];
        expect(a).toBe(1);
        expect(b).toBe(2);
      });

      it('deeply nested mixed patterns', () => {
        const data = {
          users: [{ name: 'Alice', scores: [10, 20, 30] }],
        };
        const {
          users: [
            {
              name,
              scores: [first, , third],
            },
          ],
        } = data;
        expect(name).toBe('Alice');
        expect(first).toBe(10);
        expect(third).toBe(30);
      });

      it('object rest with nested array', () => {
        const {
          data: [head, ...tail],
          ...meta
        } = {
          data: [1, 2, 3],
          type: 'test',
          version: 2,
        };
        expect(head).toBe(1);
        expect(tail).toEqual([2, 3]);
        expect(meta).toEqual({ type: 'test', version: 2 });
      });

      it('object rest nested inside array declaration and assignment patterns', () => {
        const [first, { selected, ...declaredRest }] = [1, { selected: 2, kept: 3 }];
        let assignedFirst, assignedValue, assignedRest;
        [assignedFirst, { selected: assignedValue, ...assignedRest }] = [
          4,
          { selected: 5, kept: 6 },
        ];
        expect([first, selected, declaredRest]).toEqual([1, 2, { kept: 3 }]);
        expect([assignedFirst, assignedValue, assignedRest]).toEqual([4, 5, { kept: 6 }]);
      });

      it('supports object rest nested in an array rest target', () => {
        const [...{ ...properties }] = ['a', 'b'];
        expect(properties).toEqual({ 0: 'a', 1: 'b' });
      });
    });

    describe('function parameters', () => {
      it('object destructuring in function params', () => {
        function greet({ name, greeting }) {
          return greeting + ' ' + name;
        }
        expect(greet({ name: 'world', greeting: 'Hello' })).toBe('Hello world');
      });

      it('object destructuring with defaults in params', () => {
        function point({ x = 0, y = 0 }) {
          return [x, y];
        }
        expect(point({})).toEqual([0, 0]);
        expect(point({ x: 5 })).toEqual([5, 0]);
        expect(point({ x: 3, y: 4 })).toEqual([3, 4]);
      });

      it('array destructuring in function params', () => {
        function first([a]) {
          return a;
        }
        expect(first([42, 99])).toBe(42);
      });

      it('arrow function with object destructuring', () => {
        const sum = ({ a, b }) => a + b;
        expect(sum({ a: 3, b: 4 })).toBe(7);
      });

      it('arrow function with array destructuring', () => {
        const head = ([first]) => first;
        expect(head([10, 20, 30])).toBe(10);
      });

      it('nested destructuring in arrow params', () => {
        const fn = ({ data: { id, value = 0 } }) => id + value;
        expect(fn({ data: { id: 10 } })).toBe(10);
        expect(fn({ data: { id: 10, value: 5 } })).toBe(15);
      });

      it('rest in function params', () => {
        function f({ required, ...options }) {
          return { required, keys: Object.keys(options) };
        }
        const result = f({ required: true, a: 1, b: 2 });
        expect(result.required).toBe(true);
        expect(result.keys.sort()).toEqual(['a', 'b']);
      });

      it('default parameter value for entire destructured param', () => {
        function f({ x, y } = { x: 0, y: 0 }) {
          return x + y;
        }
        expect(f()).toBe(0);
        expect(f({ x: 1, y: 2 })).toBe(3);
      });

      it('mixed defaults: param-level and property-level', () => {
        function f({ x = 1, y = 2 } = {}) {
          return x + y;
        }
        expect(f()).toBe(3);
        expect(f({})).toBe(3);
        expect(f({ x: 10 })).toBe(12);
      });

      it('makes object rest available to a later parameter default', () => {
        function f({ selected, ...rest }, value = rest.kept) {
          return [selected, rest, value];
        }
        expect(f({ selected: 1, kept: 2 })).toEqual([1, { kept: 2 }, 2]);
        expect(f({ selected: 1, kept: 2 }, 3)).toEqual([1, { kept: 2 }, 3]);
      });

      it('supports nested object rest in function parameters', () => {
        function f({ outer: { selected, ...innerRest }, ...outerRest } = { outer: {} }) {
          return [selected, innerRest, outerRest];
        }
        expect(f({ outer: { selected: 1, kept: 2 }, root: 3 })).toEqual([
          1,
          { kept: 2 },
          { root: 3 },
        ]);
      });

      // From: destructuring/default-precedence/exec.js
      it('default value references previous params', () => {
        var f0 = function (a, b = a, c = b) {
          return [a, b, c];
        };
        expect(f0(1)).toEqual([1, 1, 1]);

        var f1 = function ({ a }, b = a, c = b) {
          return [a, b, c];
        };
        expect(f1({ a: 1 })).toEqual([1, 1, 1]);

        var f2 = function ({ a }, b = a, c = a) {
          return [a, b, c];
        };
        expect(f2({ a: 1 })).toEqual([1, 1, 1]);
      });
    });

    describe('loops', () => {
      it('for-of with object destructuring', () => {
        const items = [
          { id: 1, value: 'a' },
          { id: 2, value: 'b' },
        ];
        const ids = [];
        for (const { id } of items) {
          ids.push(id);
        }
        expect(ids).toEqual([1, 2]);
      });

      it('for-of with array destructuring', () => {
        const pairs = [
          [1, 'a'],
          [2, 'b'],
        ];
        const keys = [];
        const values = [];
        for (const [k, v] of pairs) {
          keys.push(k);
          values.push(v);
        }
        expect(keys).toEqual([1, 2]);
        expect(values).toEqual(['a', 'b']);
      });

      it('for-of with nested destructuring', () => {
        const data = [
          { user: { name: 'Alice' }, scores: [10] },
          { user: { name: 'Bob' }, scores: [20] },
        ];
        const results = [];
        for (const {
          user: { name },
          scores: [score],
        } of data) {
          results.push({ name, score });
        }
        expect(results).toEqual([
          { name: 'Alice', score: 10 },
          { name: 'Bob', score: 20 },
        ]);
      });

      it('for-of with Map entries', () => {
        const map = new Map([
          ['x', 1],
          ['y', 2],
        ]);
        const result = {};
        for (const [key, val] of map) {
          result[key] = val;
        }
        expect(result).toEqual({ x: 1, y: 2 });
      });

      it('for-of supports object rest in declaration and assignment patterns', () => {
        const declared = [];
        for (const { selected, ...rest } of [{ selected: 1, kept: 2 }]) {
          declared.push([selected, rest]);
        }

        let selected, rest;
        for ({ selected, ...rest } of [{ selected: 3, kept: 4 }]) {
          // Assignment happens in the loop head.
        }
        expect(declared).toEqual([[1, { kept: 2 }]]);
        expect([selected, rest]).toEqual([3, { kept: 4 }]);
      });

      it('for-of supports object rest nested in an array pattern', () => {
        const results = [];
        for (const [index, { selected, ...rest }] of [[0, { selected: 1, kept: 2 }]]) {
          results.push([index, selected, rest]);
        }
        expect(results).toEqual([[0, 1, { kept: 2 }]]);
      });

      it('for-await-of supports object rest', async () => {
        async function* values() {
          yield { selected: 1, kept: 2 };
        }
        const results = [];
        for await (const { selected, ...rest } of values()) {
          results.push([selected, rest]);
        }
        expect(results).toEqual([[1, { kept: 2 }]]);
      });

      // NOTE(@kitten): Broken test case
      // From: destructuring/for-of-shadowed-block-scoped/exec.js
      // @babel/plugin-transform-block-scoping bug: when it renames the inner
      // `const a` to `_a` to avoid shadowing, it incorrectly also renames the
      // computed key `[a]` in the for-of destructuring pattern — even though
      // that `[a]` should reference the *outer* `a`. The renamed `_a` is
      // hoisted as `undefined`, so `O[undefined]` yields `undefined`.
      // When transform-destructuring ran first it resolved the computed key
      // before block-scoping touched the inner declaration, masking the bug.
      xit('for-of with computed key referencing outer scope despite inner shadow', () => {
        var O = { a: 'a' };
        const a = 'a';
        var ran = false;
        for (const { [a]: _ } of [O]) {
          const a = 'A'; // shadows outer `a`, but computed key already evaluated
          expect(_).toBe('a');
          ran = true;
        }
        expect(ran).toBe(true);
      });
    });

    describe('assignment expressions', () => {
      it('object destructuring assignment', () => {
        let a, b;
        ({ a, b } = { a: 1, b: 2 });
        expect(a).toBe(1);
        expect(b).toBe(2);
      });

      it('array destructuring assignment', () => {
        let x, y;
        [x, y] = [1, 2];
        expect(x).toBe(1);
        expect(y).toBe(2);
      });

      it('swap via array destructuring', () => {
        let a = 1,
          b = 2;
        [a, b] = [b, a];
        expect(a).toBe(2);
        expect(b).toBe(1);
      });

      it('nested assignment', () => {
        let name, score;
        ({
          user: { name },
          scores: [score],
        } = { user: { name: 'test' }, scores: [100] });
        expect(name).toBe('test');
        expect(score).toBe(100);
      });

      it('assignment with rest', () => {
        let first, rest;
        [first, ...rest] = [1, 2, 3, 4];
        expect(first).toBe(1);
        expect(rest).toEqual([2, 3, 4]);
      });

      it('object-rest assignment returns the right-hand value', () => {
        let selected, rest;
        const source = { selected: 1, kept: 2 };
        const result = ({ selected, ...rest } = source);
        expect(result).toBe(source);
        expect(selected).toBe(1);
        expect(rest).toEqual({ kept: 2 });
      });

      // From: destructuring/chained/exec.js
      it('chained destructuring assignment', () => {
        var a, b, c, d;
        ({ a, b } = { c, d } = { a: 1, b: 2, c: 3, d: 4 });
        expect(a).toBe(1);
        expect(b).toBe(2);
        expect(c).toBe(3);
        expect(d).toBe(4);
      });
    });

    describe('catch clause', () => {
      it('destructures error object in catch', () => {
        let msg, code;
        try {
          throw { message: 'fail', code: 42 };
        } catch ({ message, code: c }) {
          msg = message;
          code = c;
        }
        expect(msg).toBe('fail');
        expect(code).toBe(42);
      });

      it('destructures Error instance properties', () => {
        let msg;
        try {
          throw new TypeError('bad type');
        } catch ({ message }) {
          msg = message;
        }
        expect(msg).toBe('bad type');
      });

      it('collects object rest from a catch binding', () => {
        let code, details;
        try {
          throw { code: 'E_TEST', message: 'failed', retryable: true };
        } catch ({ code: caughtCode, ...rest }) {
          code = caughtCode;
          details = rest;
        }
        expect(code).toBe('E_TEST');
        expect(details).toEqual({ message: 'failed', retryable: true });
      });

      it('collects nested object rest from a catch binding', () => {
        let details;
        try {
          throw { error: { message: 'failed', code: 42 } };
        } catch ({ error: { message, ...rest } }) {
          details = [message, rest];
        }
        expect(details).toEqual(['failed', { code: 42 }]);
      });
    });

    describe('declaration variants', () => {
      it('supports object rest in exported declarations', () => {
        expect(exportedValue).toBe(1);
        expect(exportedRest).toEqual({ exportedOther: 2 });
      });

      it('const with object destructuring', () => {
        const { x, y } = { x: 1, y: 2 };
        expect(x).toBe(1);
        expect(y).toBe(2);
      });

      it('let with array destructuring', () => {
        let [a, b] = [1, 2];
        expect(a).toBe(1);
        expect(b).toBe(2);
        // let allows reassignment
        [a, b] = [3, 4];
        expect(a).toBe(3);
        expect(b).toBe(4);
      });

      it('var with multiple destructuring patterns', () => {
        var { a } = { a: 1 },
          [b] = [2];
        expect(a).toBe(1);
        expect(b).toBe(2);
      });

      // From: destructuring/const/exec.js
      it('const with nested defaults from function return', () => {
        const getState = () => ({});
        const { data: { courses: oldCourses = [] } = {} } = getState();
        expect(oldCourses).toEqual([]);
      });
    });

    describe('object-rest-spread regressions', () => {
      // Adapted from Babel regression fixture T7178.
      it('does not collide with a shadowed outer binding', () => {
        const props = { outer: true };
        const inner = function () {
          const { ...props } = this.props;
          return props;
        }.call({ props: { inner: true } });
        expect(props).toEqual({ outer: true });
        expect(inner).toEqual({ inner: true });
      });

      // Adapted from Babel regression fixture gh-17274.
      it('preserves computed-key order through nested object rest', () => {
        const order = [];
        const key = (value) => {
          order.push(value);
          return 'x';
        };
        const {
          [key(0)]: { [key(1)]: first, [key(2)]: second, ...rest },
          [key(3)]: outer,
        } = { x: { x: {} } };
        expect(order).toEqual([0, 1, 2, 3]);
        expect(rest).toEqual({});
        expect(outer).toEqual({ x: {} });
      });

      // Adapted from Babel regression fixture gh-4904.
      it('supports nested rest and rest inside a callback parameter', () => {
        const receive = (value, callback) => callback(value);
        const {
          nested: { selected, ...nestedRest },
          ...outerRest
        } = { nested: { selected: 1, kept: 2 }, root: 3 };
        const callbackResult = receive({ selected: 4, kept: 5 }, ({ selected, ...rest }) => [
          selected,
          rest,
        ]);
        expect([selected, nestedRest, outerRest]).toEqual([1, { kept: 2 }, { root: 3 }]);
        expect(callbackResult).toEqual([4, { kept: 5 }]);
      });

      // Adapted from Babel regression fixture gh-5151.
      it('makes rest bindings available to later declarators and preserves declarator order', () => {
        const order = [];
        const record = (name, value) => {
          order.push(name);
          return value;
        };
        const { selected, ...rest } = record('source', { selected: 1, kept: 2 }),
          later = record('later', rest.kept);
        var before = record('before', true),
          {
            nested: { value, ...nestedRest },
            ...outerRest
          } = record('nested', { nested: { value: 3, kept: 4 }, root: 5 }),
          after = record('after', true);
        expect([selected, rest, later]).toEqual([1, { kept: 2 }, 2]);
        expect([value, nestedRest, outerRest]).toEqual([3, { kept: 4 }, { root: 5 }]);
        expect([before, after]).toEqual([true, true]);
        expect(order).toEqual(['source', 'later', 'before', 'nested', 'after']);
      });

      // Adapted from Babel regression fixture gh-7388.
      it('transforms object rest inside deeply nested default arrow functions', () => {
        function outer(value) {
          const {
            first = (firstValue = {}) => {
              const {
                second = (secondValue = {}) => {
                  const { selected, ...rest } = secondValue;
                  return [selected, rest];
                },
              } = firstValue;
              return second;
            },
          } = value;
          return first;
        }
        const first = outer({});
        const second = first({});
        expect(second({ selected: 1, kept: 2 })).toEqual([1, { kept: 2 }]);
      });

      // Adapted from Babel regression fixture gh-8323.
      it('preserves defaults when an object parameter also contains rest', () => {
        let defaults = 0;
        const fallback = () => {
          defaults++;
          return 3;
        };
        const extract = ({ a = fallback(), b, c, ...rest }) => [a, b, c, rest];
        expect(extract({ b: 2, c: 3, kept: 4 })).toEqual([3, 2, 3, { kept: 4 }]);
        expect(extract({ a: 1, b: 2, c: 3, kept: 4 })).toEqual([1, 2, 3, { kept: 4 }]);
        expect(defaults).toBe(1);
      });
    });

    // From: destructuring/check-iterator-return/exec.js
    describe('iterator protocol', () => {
      it('empty pattern calls iterator.return when return() returns object', () => {
        var returnCalled = false;
        // eslint-disable-next-line no-empty-pattern
        var [] = {
          [Symbol.iterator]: () => {
            return {
              return: () => {
                returnCalled = true;
                return {};
              },
            };
          },
        };
        expect(returnCalled).toBe(true);
      });

      it('empty pattern throws if iterator.return() returns non-object', () => {
        expect(() => {
          // eslint-disable-next-line no-empty-pattern
          var [] = {
            [Symbol.iterator]: () => {
              return {
                return: () => {},
              };
            },
          };
        }).toThrow();
      });

      it('single-element pattern throws if iterator.return() returns non-object', () => {
        expect(() => {
          var [x] = {
            [Symbol.iterator]: () => {
              return {
                next: () => ({ done: false, value: 1 }),
                return: () => {},
              };
            },
          };
        }).toThrow();
      });

      it('single-element pattern does not throw if iterator.return() returns object', () => {
        expect(() => {
          var [x] = {
            [Symbol.iterator]: () => {
              return {
                next: () => ({ done: false, value: 1 }),
                return: () => ({}),
              };
            },
          };
        }).not.toThrow();
      });
    });

    // From: destructuring/init-hole/exec.js
    describe('holes and sparse arrays', () => {
      it('default with explicit hole (let)', () => {
        // eslint-disable-next-line no-sparse-arrays
        let [x = 23] = [,];
        expect(x).toBe(23);
      });

      it('default with hole and trailing value (const)', () => {
        // eslint-disable-next-line no-sparse-arrays
        const [y = 24, z] = [, 42];
        expect(y).toBe(24);
        expect(z).toBe(42);
      });

      it('default interleaves with generator evaluation order', () => {
        function* foo() {
          yield 1;
          yield 2;
        }
        let bar = foo();
        // The default for `a` is bar.next().value, but it only runs because
        // position 0 is a hole. By the time it runs, bar has already yielded 1
        // (for position 1), so the default produces 2.
        // eslint-disable-next-line no-sparse-arrays
        const [a = bar.next().value, b] = [, bar.next().value];
        expect(a).toBe(2);
        expect(b).toBe(1);
      });

      it('assignment pattern with hole', () => {
        var c;
        // eslint-disable-next-line no-sparse-arrays
        const arr = ([c = 42] = [,]);
        expect(c).toBe(42);
        // eslint-disable-next-line no-sparse-arrays
        expect(arr).toEqual([,]);
      });

      it('rest from sparse array fills holes with undefined', () => {
        // eslint-disable-next-line no-sparse-arrays
        const [...d] = [,];
        expect(d).toEqual([undefined]);
      });

      it('rest with object pattern from sparse array', () => {
        // eslint-disable-next-line no-sparse-arrays
        const [...{ 0: e }] = [,];
        expect(e).toEqual(undefined);
      });

      it('single element from sparse array is undefined', () => {
        // eslint-disable-next-line no-sparse-arrays
        const [f] = [,];
        expect(f).toEqual(undefined);
        // eslint-disable-next-line no-sparse-arrays
        let [g] = [,];
        expect(g).toEqual(undefined);
      });

      it('object pattern from hole throws', () => {
        var thrown;
        try {
          thrown = false;
          // eslint-disable-next-line no-sparse-arrays
          [{}] = [,];
        } catch (e) {
          thrown = true;
        }
        expect(thrown).toBe(true);
      });

      it('array pattern from hole throws', () => {
        var thrown;
        try {
          thrown = false;
          // eslint-disable-next-line no-sparse-arrays
          [[]] = [,];
        } catch (e) {
          thrown = true;
        }
        expect(thrown).toBe(true);
      });
    });

    // From: destructuring/empty-array-pattern/exec.js
    describe('empty array pattern', () => {
      it('throws on null', () => {
        expect(() => {
          // eslint-disable-next-line no-empty-pattern
          var [] = null;
        }).toThrow();
      });

      it('throws on number', () => {
        expect(() => {
          // eslint-disable-next-line no-empty-pattern
          var [] = 42;
        }).toThrow();
      });

      it('throws on plain object', () => {
        expect(() => {
          // eslint-disable-next-line no-empty-pattern
          var [] = {};
        }).toThrow();
      });

      it('throws if Symbol.iterator returns non-object', () => {
        expect(() => {
          // eslint-disable-next-line no-empty-pattern
          var [] = { [Symbol.iterator]: () => {} };
        }).toThrow();
      });

      it('does not throw on valid iterables', () => {
        expect(() => {
          // eslint-disable-next-line no-empty-pattern
          var [] = [];
          // eslint-disable-next-line no-empty-pattern
          var [] = [0, 1, 2];
          // eslint-disable-next-line no-empty-pattern
          var [] = 'foo';
          // eslint-disable-next-line no-empty-pattern
          var [] = (function* () {
            throw new Error('Should not throw');
          })();
          // eslint-disable-next-line no-empty-pattern
          var [] = { [Symbol.iterator]: () => ({}) };
        }).not.toThrow();
      });

      it('calls iterator.return on empty pattern', () => {
        var returnCalled = false;
        // eslint-disable-next-line no-empty-pattern
        var [] = {
          [Symbol.iterator]: () => {
            return {
              return: () => {
                returnCalled = true;
                return {};
              },
            };
          },
        };
        expect(returnCalled).toBe(true);
      });
    });

    // From: destructuring/non-iterable/exec.js
    describe('non-iterable errors', () => {
      it('throws on undefined', () => {
        var foo;
        expect(() => {
          [foo] = undefined;
        }).toThrow();
      });

      it('throws on plain object', () => {
        var foo;
        expect(() => {
          [foo] = {};
        }).toThrow();
      });
    });

    describe('edge cases', () => {
      it('empty object pattern does not throw on object', () => {
        expect(() => {
          // eslint-disable-next-line no-empty-pattern
          const {} = { a: 1 };
        }).not.toThrow();
      });

      it('empty array pattern does not throw on array', () => {
        expect(() => {
          // eslint-disable-next-line no-empty-pattern
          const [] = [1, 2];
        }).not.toThrow();
      });

      it('destructuring null throws TypeError', () => {
        expect(() => {
          const { a } = null;
        }).toThrow();
      });

      it('destructuring undefined throws TypeError', () => {
        expect(() => {
          const { a } = undefined;
        }).toThrow();
      });

      it('array destructuring from non-iterable throws', () => {
        expect(() => {
          const [a] = 42;
        }).toThrow();
      });

      it('default value expression is lazily evaluated', () => {
        let evaluated = false;
        const { a = (evaluated = true) } = { a: 1 };
        expect(a).toBe(1);
        expect(evaluated).toBe(false);
      });

      it('default value expression evaluated when value is undefined', () => {
        let count = 0;
        const { a = ++count, b = ++count } = { a: undefined };
        expect(a).toBe(1);
        expect(b).toBe(2);
        expect(count).toBe(2);
      });

      it('array default value expression is lazily evaluated', () => {
        let evaluated = false;
        const [a = (evaluated = true)] = [42];
        expect(a).toBe(42);
        expect(evaluated).toBe(false);
      });

      it('evaluation order matches spec for object destructuring', () => {
        const order = [];
        const obj = {
          get a() {
            order.push('get a');
            return 1;
          },
          get b() {
            order.push('get b');
            return 2;
          },
        };
        const { a, b } = obj;
        expect(a).toBe(1);
        expect(b).toBe(2);
        expect(order).toEqual(['get a', 'get b']);
      });

      it('rest creates a shallow copy', () => {
        const inner = { value: 1 };
        const { a, ...rest } = { a: 1, b: inner };
        expect(rest.b).toBe(inner);
        inner.value = 2;
        expect(rest.b.value).toBe(2);
      });

      it('rest with symbol keys are included', () => {
        const sym = Symbol('test');
        const obj = { a: 1, [sym]: 2 };
        const { a, ...rest } = obj;
        expect(a).toBe(1);
        expect(rest[sym]).toBe(2);
      });

      it('destructuring assignment returns the right-hand value', () => {
        let a, b;
        const result = ([a, b] = [1, 2]);
        expect(result).toEqual([1, 2]);
        expect(a).toBe(1);
        expect(b).toBe(2);
      });

      it('array rest with object pattern', () => {
        const [first, ...{ length }] = [1, 2, 3];
        expect(first).toBe(1);
        expect(length).toBe(2);
      });

      it('handles large number of properties', () => {
        const obj = {};
        for (let i = 0; i < 100; i++) {
          obj['k' + i] = i;
        }
        const { k0, k50, k99, ...rest } = obj;
        expect(k0).toBe(0);
        expect(k50).toBe(50);
        expect(k99).toBe(99);
        expect(Object.keys(rest).length).toBe(97);
      });
    });
  });
}
