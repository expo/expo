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
  filename: '/unknown',
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

function transformTest(code: string, isServer = false) {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller(isServer ? SERVER_CALLER : CLIENT_CALLER),
  };

  const results = babel.transform(code, options);
  if (!results) throw new Error('Failed to transform code');

  return {
    code: results.code,
    metadata: results.metadata,
  };
}

describe('export function loader()', () => {
  it('removes `export async function loader() {}`', () => {
    expect(
      transformTest(
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
        false
      ).code
    ).toMatchInlineSnapshot(`
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
    expect(
      transformTest(
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
        false
      ).code
    ).toMatchInlineSnapshot(`
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
    expect(
      transformTest(
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
        false
      ).code
    ).toMatchInlineSnapshot(`
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
    expect(
      transformTest(
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
        false
      ).code
    ).toMatchInlineSnapshot(`
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
    expect(
      transformTest(
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
        false
      ).code
    ).toMatchInlineSnapshot(`
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
    expect(
      transformTest(
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
        false
      ).code
    ).toMatchInlineSnapshot(`
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
    expect(
      transformTest(
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
        true
      ).code
    ).toMatchInlineSnapshot(`
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
    expect(
      transformTest(
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
        false
      ).code
    ).toMatchInlineSnapshot(`
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
    expect(
      transformTest(
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
        false
      ).code
    ).toMatchInlineSnapshot(`
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
    expect(
      transformTest(
        `
      export default function Index() {
        return <div>Index</div>;
      }
    `,
        false
      ).code
    ).toMatchInlineSnapshot(`
      "import { jsx as _jsx } from "react/jsx-runtime";
      export default function Index() {
        return /*#__PURE__*/_jsx("div", {
          children: "Index"
        });
      }"
    `);
  });

  it('handles files with only loader export', () => {
    expect(
      transformTest(
        `
      export async function loader() {
        return { data: 'test' };
      }
    `,
        false
      ).code
    ).toMatchInlineSnapshot(`""`);
  });
});
