/* eslint-disable */
'use strict';

// Comprehensive runtime compliance tests for async generators, for-await-of,
// for-of iteration, and sync generators.
// Validates that these features work correctly at runtime in the Hermes engine.
// Cases sourced from @babel/plugin-transform-async-generator-functions,
// @babel/plugin-transform-for-of, and @babel/plugin-transform-regenerator
// exec.js fixtures, supplemented with edge cases.

export const name = 'JS Async Generator';

export function test({ describe, it, xit, expect }) {
  describe('JS Async Generator', () => {
    describe('sync generators', () => {
      it('basic generator yields values', () => {
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const g = gen();
        expect(g.next()).toEqual({ value: 1, done: false });
        expect(g.next()).toEqual({ value: 2, done: false });
        expect(g.next()).toEqual({ value: 3, done: false });
        expect(g.next()).toEqual({ value: undefined, done: true });
      });

      it('generator with return value', () => {
        function* gen() {
          yield 1;
          return 'done';
        }
        const g = gen();
        expect(g.next()).toEqual({ value: 1, done: false });
        expect(g.next()).toEqual({ value: 'done', done: true });
        expect(g.next()).toEqual({ value: undefined, done: true });
      });

      // From: regression/17358/exec.js
      it('generator with try-catch and no throw', () => {
        function* foobar() {
          try {
            yield 1;
          } catch {
            return false;
          }
        }
        const gen = foobar();
        expect(gen.next().value).toBe(1);
        expect(gen.next().value).toBeUndefined();
      });

      // From: regression/17365/exec.js
      it('generator with try-finally and early return', () => {
        function* gen() {
          try {
            return;
          } finally {
            // noop
          }
        }
        expect(gen().next()).toEqual({ done: true, value: undefined });
      });

      // From: regression/break-default-in-end/exec.js
      it('generator with switch-default-break', () => {
        function* gen(type) {
          switch (type) {
            default:
              break;
          }
        }
        expect(gen(1).next().done).toBe(true);

        function* gen2(type) {
          switch (type) {
            case 0:
              throw 'unreachable';
            default:
              break;
          }
        }
        expect(gen2(1).next().done).toBe(true);
      });

      // From: integration/default-parameters/exec.js
      it('generator with default parameters', () => {
        function* foo(bar = 'bar') {
          return bar;
        }
        expect(foo().next().value).toBe('bar');
        expect(foo('foo').next().value).toBe('foo');
      });

      // From: integration/destructuring-parameters/exec.js
      it('generator with destructured parameters', () => {
        function* foo({ bar }) {
          return bar;
        }
        expect(foo({ bar: 'bar' }).next().value).toBe('bar');
      });

      // From: integration/rest-parameters/exec.js
      it('generator with rest parameters', () => {
        function* foo(...items) {
          return items;
        }
        expect(foo(1, 2, 3).next().value).toEqual([1, 2, 3]);
      });

      it('generator with throw()', () => {
        function* gen() {
          try {
            yield 1;
            yield 2;
          } catch (e) {
            yield 'caught: ' + e.message;
          }
        }
        const g = gen();
        expect(g.next()).toEqual({ value: 1, done: false });
        expect(g.throw(new Error('test'))).toEqual({ value: 'caught: test', done: false });
      });

      it('generator with return()', () => {
        function* gen() {
          try {
            yield 1;
            yield 2;
          } finally {
            yield 'cleanup';
          }
        }
        const g = gen();
        expect(g.next()).toEqual({ value: 1, done: false });
        expect(g.return('early')).toEqual({ value: 'cleanup', done: false });
        expect(g.next()).toEqual({ value: 'early', done: true });
      });

      it('yield* delegation to another generator', () => {
        function* inner() {
          yield 'a';
          yield 'b';
        }
        function* outer() {
          yield 1;
          yield* inner();
          yield 2;
        }
        expect([...outer()]).toEqual([1, 'a', 'b', 2]);
      });

      it('yield* delegation to array', () => {
        function* gen() {
          yield* [10, 20, 30];
        }
        expect([...gen()]).toEqual([10, 20, 30]);
      });

      // From: regression/star-rhs-iter-rtrn-no-rtrn/exec.js
      it('yield* with iterable that has no return method', () => {
        function* inner() {
          yield 1;
          yield 2;
        }
        function* outer() {
          const result = yield* inner();
          yield result;
        }
        const g = outer();
        expect(g.next()).toEqual({ value: 1, done: false });
        expect(g.next()).toEqual({ value: 2, done: false });
        expect(g.next()).toEqual({ value: undefined, done: false });
      });

      it('generator used in spread', () => {
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        expect([...gen()]).toEqual([1, 2, 3]);
      });

      it('generator used in destructuring', () => {
        function* gen() {
          yield 'a';
          yield 'b';
          yield 'c';
        }
        const [x, y, z] = gen();
        expect(x).toBe('a');
        expect(y).toBe('b');
        expect(z).toBe('c');
      });

      it('generator with complex control flow', () => {
        function* gen(n) {
          for (let i = 0; i < n; i++) {
            if (i % 2 === 0) {
              yield i;
            }
          }
        }
        expect([...gen(6)]).toEqual([0, 2, 4]);
      });

      it('nested generators with yield*', () => {
        function* a() {
          yield 1;
        }
        function* b() {
          yield* a();
          yield 2;
        }
        function* c() {
          yield* b();
          yield 3;
        }
        expect([...c()]).toEqual([1, 2, 3]);
      });

      it('generator passing values via next()', () => {
        function* gen() {
          const a = yield 'first';
          const b = yield 'second';
          return a + b;
        }
        const g = gen();
        expect(g.next().value).toBe('first');
        expect(g.next(10).value).toBe('second');
        expect(g.next(32).value).toBe(42);
      });

      it('infinite generator with break', () => {
        function* counter() {
          let i = 0;
          while (true) {
            yield i++;
          }
        }
        const results = [];
        for (const n of counter()) {
          results.push(n);
          if (n >= 4) break;
        }
        expect(results).toEqual([0, 1, 2, 3, 4]);
      });
    });

    describe('for-of iteration', () => {
      // From: loose-exec/array.js
      it('for-of with array', () => {
        var arr = [1, 2, 3];
        var res = [];
        for (const x of arr) res.push(x);
        expect(res).toEqual([1, 2, 3]);
      });

      // From: loose-exec/array-break.js
      it('for-of with array and break', () => {
        var arr = [1, 2, 3];
        var res = [];
        for (const x of arr) {
          if (x === 2) break;
          res.push(x);
        }
        expect(res).toEqual([1]);
      });

      // From: loose-exec/array-continue.js
      it('for-of with array and continue', () => {
        var arr = [1, 2, 3];
        var res = [];
        for (const x of arr) {
          if (x === 2) continue;
          res.push(x);
        }
        expect(res).toEqual([1, 3]);
      });

      // From: loose-exec/generator.js
      it('for-of with generator', () => {
        function* f() {
          yield 1;
          yield 2;
          yield 3;
        }
        var res = [];
        for (const x of f()) res.push(x);
        expect(res).toEqual([1, 2, 3]);
      });

      // From: loose-exec/generator-break.js
      it('for-of with generator and break', () => {
        function* f() {
          yield 1;
          yield 2;
          yield 3;
        }
        var res = [];
        for (const x of f()) {
          if (x === 2) break;
          res.push(x);
        }
        expect(res).toEqual([1]);
      });

      // From: loose-exec/generator-continue.js
      it('for-of with generator and continue', () => {
        function* f() {
          yield 1;
          yield 2;
          yield 3;
        }
        var res = [];
        for (const x of f()) {
          if (x === 2) continue;
          res.push(x);
        }
        expect(res).toEqual([1, 3]);
      });

      it('for-of with string', () => {
        var res = [];
        for (const ch of 'abc') res.push(ch);
        expect(res).toEqual(['a', 'b', 'c']);
      });

      it('for-of with Set', () => {
        var res = [];
        for (const x of new Set([1, 2, 3])) res.push(x);
        expect(res).toEqual([1, 2, 3]);
      });

      it('for-of with Map', () => {
        var res = [];
        for (const [k, v] of new Map([['a', 1], ['b', 2]])) {
          res.push(k + ':' + v);
        }
        expect(res).toEqual(['a:1', 'b:2']);
      });

      it('for-of with custom iterable', () => {
        const iterable = {
          [Symbol.iterator]() {
            let i = 0;
            return {
              next() {
                if (i < 3) return { value: i++, done: false };
                return { value: undefined, done: true };
              },
            };
          },
        };
        var res = [];
        for (const x of iterable) res.push(x);
        expect(res).toEqual([0, 1, 2]);
      });

      // From: spec-exec/throw-iterator-handling.js
      // TODO(@kitten): loose mode in Babel doesn't support this
      xit('for-of calls return() on iterator when break occurs', () => {
        let returnCalled = false;
        const iterable = {
          [Symbol.iterator]() {
            let i = 0;
            return {
              next() {
                return { value: i++, done: false };
              },
              return() {
                returnCalled = true;
                return { value: undefined, done: true };
              },
            };
          },
        };
        for (const x of iterable) {
          if (x === 2) break;
        }
        expect(returnCalled).toBe(true);
      });

      // TODO(@kitten): loose mode in Babel doesn't support this
      xit('for-of calls return() on iterator when exception is thrown', () => {
        let returnCalled = false;
        const iterable = {
          [Symbol.iterator]() {
            let i = 0;
            return {
              next() {
                return { value: i++, done: false };
              },
              return() {
                returnCalled = true;
                return { value: undefined, done: true };
              },
            };
          },
        };
        try {
          for (const x of iterable) {
            if (x === 1) throw new Error('bail');
          }
        } catch (e) {}
        expect(returnCalled).toBe(true);
      });

      it('for-of with let creates per-iteration binding', () => {
        const funcs = [];
        for (let x of [0, 1, 2]) {
          funcs.push(() => x);
        }
        expect(funcs[0]()).toBe(0);
        expect(funcs[1]()).toBe(1);
        expect(funcs[2]()).toBe(2);
      });

      it('for-of with destructuring', () => {
        const pairs = [[1, 'a'], [2, 'b'], [3, 'c']];
        var nums = [];
        var strs = [];
        for (const [n, s] of pairs) {
          nums.push(n);
          strs.push(s);
        }
        expect(nums).toEqual([1, 2, 3]);
        expect(strs).toEqual(['a', 'b', 'c']);
      });

      it('for-of with arguments object', () => {
        function getArgs() {
          return arguments;
        }
        var args = getArgs(1, 2, 3);
        var res = [];
        for (const x of args) res.push(x);
        expect(res).toEqual([1, 2, 3]);
      });
    });

    describe('async generators', () => {
      // From: async-generators/declaration-exec/exec.js
      it('basic async generator yields resolved values', async () => {
        async function* gen() {
          yield await Promise.resolve('foo');
          yield await Promise.resolve('bar');
          yield await Promise.resolve('baz');
        }
        const g = gen();
        expect(await g.next()).toEqual({ value: 'foo', done: false });
        expect(await g.next()).toEqual({ value: 'bar', done: false });
        expect(await g.next()).toEqual({ value: 'baz', done: false });
        expect(await g.next()).toEqual({ value: undefined, done: true });
      });

      // From: async-generators/yield-exec/exec.js
      it('async generator execution order with delays', async () => {
        const log = [];
        async function* gen() {
          log.push('a');
          yield Promise.resolve();
          log.push('b');
          yield Promise.resolve();
          log.push('c');
        }
        const g = gen();
        await g.next();
        await g.next();
        await g.next();
        expect(log).toEqual(['a', 'b', 'c']);
      });

      it('async generator with return value', async () => {
        async function* gen() {
          yield 1;
          yield 2;
          return 'done';
        }
        const g = gen();
        expect(await g.next()).toEqual({ value: 1, done: false });
        expect(await g.next()).toEqual({ value: 2, done: false });
        expect(await g.next()).toEqual({ value: 'done', done: true });
        expect(await g.next()).toEqual({ value: undefined, done: true });
      });

      it('async generator with throw()', async () => {
        async function* gen() {
          try {
            yield 1;
            yield 2;
          } catch (e) {
            yield 'caught: ' + e.message;
          }
        }
        const g = gen();
        expect(await g.next()).toEqual({ value: 1, done: false });
        const result = await g.throw(new Error('test'));
        expect(result).toEqual({ value: 'caught: test', done: false });
      });

      it('async generator with return() for cleanup', async () => {
        const log = [];
        async function* gen() {
          try {
            log.push('start');
            yield 1;
            log.push('after yield 1');
            yield 2;
          } finally {
            log.push('cleanup');
          }
        }
        const g = gen();
        await g.next();
        await g.return();
        expect(log).toEqual(['start', 'cleanup']);
      });

      it('async generator passing values via next()', async () => {
        async function* gen() {
          const a = yield 'first';
          const b = yield 'second';
          return a + b;
        }
        const g = gen();
        expect((await g.next()).value).toBe('first');
        expect((await g.next(10)).value).toBe('second');
        expect((await g.next(32)).value).toBe(42);
      });

      it('async generator with try-finally', async () => {
        const log = [];
        async function* gen() {
          try {
            yield 1;
            yield 2;
          } finally {
            log.push('finally');
          }
        }
        const g = gen();
        await g.next();
        await g.next();
        await g.next();
        expect(log).toEqual(['finally']);
      });

      it('async generator with nested await', async () => {
        async function fetchVal(x) {
          return Promise.resolve(x * 2);
        }
        async function* gen() {
          yield await fetchVal(1);
          yield await fetchVal(2);
          yield await fetchVal(3);
        }
        const results = [];
        const g = gen();
        let r = await g.next();
        while (!r.done) {
          results.push(r.value);
          r = await g.next();
        }
        expect(results).toEqual([2, 4, 6]);
      });

      it('async generator expression', async () => {
        const gen = async function* () {
          yield 1;
          yield 2;
        };
        const g = gen();
        expect(await g.next()).toEqual({ value: 1, done: false });
        expect(await g.next()).toEqual({ value: 2, done: false });
        expect(await g.next()).toEqual({ value: undefined, done: true });
      });

      it('async generator as class method', async () => {
        class Foo {
          async *items() {
            yield 'a';
            yield 'b';
          }
        }
        const results = [];
        for await (const val of new Foo().items()) {
          results.push(val);
        }
        expect(results).toEqual(['a', 'b']);
      });
    });

    describe('for-await-of', () => {
      // From: for-await/async-generator-exec/exec.js
      it('for-await-of with async generator (cumulative sum)', async () => {
        async function* genAnswers() {
          var stream = [
            Promise.resolve(4),
            Promise.resolve(9),
            Promise.resolve(12),
          ];
          var total = 0;
          for await (let val of stream) {
            total += await val;
            yield total;
          }
        }
        const results = [];
        for await (const val of genAnswers()) {
          results.push(val);
        }
        expect(results).toEqual([4, 13, 25]);
      });

      it('for-await-of with array of promises', async () => {
        const promises = [
          Promise.resolve(1),
          Promise.resolve(2),
          Promise.resolve(3),
        ];
        const results = [];
        for await (const val of promises) {
          results.push(val);
        }
        expect(results).toEqual([1, 2, 3]);
      });

      it('for-await-of with custom async iterable', async () => {
        const iterable = {
          [Symbol.asyncIterator]() {
            let i = 0;
            return {
              next() {
                if (i < 3) return Promise.resolve({ value: i++, done: false });
                return Promise.resolve({ value: undefined, done: true });
              },
            };
          },
        };
        const results = [];
        for await (const val of iterable) {
          results.push(val);
        }
        expect(results).toEqual([0, 1, 2]);
      });

      it('for-await-of with break', async () => {
        async function* gen() {
          yield 1;
          yield 2;
          yield 3;
          yield 4;
          yield 5;
        }
        const results = [];
        for await (const val of gen()) {
          results.push(val);
          if (val === 3) break;
        }
        expect(results).toEqual([1, 2, 3]);
      });

      it('for-await-of with error in iterable', async () => {
        async function* gen() {
          yield 1;
          throw new Error('gen error');
        }
        const results = [];
        try {
          for await (const val of gen()) {
            results.push(val);
          }
        } catch (e) {
          results.push('error: ' + e.message);
        }
        expect(results).toEqual([1, 'error: gen error']);
      });

      // From: for-await/step-value-not-accessed-when-done/exec.js
      it('for-await-of does not access value when done', async () => {
        let gotValue = false;
        const iterable = {
          [Symbol.asyncIterator]() {
            return {
              next: () =>
                Promise.resolve({
                  get value() {
                    gotValue = true;
                  },
                  done: true,
                }),
            };
          },
        };
        for await (let value of iterable) {
        }
        expect(gotValue).toBe(false);
      });

      // From: for-await/lhs-member-expression/exec.js
      it('for-await-of with member expression as LHS', async () => {
        let obj = {};
        for await (obj.x of [1, 2]) {
        }
        expect(obj.x).toBe(2);
      });

      // From: for-await/re-declare-var-in-init-body/exec.js
      it('for-await-of allows re-declaration of let in body', async () => {
        // Should not throw a SyntaxError
        for await (let x of []) {
          let x;
        }
        expect(true).toBe(true);
      });

      it('for-await-of with destructuring', async () => {
        async function* gen() {
          yield { a: 1, b: 2 };
          yield { a: 3, b: 4 };
        }
        const results = [];
        for await (const { a, b } of gen()) {
          results.push(a + b);
        }
        expect(results).toEqual([3, 7]);
      });

      it('for-await-of with sync iterable (fallback)', async () => {
        // for-await-of should work with sync iterables too
        const results = [];
        for await (const val of [10, 20, 30]) {
          results.push(val);
        }
        expect(results).toEqual([10, 20, 30]);
      });
    });

    describe('async generator yield* delegation', () => {
      // From: yield-star/return-method/exec.js
      it('yield* delegation with early return()', async () => {
        const log = [];
        async function* inner() {
          log.push(1);
          yield 'a';
          log.push(2);
          yield 'b';
          log.push(3);
        }
        async function* outer() {
          log.push(4);
          yield* inner();
          log.push(5);
        }
        const iter = outer();
        const res = await iter.next();
        expect(res).toEqual({ value: 'a', done: false });
        expect(log).toEqual([4, 1]);

        await iter.return();
        expect(log).toEqual([4, 1]);
      });

      // From: yield-star/throw-method-with-catch/exec.js
      it('yield* delegation with throw() caught by inner', async () => {
        const log = [];
        async function* inner() {
          try {
            log.push(1);
            yield 'a';
            log.push(2);
          } catch (e) {
            log.push(3);
            yield 'caught';
            log.push(4);
          }
        }
        async function* outer() {
          log.push(5);
          yield* inner();
          log.push(6);
        }
        const iter = outer();
        await iter.next();
        expect(log).toEqual([5, 1]);

        const res = await iter.throw(new Error('TEST'));
        expect(res).toEqual({ value: 'caught', done: false });
        expect(log).toEqual([5, 1, 3]);

        await iter.next();
        expect(log).toEqual([5, 1, 3, 4, 6]);
      });

      // From: yield-star/create-async-from-sync-iterator/exec.js
      it('yield* from sync iterable in async generator', async () => {
        async function* fn() {
          yield* [Promise.resolve('ok')];
        }
        const result = await fn().next();
        expect(result.done).toBe(false);
        // CreateAsyncFromSyncIterator awaits the yielded promise,
        // so the value is the resolved string, not the Promise itself.
        expect(result.value).toBe('ok');
      });

      // From: yield-star/issue-9905/exec.js
      it('yield* early return does not execute rest of inner', async () => {
        const log = [];
        async function* func1() {
          log.push(1);
          yield 'a';
          log.push(2);
        }
        async function* func2() {
          yield* func1();
          log.push(3);
        }
        const iter = func2();
        await iter.next();
        await iter.return();
        expect(log).toEqual([1]);
      });

      it('yield* delegation with async inner values', async () => {
        async function* inner() {
          yield await Promise.resolve(10);
          yield await Promise.resolve(20);
        }
        async function* outer() {
          yield 1;
          yield* inner();
          yield 2;
        }
        const results = [];
        for await (const val of outer()) {
          results.push(val);
        }
        expect(results).toEqual([1, 10, 20, 2]);
      });

      it('yield* nested three levels deep', async () => {
        async function* a() {
          yield 'a';
        }
        async function* b() {
          yield* a();
          yield 'b';
        }
        async function* c() {
          yield* b();
          yield 'c';
        }
        const results = [];
        for await (const val of c()) {
          results.push(val);
        }
        expect(results).toEqual(['a', 'b', 'c']);
      });
    });

    describe('edge cases', () => {
      it('generator with labeled loop and break', () => {
        function* gen() {
          outer: for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              if (j === 1) continue outer;
              yield [i, j];
            }
          }
        }
        expect([...gen()]).toEqual([[0, 0], [1, 0], [2, 0]]);
      });

      it('async generator with for-of inside', async () => {
        async function* gen() {
          for (const x of [1, 2, 3]) {
            yield await Promise.resolve(x * 10);
          }
        }
        const results = [];
        for await (const val of gen()) {
          results.push(val);
        }
        expect(results).toEqual([10, 20, 30]);
      });

      it('async generator with for-await-of inside', async () => {
        async function* gen() {
          for await (const x of [Promise.resolve(1), Promise.resolve(2)]) {
            yield x * 10;
          }
        }
        const results = [];
        for await (const val of gen()) {
          results.push(val);
        }
        expect(results).toEqual([10, 20]);
      });

      it('for-of with empty iterable', () => {
        var count = 0;
        for (const x of []) {
          count++;
        }
        expect(count).toBe(0);
      });

      it('for-await-of with empty async iterable', async () => {
        async function* empty() {}
        var count = 0;
        for await (const x of empty()) {
          count++;
        }
        expect(count).toBe(0);
      });

      it('generator function length property', () => {
        function* gen(a, b, c) {}
        expect(gen.length).toBe(3);
      });

      it('generator is iterable (Symbol.iterator)', () => {
        function* gen() {
          yield 1;
        }
        const g = gen();
        expect(g[Symbol.iterator]() === g).toBe(true);
      });

      it('async generator is async iterable (Symbol.asyncIterator)', () => {
        async function* gen() {
          yield 1;
        }
        const g = gen();
        expect(g[Symbol.asyncIterator]() === g).toBe(true);
      });

      it('for-of with TypedArray', () => {
        var res = [];
        for (const x of new Uint8Array([10, 20, 30])) {
          res.push(x);
        }
        expect(res).toEqual([10, 20, 30]);
      });

      it('async generator with Promise.all inside', async () => {
        async function* gen() {
          const [a, b, c] = await Promise.all([
            Promise.resolve(1),
            Promise.resolve(2),
            Promise.resolve(3),
          ]);
          yield a;
          yield b;
          yield c;
        }
        const results = [];
        for await (const val of gen()) {
          results.push(val);
        }
        expect(results).toEqual([1, 2, 3]);
      });
    });

    describe('stack traces', () => {
      it('error thrown inside sync generator includes function name', () => {
        function* failingGen() {
          throw new Error('gen error');
        }
        const g = failingGen();
        try {
          g.next();
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('failingGen') >= 0).toBe(true);
        }
      });

      it('generator throw() preserves caller stack', () => {
        function* myGen() {
          try {
            yield 1;
          } catch (e) {
            throw e;
          }
        }
        const g = myGen();
        g.next();
        try {
          g.throw(new Error('injected'));
        } catch (e) {
          expect(e.message).toBe('injected');
        }
      });

      // TODO(@kitten): transform-async-generator-functions loses function names
      xit('error thrown inside async generator includes function name', async () => {
        async function* failingAsyncGen() {
          throw new Error('async gen error');
        }
        const g = failingAsyncGen();
        try {
          await g.next();
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('failingAsyncGen') >= 0).toBe(true);
        }
      });

      // TODO(@kitten): transform-async-generator-functions loses function names
      xit('error after await inside async generator includes function name', async () => {
        async function* genAfterAwait() {
          yield 'sentinel';
          await Promise.resolve();
          throw new Error('after await');
        }
        const g = genAfterAwait();
        await g.next(); // yields 'sentinel'
        try {
          await g.next(); // resumes, awaits, then throws
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('genAfterAwait') >= 0).toBe(true);
        }
      });

      // TODO(@kitten): transform-async-generator-functions loses function names
      xit('error propagates through for-await-of with function name', async () => {
        async function* explodingGen() {
          yield 1;
          throw new Error('mid-iteration');
        }
        try {
          for await (const _val of explodingGen()) {
            // consume
          }
        } catch (e) {
          expect(e.message).toBe('mid-iteration');
          const stack = e.stack || '';
          expect(stack.indexOf('explodingGen') >= 0).toBe(true);
        }
      });

      it('error in yield* delegation includes inner generator name', () => {
        function* inner() {
          yield 1;
          throw new Error('inner fail');
        }
        function* outer() {
          yield* inner();
        }
        const g = outer();
        g.next(); // yields 1
        try {
          g.next();
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('inner') >= 0).toBe(true);
        }
      });

      // TODO(@kitten): transform-async-generator-functions loses function names
      xit('async generator method name in stack', async () => {
        class DataStream {
          async *fetchChunks() {
            throw new Error('stream error');
          }
        }
        const s = new DataStream();
        const g = s.fetchChunks();
        try {
          await g.next();
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('fetchChunks') >= 0).toBe(true);
        }
      });

      // TODO(@kitten): transform-async-generator-functions loses function names
      xit('nested async generators preserve inner name', async () => {
        async function* innerGen() {
          await Promise.resolve();
          throw new Error('inner async fail');
        }
        async function* outerGen() {
          for await (const val of innerGen()) {
            yield val;
          }
        }
        try {
          for await (const _val of outerGen()) {
            // consume
          }
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('innerGen') >= 0).toBe(true);
        }
      });

      it('for-of error in loop body has correct stack', () => {
        function thrower() {
          throw new Error('loop body error');
        }
        try {
          for (const x of [1, 2, 3]) {
            if (x === 2) thrower();
          }
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('thrower') >= 0).toBe(true);
        }
      });

      // TODO(@kitten): transform-async-generator-functions loses function names
      xit('re-thrown error from async generator preserves original stack', async () => {
        async function* originalGen() {
          throw new Error('original gen error');
        }
        async function consumer() {
          try {
            for await (const _val of originalGen()) {
              // consume
            }
          } catch (e) {
            throw e;
          }
        }
        try {
          await consumer();
        } catch (e) {
          const stack = e.stack || '';
          expect(stack.indexOf('originalGen') >= 0).toBe(true);
        }
      });
    });

    describe('destructuring + state lifting (generators)', () => {
      // See: https://github.com/expo/expo/issues/45592
      it('async generator with destructured object param yields binding', async () => {
        async function* gen({ b }) {
          yield b;
          yield b + 1;
        }
        const g = gen({ b: 41 });
        expect(await g.next()).toEqual({ value: 41, done: false });
        expect(await g.next()).toEqual({ value: 42, done: false });
        expect((await g.next()).done).toBe(true);
      });

      it('async generator with destructured array param', async () => {
        async function* gen([a, b]) {
          yield a;
          yield b;
        }
        const g = gen([1, 2]);
        expect(await g.next()).toEqual({ value: 1, done: false });
        expect(await g.next()).toEqual({ value: 2, done: false });
      });

      it('async generator with destructured param + internal await', async () => {
        async function* gen({ b }) {
          const v = await Promise.resolve(b);
          yield v;
          return v + 1;
        }
        const g = gen({ b: 41 });
        expect(await g.next()).toEqual({ value: 41, done: false });
        expect(await g.next()).toEqual({ value: 42, done: true });
      });

      it('async generator with destructured param iterates via for-await-of', async () => {
        async function* gen({ b }) {
          yield b;
          yield b + 1;
        }
        const collected = [];
        for await (const v of gen({ b: 10 })) {
          collected.push(v);
        }
        expect(collected).toEqual([10, 11]);
      });

      it('class async generator method with destructured param', async () => {
        class C {
          async *gen({ b }) {
            yield b;
            return b + 1;
          }
        }
        const g = new C().gen({ b: 41 });
        expect(await g.next()).toEqual({ value: 41, done: false });
        expect(await g.next()).toEqual({ value: 42, done: true });
      });

      it('object shorthand async generator method with destructured param', async () => {
        const o = {
          async *gen({ b }) {
            yield b;
            return b + 1;
          },
        };
        const g = o.gen({ b: 41 });
        expect(await g.next()).toEqual({ value: 41, done: false });
        expect(await g.next()).toEqual({ value: 42, done: true });
      });

      it('sync generator with destructured object param yields binding', () => {
        function* gen({ b }) {
          yield b;
          return b + 1;
        }
        const g = gen({ b: 41 });
        expect(g.next()).toEqual({ value: 41, done: false });
        expect(g.next()).toEqual({ value: 42, done: true });
      });

      it('control: async generator with plain params', async () => {
        async function* gen(a, b) {
          yield a;
          yield b;
        }
        const g = gen(1, 2);
        expect(await g.next()).toEqual({ value: 1, done: false });
        expect(await g.next()).toEqual({ value: 2, done: false });
      });

      it('control: async generator destructure in body (not in params)', async () => {
        async function* gen(x) {
          const { b } = x;
          yield b;
        }
        const g = gen({ b: 42 });
        expect(await g.next()).toEqual({ value: 42, done: false });
      });
    });
  });
}
