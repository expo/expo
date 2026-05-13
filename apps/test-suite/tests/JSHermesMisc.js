/* eslint-disable */
'use strict';

// Regression tests for Hermes V1 IRGen bugs that babel-preset-expo's hermes-v1 profile
// works around with targeted Babel plugins. These cases all execute correctly on a fixed
// Hermes; on the unfixed Hermes shipping with RN 0.85.3 they crash, throw, or miscompile
// unless the workaround plugin is applied. Keep these even after the Hermes bump so a
// future regression in the same trigger surfaces here.

export const name = 'JS Hermes Misc';

export function test({ describe, it, expect }) {
  describe('JS Hermes Misc', () => {
    describe('class declarations in finally blocks', () => {
      // See: facebook/hermes 1e94fbe0e (legacy class internal Variable caching)
      it('static field on a class declared in finally', () => {
        function f() {
          try {
            throw 1;
          } catch (_) {
          } finally {
            class C {
              static x = 42;
            }
            return C.x;
          }
        }
        expect(f()).toBe(42);
      });

      it('instance field on a class declared in finally', () => {
        function f() {
          try {
            throw 1;
          } catch (_) {
          } finally {
            class C {
              y = 7;
            }
            return new C().y;
          }
        }
        expect(f()).toBe(7);
      });

      it('private method on a class declared in finally', () => {
        function f() {
          try {
            throw 1;
          } catch (_) {
          } finally {
            class C {
              #m() {
                return 'private';
              }
              call() {
                return this.#m();
              }
            }
            return new C().call();
          }
        }
        expect(f()).toBe('private');
      });

      it('class with computed key declared in finally', () => {
        function f() {
          const k = 'computed';
          try {
            throw 1;
          } catch (_) {
          } finally {
            class C {
              [k] = 99;
            }
            return new C().computed;
          }
        }
        expect(f()).toBe(99);
      });

      it('class with extends declared in finally', () => {
        class Base {
          base() {
            return 'base';
          }
        }
        function f() {
          try {
            throw 1;
          } catch (_) {
          } finally {
            class C extends Base {
              child() {
                return 'child';
              }
            }
            const c = new C();
            return c.base() + ':' + c.child();
          }
        }
        expect(f()).toBe('base:child');
      });

      it('multiple classes declared in the same finally', () => {
        function f() {
          try {
            throw 1;
          } catch (_) {
          } finally {
            class A {
              tag() {
                return 'a';
              }
            }
            class B extends A {
              tag() {
                return super.tag() + 'b';
              }
            }
            return new B().tag();
          }
        }
        expect(f()).toBe('ab');
      });

      it('class declared in a nested block inside finally', () => {
        function f(cond) {
          try {
            throw 1;
          } catch (_) {
          } finally {
            if (cond) {
              class C {
                static v = 'inner';
              }
              return C.v;
            }
            return 'fallback';
          }
        }
        expect(f(true)).toBe('inner');
        expect(f(false)).toBe('fallback');
      });

      it('class expression assigned in finally', () => {
        function f() {
          try {
            throw 1;
          } catch (_) {
          } finally {
            const C = class {
              static v = 5;
            };
            return C.v;
          }
        }
        expect(f()).toBe(5);
      });

      it('control: class outside try/finally', () => {
        class C {
          static x = 42;
        }
        expect(C.x).toBe(42);
      });

      it('control: class inside try block (not finally)', () => {
        function f() {
          try {
            class C {
              static x = 42;
            }
            return C.x;
          } catch (_) {
            return -1;
          }
        }
        expect(f()).toBe(42);
      });

      it('control: class inside catch block (not finally)', () => {
        function f() {
          try {
            throw 1;
          } catch (_) {
            class C {
              static x = 42;
            }
            return C.x;
          }
        }
        expect(f()).toBe(42);
      });
    });

    describe('super in object literal accessors', () => {
      // See: facebook/hermes 18a963465 (genFunctionExpression home object for accessors)
      it('non-computed getter reads super', () => {
        const o = {
          get a() {
            return super.m;
          },
        };
        Object.setPrototypeOf(o, { m: 12 });
        expect(o.a).toBe(12);
      });

      it('non-computed setter writes super', () => {
        const target = { _m: 0 };
        const o = {
          set a(v) {
            super.m = v;
          },
        };
        Object.setPrototypeOf(o, {
          set m(v) {
            target._m = v;
          },
        });
        o.a = 99;
        expect(target._m).toBe(99);
      });

      it('non-computed getter with string-literal key reads super', () => {
        const o = {
          get 'weird key'() {
            return super.m;
          },
        };
        Object.setPrototypeOf(o, { m: 'ok' });
        expect(o['weird key']).toBe('ok');
      });

      it('paired getter/setter on the same key', () => {
        const store = { _v: 0 };
        const o = {
          get a() {
            return super.m;
          },
          set a(v) {
            super.m = v;
          },
        };
        Object.setPrototypeOf(o, {
          get m() {
            return store._v;
          },
          set m(v) {
            store._v = v;
          },
        });
        o.a = 5;
        expect(o.a).toBe(5);
        expect(store._v).toBe(5);
      });

      it('getter reaches super through a nested arrow', () => {
        const o = {
          get a() {
            return (() => super.m)();
          },
        };
        Object.setPrototypeOf(o, { m: 7 });
        expect(o.a).toBe(7);
      });

      it('control: computed getter with super', () => {
        const o = {
          get ['a']() {
            return super.m;
          },
        };
        Object.setPrototypeOf(o, { m: 1 });
        expect(o.a).toBe(1);
      });

      it('control: getter without super', () => {
        const o = {
          get a() {
            return 3;
          },
        };
        expect(o.a).toBe(3);
      });

      it('control: class accessor with super', () => {
        class Base {
          get m() {
            return 8;
          }
        }
        class C extends Base {
          get a() {
            return super.m;
          }
        }
        expect(new C().a).toBe(8);
      });

      it('control: nested object accessor owns its own super', () => {
        const o = {
          get a() {
            return {
              get b() {
                return super.m;
              },
            };
          },
        };
        const inner = o.a;
        Object.setPrototypeOf(inner, { m: 4 });
        expect(inner.b).toBe(4);
      });
    });
  });
}
