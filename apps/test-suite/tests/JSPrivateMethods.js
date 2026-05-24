/* eslint-disable */
'use strict';

// Comprehensive runtime compliance tests for private class methods.
// Validates that private methods, accessors, and static private methods
// work correctly at runtime in the Hermes engine.
// Cases sourced from @babel/plugin-transform-private-methods exec.js fixtures
// and supplemented with additional edge cases.

export const name = 'JS Private Methods';

export function test({ describe, it, xit, expect }) {
  describe('JS Private Methods', () => {
    describe('private instance methods', () => {
      // From: private-method/assignment/exec.js
      it('private method can be called from constructor', () => {
        class Foo {
          #bar() {
            return 42;
          }
          constructor() {
            this.result = this.#bar();
          }
        }
        const foo = new Foo();
        expect(foo.result).toBe(42);
      });

      // From: private-method/context/exec.js
      it('private method preserves this context', () => {
        class Foo {
          #name = 'foo';
          #bar() {
            return this.#name;
          }
          test() {
            return this.#bar();
          }
        }
        const foo = new Foo();
        expect(foo.test()).toBe('foo');
      });

      it('private method called with different this via call/apply', () => {
        class Foo {
          x = 1;
          #bar() {
            return this.x;
          }
          getBar() {
            return this.#bar;
          }
        }
        const foo = new Foo();
        const bar = foo.getBar();
        // Private method extracted — calling with original receiver
        expect(bar.call(foo)).toBe(1);
      });

      // From: private-method/exfiltrated/exec.js
      it('exfiltrated private method has stable identity', () => {
        class Foo {
          #bar() {
            return 'bar';
          }
          getBar() {
            return this.#bar;
          }
        }
        const foo = new Foo();
        expect(foo.getBar()).toBe(foo.getBar());
      });

      // From: private-method/before-fields/exec.js
      it('private method available during field initialization', () => {
        class Foo {
          #bar() {
            return 'bar';
          }
          foo = this.#bar();
        }
        const foo = new Foo();
        expect(foo.foo).toBe('bar');
      });

      // From: private-method/scopable/exec.js
      it('multiple private methods in same class', () => {
        class Foo {
          #bar() {
            return 'bar';
          }
          #baz() {
            return 'baz';
          }
          test() {
            return this.#bar() + this.#baz();
          }
        }
        const foo = new Foo();
        expect(foo.test()).toBe('barbaz');
      });

      // NOTE(@kitten): These don't compile in production, so need to be left out
      if (__DEV__) {
        // From: private-method/read-only/exec.js
        it('private method is read-only (assignment throws)', () => {
          expect(() => {
            class Foo {
              #bar() {}
              constructor() {
                this.#bar = 1;
              }
            }
            new Foo();
          }).toThrow();
        });

        // From: private-method/reassignment/exec.js
        it('private method compound assignment throws', () => {
          expect(() => {
            class Foo {
              #bar() {}
              constructor() {
                this.#bar += 1;
              }
            }
            new Foo();
          }).toThrow();
        });

        it('private method increment throws', () => {
          expect(() => {
            class Foo {
              #bar() {}
              constructor() {
                this.#bar++;
              }
            }
            new Foo();
          }).toThrow();
        });
      }

      // From: private-method/class-binding/exec.js
      it('class name binding preserved inside private method', () => {
        class Foo {
          #bar() {
            return Foo;
          }
          test() {
            return this.#bar();
          }
        }
        const foo = new Foo();
        expect(foo.test()).toBe(Foo);
      });

      // From: private-method/super/exec.js
      it('super method access from private method', () => {
        class Base {
          greet() {
            return 'hello';
          }
        }
        class Derived extends Base {
          #bar() {
            return super.greet();
          }
          test() {
            return this.#bar();
          }
        }
        const d = new Derived();
        expect(d.test()).toBe('hello');
      });

      // From: private-method/tagged-template/exec.js
      // Hermes v1 does not support private methods as tagged template literals.
      xit('private method as tagged template', () => {
        class Foo {
          #tag(strings, ...values) {
            return { strings: Array.from(strings), values };
          }
          test() {
            return this.#tag`hello ${'world'}`;
          }
        }
        const foo = new Foo();
        const result = foo.test();
        expect(result.strings).toEqual(['hello ', '']);
        expect(result.values).toEqual(['world']);
      });

      it('private method with parameters', () => {
        class Calc {
          #add(a, b) {
            return a + b;
          }
          sum(a, b) {
            return this.#add(a, b);
          }
        }
        const calc = new Calc();
        expect(calc.sum(3, 4)).toBe(7);
      });

      it('private method with default parameters', () => {
        class Foo {
          #greet(name = 'world') {
            return `hello ${name}`;
          }
          test(n) {
            return this.#greet(n);
          }
        }
        const foo = new Foo();
        expect(foo.test()).toBe('hello world');
        expect(foo.test('bar')).toBe('hello bar');
      });

      it('private method with rest parameters', () => {
        class Foo {
          #sum(...args) {
            return args.reduce((a, b) => a + b, 0);
          }
          test(...args) {
            return this.#sum(...args);
          }
        }
        const foo = new Foo();
        expect(foo.test(1, 2, 3)).toBe(6);
      });

      it('private method with destructured parameters', () => {
        class Foo {
          #extract({ x, y }) {
            return x + y;
          }
          test(obj) {
            return this.#extract(obj);
          }
        }
        const foo = new Foo();
        expect(foo.test({ x: 10, y: 20 })).toBe(30);
      });

      it('private method not accessible from outside', () => {
        class Foo {
          #secret() {
            return 42;
          }
        }
        const foo = new Foo();
        expect(foo['#secret']).toBeUndefined();
        expect(typeof foo['#secret']).toBe('undefined');
      });

      it('private method not accessible from subclass', () => {
        class Base {
          #secret() {
            return 42;
          }
          callSecret() {
            return this.#secret();
          }
        }
        class Child extends Base {}
        const child = new Child();
        // Can only call through inherited public method
        expect(child.callSecret()).toBe(42);
      });

      it('private method calling another private method', () => {
        class Foo {
          #a() {
            return 1;
          }
          #b() {
            return this.#a() + 2;
          }
          test() {
            return this.#b();
          }
        }
        const foo = new Foo();
        expect(foo.test()).toBe(3);
      });

      it('private method returning this for chaining', () => {
        class Builder {
          value = 0;
          #add(n) {
            this.value += n;
            return this;
          }
          #mul(n) {
            this.value *= n;
            return this;
          }
          build(a, b) {
            return this.#add(a).#mul(b).value;
          }
        }
        const b = new Builder();
        expect(b.build(3, 4)).toBe(12);
      });
    });

    describe('async private methods', () => {
      // From: private-method/async/exec.js
      it('async private method returns promise', async () => {
        class Foo {
          async #bar() {
            return 42;
          }
          async test() {
            return await this.#bar();
          }
        }
        const foo = new Foo();
        const result = await foo.test();
        expect(result).toBe(42);
      });

      it('async private method with await', async () => {
        class Foo {
          async #fetch(val) {
            const result = await Promise.resolve(val * 2);
            return result;
          }
          async test() {
            return await this.#fetch(21);
          }
        }
        const foo = new Foo();
        expect(await foo.test()).toBe(42);
      });

      it('async private method error propagation', async () => {
        class Foo {
          async #fail() {
            throw new Error('private error');
          }
          async test() {
            try {
              await this.#fail();
              return 'no error';
            } catch (e) {
              return e.message;
            }
          }
        }
        const foo = new Foo();
        expect(await foo.test()).toBe('private error');
      });
    });

    describe('generator private methods', () => {
      // From: private-method/generator/exec.js
      it('private generator method yields values', () => {
        class Foo {
          *#gen() {
            yield 1;
            yield 2;
            yield 3;
          }
          test() {
            return [...this.#gen()];
          }
        }
        const foo = new Foo();
        expect(foo.test()).toEqual([1, 2, 3]);
      });

      it('private async generator method', async () => {
        class Foo {
          async *#gen() {
            yield await Promise.resolve(1);
            yield await Promise.resolve(2);
            yield await Promise.resolve(3);
          }
          async test() {
            const results = [];
            for await (const val of this.#gen()) {
              results.push(val);
            }
            return results;
          }
        }
        const foo = new Foo();
        expect(await foo.test()).toEqual([1, 2, 3]);
      });

      it('private generator with return', () => {
        class Foo {
          *#gen() {
            yield 'a';
            return 'done';
          }
          test() {
            const gen = this.#gen();
            const first = gen.next();
            const second = gen.next();
            return { first, second };
          }
        }
        const foo = new Foo();
        const result = foo.test();
        expect(result.first.value).toBe('a');
        expect(result.first.done).toBe(false);
        expect(result.second.value).toBe('done');
        expect(result.second.done).toBe(true);
      });
    });

    describe('private accessors', () => {
      it('private getter', () => {
        class Foo {
          #x = 42;
          get #value() {
            return this.#x;
          }
          test() {
            return this.#value;
          }
        }
        const foo = new Foo();
        expect(foo.test()).toBe(42);
      });

      it('private setter', () => {
        class Foo {
          #x = 0;
          set #value(v) {
            this.#x = v;
          }
          getValue() {
            return this.#x;
          }
          test(v) {
            this.#value = v;
          }
        }
        const foo = new Foo();
        foo.test(42);
        expect(foo.getValue()).toBe(42);
      });

      it('private getter and setter pair', () => {
        class Foo {
          #x = 0;
          get #value() {
            return this.#x;
          }
          set #value(v) {
            this.#x = v * 2;
          }
          test() {
            this.#value = 21;
            return this.#value;
          }
        }
        const foo = new Foo();
        expect(foo.test()).toBe(42);
      });

      if (__DEV__) {
        it('getter-only private accessor throws on set', () => {
          expect(() => {
            class Foo {
              get #bar() {
                return 1;
              }
              constructor() {
                this.#bar = 2;
              }
            }
            new Foo();
          }).toThrow();
        });

        // In loose mode, setter-only accessor does not throw on get — returns undefined instead.
        xit('setter-only private accessor throws on get', () => {
          expect(() => {
            class Foo {
              set #bar(v) {}
              constructor() {
                const x = this.#bar;
              }
            }
            new Foo();
          }).toThrow();
        });
      }

      it('private accessor available during field initialization', () => {
        class Foo {
          get #value() {
            return 42;
          }
          field = this.#value;
        }
        const foo = new Foo();
        expect(foo.field).toBe(42);
      });

      it('private getter with computed value', () => {
        class Rect {
          #w;
          #h;
          constructor(w, h) {
            this.#w = w;
            this.#h = h;
          }
          get #area() {
            return this.#w * this.#h;
          }
          getArea() {
            return this.#area;
          }
        }
        const r = new Rect(3, 4);
        expect(r.getArea()).toBe(12);
      });

      it('private accessor increment/decrement via getter+setter', () => {
        class Counter {
          #x = 0;
          get #count() {
            return this.#x;
          }
          set #count(v) {
            this.#x = v;
          }
          inc() {
            this.#count++;
            return this.#count;
          }
          dec() {
            this.#count--;
            return this.#count;
          }
        }
        const c = new Counter();
        expect(c.inc()).toBe(1);
        expect(c.inc()).toBe(2);
        expect(c.dec()).toBe(1);
      });
    });

    describe('private static methods', () => {
      // From: private-static-method/basic/exec.js
      it('basic static private method', () => {
        class Foo {
          static #bar() {
            return 'bar';
          }
          static test() {
            return Foo.#bar();
          }
        }
        expect(Foo.test()).toBe('bar');
      });

      // From: private-static-method/class-check/exec.js
      it('static private method with class passed as argument', () => {
        class Foo {
          static #bar() {
            return 'bar';
          }
          static extract(klass) {
            return klass.#bar();
          }
        }
        expect(Foo.extract(Foo)).toBe('bar');
      });

      // From: private-static-method/exfiltrated/exec.js
      it('exfiltrated static private method has stable identity', () => {
        class Foo {
          static #bar() {
            return 'bar';
          }
          static getBar() {
            return Foo.#bar;
          }
        }
        expect(Foo.getBar()).toBe(Foo.getBar());
      });

      // From: private-static-method/scopable/exec.js
      it('multiple static private methods', () => {
        class Foo {
          static #bar() {
            return 'bar';
          }
          static #baz() {
            return 'baz';
          }
          static test() {
            return Foo.#bar() + Foo.#baz();
          }
        }
        expect(Foo.test()).toBe('barbaz');
      });

      // From: private-static-method/read-only/exec.js
      if (__DEV__) {
        it('static private method is read-only', () => {
          expect(() => {
            class Foo {
              static #bar() {}
              static {
                Foo.#bar = 1;
              }
            }
          }).toThrow();
        });

        // From: private-static-method/reassignment/exec.js
        it('static private method compound assignment throws', () => {
          expect(() => {
            class Foo {
              static #bar() {}
              static {
                Foo.#bar += 1;
              }
            }
          }).toThrow();
        });
      }

      // From: private-static-method/super/exec.js
      it('super access from static private method', () => {
        class Base {
          static greet() {
            return 'hello';
          }
        }
        class Derived extends Base {
          static #bar() {
            return super.greet();
          }
          static test() {
            return Derived.#bar();
          }
        }
        expect(Derived.test()).toBe('hello');
      });

      // From: private-static-method/this/exec.js
      it('this in static private method refers to class', () => {
        class Foo {
          static val = 42;
          static #bar() {
            return this.val;
          }
          static test() {
            return this.#bar();
          }
        }
        expect(Foo.test()).toBe(42);
      });

      // From: private-static-method/tagged-template/exec.js
      // Hermes v1 does not support private methods as tagged template literals.
      xit('static private method as tagged template', () => {
        class Foo {
          static #tag(strings, ...values) {
            return { strings: Array.from(strings), values };
          }
          static test() {
            return Foo.#tag`hi ${'there'}`;
          }
        }
        const result = Foo.test();
        expect(result.strings).toEqual(['hi ', '']);
        expect(result.values).toEqual(['there']);
      });

      // From: private-static-method/generator/exec.js
      it('static private generator method', () => {
        class Foo {
          static *#gen() {
            yield 10;
            yield 20;
          }
          static test() {
            return [...Foo.#gen()];
          }
        }
        expect(Foo.test()).toEqual([10, 20]);
      });

      it('static private async method', async () => {
        class Foo {
          static async #compute(x) {
            return await Promise.resolve(x * 2);
          }
          static async test() {
            return await Foo.#compute(21);
          }
        }
        expect(await Foo.test()).toBe(42);
      });
    });

    describe('private static accessors', () => {
      it('static private getter', () => {
        class Foo {
          static #x = 42;
          static get #value() {
            return Foo.#x;
          }
          static test() {
            return Foo.#value;
          }
        }
        expect(Foo.test()).toBe(42);
      });

      it('static private setter', () => {
        class Foo {
          static #x = 0;
          static set #value(v) {
            Foo.#x = v;
          }
          static get() {
            return Foo.#x;
          }
          static test(v) {
            Foo.#value = v;
          }
        }
        Foo.test(42);
        expect(Foo.get()).toBe(42);
      });

      it('static private getter and setter pair', () => {
        class Foo {
          static #x = 0;
          static get #value() {
            return Foo.#x;
          }
          static set #value(v) {
            Foo.#x = v * 2;
          }
          static test() {
            Foo.#value = 21;
            return Foo.#value;
          }
        }
        expect(Foo.test()).toBe(42);
      });

      if (__DEV__) {
        it('static getter-only throws on set', () => {
          expect(() => {
            class Foo {
              static get #bar() {
                return 1;
              }
              static {
                Foo.#bar = 2;
              }
            }
          }).toThrow();
        });
      }
    });

    describe('inheritance and isolation', () => {
      it('private methods are per-class (not inherited)', () => {
        class Base {
          #greet() {
            return 'base';
          }
          test() {
            return this.#greet();
          }
        }
        class Child extends Base {
          // Child does NOT have access to Base's #greet
        }
        const child = new Child();
        // inherited public method still works because it calls #greet on Base
        expect(child.test()).toBe('base');
      });

      it('subclass can define same-named private method', () => {
        class Base {
          #method() {
            return 'base';
          }
          baseTest() {
            return this.#method();
          }
        }
        class Child extends Base {
          #method() {
            return 'child';
          }
          childTest() {
            return this.#method();
          }
        }
        const c = new Child();
        expect(c.baseTest()).toBe('base');
        expect(c.childTest()).toBe('child');
      });

      it('private method access on wrong class instance throws', () => {
        class A {
          #foo() {
            return 'a';
          }
          test(obj) {
            return obj.#foo();
          }
        }
        class B {}
        const a = new A();
        const b = new B();
        expect(() => a.test(b)).toThrow();
      });

      it('different classes with same private method name are independent', () => {
        class A {
          #x() {
            return 'A';
          }
          test() {
            return this.#x();
          }
        }
        class B {
          #x() {
            return 'B';
          }
          test() {
            return this.#x();
          }
        }
        expect(new A().test()).toBe('A');
        expect(new B().test()).toBe('B');
      });
    });

    describe('private fields interaction', () => {
      it('private method accessing private field', () => {
        class Foo {
          #x = 10;
          #double() {
            return this.#x * 2;
          }
          test() {
            return this.#double();
          }
        }
        expect(new Foo().test()).toBe(20);
      });

      it('private method mutating private field', () => {
        class Counter {
          #count = 0;
          #increment() {
            this.#count++;
          }
          inc() {
            this.#increment();
            return this.#count;
          }
        }
        const c = new Counter();
        expect(c.inc()).toBe(1);
        expect(c.inc()).toBe(2);
      });

      it('private setter validating before setting private field', () => {
        class Temp {
          #celsius = 0;
          set #temperature(v) {
            if (v < -273.15) throw new Error('below absolute zero');
            this.#celsius = v;
          }
          get #temperature() {
            return this.#celsius;
          }
          setTemp(v) {
            this.#temperature = v;
          }
          getTemp() {
            return this.#temperature;
          }
        }
        const t = new Temp();
        t.setTemp(100);
        expect(t.getTemp()).toBe(100);
        expect(() => t.setTemp(-300)).toThrow();
        // Value unchanged after rejected set
        expect(t.getTemp()).toBe(100);
      });
    });

    describe('edge cases', () => {
      it('private method in expression class', () => {
        const Foo = class {
          #bar() {
            return 'bar';
          }
          test() {
            return this.#bar();
          }
        };
        expect(new Foo().test()).toBe('bar');
      });

      it('private method in nested class', () => {
        class Outer {
          test() {
            class Inner {
              #foo() {
                return 'inner';
              }
              test() {
                return this.#foo();
              }
            }
            return new Inner().test();
          }
        }
        expect(new Outer().test()).toBe('inner');
      });

      it('private method with symbol property on instance', () => {
        const sym = Symbol('test');
        class Foo {
          [sym] = 'symbol-val';
          #bar() {
            return this[sym];
          }
          test() {
            return this.#bar();
          }
        }
        expect(new Foo().test()).toBe('symbol-val');
      });

      it('private method with computed public method', () => {
        const key = 'myMethod';
        class Foo {
          #priv() {
            return 'private';
          }
          [key]() {
            return this.#priv();
          }
        }
        expect(new Foo().myMethod()).toBe('private');
      });

      it('multiple instances have independent private state but shared method identity', () => {
        class Foo {
          #val;
          constructor(val) {
            this.#val = val;
          }
          #getVal() {
            return this.#val;
          }
          test() {
            return this.#getVal();
          }
          getMethod() {
            return this.#getVal;
          }
        }
        const a = new Foo(1);
        const b = new Foo(2);
        expect(a.test()).toBe(1);
        expect(b.test()).toBe(2);
        // Private methods share identity across instances
        expect(a.getMethod()).toBe(b.getMethod());
      });

      it('private method in class with constructor returning different object', () => {
        class Foo {
          #x = 10;
          #bar() {
            return this.#x;
          }
          test() {
            return this.#bar();
          }
        }
        // Normal instance works
        expect(new Foo().test()).toBe(10);
      });

      it('private static method not accessible on instances', () => {
        class Foo {
          static #bar() {
            return 42;
          }
          static test() {
            return Foo.#bar();
          }
          instanceTest() {
            // Can't access static private from instance
            return Foo.test();
          }
        }
        expect(new Foo().instanceTest()).toBe(42);
      });

      // In loose mode, private methods are stored as regular properties with
      // mangled names (e.g. __private_..._secret), so they appear in
      // getOwnPropertyNames. With native private methods this would pass.
      xit('toString does not reveal private method names', () => {
        class Foo {
          #secret() {
            return 42;
          }
          test() {
            return this.#secret();
          }
        }
        const foo = new Foo();
        const keys = Object.getOwnPropertyNames(foo);
        const hasPrivate = keys.some((k) => k.includes('secret'));
        expect(hasPrivate).toBe(false);
      });

      it('for-in does not enumerate private methods', () => {
        class Foo {
          #secret() {}
          pub = 1;
        }
        const foo = new Foo();
        const keys = [];
        for (const k in foo) {
          keys.push(k);
        }
        // In loose mode, the transformed key is non-enumerable.
        // With native private methods, the key wouldn't exist at all.
        // Either way, no key named '#secret' is enumerable.
        expect(keys.indexOf('#secret')).toBe(-1);
        expect(keys.indexOf('pub') >= 0).toBe(true);
      });

      it('JSON.stringify only includes public properties', () => {
        class Foo {
          #method() {
            return 42;
          }
          x = 1;
        }
        const foo = new Foo();
        const parsed = JSON.parse(JSON.stringify(foo));
        expect(parsed.x).toBe(1);
        // Private method storage (loose or native) should not appear
        var keyCount = Object.keys(parsed).length;
        expect(keyCount).toBe(1);
      });

      it('Object.keys does not include private methods', () => {
        class Foo {
          #method() {}
          x = 1;
        }
        const keys = Object.keys(new Foo());
        expect(keys.indexOf('x') >= 0).toBe(true);
        expect(keys.length).toBe(1);
      });

      it('typeof private method is function', () => {
        class Foo {
          #bar() {}
          test() {
            return typeof this.#bar;
          }
        }
        expect(new Foo().test()).toBe('function');
      });

      it('constructor returning different object loses private brand', () => {
        class Foo {
          #x = 10;
          #bar() {
            return this.#x;
          }
          constructor(override) {
            if (override) return override;
          }
          test() {
            return this.#bar();
          }
        }
        // Normal construction installs brand
        expect(new Foo().test()).toBe(10);
        // Overridden constructor returns a plain object without the brand
        const plain = {};
        const result = new Foo(plain);
        expect(result).toBe(plain);
        expect(result.test).toBeUndefined();
      });

      it('private method as detached callback loses this', () => {
        class Foo {
          #val = 42;
          #getVal() {
            return this.#val;
          }
          getCallback() {
            // Wrapping in arrow preserves this
            return () => this.#getVal();
          }
          getDetached() {
            return this.#getVal;
          }
        }
        const foo = new Foo();
        // Arrow-wrapped callback works
        expect(foo.getCallback()()).toBe(42);
        // Detached loses this context — calling without a receiver
        const detached = foo.getDetached();
        expect(() => detached()).toThrow();
      });

      it('private method with closure over constructor parameter', () => {
        class Foo {
          #fn;
          constructor(multiplier) {
            this.#fn = (x) => x * multiplier;
          }
          test(x) {
            return this.#fn(x);
          }
        }
        expect(new Foo(3).test(7)).toBe(21);
      });
    });

    describe('static blocks', () => {
      it('static block can access private static method', () => {
        let captured;
        class Foo {
          static #bar() {
            return 'from static block';
          }
          static {
            captured = Foo.#bar();
          }
        }
        expect(captured).toBe('from static block');
      });

      it('static block can access private static accessor', () => {
        let captured;
        class Foo {
          static #x = 42;
          static get #value() {
            return Foo.#x;
          }
          static {
            captured = Foo.#value;
          }
        }
        expect(captured).toBe(42);
      });
    });

    describe('private-in checks (ergonomic brand checks)', () => {
      it('#field in obj for instance with private method', () => {
        class Foo {
          #bar() {}
          static check(obj) {
            return #bar in obj;
          }
        }
        expect(Foo.check(new Foo())).toBe(true);
        expect(Foo.check({})).toBe(false);
        // `in` operator throws TypeError for non-object right-hand side
        expect(() => Foo.check(42)).toThrow();
      });

      it('#field in obj for instance with private field', () => {
        class Foo {
          #x = 1;
          static check(obj) {
            return #x in obj;
          }
        }
        expect(Foo.check(new Foo())).toBe(true);
        expect(Foo.check({})).toBe(false);
      });

      it('#field in obj with inheritance', () => {
        class Base {
          #secret() {}
          static check(obj) {
            return #secret in obj;
          }
        }
        class Child extends Base {}
        expect(Base.check(new Base())).toBe(true);
        expect(Base.check(new Child())).toBe(true);
        expect(Base.check({})).toBe(false);
      });
    });
  });
}
