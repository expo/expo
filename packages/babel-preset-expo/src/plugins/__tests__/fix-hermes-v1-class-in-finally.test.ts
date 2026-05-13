import { transformSync } from '@babel/core';

import { fixHermesV1ClassInFinally } from '../fix-hermes-v1-class-in-finally';

function transform(code: string) {
  const result = transformSync(code, {
    plugins: [fixHermesV1ClassInFinally],
    configFile: false,
    babelrc: false,
    compact: false,
  });
  return result!.code!;
}

describe('classes inside finally', () => {
  it('wraps a class declaration', () => {
    expect(
      transform(
        `function f() { try { throw 1; } finally { class C { static x = 42; } return C.x; } }`
      )
    ).toMatchInlineSnapshot(`
"function f() {
  try {
    throw 1;
  } finally {
    var C = (() => {
      class C {
        static x = 42;
      }
      return C;
    })();
    return C.x;
  }
}"
`);
  });

  it('wraps multiple class declarations', () => {
    expect(transform(`try {} finally { class A {} class B extends A {} use(A, B); }`))
      .toMatchInlineSnapshot(`
"try {} finally {
  var A = (() => {
    class A {}
    return A;
  })();
  var B = (() => {
    class B extends A {}
    return B;
  })();
  use(A, B);
}"
`);
  });

  it('wraps a class expression', () => {
    expect(transform(`try {} finally { use(class { method() {} }); }`)).toMatchInlineSnapshot(`
"try {} finally {
  use((() => class {
    method() {}
  })());
}"
`);
  });

  it('wraps classes nested in blocks inside finally', () => {
    expect(transform(`try {} finally { if (cond) { class C {} use(C); } }`)).toMatchInlineSnapshot(`
"try {} finally {
  if (cond) {
    var C = (() => {
      class C {}
      return C;
    })();
    use(C);
  }
}"
`);
  });

  it('preserves extends, methods, and static/private fields', () => {
    expect(
      transform(
        `try {} finally { class C extends Base { #priv = 1; static s = 2; m() { return this.#priv; } } }`
      )
    ).toMatchInlineSnapshot(`
"try {} finally {
  var C = (() => {
    class C extends Base {
      #priv = 1;
      static s = 2;
      m() {
        return this.#priv;
      }
    }
    return C;
  })();
}"
`);
  });
});

describe('untouched', () => {
  it('leaves a class outside any try/finally alone', () => {
    expect(transform(`class C {}`)).toMatchInlineSnapshot(`"class C {}"`);
  });

  it('leaves a class in a try block alone', () => {
    expect(transform(`try { class C {} } catch (e) {}`)).toMatchInlineSnapshot(`
"try {
  class C {}
} catch (e) {}"
`);
  });

  it('leaves a class in a catch block alone', () => {
    expect(transform(`try {} catch (e) { class C {} }`)).toMatchInlineSnapshot(`
"try {} catch (e) {
  class C {}
}"
`);
  });

  it('leaves a class behind a function boundary inside finally alone', () => {
    expect(transform(`try {} finally { (() => { class C {} return C; })(); }`))
      .toMatchInlineSnapshot(`
"try {} finally {
  (() => {
    class C {}
    return C;
  })();
}"
`);
  });

  it('leaves a class inside a method body inside finally alone', () => {
    expect(transform(`try {} finally { class Outer { m() { class Inner {} return Inner; } } }`))
      .toMatchInlineSnapshot(`
"try {} finally {
  var Outer = (() => {
    class Outer {
      m() {
        class Inner {}
        return Inner;
      }
    }
    return Outer;
  })();
}"
`);
  });

  it('leaves a try/finally with no class inside alone', () => {
    expect(transform(`try { a(); } finally { b(); }`)).toMatchInlineSnapshot(`
"try {
  a();
} finally {
  b();
}"
`);
  });
});
