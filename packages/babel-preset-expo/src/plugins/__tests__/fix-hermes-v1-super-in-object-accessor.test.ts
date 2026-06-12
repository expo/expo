import { transformSync } from '@babel/core';

import { fixHermesV1SuperInObjectAccessor } from '../fix-hermes-v1-super-in-object-accessor';

function transform(code: string) {
  const result = transformSync(code, {
    plugins: [fixHermesV1SuperInObjectAccessor],
    configFile: false,
    babelrc: false,
    compact: false,
  });
  return result!.code!;
}

describe('object literal accessors with super', () => {
  it('rewrites a non-computed identifier-keyed getter with super', () => {
    expect(transform(`const o = { get a() { return super.m; } };`)).toMatchInlineSnapshot(`
"const o = {
  get ["a"]() {
    return super.m;
  }
};"
`);
  });

  it('rewrites a non-computed identifier-keyed setter with super', () => {
    expect(transform(`const o = { set a(v) { super.m = v; } };`)).toMatchInlineSnapshot(`
"const o = {
  set ["a"](v) {
    super.m = v;
  }
};"
`);
  });

  it('rewrites a string-literal-keyed getter with super', () => {
    expect(transform(`const o = { get "weird key"() { return super.m; } };`))
      .toMatchInlineSnapshot(`
"const o = {
  get ["weird key"]() {
    return super.m;
  }
};"
`);
  });

  it('detects super reachable through a nested arrow', () => {
    expect(transform(`const o = { get a() { return (() => super.m)(); } };`))
      .toMatchInlineSnapshot(`
"const o = {
  get ["a"]() {
    return (() => super.m)();
  }
};"
`);
  });
});

describe('untouched', () => {
  it('leaves an accessor without super alone', () => {
    expect(transform(`const o = { get a() { return 1; } };`)).toMatchInlineSnapshot(`
"const o = {
  get a() {
    return 1;
  }
};"
`);
  });

  it('leaves an already-computed accessor alone', () => {
    expect(transform(`const o = { get ['a']() { return super.m; } };`)).toMatchInlineSnapshot(`
"const o = {
  get ['a']() {
    return super.m;
  }
};"
`);
  });

  it('leaves a regular method (kind: method) alone', () => {
    expect(transform(`const o = { m() { return super.m; } };`)).toMatchInlineSnapshot(`
"const o = {
  m() {
    return super.m;
  }
};"
`);
  });

  it('leaves a class method with super alone', () => {
    expect(transform(`class C extends B { get a() { return super.m; } }`)).toMatchInlineSnapshot(`
"class C extends B {
  get a() {
    return super.m;
  }
}"
`);
  });

  it('does not flip when super only appears in a nested class static block', () => {
    expect(
      transform(`const o = { get a() { class C extends B { static { super.m; } } return C; } };`)
    ).toMatchInlineSnapshot(`
"const o = {
  get a() {
    class C extends B {
      static {
        super.m;
      }
    }
    return C;
  }
};"
`);
  });

  it('does not flip when super only appears in a nested class field initializer', () => {
    expect(transform(`const o = { get a() { class C extends B { x = super.m; } return C; } };`))
      .toMatchInlineSnapshot(`
"const o = {
  get a() {
    class C extends B {
      x = super.m;
    }
    return C;
  }
};"
`);
  });

  it('does not flip when super only appears in a nested object accessor', () => {
    expect(transform(`const o = { get a() { return { get b() { return super.m; } }.b; } };`))
      .toMatchInlineSnapshot(`
"const o = {
  get a() {
    return {
      get ["b"]() {
        return super.m;
      }
    }.b;
  }
};"
`);
  });
});
