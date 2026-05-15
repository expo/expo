/* eslint-disable */
'use strict';

// Comprehensive runtime compliance tests for optional chaining (?.).
// Validates that ?. works correctly at runtime in the Hermes engine.
//
// @babel/plugin-transform-optional-chaining rewrites:
//   a?.b       → a === null || a === void 0 ? undefined : a.b
//   a?.[b]     → a === null || a === void 0 ? undefined : a[b]
//   a?.()      → a === null || a === void 0 ? undefined : a()
//   a?.b()     → a === null || a === void 0 ? undefined : a.b.call(a)
//   delete a?.b → a === null || a === void 0 ? true : delete a.b
//
// In loose mode (used by Expo): uses a == null instead of strict checks.
//
// Cases sourced from @babel/plugin-transform-optional-chaining
// and supplemented with edge cases.

export const name = 'JS Optional Chaining';

export function test({ describe, it, xit, expect }) {
  describe('JS Optional Chaining', () => {
    describe('member access (?.)', () => {
      it('accesses property on object', () => {
        const obj = { a: 1 };
        expect(obj?.a).toBe(1);
      });

      it('returns undefined for null base', () => {
        const obj = null;
        expect(obj?.a).toBe(undefined);
      });

      it('returns undefined for undefined base', () => {
        const obj = undefined;
        expect(obj?.a).toBe(undefined);
      });

      it('accesses nested property', () => {
        const obj = { a: { b: { c: 42 } } };
        expect(obj?.a?.b?.c).toBe(42);
      });

      it('short-circuits at first null', () => {
        const obj = { a: null };
        expect(obj?.a?.b?.c).toBe(undefined);
      });

      it('short-circuits at first undefined property', () => {
        const obj = { a: {} };
        expect(obj?.a?.b?.c).toBe(undefined);
      });

      it('property exists but is falsy', () => {
        const obj = { val: 0 };
        expect(obj?.val).toBe(0);
      });

      it('preserves all falsy non-nullish values', () => {
        expect(({ v: 0 })?.v).toBe(0);
        expect(({ v: '' })?.v).toBe('');
        expect(({ v: false })?.v).toBe(false);
        expect(({ v: NaN })?.v).not.toBe(NaN); // NaN !== NaN
        expect(typeof ({ v: NaN })?.v).toBe('number');
      });

      it('works on non-plain objects', () => {
        expect('hello'?.length).toBe(5);
        expect([1, 2, 3]?.length).toBe(3);
        expect((42)?.toFixed(2)).toBe('42.00');
      });
    });

    describe('computed member access (?.[])', () => {
      it('accesses computed property', () => {
        const obj = { foo: 'bar' };
        const key = 'foo';
        expect(obj?.[key]).toBe('bar');
      });

      it('returns undefined for null base', () => {
        const obj = null;
        expect(obj?.['foo']).toBe(undefined);
      });

      it('returns undefined for undefined base', () => {
        const obj = undefined;
        expect(obj?.['foo']).toBe(undefined);
      });

      it('accesses array element', () => {
        const arr = [10, 20, 30];
        expect(arr?.[1]).toBe(20);
      });

      it('returns undefined for null array', () => {
        const arr = null;
        expect(arr?.[0]).toBe(undefined);
      });

      it('accesses with symbol key', () => {
        const sym = Symbol('key');
        const obj = { [sym]: 'value' };
        expect(obj?.[sym]).toBe('value');
      });

      it('computed key expression is not evaluated when base is nullish', () => {
        let evaluated = false;
        const key = () => { evaluated = true; return 'foo'; };
        const obj = null;
        obj?.[key()];
        expect(evaluated).toBe(false);
      });

      it('computed key expression evaluated once when base is non-nullish', () => {
        let count = 0;
        const key = () => { count++; return 'foo'; };
        const obj = { foo: 'bar' };
        expect(obj?.[key()]).toBe('bar');
        expect(count).toBe(1);
      });
    });

    describe('optional call (?.())', () => {
      it('calls function', () => {
        const fn = () => 42;
        expect(fn?.()).toBe(42);
      });

      it('returns undefined for null function', () => {
        const fn = null;
        expect(fn?.()).toBe(undefined);
      });

      it('returns undefined for undefined function', () => {
        const fn = undefined;
        expect(fn?.()).toBe(undefined);
      });

      it('passes arguments', () => {
        const fn = (a, b) => a + b;
        expect(fn?.(2, 3)).toBe(5);
      });

      it('arguments not evaluated when function is nullish', () => {
        let evaluated = false;
        const fn = null;
        fn?.((evaluated = true));
        expect(evaluated).toBe(false);
      });

      it('works with function stored in variable', () => {
        const obj = { fn: (x) => x * 2 };
        expect(obj.fn?.(5)).toBe(10);
      });

      it('returns undefined for missing method', () => {
        const obj = {};
        expect(obj.fn?.()).toBe(undefined);
      });
    });

    describe('method calls (?.method())', () => {
      it('calls method on object', () => {
        const obj = {
          greet() { return 'hello'; },
        };
        expect(obj?.greet()).toBe('hello');
      });

      it('preserves this context', () => {
        const obj = {
          name: 'test',
          getName() { return this.name; },
        };
        expect(obj?.getName()).toBe('test');
      });

      it('returns undefined when object is null', () => {
        const obj = null;
        expect(obj?.greet()).toBe(undefined);
      });

      it('returns undefined when method is undefined', () => {
        const obj = {};
        expect(obj?.greet?.()).toBe(undefined);
      });

      it('chained method calls', () => {
        const obj = {
          inner: {
            getValue() { return 42; },
          },
        };
        expect(obj?.inner?.getValue()).toBe(42);
      });

      it('method on prototype chain', () => {
        class Base {
          hello() { return 'base'; }
        }
        class Child extends Base {}
        const c = new Child();
        expect(c?.hello()).toBe('base');
      });

      it('this context preserved in nested access', () => {
        const obj = {
          x: 10,
          inner: {
            x: 20,
            getX() { return this.x; },
          },
        };
        expect(obj?.inner?.getX()).toBe(20);
      });
    });

    describe('short-circuit evaluation', () => {
      it('does not access further properties after null', () => {
        let accessed = false;
        const handler = {
          get() { accessed = true; return {}; },
        };
        const obj = null;
        obj?.foo;
        expect(accessed).toBe(false);
      });

      it('does not call methods after null', () => {
        let called = false;
        const obj = null;
        obj?.method?.((called = true));
        expect(called).toBe(false);
      });

      it('entire chain short-circuits', () => {
        let sideEffect = false;
        const obj = null;
        obj?.a.b.c.d.e?.f?.(() => { sideEffect = true; });
        expect(sideEffect).toBe(false);
      });

      it('short-circuits computed access after null', () => {
        let keyEvaluated = false;
        const obj = null;
        obj?.[(() => { keyEvaluated = true; return 'key'; })()];
        expect(keyEvaluated).toBe(false);
      });

      it('side effects in base are evaluated once', () => {
        let count = 0;
        const getObj = () => { count++; return { a: 1 }; };
        expect(getObj()?.a).toBe(1);
        expect(count).toBe(1);
      });

      it('non-optional part after ?. still evaluates if base is present', () => {
        let count = 0;
        const obj = { get a() { count++; return { b: 42 }; } };
        expect(obj?.a.b).toBe(42);
        expect(count).toBe(1);
      });
    });

    describe('delete with optional chaining', () => {
      it('deletes existing property', () => {
        const obj = { a: 1 };
        expect(delete obj?.a).toBe(true);
        expect(obj.a).toBe(undefined);
      });

      // TODO(@kitten): Hermes returns undefined for `delete nullObj?.prop` instead
      // of the spec-mandated true. The spec says the optional chain short-circuits
      // to undefined (not a Reference), and delete on a non-Reference returns true.
      // Babel's spec-mode transform handles this correctly (`? true : delete obj.a`),
      // but Hermes' native implementation does not.
      xit('returns true for null base', () => {
        const obj = null;
        expect(delete obj?.a).toBe(true);
      });

      // TODO(@kitten): Same Hermes delete-on-nullish limitation as above.
      xit('returns true for undefined base', () => {
        const obj = undefined;
        expect(delete obj?.a).toBe(true);
      });

      it('deletes nested property', () => {
        const obj = { a: { b: 1 } };
        expect(delete obj?.a?.b).toBe(true);
        expect(obj.a.b).toBe(undefined);
      });

      // TODO(@kitten): Same Hermes delete-on-nullish limitation as above.
      xit('returns true for null in nested delete', () => {
        const obj = { a: null };
        expect(delete obj?.a?.b).toBe(true);
      });

      it('deletes computed property', () => {
        const obj = { foo: 'bar' };
        const key = 'foo';
        expect(delete obj?.[key]).toBe(true);
        expect(obj.foo).toBe(undefined);
      });
    });

    describe('in boolean context', () => {
      it('if statement with optional chaining', () => {
        const obj = null;
        let branch = 'none';
        if (obj?.truthy) {
          branch = 'if';
        } else {
          branch = 'else';
        }
        expect(branch).toBe('else');
      });

      it('if with non-null object and truthy value', () => {
        const obj = { flag: true };
        let branch = 'none';
        if (obj?.flag) {
          branch = 'if';
        }
        expect(branch).toBe('if');
      });

      it('if with non-null object and falsy value', () => {
        const obj = { flag: 0 };
        let branch = 'none';
        if (obj?.flag) {
          branch = 'if';
        } else {
          branch = 'else';
        }
        expect(branch).toBe('else');
      });

      it('logical NOT with optional chaining', () => {
        const obj = null;
        expect(!obj?.foo).toBe(true);
      });

      it('logical NOT with existing value', () => {
        const obj = { foo: 'bar' };
        expect(!obj?.foo).toBe(false);
      });

      it('double NOT coerces to boolean', () => {
        expect(!!null?.foo).toBe(false);
        expect(!!({ foo: 1 })?.foo).toBe(true);
        expect(!!({ foo: 0 })?.foo).toBe(false);
      });

      it('ternary with optional chaining', () => {
        const obj = null;
        expect(obj?.val ? 'yes' : 'no').toBe('no');
      });

      it('while loop with optional chaining', () => {
        const items = [{ next: { next: { next: null } } }];
        let node = items[0];
        let count = 0;
        while (node?.next) {
          node = node.next;
          count++;
        }
        expect(count).toBe(2);
      });
    });

    describe('with logical operators', () => {
      it('?. with && operator', () => {
        const obj = null;
        expect(obj?.a && 'yes').toBe(undefined);
      });

      it('?. with || operator', () => {
        const obj = null;
        expect(obj?.a || 'fallback').toBe('fallback');
      });

      it('?. with ?? operator', () => {
        const obj = null;
        expect(obj?.a ?? 'fallback').toBe('fallback');
      });

      it('?. returning falsy with ??', () => {
        const obj = { a: 0 };
        expect(obj?.a ?? 'fallback').toBe(0);
      });

      it('?. returning falsy with ||', () => {
        const obj = { a: 0 };
        expect(obj?.a || 'fallback').toBe('fallback');
      });

      it('chained logical with multiple ?.', () => {
        const a = { x: 1 };
        const b = null;
        expect(a?.x && b?.y).toBe(undefined);
      });
    });

    describe('mixed chains', () => {
      it('optional then regular access', () => {
        const obj = { a: { b: 42 } };
        expect(obj?.a.b).toBe(42);
      });

      it('optional then regular access on null short-circuits all', () => {
        const obj = null;
        // The entire chain short-circuits — .b is not attempted
        expect(obj?.a.b).toBe(undefined);
      });

      it('regular then optional access', () => {
        const obj = { a: null };
        expect(obj.a?.b).toBe(undefined);
      });

      it('mixed optional and regular deep chain', () => {
        const obj = { a: { b: { c: { d: 'deep' } } } };
        expect(obj?.a.b?.c.d).toBe('deep');
      });

      it('optional member then optional call', () => {
        const obj = { fn: () => 42 };
        expect(obj?.fn?.()).toBe(42);
      });

      it('optional member with missing function', () => {
        const obj = {};
        expect(obj?.fn?.()).toBe(undefined);
      });

      it('optional computed then optional member', () => {
        const obj = { items: [{ name: 'first' }] };
        expect(obj?.items?.[0]?.name).toBe('first');
        expect(obj?.items?.[99]?.name).toBe(undefined);
      });
    });

    describe('with classes', () => {
      it('optional access on class instance', () => {
        class User {
          constructor(name) { this.name = name; }
          greet() { return 'Hi, ' + this.name; }
        }
        const user = new User('Alice');
        expect(user?.name).toBe('Alice');
        expect(user?.greet()).toBe('Hi, Alice');
      });

      it('optional access on null instance', () => {
        const user = null;
        expect(user?.name).toBe(undefined);
        expect(user?.greet?.()).toBe(undefined);
      });

      it('optional access on inherited method', () => {
        class Animal {
          speak() { return 'generic'; }
        }
        class Dog extends Animal {
          speak() { return 'woof'; }
        }
        const d = new Dog();
        expect(d?.speak()).toBe('woof');
        const n = null;
        expect(n?.speak?.()).toBe(undefined);
      });

      it('optional access on static method', () => {
        class Utils {
          static parse(s) { return parseInt(s, 10); }
        }
        expect(Utils?.parse('42')).toBe(42);
        const Cls = null;
        expect(Cls?.parse?.('42')).toBe(undefined);
      });

      it('optional access on getter', () => {
        class Box {
          #val;
          constructor(v) { this.#val = v; }
          get value() { return this.#val; }
        }
        const box = new Box(42);
        expect(box?.value).toBe(42);
        const empty = null;
        expect(empty?.value).toBe(undefined);
      });
    });

    describe('with various types as base', () => {
      it('number base', () => {
        const n = 42;
        expect(n?.toFixed(2)).toBe('42.00');
        expect(n?.toString()).toBe('42');
      });

      it('string base', () => {
        const s = 'hello';
        expect(s?.length).toBe(5);
        expect(s?.toUpperCase()).toBe('HELLO');
        expect(s?.[0]).toBe('h');
      });

      it('boolean base', () => {
        const b = true;
        expect(b?.toString()).toBe('true');
      });

      it('symbol base', () => {
        const s = Symbol('test');
        expect(s?.toString()).toBe('Symbol(test)');
        expect(s?.description).toBe('test');
      });

      it('bigint base', () => {
        const b = BigInt(42);
        expect(b?.toString()).toBe('42');
      });

      it('array base', () => {
        const arr = [1, 2, 3];
        expect(arr?.length).toBe(3);
        expect(arr?.map(x => x * 2)).toEqual([2, 4, 6]);
        expect(arr?.[2]).toBe(3);
      });

      it('function base', () => {
        const fn = (x) => x * 2;
        expect(fn?.name).toBe('fn');
        expect(fn?.length).toBe(1);
        expect(fn?.(5)).toBe(10);
      });

      it('regex base', () => {
        const re = /test/i;
        expect(re?.test('TEST')).toBe(true);
        expect(re?.flags).toBe('i');
      });
    });

    describe('with destructuring', () => {
      it('result of optional chain in destructuring default', () => {
        const obj = null;
        const { a = obj?.b ?? 'default' } = {};
        expect(a).toBe('default');
      });

      it('optional chain inside destructured value', () => {
        const data = { user: { address: { city: 'NYC' } } };
        const city = data?.user?.address?.city;
        expect(city).toBe('NYC');
      });

      it('optional chain result destructured', () => {
        const obj = { coords: { x: 10, y: 20 } };
        const { x, y } = obj?.coords ?? {};
        expect(x).toBe(10);
        expect(y).toBe(20);
      });

      it('null base with destructure fallback', () => {
        const obj = null;
        const { x = 0, y = 0 } = obj?.coords ?? {};
        expect(x).toBe(0);
        expect(y).toBe(0);
      });
    });

    describe('with async/await', () => {
      it('optional chain on async function result', async () => {
        const fetchData = async () => ({ value: 42 });
        const result = await fetchData();
        expect(result?.value).toBe(42);
      });

      it('optional chain on null async result', async () => {
        const fetchData = async () => null;
        const result = await fetchData();
        expect(result?.value).toBe(undefined);
      });

      it('optional call on async method', async () => {
        const obj = {
          async getData() { return 'data'; },
        };
        const result = await obj?.getData();
        expect(result).toBe('data');
      });

      it('optional call on null async method', async () => {
        const obj = {};
        const result = await obj?.getData?.();
        expect(result).toBe(undefined);
      });
    });

    describe('with Map, Set, and WeakMap', () => {
      it('optional method call on Map', () => {
        const map = new Map([['key', 'value']]);
        expect(map?.get('key')).toBe('value');
        expect(map?.get('missing')).toBe(undefined);
      });

      it('optional on null Map', () => {
        const map = null;
        expect(map?.get?.('key')).toBe(undefined);
      });

      it('optional on Set', () => {
        const set = new Set([1, 2, 3]);
        expect(set?.has(2)).toBe(true);
        expect(set?.has(4)).toBe(false);
        expect(set?.size).toBe(3);
      });

      it('optional on WeakMap', () => {
        const wm = new WeakMap();
        const key = {};
        wm.set(key, 'val');
        expect(wm?.get(key)).toBe('val');
      });
    });

    describe('edge cases', () => {
      it('optional chaining on result of typeof', () => {
        // typeof always returns a string
        const result = (typeof undefined)?.length;
        expect(result).toBe(9); // "undefined".length
      });

      it('deeply nested with all nullish', () => {
        const obj = null;
        expect(obj?.a?.b?.c?.d?.e?.f?.g?.h).toBe(undefined);
      });

      it('optional chaining in template literal', () => {
        const obj = null;
        const result = `value: ${obj?.foo ?? 'none'}`;
        expect(result).toBe('value: none');
      });

      it('optional chaining with spread', () => {
        const obj = { arr: [1, 2, 3] };
        const result = [...(obj?.arr ?? [])];
        expect(result).toEqual([1, 2, 3]);

        const nul = null;
        const result2 = [...(nul?.arr ?? [])];
        expect(result2).toEqual([]);
      });

      it('chained optional calls', () => {
        const fn = () => () => () => 42;
        expect(fn?.()?.()?.()).toBe(42);
      });

      it('chained optional calls with null', () => {
        const fn = () => () => null;
        expect(fn?.()?.()?.()).toBe(undefined);
      });

      it('optional on Map.prototype.get result', () => {
        const map = new Map();
        map.set('user', { name: 'Alice' });
        expect(map.get('user')?.name).toBe('Alice');
        expect(map.get('missing')?.name).toBe(undefined);
      });

      it('optional chaining preserves object identity', () => {
        const inner = { value: 42 };
        const obj = { inner };
        expect(obj?.inner).toBe(inner);
      });

      it('parenthesized optional chain', () => {
        const obj = { a: { b: 42 } };
        expect((obj?.a)?.b).toBe(42);
        const nul = null;
        expect((nul?.a)?.b).toBe(undefined);
      });

      it('optional chaining with comma operator', () => {
        const obj = { a: 1 };
        const result = (0, obj)?.a;
        expect(result).toBe(1);
      });
    });

    describe('practical patterns', () => {
      it('safe nested config access', () => {
        const config = {
          database: {
            connection: {
              host: 'localhost',
              port: 5432,
            },
          },
        };
        expect(config?.database?.connection?.host).toBe('localhost');
        expect(config?.database?.connection?.ssl).toBe(undefined);
        expect(config?.cache?.redis?.host).toBe(undefined);
      });

      it('safe event handler invocation', () => {
        let called = false;
        const props = {
          onPress: () => { called = true; },
        };
        props?.onPress?.();
        expect(called).toBe(true);

        const emptyProps = {};
        emptyProps?.onPress?.();
        // No error thrown
        expect(true).toBe(true);
      });

      it('safe array element access', () => {
        const matrix = [[1, 2], [3, 4]];
        expect(matrix?.[0]?.[1]).toBe(2);
        expect(matrix?.[5]?.[0]).toBe(undefined);
      });

      it('optional chaining in reduce', () => {
        const items = [
          { category: { name: 'A' }, value: 1 },
          { category: null, value: 2 },
          { category: { name: 'B' }, value: 3 },
        ];
        const categories = items.map(item => item.category?.name ?? 'Unknown');
        expect(categories).toEqual(['A', 'Unknown', 'B']);
      });

      it('JSON response navigation', () => {
        const response = {
          data: {
            users: [
              { profile: { avatar: { url: 'https://example.com/photo.jpg' } } },
              { profile: { avatar: null } },
              { profile: null },
            ],
          },
        };
        expect(response.data?.users?.[0]?.profile?.avatar?.url).toBe('https://example.com/photo.jpg');
        expect(response.data?.users?.[1]?.profile?.avatar?.url).toBe(undefined);
        expect(response.data?.users?.[2]?.profile?.avatar?.url).toBe(undefined);
        expect(response.data?.users?.[99]?.profile?.avatar?.url).toBe(undefined);
      });

      it('safe method chaining pattern', () => {
        class Builder {
          #parts = [];
          add(part) { this.#parts.push(part); return this; }
          build() { return this.#parts.join(' '); }
        }
        const builder = new Builder();
        const result = builder?.add('hello')?.add('world')?.build();
        expect(result).toBe('hello world');

        const nullBuilder = null;
        const nullResult = nullBuilder?.add('hello')?.add('world')?.build();
        expect(nullResult).toBe(undefined);
      });
    });
  });
}
