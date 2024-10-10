/**
 * Copyright © 2024 650 Industries.
 */

import * as babel from '@babel/core';

import preset from '..';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
  isReactServer: true,
  platform: 'ios',
  projectRoot: __dirname,
  supportsStaticESM: true,
};

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
  filename: '/unknown',

  babelrc: false,
  presets: [preset],

  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  retainLines: false,
  caller: getCaller({ ...ENABLED_CALLER }),
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, FORCE_COLOR: '0' };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

// import { createPlugin as createReactServerPlugin } from '../server-actions-plugin';

function transformTest(sourceCode: string) {
  const options = {
    ...DEF_OPTIONS,
    // plugins: [serverActionPlugin],
    caller: getCaller(ENABLED_CALLER),
  };

  const results = babel.transform(sourceCode, options);
  if (!results) throw new Error('Failed to transform code');
  //   console.log('results', results.code);
  const meta = results.metadata as unknown as { hasCjsExports?: boolean };
  return {
    code: results.code,
    hasCjsExports: meta.hasCjsExports,
    metadata: meta,
  };
}

describe('scope', () => {
  it('does not leak state between two different files', () => {
    const sourceCode = `"use server"; export const foo = async () => {}`;

    const aRes = babel.transform(sourceCode, {
      ...DEF_OPTIONS,
      filename: '/a',
      caller: getCaller(ENABLED_CALLER),
      // @ts-expect-error: not in types
    })!.metadata!.reactServerActions.id;

    const bRes = babel.transform(sourceCode, {
      ...DEF_OPTIONS,
      filename: '/b',
      caller: getCaller(ENABLED_CALLER),
      // @ts-expect-error: not in types
    })!.metadata!.reactServerActions.id;

    expect(aRes).toBe('file:///a');
    expect(bRes).toBe('file:///b');
    expect(aRes).not.toMatch(bRes);
  });
});

describe('syntax', () => {
  it('supports server actions with named functions', () => {
    expect(
      transformTest(`
  async function foo() {
      "use server"
      return 'bar';
  }`).code
    ).toMatchInlineSnapshot(`
      "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION"]}*/
      import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
      // hoisted action: foo
      export const _$$INLINE_ACTION = _registerServerReference(async function foo() {
        return 'bar';
      }, "file:///unknown", "_$$INLINE_ACTION");
      var foo = _$$INLINE_ACTION;"
    `);
  });

  it('supports server actions with arrow functions', () => {
    expect(
      transformTest(`
  const foo = async (bar) => {
      "use server"
      return 'bar';
  }`).code
    ).toMatchInlineSnapshot(`
      "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION"]}*/
      import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
      // hoisted action: <anonymous>
      export const _$$INLINE_ACTION = _registerServerReference(async bar => {
        return 'bar';
      }, "file:///unknown", "_$$INLINE_ACTION");
      const foo = _$$INLINE_ACTION;"
    `);
  });

  it('supports top-level server action exports', () => {
    expect(
      transformTest(`

const external = () => {}

const SOME_CONSTANT = "beep";

export const test1 = async (x) => {
  "use server";
  return external([x, SOME_CONSTANT]);
};

export async function test2(x) {
  "use server";
  return external([x, SOME_CONSTANT]);
}

async function test2a(x) {
  "use server";
  return external([x, SOME_CONSTANT]);
}

export { test2a };

`).code
    ).toMatchInlineSnapshot(`
      "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION","_$$INLINE_ACTION2","_$$INLINE_ACTION3"]}*/
      import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
      // hoisted action: test2a
      export const _$$INLINE_ACTION3 = _registerServerReference(async function test2a(x) {
        return external([x, SOME_CONSTANT]);
      }, "file:///unknown", "_$$INLINE_ACTION3");
      // hoisted action: test2
      export const _$$INLINE_ACTION2 = _registerServerReference(async function test2(x) {
        return external([x, SOME_CONSTANT]);
      }, "file:///unknown", "_$$INLINE_ACTION2");
      // hoisted action: <anonymous>
      export const _$$INLINE_ACTION = _registerServerReference(async x => {
        return external([x, SOME_CONSTANT]);
      }, "file:///unknown", "_$$INLINE_ACTION");
      const external = () => {};
      const SOME_CONSTANT = "beep";
      export const test1 = _$$INLINE_ACTION;
      export var test2 = _$$INLINE_ACTION2;
      var test2a = _$$INLINE_ACTION3;
      export { test2a };"
    `);
  });

  it('supports HOC server actions', () => {
    expect(
      transformTest(`
const external = () => {};

const SOME_CONSTANT = "beep";

const withAuth =
  (fn) =>
  async (...args) => {
    "use server";
    return fn(...args);
  };

export const test3 = withAuth(async (x) => {
  "use server";
  return external([x, SOME_CONSTANT]);
});
`).code
    ).toMatchInlineSnapshot(`
      "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION","_$$INLINE_ACTION2"]}*/
      import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
      var _wrapBoundArgs = thunk => {
        let cache;
        return {
          get value() {
            return cache || (cache = thunk());
          }
        };
      };
      // hoisted action: <anonymous>
      export const _$$INLINE_ACTION2 = _registerServerReference(async x => {
        return external([x, SOME_CONSTANT]);
      }, "file:///unknown", "_$$INLINE_ACTION2");
      // hoisted action: <anonymous>
      export const _$$INLINE_ACTION = _registerServerReference(async (_$$CLOSURE, ...args) => {
        var [fn] = _$$CLOSURE.value;
        return fn(...args);
      }, "file:///unknown", "_$$INLINE_ACTION");
      const external = () => {};
      const SOME_CONSTANT = "beep";
      const withAuth = fn => _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [fn]));
      export const test3 = withAuth(_$$INLINE_ACTION2);"
    `);
  });

  it('supports module-level "use server" directive', () => {
    expect(
      transformTest(`
"use server"

export async function foo() {

}
    `).code
    ).toMatchInlineSnapshot(`
      "/*rsc/actions: {"id":"file:///unknown","names":["foo"]}*/
      import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
      export async function foo() {}
      (() => _registerServerReference(foo, "file:///unknown", "foo"))();"
    `);
  });

  it('supports actions that are defined after the return statement', () => {
    expect(
      transformTest(`
  const external = () => {}
  
  export const Test = ({ foo }) => {
    const foo2 = foo;
    return (
      <form action={doStuff}>
        <input name="test" type="text" />
        <button type="submit">Submit</button>
      </form>
    );
    async function doStuff(data) {
      "use server";
      const test = data.get("test");
      await external({ test, foo: foo2 });
      return { success: true };
    }
  };`).code
    ).toMatchInlineSnapshot(`
      "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION"]}*/
      import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
      var _wrapBoundArgs = thunk => {
        let cache;
        return {
          get value() {
            return cache || (cache = thunk());
          }
        };
      };
      import { jsx as _jsx } from "react/jsx-runtime";
      import { jsxs as _jsxs } from "react/jsx-runtime";
      // hoisted action: doStuff
      export const _$$INLINE_ACTION = _registerServerReference(async function doStuff(_$$CLOSURE, data) {
        var [foo2] = _$$CLOSURE.value;
        const test = data.get("test");
        await external({
          test,
          foo: foo2
        });
        return {
          success: true
        };
      }, "file:///unknown", "_$$INLINE_ACTION");
      const external = () => {};
      export const Test = ({
        foo
      }) => {
        var doStuff = _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [foo2]));
        const foo2 = foo;
        return /*#__PURE__*/_jsxs("form", {
          action: doStuff,
          children: [/*#__PURE__*/_jsx("input", {
            name: "test",
            type: "text"
          }), /*#__PURE__*/_jsx("button", {
            type: "submit",
            children: "Submit"
          })]
        });
      };"
    `);
  });

  it('supports actions that are defined after the return statement in an extraneous closure', () => {
    expect(
      transformTest(`
const external = () => {}

export const Test2 = ({ foo }) => {
  const foo2 = foo;
  {
    return (
      <form action={doStuff}>
        <input name="test" type="text" />
        <button type="submit">Submit</button>
      </form>
    );

    async function doStuff(data) {
      "use server";
      const test = data.get("test");
      await doSomethingOnTheServer({ test, foo: foo2 });
      return { success: true };
    }
  }
};`).code
    ).toMatchInlineSnapshot(`
      "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION"]}*/
      import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
      var _wrapBoundArgs = thunk => {
        let cache;
        return {
          get value() {
            return cache || (cache = thunk());
          }
        };
      };
      import { jsx as _jsx } from "react/jsx-runtime";
      import { jsxs as _jsxs } from "react/jsx-runtime";
      // hoisted action: doStuff
      export const _$$INLINE_ACTION = _registerServerReference(async function doStuff(_$$CLOSURE, data) {
        var [foo2] = _$$CLOSURE.value;
        const test = data.get("test");
        await doSomethingOnTheServer({
          test,
          foo: foo2
        });
        return {
          success: true
        };
      }, "file:///unknown", "_$$INLINE_ACTION");
      const external = () => {};
      export const Test2 = ({
        foo
      }) => {
        const foo2 = foo;
        {
          var doStuff = _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [foo2]));
          return /*#__PURE__*/_jsxs("form", {
            action: doStuff,
            children: [/*#__PURE__*/_jsx("input", {
              name: "test",
              type: "text"
            }), /*#__PURE__*/_jsx("button", {
              type: "submit",
              children: "Submit"
            })]
          });
        }
      };"
    `);
  });
});

describe('assertions', () => {
  it('asserts that server actions must be async functions', () => {
    expect(() =>
      transformTest(`
  function foo() {
      "use server"
  }`)
    ).toThrowErrorMatchingInlineSnapshot(`
      "/unknown: functions marked with "use server" must be async
        1 |
      > 2 |   function foo() {
          |   ^
        3 |       "use server"
        4 |   }"
    `);
  });
  it('asserts that arrow-based server actions must be async', () => {
    expect(() =>
      transformTest(`
  const foo = () => {
      "use server"
  }`)
    ).toThrowErrorMatchingInlineSnapshot(`
      "/unknown: functions marked with "use server" must be async
        1 |
      > 2 |   const foo = () => {
          |               ^
        3 |       "use server"
        4 |   }"
    `);
  });

  it('asserts top-level directive with default export of arrow function is not supported', () => {
    expect(() =>
      transformTest(`
"use server";
export default async (formData) => { 
};`)
    ).toThrowErrorMatchingInlineSnapshot(`
      "/unknown: Not implemented: 'export default' declarations in "use server" files. Try using 'export { name as default }' instead.
        1 |
        2 | "use server";
      > 3 | export default async (formData) => { 
          | ^
        4 | };"
    `);
  });

  it('asserts top-level directive with default export of named function is not supported', () => {
    expect(() =>
      transformTest(`
"use server";

export default async function test() {
}`)
    ).toThrowErrorMatchingInlineSnapshot(`
      "/unknown: Not implemented: 'export default' declarations in "use server" files. Try using 'export { name as default }' instead.
        2 | "use server";
        3 |
      > 4 | export default async function test() {
          | ^
        5 | }"
    `);
  });

  it('asserts top-level directive with default export of variable', () => {
    expect(() =>
      transformTest(`
"use server";

async function test() {
}

export default test;
`)
    ).toThrowErrorMatchingInlineSnapshot(`
      "/unknown: Not implemented: 'export default' declarations in "use server" files. Try using 'export { name as default }' instead.
        5 | }
        6 |
      > 7 | export default test;
          | ^^^^^^^^^^^^^^^^^^^^
        8 |"
    `);
  });
});

it('binds props to server actions', () => {
  expect(
    transformTest(`

function Something({ shared }) {
  const foo = async () => {
      "use server"
      return shared;
  }
}

    `).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    var _wrapBoundArgs = thunk => {
      let cache;
      return {
        get value() {
          return cache || (cache = thunk());
        }
      };
    };
    // hoisted action: <anonymous>
    export const _$$INLINE_ACTION = _registerServerReference(async _$$CLOSURE => {
      var [shared] = _$$CLOSURE.value;
      return shared;
    }, "file:///unknown", "_$$INLINE_ACTION");
    function Something({
      shared
    }) {
      const foo = _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [shared]));
    }"
  `);
});

it('supports top-level directive', () => {
  expect(
    transformTest(`

"use server";
import { doSomethingOnTheServer } from "../server-stuff";

const SOME_CONSTANT = "beep";

export const test1 = async (formData) => {
  return doSomethingOnTheServer([formData, SOME_CONSTANT]);
};

export async function test2() {
  return doSomethingOnTheServer([SOME_CONSTANT]);
}

export { test2 as default, test2 as test3 };

async function test2a(formData) {
  return doSomethingOnTheServer([formData, SOME_CONSTANT]);
}

export { test2a };
`).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["test1","test2","default","test3","test2a"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    import { doSomethingOnTheServer } from "../server-stuff";
    const SOME_CONSTANT = "beep";
    export const test1 = async formData => {
      return doSomethingOnTheServer([formData, SOME_CONSTANT]);
    };
    (() => _registerServerReference(test1, "file:///unknown", "test1"))();
    export async function test2() {
      return doSomethingOnTheServer([SOME_CONSTANT]);
    }
    (() => _registerServerReference(test2, "file:///unknown", "test2"))();
    export { test2 as default, test2 as test3 };
    async function test2a(formData) {
      return doSomethingOnTheServer([formData, SOME_CONSTANT]);
    }
    (() => _registerServerReference(test2a, "file:///unknown", "test2a"))();
    export { test2a };"
  `);
});
it('supports top-level directive mixed with closure-level directives', () => {
  expect(
    transformTest(`

"use server";
import { doSomethingOnTheServer } from "../server-stuff";

const SOME_CONSTANT = "beep";

export const test1 = async (formData) => {
  return doSomethingOnTheServer(["top-level", formData, SOME_CONSTANT]);
};

const withAuth =
  (fn) =>
  async (...args) => {
    "use server";
    console.log("checking auth");
    return fn(...args);
  };

export const test4 = withAuth(async (x) => {
  "use server";
  return doSomethingOnTheServer(["inline-wrapped", x, SOME_CONSTANT]);
});
`).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["test1","_$$INLINE_ACTION","test4","_$$INLINE_ACTION2","_$$INLINE_ACTION","_$$INLINE_ACTION2"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    var _wrapBoundArgs = thunk => {
      let cache;
      return {
        get value() {
          return cache || (cache = thunk());
        }
      };
    };
    import { doSomethingOnTheServer } from "../server-stuff";
    // hoisted action: <anonymous>
    export const _$$INLINE_ACTION2 = _registerServerReference(async x => {
      return doSomethingOnTheServer(["inline-wrapped", x, SOME_CONSTANT]);
    }, "file:///unknown", "_$$INLINE_ACTION2");
    (() => _registerServerReference(_$$INLINE_ACTION2, "file:///unknown", "_$$INLINE_ACTION2"))();
    // hoisted action: <anonymous>
    export const _$$INLINE_ACTION = _registerServerReference(async (_$$CLOSURE, ...args) => {
      var [fn] = _$$CLOSURE.value;
      console.log("checking auth");
      return fn(...args);
    }, "file:///unknown", "_$$INLINE_ACTION");
    (() => _registerServerReference(_$$INLINE_ACTION, "file:///unknown", "_$$INLINE_ACTION"))();
    const SOME_CONSTANT = "beep";
    export const test1 = async formData => {
      return doSomethingOnTheServer(["top-level", formData, SOME_CONSTANT]);
    };
    (() => _registerServerReference(test1, "file:///unknown", "test1"))();
    const withAuth = fn => _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [fn]));
    export const test4 = withAuth(_$$INLINE_ACTION2);
    (() => _registerServerReference(test4, "file:///unknown", "test4"))();"
  `);
});

it('supports arrow function actions that are defined as props in JSX and using props', () => {
  expect(
    transformTest(`
import { doSomethingOnTheServer } from "../server-stuff";

export const Test = ({ foo, bar }) => {
  return (
    <form
      action={async (data) => {
        "use server";
        const test = data.get("test");
        await doSomethingOnTheServer({ test, foo });
        return { success: true };
      }}
    >
      <input name="test" type="text" />
      <button type="submit">Submit</button>
      <button
        type="button"
        formAction={async (data) => {
          "use server";
          const test = data.get("test");
          await doSomethingOnTheServer({ test, foo, bar });
          return { success: true };
        }}
      >
        Submit
      </button>
    </form>
  );
};`).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION","_$$INLINE_ACTION2"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    var _wrapBoundArgs = thunk => {
      let cache;
      return {
        get value() {
          return cache || (cache = thunk());
        }
      };
    };
    import { doSomethingOnTheServer } from "../server-stuff";
    import { jsx as _jsx } from "react/jsx-runtime";
    import { jsxs as _jsxs } from "react/jsx-runtime";
    // hoisted action: <anonymous>
    export const _$$INLINE_ACTION2 = _registerServerReference(async (_$$CLOSURE2, data) => {
      var [bar, foo] = _$$CLOSURE2.value;
      const test = data.get("test");
      await doSomethingOnTheServer({
        test,
        foo,
        bar
      });
      return {
        success: true
      };
    }, "file:///unknown", "_$$INLINE_ACTION2");
    // hoisted action: <anonymous>
    export const _$$INLINE_ACTION = _registerServerReference(async (_$$CLOSURE, data) => {
      var [foo] = _$$CLOSURE.value;
      const test = data.get("test");
      await doSomethingOnTheServer({
        test,
        foo
      });
      return {
        success: true
      };
    }, "file:///unknown", "_$$INLINE_ACTION");
    export const Test = ({
      foo,
      bar
    }) => {
      return /*#__PURE__*/_jsxs("form", {
        action: _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [foo])),
        children: [/*#__PURE__*/_jsx("input", {
          name: "test",
          type: "text"
        }), /*#__PURE__*/_jsx("button", {
          type: "submit",
          children: "Submit"
        }), /*#__PURE__*/_jsx("button", {
          type: "button",
          formAction: _$$INLINE_ACTION2.bind(null, _wrapBoundArgs(() => [bar, foo])),
          children: "Submit"
        })]
      });
    };"
  `);
});

it('supports arrow function actions that are defined in a function component and using props', () => {
  expect(
    transformTest(`
import { doSomethingOnTheServer } from "../server-stuff";

export const Test = ({ foo }) => {
  const doStuff = async (data) => {
    "use server";
    const test = data.get("test");
    await doSomethingOnTheServer({ test, foo });
    return { success: true };
  };
  return (
    <form action={doStuff}>
      <input name="test" type="text" />
      <button type="submit">Submit</button>
    </form>
  );
};`).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    var _wrapBoundArgs = thunk => {
      let cache;
      return {
        get value() {
          return cache || (cache = thunk());
        }
      };
    };
    import { doSomethingOnTheServer } from "../server-stuff";
    import { jsx as _jsx } from "react/jsx-runtime";
    import { jsxs as _jsxs } from "react/jsx-runtime";
    // hoisted action: <anonymous>
    export const _$$INLINE_ACTION = _registerServerReference(async (_$$CLOSURE, data) => {
      var [foo] = _$$CLOSURE.value;
      const test = data.get("test");
      await doSomethingOnTheServer({
        test,
        foo
      });
      return {
        success: true
      };
    }, "file:///unknown", "_$$INLINE_ACTION");
    export const Test = ({
      foo
    }) => {
      const doStuff = _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [foo]));
      return /*#__PURE__*/_jsxs("form", {
        action: doStuff,
        children: [/*#__PURE__*/_jsx("input", {
          name: "test",
          type: "text"
        }), /*#__PURE__*/_jsx("button", {
          type: "submit",
          children: "Submit"
        })]
      });
    };"
  `);
});

it('supports nested server actions', () => {
  expect(
    transformTest(`
/* eslint-disable @typescript-eslint/no-unused-vars */
import { doSomethingOnTheServer } from "../server-stuff";
import "./server-stuff";

export const Test = ({ foo }) => {
  const foo1 = foo;

  async function doStuff(data) {
    "use server";

    const nested = async () => {
      "use server";
      console.log("hi from nested!", foo1);
    };
    await nested();

    const test = data.get("test");
    await doSomethingOnTheServer({ test, foo: foo1 });
  }
  return (
    <form action={doStuff}>
      <input name="test" type="text" />
      <button type="submit">Submit</button>
    </form>
  );
};`).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION","_$$INLINE_ACTION2"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    var _wrapBoundArgs = thunk => {
      let cache;
      return {
        get value() {
          return cache || (cache = thunk());
        }
      };
    };
    /* eslint-disable @typescript-eslint/no-unused-vars */
    import { doSomethingOnTheServer } from "../server-stuff";
    import "./server-stuff";
    import { jsx as _jsx } from "react/jsx-runtime";
    import { jsxs as _jsxs } from "react/jsx-runtime";
    // hoisted action: <anonymous>
    export const _$$INLINE_ACTION2 = _registerServerReference(async _$$CLOSURE2 => {
      var [foo1] = _$$CLOSURE2.value;
      console.log("hi from nested!", foo1);
    }, "file:///unknown", "_$$INLINE_ACTION2");
    // hoisted action: doStuff
    export const _$$INLINE_ACTION = _registerServerReference(async function doStuff(_$$CLOSURE, data) {
      var [foo1] = _$$CLOSURE.value;
      const nested = _$$INLINE_ACTION2.bind(null, _wrapBoundArgs(() => [foo1]));
      await nested();
      const test = data.get("test");
      await doSomethingOnTheServer({
        test,
        foo: foo1
      });
    }, "file:///unknown", "_$$INLINE_ACTION");
    export const Test = ({
      foo
    }) => {
      var doStuff = _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [foo1]));
      const foo1 = foo;
      return /*#__PURE__*/_jsxs("form", {
        action: doStuff,
        children: [/*#__PURE__*/_jsx("input", {
          name: "test",
          type: "text"
        }), /*#__PURE__*/_jsx("button", {
          type: "submit",
          children: "Submit"
        })]
      });
    };"
  `);
});

it('supports named actions that are defined in a function component and using props', () => {
  expect(
    transformTest(`
import { doSomethingOnTheServer } from "../server-stuff";

export const Test = ({ foo }) => {
  async function doStuff(data) {
    "use server";
    const test = data.get("test");
    await doSomethingOnTheServer({ test, foo });
    return { success: true };
  }
  return (
    <form action={doStuff}>
      <input name="test" type="text" />
      <button type="submit">Submit</button>
    </form>
  );
};`).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    var _wrapBoundArgs = thunk => {
      let cache;
      return {
        get value() {
          return cache || (cache = thunk());
        }
      };
    };
    import { doSomethingOnTheServer } from "../server-stuff";
    import { jsx as _jsx } from "react/jsx-runtime";
    import { jsxs as _jsxs } from "react/jsx-runtime";
    // hoisted action: doStuff
    export const _$$INLINE_ACTION = _registerServerReference(async function doStuff(_$$CLOSURE, data) {
      var [foo] = _$$CLOSURE.value;
      const test = data.get("test");
      await doSomethingOnTheServer({
        test,
        foo
      });
      return {
        success: true
      };
    }, "file:///unknown", "_$$INLINE_ACTION");
    export const Test = ({
      foo
    }) => {
      var doStuff = _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [foo]));
      return /*#__PURE__*/_jsxs("form", {
        action: doStuff,
        children: [/*#__PURE__*/_jsx("input", {
          name: "test",
          type: "text"
        }), /*#__PURE__*/_jsx("button", {
          type: "submit",
          children: "Submit"
        })]
      });
    };"
  `);
});

it('supports named actions that are defined in JSX props', () => {
  expect(
    transformTest(`
import { doSomethingOnTheServer } from "../server-stuff";

export const Test = ({ foo }) => {
  return (
    <form
      action={async function doStuff(data) {
        "use server";
        const test = data.get("test");
        await doSomethingOnTheServer({ test, foo });
        return { success: true };
      }}
    >
      <input name="test" type="text" />
      <button type="submit">Submit</button>
    </form>
  );
};`).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    var _wrapBoundArgs = thunk => {
      let cache;
      return {
        get value() {
          return cache || (cache = thunk());
        }
      };
    };
    import { doSomethingOnTheServer } from "../server-stuff";
    import { jsx as _jsx } from "react/jsx-runtime";
    import { jsxs as _jsxs } from "react/jsx-runtime";
    // hoisted action: doStuff
    export const _$$INLINE_ACTION = _registerServerReference(async function doStuff(_$$CLOSURE, data) {
      var [foo] = _$$CLOSURE.value;
      const test = data.get("test");
      await doSomethingOnTheServer({
        test,
        foo
      });
      return {
        success: true
      };
    }, "file:///unknown", "_$$INLINE_ACTION");
    export const Test = ({
      foo
    }) => {
      return /*#__PURE__*/_jsxs("form", {
        action: _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [foo])),
        children: [/*#__PURE__*/_jsx("input", {
          name: "test",
          type: "text"
        }), /*#__PURE__*/_jsx("button", {
          type: "submit",
          children: "Submit"
        })]
      });
    };"
  `);
});

it('supports actions using variables that were named after the function was declared', () => {
  expect(
    transformTest(`
import { doSomethingOnTheServer } from "../server-stuff";

export const Test = ({ foo }) => {
  async function doStuff(data) {
    "use server";
    const test = data.get("test");
    await doSomethingOnTheServer({ test, foo: foo2, beep: x });
    return { success: true };
  }
  const foo2 = foo;
  const x = 5;
  return (
    <form action={doStuff}>
      <input name="test" type="text" />
      <button type="submit">Submit</button>
    </form>
  );
};`).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    var _wrapBoundArgs = thunk => {
      let cache;
      return {
        get value() {
          return cache || (cache = thunk());
        }
      };
    };
    import { doSomethingOnTheServer } from "../server-stuff";
    import { jsx as _jsx } from "react/jsx-runtime";
    import { jsxs as _jsxs } from "react/jsx-runtime";
    // hoisted action: doStuff
    export const _$$INLINE_ACTION = _registerServerReference(async function doStuff(_$$CLOSURE, data) {
      var [foo2, x] = _$$CLOSURE.value;
      const test = data.get("test");
      await doSomethingOnTheServer({
        test,
        foo: foo2,
        beep: x
      });
      return {
        success: true
      };
    }, "file:///unknown", "_$$INLINE_ACTION");
    export const Test = ({
      foo
    }) => {
      var doStuff = _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [foo2, x]));
      const foo2 = foo;
      const x = 5;
      return /*#__PURE__*/_jsxs("form", {
        action: doStuff,
        children: [/*#__PURE__*/_jsx("input", {
          name: "test",
          type: "text"
        }), /*#__PURE__*/_jsx("button", {
          type: "submit",
          children: "Submit"
        })]
      });
    };"
  `);
});

it('supports actions as named functions nested in components', () => {
  expect(
    transformTest(`
import { doSomethingOnTheServer } from "../server-stuff";

export const Test = ({ foo }) => {
  async function doStuff(data) {
    "use server";
    const test = data.get("test");
    await doSomethingOnTheServer({ test, foo: foo2 });
    return { success: true };
  }
  const foo2 = foo;

  async function doStuffWrapped(data) {
    "use server";
    return doStuff(data);
  }

  return (
    <form action={doStuffWrapped}>
      <input name="test" type="text" />
      <button type="submit">Submit</button>
    </form>
  );
};`).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION","_$$INLINE_ACTION2"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    var _wrapBoundArgs = thunk => {
      let cache;
      return {
        get value() {
          return cache || (cache = thunk());
        }
      };
    };
    import { doSomethingOnTheServer } from "../server-stuff";
    import { jsx as _jsx } from "react/jsx-runtime";
    import { jsxs as _jsxs } from "react/jsx-runtime";
    // hoisted action: doStuffWrapped
    export const _$$INLINE_ACTION2 = _registerServerReference(async function doStuffWrapped(_$$CLOSURE2, data) {
      var [doStuff] = _$$CLOSURE2.value;
      return doStuff(data);
    }, "file:///unknown", "_$$INLINE_ACTION2");
    // hoisted action: doStuff
    export const _$$INLINE_ACTION = _registerServerReference(async function doStuff(_$$CLOSURE, data) {
      var [foo2] = _$$CLOSURE.value;
      const test = data.get("test");
      await doSomethingOnTheServer({
        test,
        foo: foo2
      });
      return {
        success: true
      };
    }, "file:///unknown", "_$$INLINE_ACTION");
    export const Test = ({
      foo
    }) => {
      var doStuffWrapped = _$$INLINE_ACTION2.bind(null, _wrapBoundArgs(() => [doStuff]));
      var doStuff = _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [foo2]));
      const foo2 = foo;
      return /*#__PURE__*/_jsxs("form", {
        action: doStuffWrapped,
        children: [/*#__PURE__*/_jsx("input", {
          name: "test",
          type: "text"
        }), /*#__PURE__*/_jsx("button", {
          type: "submit",
          children: "Submit"
        })]
      });
    };"
  `);
});

it('supports actions nested in components', () => {
  expect(
    transformTest(`
/* eslint-disable @typescript-eslint/no-unused-vars */
import { doSomethingOnTheServer } from "../server-stuff";
import "./server-stuff";

export const Test = ({ foo }) => {
  const foo1 = foo;
  const test = 5; // potential conflict
  if (foo) {
    const test = 5; // another potential conflict
    const foo2 = foo1;
    // eslint-disable-next-line no-constant-condition
    if (true) {
      // eslint-disable-next-line no-inner-declarations
      async function doStuff(data) {
        "use server";
        const test = data.get("test");
        if (Math.random() > 0.5) {
          // @ts-expect-error  missing decl for process
          console.log(process.env.WHATEVER);
          await doSomethingOnTheServer({ test, foo: foo2 });
        } else {
          const foo2 = "overrwritten";
          await doSomethingOnTheServer({ test, foo: foo2 });
        }
      }
      return (
        <form action={doStuff}>
          <input name="test" type="text" />
          <button type="submit">Submit</button>
        </form>
      );
    }
  }
  return null;
};`).code
  ).toMatchInlineSnapshot(`
    "/*rsc/actions: {"id":"file:///unknown","names":["_$$INLINE_ACTION"]}*/
    import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";
    var _wrapBoundArgs = thunk => {
      let cache;
      return {
        get value() {
          return cache || (cache = thunk());
        }
      };
    };
    /* eslint-disable @typescript-eslint/no-unused-vars */
    import { doSomethingOnTheServer } from "../server-stuff";
    import "./server-stuff";
    import { jsx as _jsx } from "react/jsx-runtime";
    import { jsxs as _jsxs } from "react/jsx-runtime";
    // hoisted action: doStuff
    export const _$$INLINE_ACTION = _registerServerReference(async function doStuff(_$$CLOSURE, data) {
      var [foo2] = _$$CLOSURE.value;
      const test = data.get("test");
      if (Math.random() > 0.5) {
        // @ts-expect-error  missing decl for process
        console.log(process.env.WHATEVER);
        await doSomethingOnTheServer({
          test,
          foo: foo2
        });
      } else {
        const foo2 = "overrwritten";
        await doSomethingOnTheServer({
          test,
          foo: foo2
        });
      }
    }, "file:///unknown", "_$$INLINE_ACTION");
    export const Test = ({
      foo
    }) => {
      const foo1 = foo;
      const test = 5; // potential conflict
      if (foo) {
        const test = 5; // another potential conflict
        const foo2 = foo1;
        // eslint-disable-next-line no-constant-condition
        if (true) {
          var doStuff = _$$INLINE_ACTION.bind(null, _wrapBoundArgs(() => [foo2]));
          // eslint-disable-next-line no-inner-declarations

          return /*#__PURE__*/_jsxs("form", {
            action: doStuff,
            children: [/*#__PURE__*/_jsx("input", {
              name: "test",
              type: "text"
            }), /*#__PURE__*/_jsx("button", {
              type: "submit",
              children: "Submit"
            })]
          });
        }
      }
      return null;
    };"
  `);
});
