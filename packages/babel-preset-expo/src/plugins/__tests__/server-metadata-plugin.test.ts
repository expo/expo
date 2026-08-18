/**
 * Copyright © 2026 650 Industries.
 */

import * as babel from '@babel/core';

import preset from '../..';

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

function transformTest(
  code: string,
  caller: babel.TransformCaller,
  options: { filename?: string } = {}
) {
  const result = babel.transform(code, {
    filename: options.filename ?? '/app/index',
    babelrc: false,
    configFile: false,
    presets: [preset],
    comments: true,
    compact: false,
    caller,
  });

  if (!result) {
    throw new Error('Failed to transform code');
  }

  return {
    code: result.code ?? '',
    metadata: result.metadata as {
      performConstantFolding?: boolean;
    },
  };
}

describe('serverMetadataPlugin', () => {
  it('preserves `generateMetadata()` exports in server bundles', () => {
    const result = transformTest(
      `
      export async function generateMetadata() {
        return { title: 'Hello' };
      }

      export default function Index() {
        return <div>Hello</div>;
      }
      `,
      SERVER_CALLER as babel.TransformCaller
    );

    expect(result.metadata.performConstantFolding).toBeUndefined();
    expect(result.code).toMatchInlineSnapshot(`
      "import { jsx as _jsx } from "react/jsx-runtime";
      export async function generateMetadata() {
        return {
          title: 'Hello'
        };
      }
      export default function Index() {
        return /*#__PURE__*/_jsx("div", {
          children: "Hello"
        });
      }"
    `);
  });

  it('removes `generateMetadata()` exports from client bundles', () => {
    const result = transformTest(
      `
      export async function generateMetadata() {
        return { title: 'Hello' };
      }

      export default function Index() {
        return <div>Hello</div>;
      }
      `,
      CLIENT_CALLER as babel.TransformCaller
    );

    expect(result.metadata.performConstantFolding).toBe(true);
    expect(result.code).not.toContain('generateMetadata');
    expect(result.code).toMatchInlineSnapshot(`
      "import { jsx as _jsx } from "react/jsx-runtime";
      export default function Index() {
        return /*#__PURE__*/_jsx("div", {
          children: "Hello"
        });
      }"
    `);
  });

  it('removes `generateMetadata()` variable exports from client bundles', () => {
    const result = transformTest(
      `
      export const generateMetadata = async () => ({ title: 'Hello' });

      export default function Index() {
        return <div>Hello</div>;
      }
      `,
      CLIENT_CALLER as babel.TransformCaller
    );

    expect(result.metadata.performConstantFolding).toBe(true);
    expect(result.code).toMatchInlineSnapshot(`
      "import { jsx as _jsx } from "react/jsx-runtime";
      export default function Index() {
        return /*#__PURE__*/_jsx("div", {
          children: "Hello"
        });
      }"
    `);
  });

  it('removes `generateMetadata()` exports from mixed variable exports in client bundles', () => {
    const result = transformTest(
      `
      export const generateMetadata = async () => ({ title: 'Hello' }), routeValue = 'client';

      export default function Index() {
        return <div>{routeValue}</div>;
      }
      `,
      CLIENT_CALLER as babel.TransformCaller
    );

    expect(result.metadata.performConstantFolding).toBe(true);
    expect(result.code).not.toContain('generateMetadata');
    expect(result.code).toMatchInlineSnapshot(`
      "import { jsx as _jsx } from "react/jsx-runtime";
      export const routeValue = 'client';
      export default function Index() {
        return /*#__PURE__*/_jsx("div", {
          children: routeValue
        });
      }"
    `);
  });

  it('preserves non-metadata exports in client bundles', () => {
    const result = transformTest(
      `
      export const title = 'Hello';
      export default function Index() {
        return <div>{title}</div>;
      }
      `,
      CLIENT_CALLER as babel.TransformCaller
    );

    expect(result.metadata.performConstantFolding).toBeUndefined();
    expect(result.code).toMatchInlineSnapshot(`
      "import { jsx as _jsx } from "react/jsx-runtime";
      export const title = 'Hello';
      export default function Index() {
        return /*#__PURE__*/_jsx("div", {
          children: title
        });
      }"
    `);
  });

  it('does not modify files outside the app directory', () => {
    const result = transformTest(
      `
      export async function generateMetadata() {
        return { title: 'Hello' };
      }
      `,
      CLIENT_CALLER as babel.TransformCaller,
      { filename: '/components/metadata' }
    );

    expect(result.metadata.performConstantFolding).toBeUndefined();
    expect(result.code).toMatchInlineSnapshot(`
      "export async function generateMetadata() {
        return {
          title: 'Hello'
        };
      }"
    `);
  });
});
