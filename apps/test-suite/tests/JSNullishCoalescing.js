/* eslint-disable */
'use strict';

// Comprehensive runtime compliance tests for the nullish coalescing operator (??).
// Validates that ?? works correctly at runtime in the Hermes engine.
//
// @babel/plugin-transform-nullish-coalescing-operator rewrites `a ?? b` to:
//   Spec mode:  (_a = a) !== null && _a !== void 0 ? _a : b
//   Loose mode: (_a = a) != null ? _a : b
//
// The key semantics: ?? only falls through on null/undefined, NOT on other
// falsy values (0, "", false, NaN). This is the critical difference from ||.
//
// Cases sourced from @babel/plugin-transform-nullish-coalescing-operator
// and supplemented with edge cases.

export const name = 'JS Nullish Coalescing';

export function test({ describe, it, xit, expect }) {
  describe('JS Nullish Coalescing', () => {
    describe('basic semantics', () => {
      it('returns left side when not null or undefined', () => {
        expect('hello' ?? 'default').toBe('hello');
        expect(42 ?? 0).toBe(42);
        expect(true ?? false).toBe(true);
      });

      it('returns right side when left is null', () => {
        expect(null ?? 'default').toBe('default');
      });

      it('returns right side when left is undefined', () => {
        expect(undefined ?? 'default').toBe('default');
      });

      it('returns right side when left is void 0', () => {
        expect(void 0 ?? 'default').toBe('default');
      });

      it('preserves falsy non-nullish values', () => {
        expect(0 ?? 'default').toBe(0);
        expect('' ?? 'default').toBe('');
        expect(false ?? 'default').toBe(false);
        expect(NaN ?? 'default').not.toBe('default');
      });

      it('returns -0 without falling through', () => {
        const result = -0 ?? 'default';
        expect(result).toBe(-0);
        expect(1 / result).toBe(-Infinity);
      });
    });

    describe('difference from || operator', () => {
      it('?? keeps 0, || does not', () => {
        expect(0 ?? 'fallback').toBe(0);
        expect(0 || 'fallback').toBe('fallback');
      });

      it('?? keeps empty string, || does not', () => {
        expect('' ?? 'fallback').toBe('');
        expect('' || 'fallback').toBe('fallback');
      });

      it('?? keeps false, || does not', () => {
        expect(false ?? 'fallback').toBe(false);
        expect(false || 'fallback').toBe('fallback');
      });

      it('?? keeps NaN, || does not', () => {
        const qqResult = NaN ?? 'fallback';
        const orResult = NaN || 'fallback';
        expect(typeof qqResult).toBe('number');
        expect(orResult).toBe('fallback');
      });

      it('both fall through on null', () => {
        expect(null ?? 'fallback').toBe('fallback');
        expect(null || 'fallback').toBe('fallback');
      });

      it('both fall through on undefined', () => {
        expect(undefined ?? 'fallback').toBe('fallback');
        expect(undefined || 'fallback').toBe('fallback');
      });
    });

    describe('chaining', () => {
      it('multiple ?? operators', () => {
        expect(null ?? undefined ?? 'found').toBe('found');
      });

      it('first non-nullish wins in chain', () => {
        expect(null ?? 0 ?? 'fallback').toBe(0);
      });

      it('all null/undefined falls through to last', () => {
        expect(null ?? undefined ?? null ?? 'end').toBe('end');
      });

      it('first value returned if not nullish', () => {
        expect('first' ?? 'second' ?? 'third').toBe('first');
      });

      it('chain with false', () => {
        expect(null ?? false ?? 'fallback').toBe(false);
      });
    });

    describe('with member expressions', () => {
      it('property access on object', () => {
        const obj = { foo: 'bar' };
        expect(obj.foo ?? 'default').toBe('bar');
      });

      it('missing property returns default', () => {
        const obj = {};
        expect(obj.foo ?? 'default').toBe('default');
      });

      it('null property value returns default', () => {
        const obj = { foo: null };
        expect(obj.foo ?? 'default').toBe('default');
      });

      it('falsy property value is preserved', () => {
        const obj = { count: 0, name: '', active: false };
        expect(obj.count ?? 99).toBe(0);
        expect(obj.name ?? 'anonymous').toBe('');
        expect(obj.active ?? true).toBe(false);
      });

      it('nested property access', () => {
        const obj = { a: { b: { c: null } } };
        expect(obj.a.b.c ?? 'default').toBe('default');
      });

      it('computed property access', () => {
        const obj = { key: 'value' };
        const key = 'key';
        expect(obj[key] ?? 'default').toBe('value');
        expect(obj['missing'] ?? 'default').toBe('default');
      });

      it('array element access', () => {
        const arr = [1, null, undefined, 0];
        expect(arr[0] ?? 'default').toBe(1);
        expect(arr[1] ?? 'default').toBe('default');
        expect(arr[2] ?? 'default').toBe('default');
        expect(arr[3] ?? 'default').toBe(0);
        expect(arr[99] ?? 'default').toBe('default');
      });
    });

    describe('with function calls', () => {
      it('function returning null', () => {
        const fn = () => null;
        expect(fn() ?? 'default').toBe('default');
      });

      it('function returning undefined', () => {
        const fn = () => undefined;
        expect(fn() ?? 'default').toBe('default');
      });

      it('function returning value', () => {
        const fn = () => 42;
        expect(fn() ?? 'default').toBe(42);
      });

      it('function returning falsy non-nullish', () => {
        expect((() => 0)() ?? 'default').toBe(0);
        expect((() => '')() ?? 'default').toBe('');
        expect((() => false)() ?? 'default').toBe(false);
      });

      it('left side evaluated only once', () => {
        let count = 0;
        const fn = () => { count++; return null; };
        fn() ?? 'default';
        expect(count).toBe(1);
      });

      it('right side not evaluated when left is non-nullish', () => {
        let evaluated = false;
        const right = () => { evaluated = true; return 'right'; };
        'left' ?? right();
        expect(evaluated).toBe(false);
      });

      it('right side evaluated when left is nullish', () => {
        let evaluated = false;
        const right = () => { evaluated = true; return 'right'; };
        const result = null ?? right();
        expect(evaluated).toBe(true);
        expect(result).toBe('right');
      });
    });

    describe('short-circuit evaluation', () => {
      it('does not evaluate right side when left is 0', () => {
        let sideEffect = false;
        const result = 0 ?? (sideEffect = true, 'fallback');
        expect(result).toBe(0);
        expect(sideEffect).toBe(false);
      });

      it('does not evaluate right side when left is empty string', () => {
        let sideEffect = false;
        const result = '' ?? (sideEffect = true, 'fallback');
        expect(result).toBe('');
        expect(sideEffect).toBe(false);
      });

      it('does not evaluate right side when left is false', () => {
        let sideEffect = false;
        const result = false ?? (sideEffect = true, 'fallback');
        expect(result).toBe(false);
        expect(sideEffect).toBe(false);
      });

      it('evaluates right side when left is null', () => {
        let sideEffect = false;
        const result = null ?? (sideEffect = true, 'fallback');
        expect(result).toBe('fallback');
        expect(sideEffect).toBe(true);
      });

      it('evaluates right side when left is undefined', () => {
        let sideEffect = false;
        const result = undefined ?? (sideEffect = true, 'fallback');
        expect(result).toBe('fallback');
        expect(sideEffect).toBe(true);
      });

      it('complex left side evaluated once with side effects', () => {
        const calls = [];
        const obj = {
          get prop() {
            calls.push('get');
            return null;
          },
        };
        obj.prop ?? 'default';
        expect(calls.length).toBe(1);
      });
    });

    describe('with assignment', () => {
      it('assign result to variable', () => {
        const x = null ?? 42;
        expect(x).toBe(42);
      });

      it('assign with non-nullish left', () => {
        const x = 0 ?? 42;
        expect(x).toBe(0);
      });

      it('nullish coalescing assignment (??=)', () => {
        let a = null;
        a ??= 'default';
        expect(a).toBe('default');
      });

      it('??= does not assign when non-nullish', () => {
        let a = 0;
        a ??= 99;
        expect(a).toBe(0);
      });

      it('??= with undefined', () => {
        let a = undefined;
        a ??= 'filled';
        expect(a).toBe('filled');
      });

      it('??= with false', () => {
        let a = false;
        a ??= true;
        expect(a).toBe(false);
      });

      it('??= with empty string', () => {
        let a = '';
        a ??= 'nonempty';
        expect(a).toBe('');
      });

      it('??= on object property', () => {
        const obj = { a: null, b: 0 };
        obj.a ??= 'filled';
        obj.b ??= 99;
        expect(obj.a).toBe('filled');
        expect(obj.b).toBe(0);
      });
    });

    describe('with various types', () => {
      it('object value preserved', () => {
        const obj = { key: 'value' };
        expect((obj ?? {}).key).toBe('value');
      });

      it('null falls through to object default', () => {
        const result = null ?? { key: 'default' };
        expect(result.key).toBe('default');
      });

      it('array value preserved', () => {
        const arr = [1, 2, 3];
        const result = arr ?? [];
        expect(result.length).toBe(3);
      });

      it('function value preserved', () => {
        const fn = () => 42;
        const result = fn ?? (() => 0);
        expect(result()).toBe(42);
      });

      it('symbol value preserved', () => {
        const sym = Symbol('test');
        expect((sym ?? 'fallback')).toBe(sym);
      });

      it('bigint value preserved', () => {
        const big = BigInt(0);
        expect((big ?? 'fallback')).toBe(big);
      });

      it('regex value preserved', () => {
        const re = /test/;
        expect((re ?? 'fallback')).toBe(re);
      });

      it('Date value preserved', () => {
        const date = new Date(0);
        expect((date ?? 'fallback')).toBe(date);
      });
    });

    describe('with optional chaining', () => {
      it('?. producing undefined triggers ??', () => {
        const obj = {};
        expect(obj.foo?.bar ?? 'default').toBe('default');
      });

      it('?. on null triggers ??', () => {
        const obj = { foo: null };
        expect(obj.foo?.bar ?? 'default').toBe('default');
      });

      it('?. producing value does not trigger ??', () => {
        const obj = { foo: { bar: 'value' } };
        expect(obj.foo?.bar ?? 'default').toBe('value');
      });

      it('?. producing 0 does not trigger ??', () => {
        const obj = { foo: { bar: 0 } };
        expect(obj.foo?.bar ?? 99).toBe(0);
      });

      it('deep optional chain with ??', () => {
        const obj = { a: { b: { c: { d: null } } } };
        expect(obj.a?.b?.c?.d ?? 'default').toBe('default');
        expect(obj.a?.b?.c?.e ?? 'default').toBe('default');
        expect(obj.x?.y?.z ?? 'default').toBe('default');
      });

      it('optional method call with ??', () => {
        const obj = { fn: () => null };
        expect(obj.fn?.() ?? 'default').toBe('default');
        expect(obj.missing?.() ?? 'default').toBe('default');
      });
    });

    describe('in function parameters', () => {
      it('default parameter with ??', () => {
        function greet(name) {
          const displayName = name ?? 'stranger';
          return 'Hello, ' + displayName;
        }
        expect(greet('Alice')).toBe('Hello, Alice');
        expect(greet(null)).toBe('Hello, stranger');
        expect(greet(undefined)).toBe('Hello, stranger');
        expect(greet('')).toBe('Hello, ');
      });

      it('multiple parameters with ??', () => {
        function config(host, port, secure) {
          return {
            host: host ?? 'localhost',
            port: port ?? 3000,
            secure: secure ?? false,
          };
        }
        const c = config(null, 0, undefined);
        expect(c.host).toBe('localhost');
        expect(c.port).toBe(0);
        expect(c.secure).toBe(false);
      });

      it('arrow function with ??', () => {
        const getVal = (x) => x ?? 'default';
        expect(getVal(null)).toBe('default');
        expect(getVal(0)).toBe(0);
      });
    });

    describe('in expressions', () => {
      it('ternary on left side', () => {
        const x = true ? null : 'value';
        expect(x ?? 'default').toBe('default');
      });

      it('arithmetic on right side', () => {
        const x = null ?? 2 + 3;
        expect(x).toBe(5);
      });

      it('template literal on right side', () => {
        const name = null ?? `world`;
        expect(name).toBe('world');
      });

      it('nested ?? in right side', () => {
        const a = null;
        const b = undefined;
        const c = 'found';
        expect(a ?? (b ?? c)).toBe('found');
      });

      it('in return statement', () => {
        function getValue(obj) {
          return obj.value ?? 'empty';
        }
        expect(getValue({ value: null })).toBe('empty');
        expect(getValue({ value: 0 })).toBe(0);
      });

      it('in throw expression right side', () => {
        const val = null;
        try {
          const result = val ?? (() => { throw new Error('nullish'); })();
          // Should have thrown
          expect(true).toBe(false);
        } catch (e) {
          expect(e.message).toBe('nullish');
        }
      });
    });

    describe('in destructuring', () => {
      it('with destructured property', () => {
        const { a } = { a: null };
        expect(a ?? 'default').toBe('default');
      });

      it('with default destructuring vs ??', () => {
        // Default destructuring only triggers on undefined, not null
        const { a = 'destructure-default' } = { a: null };
        // a is null because destructuring default only applies on undefined
        expect(a).toBe(null);
        expect(a ?? 'nullish-default').toBe('nullish-default');
      });

      it('with array destructuring', () => {
        const [a, b] = [null, undefined];
        expect(a ?? 'first').toBe('first');
        expect(b ?? 'second').toBe('second');
      });
    });

    describe('in loops and conditionals', () => {
      it('in if condition', () => {
        const x = null;
        const val = x ?? 0;
        if (val === 0) {
          expect(true).toBe(true);
        } else {
          expect(true).toBe(false);
        }
      });

      it('in for loop initializer', () => {
        const values = [];
        for (let i = null ?? 0; i < 3; i++) {
          values.push(i);
        }
        expect(values).toEqual([0, 1, 2]);
      });

      it('in while condition', () => {
        let arr = [1, 2, null, 3];
        let results = [];
        let idx = 0;
        while (idx < arr.length) {
          results.push(arr[idx] ?? 'nil');
          idx++;
        }
        expect(results).toEqual([1, 2, 'nil', 3]);
      });
    });

    describe('class contexts', () => {
      it('in class method', () => {
        class Config {
          constructor(value) {
            this.value = value ?? 'default';
          }
          getValue() {
            return this.value ?? 'none';
          }
        }
        expect(new Config(null).value).toBe('default');
        expect(new Config(0).value).toBe(0);
        expect(new Config(null).getValue()).toBe('default');
      });

      it('in static method', () => {
        class Utils {
          static getDefault(val) {
            return val ?? 'default';
          }
        }
        expect(Utils.getDefault(null)).toBe('default');
        expect(Utils.getDefault('')).toBe('');
      });

      it('in getter', () => {
        class Box {
          #value;
          constructor(v) { this.#value = v; }
          get content() { return this.#value ?? 'empty'; }
        }
        expect(new Box(null).content).toBe('empty');
        expect(new Box(0).content).toBe(0);
        expect(new Box(false).content).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('both sides are null', () => {
        expect(null ?? null).toBe(null);
      });

      it('both sides are undefined', () => {
        expect(undefined ?? undefined).toBe(undefined);
      });

      it('right side is null', () => {
        expect(undefined ?? null).toBe(null);
      });

      it('left side is an expression returning null', () => {
        expect((1 > 2 ? 'yes' : null) ?? 'default').toBe('default');
      });

      it('works with comma operator', () => {
        let x;
        const result = (x = null, x) ?? 'default';
        expect(result).toBe('default');
      });

      it('typeof does not throw for undeclared variable in right side', () => {
        const result = 'value' ?? undeclaredVar;
        expect(result).toBe('value');
      });

      it('deeply nested nullish coalescing', () => {
        const a = null ?? (null ?? (null ?? (null ?? 'deep')));
        expect(a).toBe('deep');
      });

      it('with Map.get()', () => {
        const map = new Map();
        map.set('key', 0);
        expect(map.get('key') ?? 'default').toBe(0);
        expect(map.get('missing') ?? 'default').toBe('default');
      });

      it('with WeakRef deref', () => {
        let obj = { name: 'test' };
        const ref = new WeakRef(obj);
        expect(ref.deref() ?? 'collected').toBe(obj);
      });

      it('preserves object identity', () => {
        const obj = {};
        const result = obj ?? {};
        expect(result).toBe(obj);
      });
    });

    describe('practical patterns', () => {
      it('config merging with ??', () => {
        const defaults = { host: 'localhost', port: 3000, debug: false };
        const userConfig = { host: null, port: 8080, debug: undefined };
        const config = {
          host: userConfig.host ?? defaults.host,
          port: userConfig.port ?? defaults.port,
          debug: userConfig.debug ?? defaults.debug,
        };
        expect(config.host).toBe('localhost');
        expect(config.port).toBe(8080);
        expect(config.debug).toBe(false);
      });

      it('safe access with fallback', () => {
        const response = { data: { users: null } };
        const users = response.data?.users ?? [];
        expect(users).toEqual([]);
      });

      it('counting with zero preservation', () => {
        function getCount(obj) {
          return obj.count ?? -1;
        }
        expect(getCount({ count: 0 })).toBe(0);
        expect(getCount({ count: 10 })).toBe(10);
        expect(getCount({})).toBe(-1);
      });

      it('DOM-style attribute defaults', () => {
        const attrs = { tabIndex: 0, disabled: false, id: '' };
        expect(attrs.tabIndex ?? -1).toBe(0);
        expect(attrs.disabled ?? false).toBe(false);
        expect(attrs.id ?? 'auto').toBe('');
        expect(attrs.className ?? 'default').toBe('default');
      });

      it('nested defaults', () => {
        function getTheme(prefs) {
          return {
            color: prefs?.theme?.color ?? prefs?.color ?? 'blue',
            size: prefs?.theme?.size ?? 16,
          };
        }
        expect(getTheme(null).color).toBe('blue');
        expect(getTheme({ color: 'red' }).color).toBe('red');
        expect(getTheme({ theme: { color: 'green' } }).color).toBe('green');
        expect(getTheme({}).size).toBe(16);
      });

      it('error message fallback', () => {
        function getErrorMessage(error) {
          return error?.message ?? error?.code ?? 'Unknown error';
        }
        expect(getErrorMessage({ message: 'Not found' })).toBe('Not found');
        expect(getErrorMessage({ code: 404 })).toBe(404);
        expect(getErrorMessage({})).toBe('Unknown error');
        expect(getErrorMessage(null)).toBe('Unknown error');
      });
    });
  });
}
