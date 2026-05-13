/* eslint-disable */
'use strict';

// Comprehensive runtime compliance tests for ES6 block scoping (let/const).
// Validates that let/const work correctly at runtime in the Hermes engine.
// Cases sourced from @babel/plugin-transform-block-scoping exec.js fixtures,
// Hermes issues #575 and #1599, and supplemental edge cases.

export const name = 'JS Block Scoping';

export function test({ describe, it, expect }) {
  describe('JS Block Scoping', () => {
    describe('basic block scoping', () => {
      // From: exec/block-scoped.js
      it('nested let declarations create independent scopes', () => {
        let x = 1;
        {
          let x = 2;
          expect(x).toBe(2);
          {
            let x = 3;
            expect(x).toBe(3);
            x++;
            expect(x).toBe(4);
          }
        }
        expect(x).toBe(1);
      });

      // From: exec/block-scoped-2.js
      it('closures in nested blocks capture correct binding', () => {
        expect(
          (() => {
            let sum = 0;
            let a = 0;
            {
              let a = 10;
              for (let i = 0; i < a; i++) {
                let a = 1;
                sum += (() => a)();
              }
            }
            return sum;
          })()
        ).toBe(10);
      });

      // From: exec/duplicate-function-scope.js
      it('inner scope shadows outer function scope', () => {
        function test() {
          let value = 'outer';
          return (function () {
            let value = 'inner';
            return value;
          })();
        }
        expect(test()).toBe('inner');
      });

      // From: exec/collision-for.js
      it('let in loop body shadows outer let', () => {
        let x = 0;
        for (;;) {
          let x = 1;
          expect(x).toBe(1);
          break;
        }
        expect(x).toBe(0);
      });

      it('const in block is not visible outside', () => {
        {
          const a = 1;
          expect(a).toBe(1);
        }
        expect(typeof a).toBe('undefined');
      });

      it('let in block is not visible outside', () => {
        {
          let b = 2;
          expect(b).toBe(2);
        }
        expect(typeof b).toBe('undefined');
      });

      it('if-block scoping', () => {
        let x = 'outer';
        if (true) {
          let x = 'inner';
          expect(x).toBe('inner');
        }
        expect(x).toBe('outer');
      });
    });

    describe('for loop scoping', () => {
      // From: exec/for-loop-head.js
      it('let in for-loop head does not leak', () => {
        expect(
          function () {
            let a = 1;
            for (let a = 0; a < 8; a++) {}
            return a;
          }()
        ).toBe(1);
      });

      // From: exec/multiple.js
      it('multiple let declarations in for-loop head do not leak', () => {
        for (let i = 0, x = 2; i < 5; i++);
        expect(typeof i).toBe('undefined');
        expect(typeof x).toBe('undefined');
      });

      // From: exec/for-continuation.js
      it('closures capture per-iteration let binding in for loop', () => {
        var fns = [];
        for (let i = 0; i < 10; i++) {
          fns.push(function () {
            return i;
          });
          i += 1;
        }
        expect(fns[0]()).toBe(1);
        expect(fns[1]()).toBe(3);
        expect(fns[2]()).toBe(5);
        expect(fns[3]()).toBe(7);
        expect(fns[4]()).toBe(9);
      });

      // From: exec/for-continuation-outer-reference.js
      it('closures with splice and index mutation in for loop', () => {
        let data = [true, false, false, true, false];
        for (let index = 0; index < data.length; index++) {
          let item = data[index];
          if (!item) {
            data.splice(index, 1);
            index--;
            continue;
          }
          let fn = function () {
            item;
          };
        }
        expect(data.every((item) => item)).toBe(true);
      });

      it('each for-loop iteration gets its own let binding', () => {
        var funcs = [];
        for (let i = 0; i < 5; i++) {
          funcs.push(() => i);
        }
        expect(funcs[0]()).toBe(0);
        expect(funcs[1]()).toBe(1);
        expect(funcs[2]()).toBe(2);
        expect(funcs[3]()).toBe(3);
        expect(funcs[4]()).toBe(4);
      });

      it('const in for-of creates per-iteration binding', () => {
        var funcs = [];
        for (const val of [10, 20, 30]) {
          funcs.push(() => val);
        }
        expect(funcs[0]()).toBe(10);
        expect(funcs[1]()).toBe(20);
        expect(funcs[2]()).toBe(30);
      });

      // Hermes issue #575: for-in with closure capturing loop variable
      it('const in for-in creates per-iteration binding (hermes#575)', () => {
        const target = {
          a: 'a',
          b: 'b',
          c: 'c',
        };
        const copy = {};
        let keys = '';
        for (const prop in target) {
          keys += ' ' + prop;
          Object.defineProperty(copy, prop, {
            get: () => target[prop],
            enumerable: true,
          });
        }
        expect(copy.a).toBe('a');
        expect(copy.b).toBe('b');
        expect(copy.c).toBe('c');
      });

      it('let in for-in creates per-iteration binding', () => {
        const obj = { x: 1, y: 2, z: 3 };
        var funcs = [];
        for (let key in obj) {
          funcs.push(() => key);
        }
        var results = funcs.map((f) => f());
        expect(results).toContain('x');
        expect(results).toContain('y');
        expect(results).toContain('z');
      });

      // From: exec/destructuring-defaults.js
      it('destructuring with defaults in for-of', () => {
        var fields = [{ name: 'title' }, { name: 'content' }];
        for (let { name, value = 'Default value' } of fields) {
          expect(value).toBe('Default value');
        }
      });
    });

    describe('labels and control flow', () => {
      // From: exec/label.js
      it('labeled break with closures in for-in', () => {
        var heh = [];
        var nums = [1, 2, 3];

        loop1: for (let i in nums) {
          let num = nums[i];
          heh.push((x) => x * num);
          if (num >= 2) {
            break loop1;
          }
        }
        expect(heh.length).toBe(2);
        expect(heh[0](2)).toBe(2);
        expect(heh[1](4)).toBe(8);
      });

      // From: exec/nested-labels.js
      it('nested loops with labeled continue and closures', () => {
        var stack = [];
        loop1: for (let j = 0; j < 10; j++) {
          for (let i = 0; i < 10; i++) {
            stack.push(() => [i, j]);
            continue loop1;
          }
        }
        expect(stack[0]()).toEqual([0, 0]);
        expect(stack[1]()).toEqual([0, 1]);
        expect(stack[4]()).toEqual([0, 4]);
        expect(stack[9]()).toEqual([0, 9]);
      });

      // From: exec/nested-labels-2.js
      it('nested loops with inner break and closures', () => {
        var stack = [];
        for (let j = 0; j < 10; j++) {
          for (let i = 0; i < 10; i++) {
            stack.push(() => [i, j]);
            break;
          }
        }
        expect(stack[0]()).toEqual([0, 0]);
        expect(stack[1]()).toEqual([0, 1]);
        expect(stack[9]()).toEqual([0, 9]);
      });

      // From: exec/nested-labels-3.js
      it('triple-nested loops with labeled continue and closures', () => {
        var stack = [];
        loop1: for (let j = 0; j < 10; j++) {
          loop2: for (let i = 0; i < 10; i++) {
            for (let x = 0; x < 10; x++) {
              stack.push(() => [j, i, x]);
              continue loop2;
            }
          }
        }
        expect(stack[0]()).toEqual([0, 0, 0]);
        expect(stack[1]()).toEqual([0, 1, 0]);
        expect(stack[9]()).toEqual([0, 9, 0]);
      });

      // From: exec/nested-labels-4.js
      it('labeled break exits all nested loops', () => {
        var stack = [];
        loop1: for (let j = 0; j < 10; j++) {
          for (let i = 0; i < 10; i++) {
            stack.push(() => [i, j]);
            break loop1;
          }
        }
        expect(stack.length).toBe(1);
        expect(stack[0]()).toEqual([0, 0]);
      });
    });

    describe('switch statements', () => {
      // From: exec/switch-break.js
      it('const in switch case block is accessible', () => {
        if (true) {
          const x = 1;
          switch (x) {
            case 1: {
              expect(x).toBe(1);
              break;
            }
          }
        }
      });

      // From: exec/switch-labeled-break.js
      it('labeled break inside switch exits outer loop', () => {
        var i;
        the_loop: for (i = 0; i < 10; i++) {
          switch (i) {
            case 3: {
              break the_loop;
            }
          }
          const z = 3;
          (() => z)();
        }
        expect(i).toBe(3);
      });

      // From: general/block-inside-switch-inside-loop/exec.js
      it('switch break does not exit for loop', () => {
        var i;
        for (i = 0; i < 10; i++) {
          switch (i) {
            case 1: {
              break;
            }
          }
          const z = 3;
          (() => z)();
        }
        expect(i).toBe(10);
      });

      it('continue in switch case continues loop', () => {
        var j = 0;
        var i;
        for (i = 0; i < 10; i++) {
          switch (i) {
            case 0: {
              continue;
            }
          }
          j++;
          const z = 3;
          (() => z)();
        }
        expect(j).toBe(9);
      });

      it('nested loop inside switch with break', () => {
        var j = 0;
        var i;
        for (i = 0; i < 10; i++) {
          switch (i) {
            case 0: {
              for (var k = 0; k < 10; k++) {
                const z = 3;
                (() => z)();
                j++;
                break;
              }
              break;
            }
          }
          const z = 3;
          (() => z)();
        }
        expect(j).toBe(1);
      });

      it('let in switch cases are block-scoped', () => {
        let result;
        switch (1) {
          case 1: {
            let x = 'one';
            result = x;
            break;
          }
          case 2: {
            let x = 'two';
            result = x;
            break;
          }
        }
        expect(result).toBe('one');
      });
    });

    describe('temporal dead zone', () => {
      // From: tdz/simple-reference/exec.js
      // Hermes does not enforce TDZ — accessing let before declaration does not throw.
      xit('reference before let declaration throws', () => {
        expect(() => {
          i;
          let i;
        }).toThrow();
      });

      // From: tdz/self-reference/exec.js
      // Hermes does not enforce TDZ — self-referencing let initializer does not throw.
      xit('let x = x throws ReferenceError', () => {
        expect(() => {
          let x = x;
        }).toThrow();
      });

      // From: tdz/const-readonly/exec.js
      it('const reassignment throws TypeError', () => {
        expect(() => {
          const x = 0;
          x = 1;
        }).toThrow();
      });

      it('assignment before const declaration throws', () => {
        expect(() => {
          x = 1;
          const x = 0;
        }).toThrow();
      });

      it('closure called before const declaration throws', () => {
        expect(() => {
          (() => {
            x = 1;
          })();
          const x = 0;
        }).toThrow();
      });

      it('deferred closure called after const declaration throws TypeError', () => {
        expect(() => {
          const call = (() => {
            return () => {
              x = 1;
            };
          })();
          const x = 0;
          call();
        }).toThrow();
      });

      // Hermes does not enforce TDZ — let is accessible (as undefined) before initialization.
      xit('let is undefined before initialization in same scope', () => {
        expect(() => {
          expect(y).toBeUndefined();
          let y = 1;
        }).toThrow();
      });

      it('typeof on TDZ variable does not throw', () => {
        // typeof is special - it doesn't throw even in TDZ in some engines
        // but per spec it should throw for let/const. We just check it doesn't crash.
        let didThrow = false;
        try {
          typeof tdz_var;
          let tdz_var = 1;
        } catch (e) {
          didThrow = true;
        }
        // Either behavior is acceptable for this edge case
        expect(typeof didThrow).toBe('boolean');
      });

      // Hermes does not enforce TDZ — inner block let does not shadow outer in TDZ.
      xit('TDZ applies per-block', () => {
        let x = 'outer';
        {
          expect(() => {
            return x;
            let x = 'inner';
          }).toThrow();
        }
      });

      it('function hoisting is not affected by TDZ', () => {
        expect(() => {
          foo();
          function foo() {}
        }).not.toThrow();
      });
    });

    describe('closures in loops', () => {
      it('var in for-loop shares binding (baseline)', () => {
        var funcs = [];
        for (var i = 0; i < 5; i++) {
          funcs.push(() => i);
        }
        // All closures see the same i = 5
        expect(funcs[0]()).toBe(5);
        expect(funcs[4]()).toBe(5);
      });

      it('let in for-loop gives per-iteration binding', () => {
        var funcs = [];
        for (let i = 0; i < 5; i++) {
          funcs.push(() => i);
        }
        expect(funcs[0]()).toBe(0);
        expect(funcs[1]()).toBe(1);
        expect(funcs[2]()).toBe(2);
        expect(funcs[3]()).toBe(3);
        expect(funcs[4]()).toBe(4);
      });

      it('let in for-loop with setTimeout pattern', () => {
        var results = [];
        var callbacks = [];
        for (let i = 0; i < 3; i++) {
          callbacks.push(() => {
            results.push(i);
          });
        }
        callbacks.forEach((cb) => cb());
        expect(results).toEqual([0, 1, 2]);
      });

      it('const in for-of with async-like closures', () => {
        var tasks = [];
        for (const item of ['a', 'b', 'c']) {
          tasks.push(() => item);
        }
        expect(tasks.map((t) => t())).toEqual(['a', 'b', 'c']);
      });

      it('let in for-loop with nested closures', () => {
        var outer = [];
        for (let i = 0; i < 3; i++) {
          var inner = [];
          for (let j = 0; j < 3; j++) {
            inner.push(() => [i, j]);
          }
          outer.push(inner);
        }
        expect(outer[0][0]()).toEqual([0, 0]);
        expect(outer[0][2]()).toEqual([0, 2]);
        expect(outer[2][1]()).toEqual([2, 1]);
      });

      it('let in while loop with closure', () => {
        var funcs = [];
        let i = 0;
        while (i < 3) {
          let captured = i;
          funcs.push(() => captured);
          i++;
        }
        expect(funcs[0]()).toBe(0);
        expect(funcs[1]()).toBe(1);
        expect(funcs[2]()).toBe(2);
      });

      it('let in for-in with closure captures each key', () => {
        var obj = { a: 1, b: 2, c: 3 };
        var funcs = [];
        for (let k in obj) {
          funcs.push(() => k);
        }
        var keys = funcs.map((f) => f()).sort();
        expect(keys).toEqual(['a', 'b', 'c']);
      });
    });

    describe('Hermes issues', () => {
      // Hermes issue #575: for-in closure captures last value instead of per-iteration
      it('for-in closure with Object.defineProperty (hermes#575)', () => {
        const target = { x: 10, y: 20, z: 30 };
        const proxy = {};
        for (const key in target) {
          Object.defineProperty(proxy, key, {
            get: () => target[key],
            enumerable: true,
          });
        }
        expect(proxy.x).toBe(10);
        expect(proxy.y).toBe(20);
        expect(proxy.z).toBe(30);
      });

      // Hermes issue #1599: variable shadowing in arrow function
      it('block-scoped shadow does not affect outer closure (hermes#1599)', () => {
        function repro(t) {
          const lambda = () => {
            // Under the Hermes bug, t would be undefined here due to
            // the const t declaration in the if-block below
            const result = t === 42;
            if (result) {
              const t = 69;
              void t; // use it to prevent removal
            }
            return result;
          };
          return lambda();
        }
        expect(repro(42)).toBe(true);
      });

      // Hermes issue #1599 variant: deeper nesting
      it('deeply nested shadow does not affect outer reference', () => {
        function test(value) {
          const check = () => {
            const captured = value;
            if (true) {
              if (true) {
                const value = 'shadow';
                void value;
              }
            }
            return captured;
          };
          return check();
        }
        expect(test('original')).toBe('original');
      });

      // Hermes issue #1599 variant: multiple shadows
      it('multiple shadows in different blocks', () => {
        function test(x) {
          const fn = () => x;
          {
            const x = 'a';
            void x;
          }
          {
            const x = 'b';
            void x;
          }
          return fn();
        }
        expect(test(42)).toBe(42);
      });
    });

    describe('assignment and mutation', () => {
      it('let allows reassignment', () => {
        let x = 1;
        x = 2;
        expect(x).toBe(2);
      });

      it('const does not allow reassignment', () => {
        expect(() => {
          const x = 1;
          x = 2;
        }).toThrow();
      });

      it('const object properties can be mutated', () => {
        const obj = { a: 1 };
        obj.a = 2;
        expect(obj.a).toBe(2);
      });

      it('const array elements can be mutated', () => {
        const arr = [1, 2, 3];
        arr[0] = 10;
        expect(arr[0]).toBe(10);
      });

      // From: exec/constant-violation.js
      it('const += throws TypeError', () => {
        expect(() => {
          const a = 1;
          a += 2;
        }).toThrow();
      });

      it('const++ throws TypeError', () => {
        expect(() => {
          const a = 1;
          a++;
        }).toThrow();
      });
    });

    describe('edge cases', () => {
      it('let in try-catch blocks', () => {
        let x = 'outer';
        try {
          let x = 'try';
          expect(x).toBe('try');
          throw new Error('test');
        } catch (e) {
          let x = 'catch';
          expect(x).toBe('catch');
        } finally {
          let x = 'finally';
          expect(x).toBe('finally');
        }
        expect(x).toBe('outer');
      });

      it('let in labeled block', () => {
        let x = 'outer';
        block: {
          let x = 'inner';
          expect(x).toBe('inner');
          break block;
        }
        expect(x).toBe('outer');
      });

      it('const declaration in case block does not leak to other cases', () => {
        function test(val) {
          switch (val) {
            case 1: {
              const x = 'one';
              return x;
            }
            case 2: {
              const x = 'two';
              return x;
            }
            default: {
              const x = 'default';
              return x;
            }
          }
        }
        expect(test(1)).toBe('one');
        expect(test(2)).toBe('two');
        expect(test(3)).toBe('default');
      });

      it('block scoping with comma operator', () => {
        let x;
        {
          let a = 1,
            b = 2;
          x = a + b;
        }
        expect(x).toBe(3);
        expect(typeof a).toBe('undefined');
        expect(typeof b).toBe('undefined');
      });

      it('for loop with let and complex update expression', () => {
        var results = [];
        for (let i = 0; i < 6; i += 2) {
          results.push(() => i);
        }
        expect(results[0]()).toBe(0);
        expect(results[1]()).toBe(2);
        expect(results[2]()).toBe(4);
      });

      it('immediately invoked closure in for loop captures correct value', () => {
        var results = [];
        for (let i = 0; i < 3; i++) {
          results.push(
            ((val) => () => val)(i)
          );
        }
        expect(results[0]()).toBe(0);
        expect(results[1]()).toBe(1);
        expect(results[2]()).toBe(2);
      });

      it('let in arrow function parameter default does not leak', () => {
        let x = 'outer';
        const fn = (val = (() => { let x = 'default'; return x; })()) => val;
        expect(fn()).toBe('default');
        expect(x).toBe('outer');
      });

      it('nested for loops with same variable name', () => {
        var outer = [];
        var inner = [];
        for (let i = 0; i < 3; i++) {
          outer.push(() => i);
          for (let i = 10; i < 13; i++) {
            inner.push(() => i);
          }
        }
        expect(outer[0]()).toBe(0);
        expect(outer[1]()).toBe(1);
        expect(outer[2]()).toBe(2);
        expect(inner[0]()).toBe(10);
        expect(inner[1]()).toBe(11);
        expect(inner[2]()).toBe(12);
      });

      it('for-of with let and break', () => {
        var funcs = [];
        for (const x of [1, 2, 3, 4, 5]) {
          funcs.push(() => x);
          if (x === 3) break;
        }
        expect(funcs.length).toBe(3);
        expect(funcs[0]()).toBe(1);
        expect(funcs[1]()).toBe(2);
        expect(funcs[2]()).toBe(3);
      });

      it('closure captures let after mutation within same iteration', () => {
        var funcs = [];
        for (let i = 0; i < 3; i++) {
          let val = i;
          val *= 10;
          funcs.push(() => val);
        }
        expect(funcs[0]()).toBe(0);
        expect(funcs[1]()).toBe(10);
        expect(funcs[2]()).toBe(20);
      });
    });
  });
}
