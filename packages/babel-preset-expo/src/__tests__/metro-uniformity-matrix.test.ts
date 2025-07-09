// These tests ensure syntax is treated uniformly across all platforms, and environments.

/**
 * Copyright © 2024 650 Industries.
 */

import * as babel from '@babel/core';

import preset from '..';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: true,
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
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, FORCE_COLOR: '0' };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

// These are tolerable differences between platforms.
const comparableCode = (code) => code.trim().replace(/\s+/g, ' ');

// import { createPlugin as createReactServerPlugin } from '../server-actions-plugin';

describe.each(['ios', 'android', 'web'])('%s', (platform) => {
  describe.each([
    ['client', { isServer: false, isReactServer: false }],
    ['ssr', { isServer: true, isReactServer: false }],
    ['react-server', { isServer: true, isReactServer: true }],
  ])('%s', (_targetEnvName, targetEnv) => {
    function transformTest(sourceCode: string, customOptions: { filename?: string } = {}) {
      const options = {
        ...DEF_OPTIONS,
        caller: getCaller({
          ...ENABLED_CALLER,
          platform,
          ...targetEnv,
        }),
        ...customOptions,
      };

      const results = babel.transform(sourceCode, options);
      if (!results) throw new Error('Failed to transform code');
      const meta = results.metadata as unknown as { hasCjsExports?: boolean };

      // Parse again to ensure the output is valid code
      babel.parse(results.code, options);

      return {
        code: results.code,
        hasCjsExports: meta.hasCjsExports,
        metadata: meta,
      };
    }

    // Tests

    describe('JavaScript', () => {
      it.each([
        [`export { default as Foo } from './x';`, `export { default as Foo } from './x';`],
        [`export { Foo } from './x';`, `export { Foo } from './x';`],
        [`export * from './x';`, `export * from './x';`],
        [`export { default } from './x';`, `export { default } from './x';`],
        [
          `export * as X from './x';`,
          `import * as _X from './x';
          export { _X as X };`,
        ],
        [
          `export { default as Foo, Bar } from './x';`,
          `export { default as Foo, Bar } from './x';`,
        ],

        [`import { Foo } from './x';`, `import { Foo } from './x';`],
        [`import Foo from './x';`, `import Foo from './x';`],
        [`import * as X from './x';`, `import * as X from './x';`],
        [`import { default as Foo } from './x';`, `import { default as Foo } from './x';`],
        [
          `export { default as Foo, Bar } from './x';`,
          `export { default as Foo, Bar } from './x';`,
        ],
      ])('%s', (inputCode, outputCode) => {
        expect(
          comparableCode(
            transformTest(inputCode, {
              filename: '/unknown',
            }).code
          )
        ).toMatchInlineSnapshot(JSON.stringify(comparableCode(outputCode)));
      });
    });

    describe('TypeScript', () => {
      it.each([
        [`export type { X } from './x';`, ``],
        [`export { type Foo, Bar } from './x';`, `export { Bar } from './x';`],
        [`export type * as X from './x';`, ``],
        [`export type Foo = { a: number };`, ``],
        [`export interface Bar { b: string; }`, ``],
        [`export type * as Types from './module';`, ``],
      ])('%s', (inputCode, outputCode) => {
        expect(
          comparableCode(
            transformTest(inputCode, {
              filename: '/unknown.ts',
            }).code
          )
        ).toMatchInlineSnapshot(JSON.stringify(comparableCode(outputCode)));
      });
    });
  });
});
