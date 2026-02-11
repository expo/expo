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

const LOADER_BUNDLE_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: true,
  isReactServer: false,
  isLoaderBundle: true,
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
  bundleType: 'client' | 'server' | 'loader';
};

function transformTest(code: string, { bundleType, ...defaultOverrideOpts }: TransformTestOptions) {
  const knownCallers = {
    client: CLIENT_CALLER,
    server: SERVER_CALLER,
    loader: LOADER_BUNDLE_CALLER,
  };
  const options = {
    ...DEF_OPTIONS,
    ...defaultOverrideOpts,
    caller: getCaller(knownCallers[bundleType]),
  };

  const results = babel.transform(code, options);
  if (!results) throw new Error('Failed to transform code');

  return {
    code: results.code,
    metadata: results.metadata as unknown as {
      performConstantFolding?: boolean;
      loaderReference?: string;
    },
  };
}

describe('client', () => {
  describe('removes loader exports', () => {
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
        { bundleType: 'client' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
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
        { bundleType: 'client' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
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
        { bundleType: 'client' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
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
        { bundleType: 'client' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
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
        { bundleType: 'client' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
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
        { bundleType: 'client' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
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

  describe('preserves non-loader exports', () => {
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
        { bundleType: 'client' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
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
        { bundleType: 'client' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
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
        { bundleType: 'client' }
      );

      expect(res.metadata.performConstantFolding).toBeUndefined();
      expect(res.metadata.loaderReference).toBeUndefined();
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
        { bundleType: 'client' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
      expect(res.code).toMatchInlineSnapshot(`""`);
    });

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
          bundleType: 'client',
          filename: '/components/MyComponent',
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
});

// NOTE(@hassankhan): Server bundles preserve loaders for SSG. A followup is required to strip
// loaders from server bundles.
describe('server', () => {
  describe('preserves exports', () => {
    it('preserves loader exports', () => {
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
        { bundleType: 'server' }
      );

      expect(res.metadata.performConstantFolding).toBeUndefined();
      expect(res.metadata.loaderReference).toBeUndefined();
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

    it('preserves non-loader exports', () => {
      const res = transformTest(
        `
      export async function loader() {
        return { data: 'test' };
      }

      export const unstable_settings = { anchor: 'index' };

      export default function Index() {
        return <div>Index</div>;
      }
    `,
        { bundleType: 'server' }
      );

      expect(res.metadata.performConstantFolding).toBeUndefined();
      expect(res.code).toMatchInlineSnapshot(`
      "import { jsx as _jsx } from "react/jsx-runtime";
      export async function loader() {
        return {
          data: 'test'
        };
      }
      export const unstable_settings = {
        anchor: 'index'
      };
      export default function Index() {
        return /*#__PURE__*/_jsx("div", {
          children: "Index"
        });
      }"
    `);
    });
  });
});

describe('loader', () => {
  describe('removes non-loader exports', () => {
    it('removes default export in loader bundles', () => {
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
        { bundleType: 'loader' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
      expect(res.code).toMatchInlineSnapshot(`
      "import { useLoaderData } from 'expo-router';
      export async function loader() {
        return {
          data: 'test'
        };
      }"
    `);
    });

    it('removes other named exports in loader bundles', () => {
      const res = transformTest(
        `
      export async function loader() {
        return { data: 'test' };
      }

      export const unstable_settings = { anchor: 'index' };

      export function generateStaticParams() {
        return [{ id: '1' }];
      }

      export default function Index() {
        return <div>Index</div>;
      }
    `,
        { bundleType: 'loader' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
      expect(res.code).toMatchInlineSnapshot(`
      "export async function loader() {
        return {
          data: 'test'
        };
      }"
    `);
    });
  });

  describe('preserves loader exports', () => {
    it('preserves loader function declaration', () => {
      const res = transformTest(
        `
      export function loader() {
        return { data: 'test' };
      }

      export default function Index() {
        return <div>Index</div>;
      }
    `,
        { bundleType: 'loader' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
      expect(res.code).toMatchInlineSnapshot(`
      "export function loader() {
        return {
          data: 'test'
        };
      }"
    `);
    });

    it('preserves loader const arrow function', () => {
      const res = transformTest(
        `
      export const loader = async () => {
        return { data: 'test' };
      };

      export default function Index() {
        return <div>Index</div>;
      }
    `,
        { bundleType: 'loader' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
      expect(res.code).toMatchInlineSnapshot(`
      "export const loader = async () => {
        return {
          data: 'test'
        };
      };"
    `);
    });

    it('preserves loader const function expression', () => {
      const res = transformTest(
        `
      export const loader = function() {
        return { data: 'test' };
      };

      export default function Index() {
        return <div>Index</div>;
      }
    `,
        { bundleType: 'loader' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
      expect(res.code).toMatchInlineSnapshot(`
      "export const loader = function () {
        return {
          data: 'test'
        };
      };"
    `);
    });

    it('extracts loader from multi-declaration export', () => {
      const res = transformTest(
        `
      export const loader = async () => {
        return { data: 'test' };
      }, unstable_settings = {
        anchor: 'index'
      }, generateStaticParams = () => ([
        { id: '1' }
      ]);

      export default function Index() {
        return <div>Index</div>;
      }
    `,
        { bundleType: 'loader' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
      expect(res.code).toMatchInlineSnapshot(`
      "export const loader = async () => {
        return {
          data: 'test'
        };
      };"
    `);
    });

    it('preserves loader and its dependencies', () => {
      const res = transformTest(
        `
      import { fetchData } from './api';

      const CACHE_TTL = 3600;

      async function getData(id) {
        return fetchData(id, { ttl: CACHE_TTL });
      }

      export async function loader({ params }) {
        const data = await getData(params.id);
        return { data };
      }

      export default function Index() {
        return <div>Index</div>;
      }
    `,
        { bundleType: 'loader' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBe('/app/index');
      expect(res.code).toMatchInlineSnapshot(`
      "import { fetchData } from './api';
      const CACHE_TTL = 3600;
      async function getData(id) {
        return fetchData(id, {
          ttl: CACHE_TTL
        });
      }
      export async function loader({
        params
      }) {
        const data = await getData(params.id);
        return {
          data
        };
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
        { bundleType: 'loader' }
      );

      expect(res.metadata.performConstantFolding).toBe(true);
      expect(res.metadata.loaderReference).toBeUndefined();
      expect(res.code).toMatchInlineSnapshot(`""`);
    });

    it('skips files outside app directory', () => {
      const res = transformTest(
        `
      export function loader() {
        return { data: 'test' };
      }

      export default function MyComponent() {
        return <div>Component</div>;
      }
    `,
        {
          bundleType: 'loader',
          filename: '/components/MyComponent',
        }
      );

      expect(res.metadata.performConstantFolding).toBeUndefined();
      expect(res.metadata.loaderReference).toBeUndefined();
      expect(res.code).toMatchInlineSnapshot(`
      "import { jsx as _jsx } from "react/jsx-runtime";
      export function loader() {
        return {
          data: 'test'
        };
      }
      export default function MyComponent() {
        return /*#__PURE__*/_jsx("div", {
          children: "Component"
        });
      }"
    `);
    });
  });
});
