import { transformSync, types as t } from '@babel/core';

import { fixHermesV1AsyncArrowNonSimpleParams } from '../fix-hermes-v1-async-arrow-non-simple-params';

function transform(code: string) {
  const result = transformSync(code, {
    plugins: [fixHermesV1AsyncArrowNonSimpleParams],
    configFile: false,
    babelrc: false,
    compact: false,
  });
  return result!.code!;
}

function transformWithFlowParser(code: string) {
  const result = transformSync(code, {
    plugins: [fixHermesV1AsyncArrowNonSimpleParams],
    parserOpts: { plugins: ['flow'] },
    configFile: false,
    babelrc: false,
    compact: false,
    ast: true,
  });
  const paramTypes: string[] = [];
  t.traverseFast(result!.ast!, (node) => {
    if (t.isArrowFunctionExpression(node)) {
      paramTypes.push(...node.params.map((param) => param.type));
    }
  });
  return { code: result!.code!, paramTypes };
}

describe('non-simple async arrows', () => {
  it('rewrites object destructure', () => {
    expect(transform(`const f = async ({ b }) => 42;`)).toMatchInlineSnapshot(`
      "const f = async _p => {
        var {
          b
        } = _p;
        return 42;
      };"
    `);
  });

  it('rewrites rest params ', () => {
    expect(transform(`const f = async (...rest) => 42;`)).toMatchInlineSnapshot(`
      "const f = (...rest) => (async () => {
        return 42;
      })();"
    `);
  });

  it('rewrites object destructure with rename and default', () => {
    expect(transform(`const f = async ({ a: x = 7 }) => x;`)).toMatchInlineSnapshot(`
      "const f = async _p => {
        var {
          a: x = 7
        } = _p;
        return x;
      };"
    `);
  });

  it('rewrites array destructure', () => {
    expect(transform(`const f = async ([a, b]) => a + b;`)).toMatchInlineSnapshot(`
      "const f = async _p => {
        var [a, b] = _p;
        return a + b;
      };"
    `);
  });

  it('rewrites array destructure with rest', () => {
    expect(transform(`const f = async ([a, ...rest]) => rest;`)).toMatchInlineSnapshot(`
      "const f = async _p => {
        var [a, ...rest] = _p;
        return rest;
      };"
    `);
  });

  it('rewrites default value param', () => {
    expect(transform(`const f = async (x = 7) => x;`)).toMatchInlineSnapshot(`
      "const f = async _p => {
        var x = _p === undefined ? 7 : _p;
        return x;
      };"
    `);
  });

  it('rewrites default value param with side-effecting expression', () => {
    expect(transform(`const f = async (x = compute()) => x;`)).toMatchInlineSnapshot(`
      "const f = async _p => {
        var x = _p === undefined ? compute() : _p;
        return x;
      };"
    `);
  });

  it('rewrites rest param', () => {
    expect(transform(`const f = async (...rest) => rest.length;`)).toMatchInlineSnapshot(`
      "const f = (...rest) => (async () => {
        return rest.length;
      })();"
    `);
  });

  it('rewrites mixed simple, destructure, default, and rest params', () => {
    expect(transform(`const f = async (a, { b }, c = 1, ...rest) => [a, b, c, rest];`))
      .toMatchInlineSnapshot(`
      "const f = (a, {
        b
      }, c = 1, ...rest) => (async () => {
        return [a, b, c, rest];
      })();"
    `);
  });

  it('promotes concise body to block with return', () => {
    expect(transform(`const f = async ({ b }) => await b;`)).toMatchInlineSnapshot(`
      "const f = async _p => {
        var {
          b
        } = _p;
        return await b;
      };"
    `);
  });

  it('preserves block body and prepends inits', () => {
    expect(transform(`const f = async ({ b }) => { const c = b + 1; return c; };`))
      .toMatchInlineSnapshot(`
      "const f = async _p => {
        var {
          b
        } = _p;
        const c = b + 1;
        return c;
      };"
    `);
  });
});

describe('params left as expressions by the flow parser', () => {
  // With the `flow` parser plugin, @babel/parser doesn't convert the params of an arrow with a
  // block body in a conditional consequent to patterns, e.g. `...r` is left as a `SpreadElement`
  // and `{ a }` as an `ObjectExpression`
  const cases = {
    rest: `const g = e => (e ? async (...r) => { return r } : 0);`,
    object: `const g = e => (e ? async ({ a, b: [c = 1, ...d] }) => { return a } : 0);`,
    array: `const g = e => (e ? async ([a, b]) => { return a } : 0);`,
    default: `const g = e => (e ? async (a = 1) => { return a } : 0);`,
    annotated: `const g = e => (e ? async ({ a }: Props) => { return a } : 0);`,
    mixed: `const g = e => (e ? async (a, { b }, c = 1, ...rest) => { return rest } : 0);`,
  };

  it('rewrites rest param', () => {
    expect(transformWithFlowParser(cases.rest).code).toMatchInlineSnapshot(`
      "const g = e => e ? (...r) => (async () => {
        return r;
      })() : 0;"
    `);
  });

  it('rewrites object destructure', () => {
    expect(transformWithFlowParser(cases.object).code).toMatchInlineSnapshot(`
      "const g = e => e ? async _p => {
        var {
          a,
          b: [c = 1, ...d]
        } = _p;
        return a;
      } : 0;"
    `);
  });

  it('rewrites array destructure', () => {
    expect(transformWithFlowParser(cases.array).code).toMatchInlineSnapshot(`
      "const g = e => e ? async _p => {
        var [a, b] = _p;
        return a;
      } : 0;"
    `);
  });

  it('rewrites default value param', () => {
    expect(transformWithFlowParser(cases.default).code).toMatchInlineSnapshot(`
      "const g = e => e ? async _p => {
        var a = _p === undefined ? 1 : _p;
        return a;
      } : 0;"
    `);
  });

  it('rewrites type-annotated destructure', () => {
    expect(transformWithFlowParser(cases.annotated).code).toMatchInlineSnapshot(`
      "const g = e => e ? async _p => {
        var {
          a
        }: Props = _p;
        return a;
      } : 0;"
    `);
  });

  it('rewrites mixed simple, destructure, default, and rest params', () => {
    expect(transformWithFlowParser(cases.mixed).code).toMatchInlineSnapshot(`
      "const g = e => e ? (a, {
        b
      }, c = 1, ...rest) => (async () => {
        return rest;
      })() : 0;"
    `);
  });

  it('emits params as patterns', () => {
    for (const code of Object.values(cases)) {
      for (const type of transformWithFlowParser(code).paramTypes) {
        expect([
          'Identifier',
          'ObjectPattern',
          'ArrayPattern',
          'AssignmentPattern',
          'RestElement',
        ]).toContain(type);
      }
    }
  });
});

describe('untouched', () => {
  it('leaves async arrow with simple params alone', () => {
    expect(transform(`const f = async (a, b) => a + b;`)).toMatchInlineSnapshot(
      `"const f = async (a, b) => a + b;"`
    );
  });

  it('leaves async arrow with no params alone', () => {
    expect(transform(`const f = async () => 42;`)).toMatchInlineSnapshot(
      `"const f = async () => 42;"`
    );
  });

  it('leaves sync arrow with destructured params alone', () => {
    expect(transform(`const f = ({ b }) => b;`)).toMatchInlineSnapshot(`
      "const f = ({
        b
      }) => b;"
    `);
  });

  it('leaves async function declaration with destructured params alone', () => {
    expect(transform(`async function f({ b }) { return b; }`)).toMatchInlineSnapshot(`
      "async function f({
        b
      }) {
        return b;
      }"
    `);
  });

  it('leaves async function expression with destructured params alone', () => {
    expect(transform(`const f = async function ({ b }) { return b; };`)).toMatchInlineSnapshot(`
      "const f = async function ({
        b
      }) {
        return b;
      };"
    `);
  });

  it('leaves class async method with destructured params alone', () => {
    expect(transform(`class C { async m({ b }) { return b; } }`)).toMatchInlineSnapshot(`
      "class C {
        async m({
          b
        }) {
          return b;
        }
      }"
    `);
  });

  it('leaves object shorthand async method with destructured params alone', () => {
    expect(transform(`const o = { async m({ b }) { return b; } };`)).toMatchInlineSnapshot(`
      "const o = {
        async m({
          b
        }) {
          return b;
        }
      };"
    `);
  });
});
