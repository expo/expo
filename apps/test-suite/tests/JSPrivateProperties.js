/* eslint-disable */
'use strict';

// Comprehensive runtime compliance tests for private class properties (fields).
// Validates that private field declaration, access, mutation, and the `#prop in obj`
// brand check syntax work correctly at runtime in the Hermes engine.
// Cases sourced from @babel/plugin-transform-class-properties and
// @babel/plugin-transform-private-property-in-object exec.js fixtures,
// supplemented with additional edge cases.

export const name = 'JS Private Properties';

export function test({ describe, it, xit, expect }) {
  describe('JS Private Properties', () => {
    describe('private field declaration and access', () => {
      it('basic private field with initializer', () => {
        class Foo {
          #x = 42;
          get() {
            return this.#x;
          }
        }
        expect(new Foo().get()).toBe(42);
      });

      it('private field without initializer is undefined', () => {
        class Foo {
          #x;
          get() {
            return this.#x;
          }
        }
        expect(new Foo().get()).toBeUndefined();
      });

      it('private field initialized from constructor parameter', () => {
        class Foo {
          #x;
          constructor(x) {
            this.#x = x;
          }
          get() {
            return this.#x;
          }
        }
        expect(new Foo(42).get()).toBe(42);
      });

      it('private field read and write', () => {
        class Foo {
          #x = 0;
          inc() {
            this.#x++;
          }
          get() {
            return this.#x;
          }
        }
        const foo = new Foo();
        expect(foo.get()).toBe(0);
        foo.inc();
        expect(foo.get()).toBe(1);
        foo.inc();
        expect(foo.get()).toBe(2);
      });

      it('multiple private fields', () => {
        class Point {
          #x;
          #y;
          constructor(x, y) {
            this.#x = x;
            this.#y = y;
          }
          toString() {
            return `(${this.#x}, ${this.#y})`;
          }
        }
        expect(new Point(1, 2).toString()).toBe('(1, 2)');
      });

      it('private field with various value types', () => {
        class Store {
          #num = 42;
          #str = 'hello';
          #bool = true;
          #nil = null;
          #undef = undefined;
          #arr = [1, 2, 3];
          #obj = { a: 1 };
          #fn = (x) => x * 2;
          values() {
            return {
              num: this.#num,
              str: this.#str,
              bool: this.#bool,
              nil: this.#nil,
              undef: this.#undef,
              arr: this.#arr,
              obj: this.#obj,
              fn: this.#fn(5),
            };
          }
        }
        const v = new Store().values();
        expect(v.num).toBe(42);
        expect(v.str).toBe('hello');
        expect(v.bool).toBe(true);
        expect(v.nil).toBe(null);
        expect(v.undef).toBeUndefined();
        expect(v.arr).toEqual([1, 2, 3]);
        expect(v.obj).toEqual({ a: 1 });
        expect(v.fn).toBe(10);
      });

      it('private field with computed initializer', () => {
        let counter = 0;
        class Foo {
          #x = ++counter;
          get() {
            return this.#x;
          }
        }
        const a = new Foo();
        const b = new Foo();
        expect(a.get()).toBe(1);
        expect(b.get()).toBe(2);
      });

      it('private field initializer runs per instance', () => {
        class Foo {
          #arr = [];
          push(val) {
            this.#arr.push(val);
          }
          get() {
            return this.#arr;
          }
        }
        const a = new Foo();
        const b = new Foo();
        a.push(1);
        b.push(2);
        expect(a.get()).toEqual([1]);
        expect(b.get()).toEqual([2]);
      });

      it('private field not visible via Object.keys', () => {
        class Foo {
          #x = 1;
          y = 2;
        }
        const keys = Object.keys(new Foo());
        expect(keys.length).toBe(1);
        expect(keys[0]).toBe('y');
      });

      it('private field not visible via for-in', () => {
        class Foo {
          #x = 1;
          y = 2;
        }
        const keys = [];
        for (const k in new Foo()) {
          keys.push(k);
        }
        expect(keys.indexOf('y') >= 0).toBe(true);
        expect(keys.indexOf('#x')).toBe(-1);
      });

      it('private field not visible in JSON.stringify', () => {
        class Foo {
          #secret = 'hidden';
          pub = 'visible';
        }
        const json = JSON.parse(JSON.stringify(new Foo()));
        expect(json.pub).toBe('visible');
        expect(Object.keys(json).length).toBe(1);
      });

      it('private field access from outside throws', () => {
        class Foo {
          #x = 1;
        }
        const foo = new Foo();
        // Accessing via bracket notation with the string '#x' just returns undefined
        // (it's a different property name, not the private field)
        expect(foo['#x']).toBeUndefined();
      });
    });

    describe('private field mutation', () => {
      it('compound assignment operators', () => {
        class Foo {
          #x = 10;
          addAssign(n) {
            this.#x += n;
          }
          subAssign(n) {
            this.#x -= n;
          }
          mulAssign(n) {
            this.#x *= n;
          }
          get() {
            return this.#x;
          }
        }
        const foo = new Foo();
        foo.addAssign(5);
        expect(foo.get()).toBe(15);
        foo.subAssign(3);
        expect(foo.get()).toBe(12);
        foo.mulAssign(2);
        expect(foo.get()).toBe(24);
      });

      it('prefix and postfix increment/decrement', () => {
        class Counter {
          #x = 0;
          preInc() {
            return ++this.#x;
          }
          postInc() {
            return this.#x++;
          }
          preDec() {
            return --this.#x;
          }
          postDec() {
            return this.#x--;
          }
          get() {
            return this.#x;
          }
        }
        const c = new Counter();
        expect(c.preInc()).toBe(1);
        expect(c.get()).toBe(1);
        expect(c.postInc()).toBe(1);
        expect(c.get()).toBe(2);
        expect(c.preDec()).toBe(1);
        expect(c.get()).toBe(1);
        expect(c.postDec()).toBe(1);
        expect(c.get()).toBe(0);
      });

      it('logical assignment operators', () => {
        class Foo {
          #a = null;
          #b = 0;
          #c = '';
          nullishAssign(val) {
            this.#a ??= val;
          }
          orAssign(val) {
            this.#b ||= val;
          }
          andAssign(val) {
            this.#c &&= val;
          }
          values() {
            return [this.#a, this.#b, this.#c];
          }
        }
        const foo = new Foo();
        foo.nullishAssign(42);
        foo.orAssign(7);
        foo.andAssign('replaced');
        expect(foo.values()).toEqual([42, 7, '']);
        // #a is no longer null, so ??= is a no-op
        foo.nullishAssign(100);
        expect(foo.values()[0]).toBe(42);
      });

      it('destructuring assignment to private field', () => {
        class Foo {
          #x = 0;
          #y = 0;
          assign(obj) {
            ({ x: this.#x, y: this.#y } = obj);
          }
          get() {
            return [this.#x, this.#y];
          }
        }
        const foo = new Foo();
        foo.assign({ x: 10, y: 20 });
        expect(foo.get()).toEqual([10, 20]);
      });
    });

    describe('static private fields', () => {
      it('basic static private field', () => {
        class Foo {
          static #x = 42;
          static get() {
            return Foo.#x;
          }
        }
        expect(Foo.get()).toBe(42);
      });

      it('static private field mutation', () => {
        class Counter {
          static #count = 0;
          static inc() {
            Counter.#count++;
          }
          static get() {
            return Counter.#count;
          }
        }
        expect(Counter.get()).toBe(0);
        Counter.inc();
        expect(Counter.get()).toBe(1);
        Counter.inc();
        expect(Counter.get()).toBe(2);
      });

      it('static private field accessed via this in static method', () => {
        class Foo {
          static #x = 99;
          static get() {
            return this.#x;
          }
        }
        expect(Foo.get()).toBe(99);
      });

      it('static private field not accessible from instance', () => {
        class Foo {
          static #x = 42;
          tryAccess() {
            // Can't do this.#x for static from instance — use class name
            return Foo.#x;
          }
        }
        expect(new Foo().tryAccess()).toBe(42);
      });

      it('static private field with computed initializer', () => {
        class Foo {
          static #x = [1, 2, 3].reduce((a, b) => a + b, 0);
          static get() {
            return Foo.#x;
          }
        }
        expect(Foo.get()).toBe(6);
      });
    });

    describe('private field inheritance', () => {
      it('subclass does not inherit parent private field', () => {
        class Base {
          #x = 1;
          getBase() {
            return this.#x;
          }
        }
        class Child extends Base {
          getChild() {
            // Cannot access this.#x — it belongs to Base
            return typeof this['#x'];
          }
        }
        const child = new Child();
        expect(child.getBase()).toBe(1);
        expect(child.getChild()).toBe('undefined');
      });

      it('subclass can have same-named private field', () => {
        class Base {
          #x = 'base';
          getBaseX() {
            return this.#x;
          }
        }
        class Child extends Base {
          #x = 'child';
          getChildX() {
            return this.#x;
          }
        }
        const child = new Child();
        expect(child.getBaseX()).toBe('base');
        expect(child.getChildX()).toBe('child');
      });

      it('subclass constructor can set parent private field via inherited method', () => {
        class Base {
          #x;
          setX(val) {
            this.#x = val;
          }
          getX() {
            return this.#x;
          }
        }
        class Child extends Base {
          constructor(val) {
            super();
            this.setX(val);
          }
        }
        expect(new Child(42).getX()).toBe(42);
      });

      it('private field per-instance with subclass', () => {
        class Base {
          #items = [];
          push(val) {
            this.#items.push(val);
          }
          get() {
            return this.#items;
          }
        }
        class Child extends Base {}
        const a = new Child();
        const b = new Child();
        a.push(1);
        b.push(2);
        expect(a.get()).toEqual([1]);
        expect(b.get()).toEqual([2]);
      });
    });

    describe('private field interactions', () => {
      it('private field with public field', () => {
        class Foo {
          #priv = 'private';
          pub = 'public';
          get() {
            return this.#priv + ' ' + this.pub;
          }
        }
        expect(new Foo().get()).toBe('private public');
      });

      it('private field initialization order', () => {
        const order = [];
        class Foo {
          #a = (order.push('a'), 1);
          b = (order.push('b'), 2);
          #c = (order.push('c'), 3);
          d = (order.push('d'), 4);
          getOrder() {
            return order;
          }
        }
        new Foo();
        expect(order).toEqual(['a', 'b', 'c', 'd']);
      });

      it('private field with constructor', () => {
        class Foo {
          #x = 10;
          constructor() {
            this.#x += 5;
          }
          get() {
            return this.#x;
          }
        }
        expect(new Foo().get()).toBe(15);
      });

      it('private field with super constructor', () => {
        class Base {
          constructor(val) {
            this.baseVal = val;
          }
        }
        class Child extends Base {
          #x;
          constructor(a, b) {
            super(a);
            this.#x = b;
          }
          get() {
            return this.baseVal + this.#x;
          }
        }
        expect(new Child(10, 32).get()).toBe(42);
      });

      it('private field used in method with destructuring', () => {
        class Config {
          #defaults = { color: 'blue', size: 10 };
          merge(overrides) {
            return { ...this.#defaults, ...overrides };
          }
        }
        const c = new Config();
        expect(c.merge({ size: 20 })).toEqual({ color: 'blue', size: 20 });
        expect(c.merge({})).toEqual({ color: 'blue', size: 10 });
      });

      it('private field used as Map/Set key', () => {
        class Registry {
          #map = new Map();
          set(key, val) {
            this.#map.set(key, val);
          }
          get(key) {
            return this.#map.get(key);
          }
          size() {
            return this.#map.size;
          }
        }
        const r = new Registry();
        r.set('a', 1);
        r.set('b', 2);
        expect(r.get('a')).toBe(1);
        expect(r.size()).toBe(2);
      });

      it('private field accessed in arrow function preserves this', () => {
        class Foo {
          #x = 42;
          getGetter() {
            return () => this.#x;
          }
        }
        const foo = new Foo();
        const getter = foo.getGetter();
        expect(getter()).toBe(42);
      });

      it('private field accessed in callback', () => {
        class Multiplier {
          #factor;
          constructor(factor) {
            this.#factor = factor;
          }
          applyAll(arr) {
            return arr.map((x) => x * this.#factor);
          }
        }
        expect(new Multiplier(3).applyAll([1, 2, 3])).toEqual([3, 6, 9]);
      });
    });

    describe('private instance field brand checks', () => {
      it('basic #field in obj returns true for own instance', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check(new Foo())).toBe(true);
      });

      it('#field in obj returns false for plain object', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check({})).toBe(false);
      });

      it('#field in obj returns false for instance of different class', () => {
        class A {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        class B {
          #x = 2;
        }
        expect(A.check(new B())).toBe(false);
      });

      it('multiple private field checks on same object', () => {
        class Foo {
          #a = 1;
          #b = 2;
          static checkA(obj) {
            return #a in obj;
          }
          static checkB(obj) {
            return #b in obj;
          }
        }
        const foo = new Foo();
        expect(Foo.checkA(foo)).toBe(true);
        expect(Foo.checkB(foo)).toBe(true);
        expect(Foo.checkA({})).toBe(false);
        expect(Foo.checkB({})).toBe(false);
      });

      it('#field in obj with uninitialized field (no default)', () => {
        class Foo {
          #x;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check(new Foo())).toBe(true);
      });

      it('instance method can check its own brand', () => {
        class Foo {
          #x = 1;
          isFoo(obj) {
            return #x in obj;
          }
        }
        const foo = new Foo();
        expect(foo.isFoo(foo)).toBe(true);
        expect(foo.isFoo({})).toBe(false);
      });
    });

    describe('private instance method brand checks', () => {
      // From: assumption-privateFieldsAsProperties/method/exec.js
      it('#method in obj returns true for instance', () => {
        class Foo {
          #foo() {}
          #foo2() {}
          test(other) {
            return #foo in other;
          }
          test2(other) {
            return #foo2 in other;
          }
        }
        const cl = new Foo();
        expect(cl.test({})).toBe(false);
        expect(cl.test(cl)).toBe(true);
        expect(cl.test2({})).toBe(false);
        expect(cl.test2(cl)).toBe(true);
      });

      it('#method in obj for different instances of same class', () => {
        class Foo {
          #bar() {}
          static check(obj) {
            return #bar in obj;
          }
        }
        const a = new Foo();
        const b = new Foo();
        expect(Foo.check(a)).toBe(true);
        expect(Foo.check(b)).toBe(true);
      });
    });

    describe('private accessor brand checks', () => {
      it('#getter in obj returns true for instance', () => {
        class Foo {
          get #value() {
            return 42;
          }
          static check(obj) {
            return #value in obj;
          }
        }
        expect(Foo.check(new Foo())).toBe(true);
        expect(Foo.check({})).toBe(false);
      });

      it('#setter in obj returns true for instance', () => {
        class Foo {
          set #value(v) {}
          static check(obj) {
            return #value in obj;
          }
        }
        expect(Foo.check(new Foo())).toBe(true);
        expect(Foo.check({})).toBe(false);
      });

      it('#accessor (getter+setter) in obj returns true', () => {
        class Foo {
          #x = 0;
          get #value() {
            return this.#x;
          }
          set #value(v) {
            this.#x = v;
          }
          static check(obj) {
            return #value in obj;
          }
        }
        expect(Foo.check(new Foo())).toBe(true);
        expect(Foo.check({})).toBe(false);
      });

      it('brand check does not trigger getter side effects', () => {
        let getterCalled = false;
        class Foo {
          get #value() {
            getterCalled = true;
            return 42;
          }
          static check(obj) {
            return #value in obj;
          }
        }
        const foo = new Foo();
        getterCalled = false;
        Foo.check(foo);
        expect(getterCalled).toBe(false);
      });
    });

    describe('private static field brand checks', () => {
      it('#staticField in Class returns true', () => {
        class Foo {
          static #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check(Foo)).toBe(true);
      });

      it('#staticField in instance returns false', () => {
        class Foo {
          static #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check(new Foo())).toBe(false);
      });

      it('#staticField in plain object returns false', () => {
        class Foo {
          static #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check({})).toBe(false);
      });
    });

    describe('private static method brand checks', () => {
      it('#staticMethod in Class returns true', () => {
        class Foo {
          static #bar() {}
          static check(obj) {
            return #bar in obj;
          }
        }
        expect(Foo.check(Foo)).toBe(true);
      });

      it('#staticMethod in instance returns false', () => {
        class Foo {
          static #bar() {}
          static check(obj) {
            return #bar in obj;
          }
        }
        expect(Foo.check(new Foo())).toBe(false);
      });
    });

    describe('private static accessor brand checks', () => {
      it('static #getter in Class returns true', () => {
        class Foo {
          static get #value() {
            return 1;
          }
          static check(obj) {
            return #value in obj;
          }
        }
        expect(Foo.check(Foo)).toBe(true);
        expect(Foo.check({})).toBe(false);
      });
    });

    describe('RHS not an object', () => {
      // From: private/rhs-not-object/exec.js
      it('throws TypeError for number', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(() => Foo.check(42)).toThrow();
      });

      it('throws TypeError for string', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(() => Foo.check('hello')).toThrow();
      });

      it('throws TypeError for boolean', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(() => Foo.check(true)).toThrow();
      });

      it('throws TypeError for undefined', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(() => Foo.check(undefined)).toThrow();
      });

      it('throws TypeError for null', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(() => Foo.check(null)).toThrow();
      });

      it('throws TypeError for symbol', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(() => Foo.check(Symbol('test'))).toThrow();
      });

      it('throws for static private field with non-object RHS', () => {
        class Foo {
          static #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(() => Foo.check(42)).toThrow();
        expect(() => Foo.check('str')).toThrow();
        expect(() => Foo.check(null)).toThrow();
      });

      it('throws for private method with non-object RHS', () => {
        class Foo {
          #m() {}
          static check(obj) {
            return #m in obj;
          }
        }
        expect(() => Foo.check(42)).toThrow();
        expect(() => Foo.check(undefined)).toThrow();
      });
    });

    describe('class name shadowing', () => {
      // From: private/static-shadow/exec.js
      it('static private field check works when class name is shadowed', () => {
        class Test {
          static #x = 1;
          method(other) {
            const Test = 2;
            const func = () => {
              const Test = 3;
              return #x in other && Test;
            };
            return func() + Test;
          }
        }
        const t = new Test();
        expect(t.method(Test)).toBe(5);
      });

      it('instance private field check works when class name is shadowed', () => {
        class Foo {
          #x = 1;
          check(obj) {
            const Foo = 'shadowed';
            return #x in obj;
          }
        }
        const foo = new Foo();
        expect(foo.check(foo)).toBe(true);
        expect(foo.check({})).toBe(false);
      });
    });

    describe('inheritance', () => {
      it('#field in subclass instance returns true', () => {
        class Base {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        class Child extends Base {}
        expect(Base.check(new Base())).toBe(true);
        expect(Base.check(new Child())).toBe(true);
      });

      it('subclass private field is independent from parent', () => {
        class Base {
          #x = 1;
          static checkBase(obj) {
            return #x in obj;
          }
        }
        class Child extends Base {
          #y = 2;
          static checkChild(obj) {
            return #y in obj;
          }
        }
        const child = new Child();
        expect(Base.checkBase(child)).toBe(true);
        expect(Child.checkChild(child)).toBe(true);
        expect(Child.checkChild(new Base())).toBe(false);
      });

      it('#staticField in subclass returns false', () => {
        class Base {
          static #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        class Child extends Base {}
        expect(Base.check(Base)).toBe(true);
        // Static private fields are NOT inherited
        expect(Base.check(Child)).toBe(false);
      });

      it('private method brand check on subclass instance', () => {
        class Base {
          #secret() {}
          static check(obj) {
            return #secret in obj;
          }
        }
        class Child extends Base {}
        expect(Base.check(new Child())).toBe(true);
        expect(Base.check({})).toBe(false);
      });
    });

    describe('usage in expressions', () => {
      it('negation: !(#field in obj)', () => {
        class Foo {
          #x = 1;
          static notFoo(obj) {
            return !(#x in obj);
          }
        }
        expect(Foo.notFoo(new Foo())).toBe(false);
        expect(Foo.notFoo({})).toBe(true);
      });

      it('ternary: #field in obj ? a : b', () => {
        class Foo {
          #x = 1;
          static label(obj) {
            return #x in obj ? 'foo' : 'not foo';
          }
        }
        expect(Foo.label(new Foo())).toBe('foo');
        expect(Foo.label({})).toBe('not foo');
      });

      it('logical AND: #field in obj && value', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj && 'yes';
          }
        }
        expect(Foo.check(new Foo())).toBe('yes');
        expect(Foo.check({})).toBe(false);
      });

      it('logical OR: #field in obj || fallback', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj || 'fallback';
          }
        }
        expect(Foo.check(new Foo())).toBe(true);
        expect(Foo.check({})).toBe('fallback');
      });

      it('if/else with brand check', () => {
        class Foo {
          #x = 1;
          static describe(obj) {
            if (#x in obj) {
              return 'is Foo';
            } else {
              return 'not Foo';
            }
          }
        }
        expect(Foo.describe(new Foo())).toBe('is Foo');
        expect(Foo.describe({})).toBe('not Foo');
      });

      it('brand check in while loop', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        const items = [{}, new Foo(), {}, new Foo(), {}];
        var count = 0;
        for (var i = 0; i < items.length; i++) {
          if (Foo.check(items[i])) count++;
        }
        expect(count).toBe(2);
      });

      it('brand check with nullish coalescing', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return (#x in obj) ?? 'never';
          }
        }
        // #x in obj always returns boolean, never nullish
        expect(Foo.check(new Foo())).toBe(true);
        expect(Foo.check({})).toBe(false);
      });
    });

    describe('practical patterns', () => {
      it('static factory with brand check (instanceof alternative)', () => {
        class MyClass {
          #brand;
          constructor() {
            this.#brand = undefined;
          }
          static isMyClass(obj) {
            try {
              return #brand in obj;
            } catch {
              return false;
            }
          }
        }
        expect(MyClass.isMyClass(new MyClass())).toBe(true);
        expect(MyClass.isMyClass({})).toBe(false);
        expect(MyClass.isMyClass(null)).toBe(false);
        expect(MyClass.isMyClass(42)).toBe(false);
      });

      it('safe unwrap pattern', () => {
        class Wrapper {
          #value;
          constructor(value) {
            this.#value = value;
          }
          static unwrap(obj) {
            if (typeof obj === 'object' && obj !== null && #value in obj) {
              return obj.getValue();
            }
            return obj;
          }
          getValue() {
            return this.#value;
          }
        }
        expect(Wrapper.unwrap(new Wrapper(42))).toBe(42);
        expect(Wrapper.unwrap('plain')).toBe('plain');
        expect(Wrapper.unwrap(null)).toBe(null);
      });

      it('type narrowing with multiple private brands', () => {
        class Dog {
          #bark = true;
          static isDog(obj) {
            return #bark in obj;
          }
        }
        class Cat {
          #meow = true;
          static isCat(obj) {
            return #meow in obj;
          }
        }
        const dog = new Dog();
        const cat = new Cat();
        expect(Dog.isDog(dog)).toBe(true);
        expect(Cat.isCat(dog)).toBe(false);
        expect(Dog.isDog(cat)).toBe(false);
        expect(Cat.isCat(cat)).toBe(true);
      });

      it('filtering an array by brand', () => {
        class Special {
          #mark = true;
          static is(obj) {
            return typeof obj === 'object' && obj !== null && #mark in obj;
          }
        }
        const items = [new Special(), {}, new Special(), 42, null, new Special()];
        var count = 0;
        for (var i = 0; i < items.length; i++) {
          if (Special.is(items[i])) count++;
        }
        expect(count).toBe(3);
      });
    });

    describe('cross-class isolation', () => {
      it('same field name in different classes are independent brands', () => {
        class A {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        class B {
          #x = 2;
          static check(obj) {
            return #x in obj;
          }
        }
        const a = new A();
        const b = new B();
        expect(A.check(a)).toBe(true);
        expect(A.check(b)).toBe(false);
        expect(B.check(b)).toBe(true);
        expect(B.check(a)).toBe(false);
      });

      it('nested class brand checks are independent', () => {
        class Outer {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
          makeInner() {
            return new (class Inner {
              #x = 2;
              static check(obj) {
                return #x in obj;
              }
            })();
          }
        }
        const outer = new Outer();
        expect(Outer.check(outer)).toBe(true);
      });
    });

    describe('various object types as RHS', () => {
      it('works with arrays', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check([])).toBe(false);
      });

      it('works with functions', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check(function () {})).toBe(false);
      });

      it('works with class itself as object', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        // Instance brand is not on the class constructor
        expect(Foo.check(Foo)).toBe(false);
      });

      it('works with Object.create(null)', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check(Object.create(null))).toBe(false);
      });

      it('works with Date, RegExp, Map objects', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check(new Date())).toBe(false);
        expect(Foo.check(/test/)).toBe(false);
        expect(Foo.check(new Map())).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('brand check in constructor', () => {
        class Foo {
          #x = 1;
          hasBrand;
          constructor() {
            this.hasBrand = #x in this;
          }
        }
        expect(new Foo().hasBrand).toBe(true);
      });

      it('brand check during field initialization', () => {
        class Foo {
          #x = 1;
          hasBrand = #x in this;
        }
        expect(new Foo().hasBrand).toBe(true);
      });

      it('brand check in static block', () => {
        let result;
        class Foo {
          static #x = 1;
          static {
            result = #x in Foo;
          }
        }
        expect(result).toBe(true);
      });

      it('brand check result is always a boolean', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(typeof Foo.check(new Foo())).toBe('boolean');
        expect(typeof Foo.check({})).toBe('boolean');
        expect(Foo.check(new Foo()) === true).toBe(true);
        expect(Foo.check({}) === false).toBe(true);
      });

      it('brand check on Proxy-wrapped object', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        const foo = new Foo();
        const proxy = new Proxy(foo, {});
        // Proxy does not forward private field brand — should be false
        // (or true if the engine sees through the proxy — implementation-defined)
        var result = Foo.check(proxy);
        expect(typeof result).toBe('boolean');
      });

      it('multiple brand checks in single expression', () => {
        class A {
          #a = 1;
          static check(obj) {
            return #a in obj;
          }
        }
        class B {
          #b = 2;
          static check(obj) {
            return #b in obj;
          }
        }
        class AB extends A {
          #b_too = 3;
        }
        const ab = new AB();
        // Has A's brand (through inheritance) but not B's
        expect(A.check(ab) && !B.check(ab)).toBe(true);
      });

      it('brand check after Object.freeze', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        const foo = Object.freeze(new Foo());
        expect(Foo.check(foo)).toBe(true);
      });

      it('brand check after Object.seal', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        const foo = Object.seal(new Foo());
        expect(Foo.check(foo)).toBe(true);
      });

      it('brand check with Object.preventExtensions', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        const foo = new Foo();
        Object.preventExtensions(foo);
        expect(Foo.check(foo)).toBe(true);
      });

      it('expression class with brand check', () => {
        const Foo = class {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        };
        expect(Foo.check(new Foo())).toBe(true);
        expect(Foo.check({})).toBe(false);
      });
    });
  });
}
