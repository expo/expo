/**
 * Copyright © 2026 650 Industries.
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

function transformTest(code: string, caller: babel.TransformCaller) {
  const result = babel.transform(code, {
    filename: '/app/index',
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
  it('removes route generateMetadata exports from client bundles', () => {
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
    expect(result.code).toContain('export default function Index()');
  });

  it('removes generateMetadata variable exports from client bundles', () => {
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
    expect(result.code).not.toContain('generateMetadata');
  });

  it('preserves route generateMetadata exports in server bundles', () => {
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
    expect(result.code).toContain('export async function generateMetadata()');
  });
});
