/**
 * Copyright © 2025 650 Industries.
 */

import * as babel from '@babel/core';

import preset from '..';

const CLIENT_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
  platform: 'web',
  projectRoot: '/',
  supportsStaticESM: true,
};

const SERVER_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: true,
  platform: 'web',
  projectRoot: '/',
  supportsStaticESM: true,
};

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
  filename: '/app/index',

  babelrc: false,
  presets: [preset],

  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  retainLines: false,
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, FORCE_COLOR: '0' };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

type TransformTestOptions = Partial<typeof DEF_OPTIONS> & {
  isServer?: boolean;
};

function transformTest(
  code: string,
  { isServer = false, ...defaultOverrideOpts }: TransformTestOptions
) {
  const options = {
    ...DEF_OPTIONS,
    ...defaultOverrideOpts,
    caller: getCaller(isServer ? SERVER_CALLER : CLIENT_CALLER),
  };

  const results = babel.transform(code, options);
  if (!results) throw new Error('Failed to transform code');

  return {
    code: results.code,
    metadata: results.metadata as unknown as { performConstantFolding?: boolean },
  };
}

describe('export function loader()', () => {
  it('removes `export async function loader() {}`', () => {
    const res = transformTest(
      `
      import { useLoaderData } from 'expo-router';

      export async function loader() {
        return { data: 'test' };
      }

      export default function Index() {
        const data = useLoaderData();
        return <div>{data.data}</div>;
      }
    `,
      { isServer: false }
    );

    expect(res.metadata.performConstantFolding).toBe(true);
    expect(res.code).toMatchInlineSnapshot(`
      "import { useLoaderData } from 'expo-router';
      import { jsx as _jsx } from "react/jsx-runtime";
      export default function Index() {
        const data = useLoaderData();
        return /*#__PURE__*/_jsx("div", {
          children: data.data
        });
      }"
    `);
  });

  it('removes `export function loader() {}`', () => {
    const res = transformTest(
      `
      import { useLoaderData } from 'expo-router';

      export function loader() {
        return { data: 'test' };
      }

      export default function Index() {
        const data = useLoaderData();
        return <div>{data.data}</div>;
      }
    `,
      { isServer: false }
    );

    expect(res.metadata.performConstantFolding).toBe(true);
    expect(res.code).toMatchInlineSnapshot(`
      "import { useLoaderData } from 'expo-router';
      import { jsx as _jsx } from "react/jsx-runtime";
      export default function Index() {
        const data = useLoaderData();
        return /*#__PURE__*/_jsx("div", {
          children: data.data
        });
      }"
    `);
  });
});

describe('export const loader = () => {}', () => {
  it('removes `export const loader = async () => {}`', () => {
    const res = transformTest(
      `
      import { useLoaderData } from 'expo-router';

      export const loader = async () => {
        return { data: 'test' };
      };

      export default function Index() {
        const data = useLoaderData();
        return <div>{data.data}</div>;
      }
    `,
      { isServer: false }
    );

    expect(res.metadata.performConstantFolding).toBe(true);
    expect(res.code).toMatchInlineSnapshot(`
      "import { useLoaderData } from 'expo-router';
      import { jsx as _jsx } from "react/jsx-runtime";
      export default function Index() {
        const data = useLoaderData();
        return /*#__PURE__*/_jsx("div", {
          children: data.data
        });
      }"
    `);
  });

  it('removes `export const loader = () => {}`', () => {
    const res = transformTest(
      `
      import { useLoaderData } from 'expo-router';

      export const loader = () => {
        return { data: 'test' };
      };

      export default function Index() {
        const data = useLoaderData();
        return <div>{data.data}</div>;
      }
    `,
      { isServer: false }
    );

    expect(res.metadata.performConstantFolding).toBe(true);
    expect(res.code).toMatchInlineSnapshot(`
      "import { useLoaderData } from 'expo-router';
      import { jsx as _jsx } from "react/jsx-runtime";
      export default function Index() {
        const data = useLoaderData();
        return /*#__PURE__*/_jsx("div", {
          children: data.data
        });
      }"
    `);
  });
});

describe('export const loader = function() {}', () => {
  it('removes `export const loader = async function() {}`', () => {
    const res = transformTest(
      `
      import { useLoaderData } from 'expo-router';

      export const loader = async function() {
        return { data: 'test' };
      };

      export default function Index() {
        const data = useLoaderData();
        return <div>{data.data}</div>;
      }
    `,
      { isServer: false }
    );

    expect(res.metadata.performConstantFolding).toBe(true);
    expect(res.code).toMatchInlineSnapshot(`
      "import { useLoaderData } from 'expo-router';
      import { jsx as _jsx } from "react/jsx-runtime";
      export default function Index() {
        const data = useLoaderData();
        return /*#__PURE__*/_jsx("div", {
          children: data.data
        });
      }"
    `);
  });

  it('removes `export const loader = function() {}`', () => {
    const res = transformTest(
      `
      import { useLoaderData } from 'expo-router';

      export const loader = function() {
        return { data: 'test' };
      };

      export default function Index() {
        const data = useLoaderData();
        return <div>{data.data}</div>;
      }
    `,
      { isServer: false }
    );

    expect(res.metadata.performConstantFolding).toBe(true);
    expect(res.code).toMatchInlineSnapshot(`
      "import { useLoaderData } from 'expo-router';
      import { jsx as _jsx } from "react/jsx-runtime";
      export default function Index() {
        const data = useLoaderData();
        return /*#__PURE__*/_jsx("div", {
          children: data.data
        });
      }"
    `);
  });
});

describe('preserves', () => {
  it('preserves loader in server bundles', () => {
    const res = transformTest(
      `
      import { useLoaderData } from 'expo-router';

      export async function loader() {
        return { data: 'test' };
      }

      export default function Index() {
        const data = useLoaderData();
        return <div>{data.data}</div>;
      }
    `,
      { isServer: true }
    );

    expect(res.metadata.performConstantFolding).toBeUndefined();
    expect(res.code).toMatchInlineSnapshot(`
      "import { useLoaderData } from 'expo-router';
      import { jsx as _jsx } from "react/jsx-runtime";
      export async function loader() {
        return {
          data: 'test'
        };
      }
      export default function Index() {
        const data = useLoaderData();
        return /*#__PURE__*/_jsx("div", {
          children: data.data
        });
      }"
    `);
  });

  it('preserves other named exports', () => {
    const res = transformTest(
      `
      import { useLoaderData } from 'expo-router';

      export async function loader() {
        return { data: 'test' };
      }

      export const unstable_settings = { anchor: 'index' };

      export default function Index() {
        const data = useLoaderData();
        return <div>{data.data}</div>;
      }
    `,
      { isServer: false }
    );

    expect(res.metadata.performConstantFolding).toBe(true);
    expect(res.code).toMatchInlineSnapshot(`
      "import { useLoaderData } from 'expo-router';
      import { jsx as _jsx } from "react/jsx-runtime";
      export const unstable_settings = {
        anchor: 'index'
      };
      export default function Index() {
        const data = useLoaderData();
        return /*#__PURE__*/_jsx("div", {
          children: data.data
        });
      }"
    `);
  });

  it('preserves multiple exports in same declaration', () => {
    const res = transformTest(
      `
      import { useLoaderData } from 'expo-router';

      export const loader = async () => {
        return { data: 'test' };
      }, unstable_settings = {
        anchor: 'index'
      }, generateStaticParams = () => ([
        { id: '1' }, { id: '2' }
      ]);

      export default function Index() {
        const data = useLoaderData();
        return <div>{data.data}</div>;
      }
    `,
      { isServer: false }
    );

    expect(res.metadata.performConstantFolding).toBeUndefined();
    expect(res.code).toMatchInlineSnapshot(`
      "import { useLoaderData } from 'expo-router';
      import { jsx as _jsx } from "react/jsx-runtime";
      export const unstable_settings = {
          anchor: 'index'
        },
        generateStaticParams = () => [{
          id: '1'
        }, {
          id: '2'
        }];
      export default function Index() {
        const data = useLoaderData();
        return /*#__PURE__*/_jsx("div", {
          children: data.data
        });
      }"
    `);
  });
});

describe('edge cases', () => {
  it('handles files with no loader export', () => {
    const res = transformTest(
      `
      export default function Index() {
        return <div>Index</div>;
      }
    `,
      { isServer: false }
    );

    expect(res.metadata.performConstantFolding).toBeUndefined();
    expect(res.code).toMatchInlineSnapshot(`
      "import { jsx as _jsx } from "react/jsx-runtime";
      export default function Index() {
        return /*#__PURE__*/_jsx("div", {
          children: "Index"
        });
      }"
    `);
  });

  it('handles files with only loader export', () => {
    const res = transformTest(
      `
      export async function loader() {
        return { data: 'test' };
      }
    `,
      { isServer: false }
    );

    expect(res.metadata.performConstantFolding).toBe(true);
    expect(res.code).toMatchInlineSnapshot(`""`);
  });
});

describe('directory filtering', () => {
  it('skips files outside app directory', () => {
    const res = transformTest(
      `
      export function loader() {
        return { data: 'test' };
      }

      function noop() {
        return;
      }

      export function MyComponent() {
        noop();
        const data = loader();
        return <div>{data.data}</div>;
      }
    `,
      {
        filename: '/components/MyComponent',
        isServer: false,
      }
    );

    expect(res.metadata.performConstantFolding).toBeUndefined();
    expect(res.code).toMatchInlineSnapshot(`
      "import { jsx as _jsx } from "react/jsx-runtime";
      export function loader() {
        return {
          data: 'test'
        };
      }
      function noop() {
        return;
      }
      export function MyComponent() {
        noop();
        const data = loader();
        return /*#__PURE__*/_jsx("div", {
          children: data.data
        });
      }"
    `);
  });
});
