/* eslint-disable */
'use strict';

// Comprehensive runtime compliance tests for async/await.
// Validates that async functions work correctly at runtime in the Hermes engine.
// Cases sourced from @babel/plugin-transform-async-to-generator exec.js fixtures
// and supplemented with edge cases and stack trace diagnostics.
// Async generators, for-await-of, and for-of are in JSAsyncGenerator.js.

export const name = 'JS Async';

export function test({ describe, it, xit, expect }) {
  describe('JS Async', () => {
    describe('basic async/await', () => {
      it('async function returns a promise', () => {
        async function foo() {
          return 42;
        }
        const result = foo();
        expect(result instanceof Promise).toBe(true);
      });

      it('await resolves promise value', async () => {
        async function foo() {
          return await Promise.resolve(42);
        }
        expect(await foo()).toBe(42);
      });

      it('async function returning non-promise wraps in promise', async () => {
        async function foo() {
          return 'hello';
        }
        expect(await foo()).toBe('hello');
      });

      it('await non-promise value passes through', async () => {
        async function foo() {
          const x = await 42;
          return x;
        }
        expect(await foo()).toBe(42);
      });

      it('sequential awaits', async () => {
        async function foo() {
          const a = await Promise.resolve(1);
          const b = await Promise.resolve(2);
          const c = await Promise.resolve(3);
          return a + b + c;
        }
        expect(await foo()).toBe(6);
      });

      it('await in expression position', async () => {
        async function foo() {
          return (await Promise.resolve(10)) + (await Promise.resolve(32));
        }
        expect(await foo()).toBe(42);
      });
    });

    describe('error handling', () => {
      it('rejected promise throws on await', async () => {
        async function foo() {
          try {
            await Promise.reject(new Error('fail'));
            return 'no error';
          } catch (e) {
            return e.message;
          }
        }
        expect(await foo()).toBe('fail');
      });

      it('throw in async function rejects the promise', async () => {
        async function foo() {
          throw new Error('oops');
        }
        try {
          await foo();
          expect(true).toBe(false); // should not reach
        } catch (e) {
          expect(e.message).toBe('oops');
        }
      });

      it('try-catch-finally with await', async () => {
        const log = [];
        async function foo() {
          try {
            log.push('try');
            await Promise.reject(new Error('err'));
          } catch (e) {
            log.push('catch');
          } finally {
            log.push('finally');
          }
        }
        await foo();
        expect(log).toEqual(['try', 'catch', 'finally']);
      });

      it('nested try-catch with async', async () => {
        async function inner() {
          throw new Error('inner');
        }
        async function outer() {
          try {
            await inner();
          } catch (e) {
            return 'caught: ' + e.message;
          }
        }
        expect(await outer()).toBe('caught: inner');
      });

      it('error after await does not lose context', async () => {
        async function foo() {
          await Promise.resolve();
          throw new Error('after await');
        }
        try {
          await foo();
          expect(true).toBe(false);
        } catch (e) {
          expect(e.message).toBe('after await');
        }
      });
    });

    describe('async arrow functions', () => {
      it('basic async arrow', async () => {
        const foo = async () => 42;
        expect(await foo()).toBe(42);
      });

      it('async arrow with await', async () => {
        const foo = async (x) => {
          const result = await Promise.resolve(x * 2);
          return result;
        };
        expect(await foo(21)).toBe(42);
      });

      it('async arrow preserves this from enclosing scope', async () => {
        const obj = {
          val: 42,
          getVal: function () {
            const fn = async () => {
              return await Promise.resolve(this.val);
            };
            return fn();
          },
        };
        expect(await obj.getVal()).toBe(42);
      });

      // From: regression/fn-name/exec.js
      it('async arrow preserves name property', () => {
        var concat = async (...args) => {
          var x = args[0];
          var y = args[1];
        };
        expect(concat.name).toBe('concat');
      });

      // From: regression/test262-fn-length/exec.js
      it('async function preserves length property', () => {
        var a = async (b) => {};
        expect(a.length).toBe(1);
      });
    });

    describe('async methods', () => {
      it('async class method', async () => {
        class Foo {
          async bar() {
            return await Promise.resolve(42);
          }
        }
        expect(await new Foo().bar()).toBe(42);
      });

      it('async static method', async () => {
        class Foo {
          static async bar() {
            return await Promise.resolve(42);
          }
        }
        expect(await Foo.bar()).toBe(42);
      });

      it('async object method', async () => {
        const obj = {
          async foo() {
            return await Promise.resolve(42);
          },
        };
        expect(await obj.foo()).toBe(42);
      });

      it('async method preserves this', async () => {
        class Foo {
          constructor(val) {
            this.val = val;
          }
          async getVal() {
            return await Promise.resolve(this.val);
          }
        }
        expect(await new Foo(42).getVal()).toBe(42);
      });
    });

    describe('complex parameters', () => {
      // From: async-to-generator/async-complex-params/exec.js
      it('async method with destructured parameter that throws', async () => {
        let caught = false;
        class Foo {
          async bar(a, { b }) {}
        }
        try {
          await new Foo().bar();
        } catch (e) {
          caught = true;
        }
        expect(caught).toBe(true);
      });

      it('async method with destructured parameter', async () => {
        class Foo {
          async bar(a, { b }) {
            return [a, b];
          }
        }
        expect(await new Foo().bar(1, { b: 2 })).toEqual([1, 2]);
      });

      it('async method with default parameter', async () => {
        async function foo(
          a,
          b = (() => {
            throw new Error('required');
          })()
        ) {
          return [a, b];
        }
        expect(await foo(1, 2)).toEqual([1, 2]);
      });

      // From: regression/4943/exec.js
      it('async function with mandatory default throws on missing param', async () => {
        function mandatory(name) {
          throw new Error('Missing: ' + name);
        }
        async function foo({ a, b = mandatory('b') } = {}) {
          return b;
        }
        try {
          await foo();
          expect(true).toBe(false);
        } catch (e) {
          expect(e.message).toBe('Missing: b');
        }
      });

      it('async method with rest parameter', async () => {
        class Foo {
          async bar(a, ...b) {
            return [a, b];
          }
        }
        expect(await new Foo().bar(1, 2, 3)).toEqual([1, [2, 3]]);
      });

      it('async method with super access', async () => {
        class Base {
          get val() {
            return 'base';
          }
        }
        class Child extends Base {
          async foo(a, { b }) {
            return [a, b, super.val];
          }
        }
        expect(await new Child().foo(1, { b: 2 })).toEqual([1, 2, 'base']);
      });
    });

    describe('execution order', () => {
      it('code after await runs asynchronously', async () => {
        const log = [];
        async function foo() {
          log.push(1);
          await null;
          log.push(2);
        }
        const p = foo();
        log.push(3);
        await p;
        expect(log).toEqual([1, 3, 2]);
      });

      it('multiple async functions interleave correctly', async () => {
        const log = [];
        async function a() {
          log.push('a1');
          await null;
          log.push('a2');
        }
        async function b() {
          log.push('b1');
          await null;
          log.push('b2');
        }
        await Promise.all([a(), b()]);
        expect(log[0]).toBe('a1');
        expect(log[1]).toBe('b1');
        // a2 and b2 ordering depends on microtask queue
        expect(log.indexOf('a2') >= 0).toBe(true);
        expect(log.indexOf('b2') >= 0).toBe(true);
      });

      // From: async-to-generator/double-await/exec.js
      it('double await adds extra microtask delay', async () => {
        const log = [];

        const p1 = (async function () {
          log.push(1);
          await await null;
          log.push(2);
        })();

        const p2 = (async function () {
          log.push(3);
          await null;
          log.push(4);
        })();

        log.push(5);

        await Promise.all([p1, p2]);
        // 4 should come before 2 due to double-await extra tick
        expect(log.indexOf(4) < log.indexOf(2)).toBe(true);
        expect(log[0]).toBe(1);
        expect(log[1]).toBe(3);
        expect(log[2]).toBe(5);
      });
    });

    describe('closures and loops', () => {
      // From: regression/15978/exec.js
      it('async closure in for-of captures correct value', async () => {
        let items = [1, 2, 3, 4];
        let output = [];
        for (const item of items) {
          await (async (x) => {
            output.push(item);
          })();
        }
        expect(output).toEqual([1, 2, 3, 4]);
      });

      it('await in for loop with closure', async () => {
        const results = [];
        for (let i = 0; i < 3; i++) {
          const val = await Promise.resolve(i * 10);
          results.push(() => val);
        }
        expect(results[0]()).toBe(0);
        expect(results[1]()).toBe(10);
        expect(results[2]()).toBe(20);
      });

      it('await in while loop', async () => {
        let sum = 0;
        let i = 0;
        while (i < 5) {
          sum += await Promise.resolve(i);
          i++;
        }
        expect(sum).toBe(10);
      });

      // From: regression/8783/exec.js
      it('recursive async function (polling pattern)', async () => {
        const log = [];
        async function collect(count) {
          log.push(await Promise.resolve(count));
          if (count < 3) {
            await collect(count + 1);
          }
        }
        await collect(0);
        expect(log).toEqual([0, 1, 2, 3]);
      });
    });

    describe('hoisting and declarations', () => {
      // From: regression/T6882/exec.js
      it('async function declaration is hoisted', async () => {
        // Call before declaration
        const result = await foo();
        expect(result).toBe(42);

        async function foo() {
          return 42;
        }
      });

      it('async function expression is not hoisted', () => {
        expect(() => {
          bar();
        }).toThrow();

        var bar = async function () {
          return 42;
        };
      });
    });

    describe('parallel patterns', () => {
      it('Promise.all with multiple async calls', async () => {
        async function double(x) {
          return await Promise.resolve(x * 2);
        }
        const results = await Promise.all([double(1), double(2), double(3)]);
        expect(results).toEqual([2, 4, 6]);
      });

      it('Promise.race with async functions', async () => {
        async function fast() {
          return 'fast';
        }
        async function slow() {
          await new Promise((r) => setTimeout(r, 100));
          return 'slow';
        }
        const result = await Promise.race([fast(), slow()]);
        expect(result).toBe('fast');
      });

      it('Promise.allSettled with mixed results', async () => {
        async function succeed() {
          return 'ok';
        }
        async function fail() {
          throw new Error('fail');
        }
        const results = await Promise.allSettled([succeed(), fail()]);
        expect(results[0].status).toBe('fulfilled');
        expect(results[0].value).toBe('ok');
        expect(results[1].status).toBe('rejected');
        expect(results[1].reason.message).toBe('fail');
      });
    });

    describe('edge cases', () => {
      it('async IIFE', async () => {
        const result = await (async () => {
          return await Promise.resolve(42);
        })();
        expect(result).toBe(42);
      });

      it('nested async functions', async () => {
        async function outer() {
          async function inner() {
            return await Promise.resolve(21);
          }
          const val = await inner();
          return val * 2;
        }
        expect(await outer()).toBe(42);
      });

      it('async function returning another async function', async () => {
        async function factory() {
          return async (x) => x * 2;
        }
        const fn = await factory();
        expect(await fn(21)).toBe(42);
      });

      it('await in conditional expression', async () => {
        async function foo(flag) {
          return flag ? await Promise.resolve('yes') : await Promise.resolve('no');
        }
        expect(await foo(true)).toBe('yes');
        expect(await foo(false)).toBe('no');
      });

      it('await in template literal', async () => {
        async function foo() {
          return `result: ${await Promise.resolve(42)}`;
        }
        expect(await foo()).toBe('result: 42');
      });

      it('await in array literal', async () => {
        async function foo() {
          return [await Promise.resolve(1), await Promise.resolve(2), await Promise.resolve(3)];
        }
        expect(await foo()).toEqual([1, 2, 3]);
      });

      it('await in object literal', async () => {
        async function foo() {
          return {
            a: await Promise.resolve(1),
            b: await Promise.resolve(2),
          };
        }
        expect(await foo()).toEqual({ a: 1, b: 2 });
      });

      it('await in destructuring', async () => {
        async function foo() {
          const { a, b } = await Promise.resolve({ a: 1, b: 2 });
          return a + b;
        }
        expect(await foo()).toBe(3);
      });

      it('await in switch statement', async () => {
        async function foo(key) {
          switch (await Promise.resolve(key)) {
            case 'a':
              return 1;
            case 'b':
              return 2;
            default:
              return 0;
          }
        }
        expect(await foo('a')).toBe(1);
        expect(await foo('b')).toBe(2);
        expect(await foo('c')).toBe(0);
      });

      it('async function with no await still returns promise', () => {
        async function foo() {
          return 42;
        }
        const result = foo();
        expect(result instanceof Promise).toBe(true);
      });

      it('returning a promise from async function does not double-wrap', async () => {
        async function foo() {
          return Promise.resolve(42);
        }
        const result = await foo();
        expect(result).toBe(42);
      });

      it('returning a thenable from async function', async () => {
        async function foo() {
          return {
            then(resolve) {
              resolve(42);
            },
          };
        }
        expect(await foo()).toBe(42);
      });
    });

    describe('stack traces', () => {
      it('error stack includes async function name', async () => {
        async function myAsyncFunction() {
          throw new Error('trace test');
        }
        try {
          await myAsyncFunction();
        } catch (e) {
          const stack = e.stack || '';
          // The async function name should appear somewhere in the stack
          expect(stack.indexOf('myAsyncFunction') >= 0).toBe(true);
        }
      });

      it('error stack includes caller chain through await', async () => {
        async function innerFunc() {
          throw new Error('deep trace');
        }
        async function middleFunc() {
          return await innerFunc();
        }
        async function outerFunc() {
          return await middleFunc();
        }
        try {
          await outerFunc();
        } catch (e) {
          const stack = e.stack || '';
          // At minimum, the function that threw should be in the stack
          expect(stack.indexOf('innerFunc') >= 0).toBe(true);
        }
      });

      // TODO(@kitten): transform-async-to-generator loses function names after await
      xit('error created inside async function has meaningful stack', async () => {
        async function createError() {
          await Promise.resolve();
          return new Error('for inspection');
        }
        const err = await createError();
        const stack = err.stack || '';
        // The error should have a stack that includes the function name
        expect(stack.indexOf('createError') >= 0).toBe(true);
      });

      it('console-style stack preservation through async chain', async () => {
        // Tests that the originating call site is preserved when errors
        // propagate through multiple await layers
        const errors = [];
        async function level3() {
          throw new Error('level3 error');
        }
        async function level2() {
          await level3();
        }
        async function level1() {
          try {
            await level2();
          } catch (e) {
            errors.push(e);
          }
        }
        await level1();
        expect(errors.length).toBe(1);
        expect(errors[0].message).toBe('level3 error');
        const stack = errors[0].stack || '';
        expect(stack.indexOf('level3') >= 0).toBe(true);
      });

      it('deep async chain preserves multiple function names in stack', async () => {
        async function database() {
          throw new Error('connection refused');
        }
        async function repository() {
          return await database();
        }
        async function service() {
          return await repository();
        }
        async function controller() {
          return await service();
        }
        async function router() {
          return await controller();
        }
        try {
          await router();
        } catch (e) {
          const stack = e.stack || '';
          // The throw site should always be present
          expect(stack.indexOf('database') >= 0).toBe(true);
          // Intermediate callers should appear in the async stack
          expect(stack.indexOf('repository') >= 0).toBe(true);
          expect(stack.indexOf('service') >= 0).toBe(true);
          expect(stack.indexOf('controller') >= 0).toBe(true);
          expect(stack.indexOf('router') >= 0).toBe(true);
        }
      });

      it('error thrown synchronously before any await has function name', async () => {
        async function failImmediately() {
          throw new Error('sync throw');
        }
        try {
          await failImmediately();
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('failImmediately') >= 0).toBe(true);
        }
      });

      it('error from rejected promise includes thrower name', async () => {
        async function rejecter() {
          return Promise.reject(new Error('rejected'));
        }
        async function caller() {
          return await rejecter();
        }
        try {
          await caller();
        } catch (e) {
          expect(e.message).toBe('rejected');
          const stack = e.stack || '';
          expect(stack.indexOf('rejecter') >= 0).toBe(true);
        }
      });

      it('async arrow function name in stack', async () => {
        const myArrowAsync = async () => {
          throw new Error('arrow error');
        };
        try {
          await myArrowAsync();
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('myArrowAsync') >= 0).toBe(true);
        }
      });

      it('async method name in stack', async () => {
        class MyService {
          async fetchData() {
            throw new Error('service error');
          }
        }
        try {
          await new MyService().fetchData();
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('fetchData') >= 0).toBe(true);
        }
      });

      it('nested async class methods preserve inner name', async () => {
        class Repo {
          async query() {
            throw new Error('db error');
          }
        }
        class Service {
          async handle() {
            return await new Repo().query();
          }
        }
        try {
          await new Service().handle();
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('query') >= 0).toBe(true);
        }
      });

      // TODO(@kitten): transform-async-to-generator loses function names after await
      xit('error in Promise.all includes thrower name', async () => {
        async function badTask() {
          await Promise.resolve();
          throw new Error('task failed');
        }
        try {
          await Promise.all([Promise.resolve(1), badTask()]);
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('badTask') >= 0).toBe(true);
        }
      });

      it('re-thrown error preserves original stack', async () => {
        async function original() {
          throw new Error('original error');
        }
        async function wrapper() {
          try {
            await original();
          } catch (e) {
            throw e; // re-throw
          }
        }
        try {
          await wrapper();
        } catch (e) {
          const stack = e.stack || '';
          // The original throw site should still be in the stack
          expect(stack.indexOf('original') >= 0).toBe(true);
        }
      });

      // TODO(@kitten): transform-async-to-generator loses function names after await
      xit('error constructed after await preserves function name', async () => {
        async function buildError() {
          await Promise.resolve();
          return new Error('constructed');
        }
        const err = await buildError();
        const stack = err.stack || '';
        expect(stack.indexOf('buildError') >= 0).toBe(true);
      });
    });

    describe('destructuring + state lifting', () => {
      // See: https://github.com/expo/expo/issues/45592
      it('awaits after destructuring in arrow params', async () => {
        const f = async ({ b: _ }) => 42;
        const actual = await f({ b: 1 });
        expect(actual).toBe(42);
      });

      it('object destructure with rename', async () => {
        const f = async ({ b: x }) => x;
        expect(await f({ b: 42 })).toBe(42);
      });

      it('object destructure with default', async () => {
        const f = async ({ b = 7 }) => b;
        expect(await f({})).toBe(7);
      });

      it('object destructure with rest', async () => {
        const f = async ({ a, ...rest }) => rest;
        expect(await f({ a: 1, b: 2, c: 3 })).toEqual({ b: 2, c: 3 });
      });

      it('nested object destructure', async () => {
        const f = async ({ a: { b } }) => b;
        expect(await f({ a: { b: 42 } })).toBe(42);
      });

      it('array destructure', async () => {
        const f = async ([a, b]) => a + b;
        expect(await f([1, 2])).toBe(3);
      });

      it('array destructure with rest', async () => {
        const f = async ([a, ...rest]) => rest;
        expect(await f([1, 2, 3, 4])).toEqual([2, 3, 4]);
      });

      it('async arrow with default-value param', async () => {
        const f = async (x = 7) => x;
        expect(await f()).toBe(7);
        expect(await f(9)).toBe(9);
      });

      it('async arrow with rest param', async () => {
        const f = async (...rest) => rest.length;
        expect(await f(1, 2, 3)).toBe(3);
      });

      it('value visible through .then()', async () => {
        const f = async ({ b: _ }) => 42;
        const seen = await new Promise((resolve) => {
          f({ b: 1 }).then((v) => resolve(v));
        });
        expect(seen).toBe(42);
      });

      it('value visible through Promise.all', async () => {
        const f = async ({ b }) => b;
        const results = await Promise.all([f({ b: 1 }), f({ b: 2 }), f({ b: 3 })]);
        expect(results).toEqual([1, 2, 3]);
      });

      it('control: async arrow with plain (non-destructured) params', async () => {
        const f = async (a, b) => 42;
        expect(await f(1, 2)).toBe(42);
      });

      it('control: async function declaration with destructured param', async () => {
        async function f({ b }) {
          return 42;
        }
        expect(await f({ b: 1 })).toBe(42);
      });

      it('control: async function expression with destructured param', async () => {
        const f = async function ({ b }) {
          return 42;
        };
        expect(await f({ b: 1 })).toBe(42);
      });

      it('control: class async method with destructured param', async () => {
        class C {
          async m({ b }) {
            return 42;
          }
        }
        expect(await new C().m({ b: 1 })).toBe(42);
      });

      it('control: object shorthand async method with destructured param', async () => {
        const o = {
          async m({ b }) {
            return 42;
          },
        };
        expect(await o.m({ b: 1 })).toBe(42);
      });

      it('control: arrow with body destructure (not in params)', async () => {
        const f = async (x) => {
          const { b } = x;
          void b;
          return 42;
        };
        expect(await f({ b: 1 })).toBe(42);
      });
    });
  });
}
