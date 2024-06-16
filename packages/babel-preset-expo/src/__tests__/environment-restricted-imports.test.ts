/**
 * Copyright © 2024 650 Industries.
 */

import * as babel from '@babel/core';

import preset from '..';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
  projectRoot: '/',
};

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
  filename: '/unknown',

  babelrc: false,
  presets: [[preset, { disableImportExportTransform: true }]],
  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  retainLines: false,
  caller: getCaller({ ...ENABLED_CALLER, platform: 'ios' }),
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, FORCE_COLOR: '0' };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

function getOpts(caller: Record<string, string | boolean>) {
  return {
    ...DEF_OPTIONS,
    caller: getCaller({ ...ENABLED_CALLER, ...caller }),
  };
}

describe('forbidden server imports', () => {
  describe('react server mode', () => {
    function runServerPass(src: string) {
      return babel.transform(
        src,
        getOpts({
          isReactServer: true,
        })
      );
    }

    it(`does not assert importing client-side modules in client components (react server mode)`, () => {
      // This test covers the order of server registry running before the assertion to remove the import.
      expect(runServerPass(`"use client"; import 'client-only';`)!.code).toMatch(
        'react-server-dom-webpack'
      );
    });

    it(`asserts importing client-side modules in server components`, () => {
      expect(() =>
        runServerPass(`import { A } from 'client-only';`)
      ).toThrowErrorMatchingSnapshot();
      expect(() => runServerPass(`require("client-only")`)).toThrowError();
      expect(() => runServerPass(`require.resolveWeak("client-only")`)).toThrowError();
      expect(() => runServerPass(`require.importAll("client-only")`)).toThrowError();
      expect(() => runServerPass(`require.importDefault("client-only")`)).toThrowError();
      expect(() => runServerPass(`export * from "client-only"`)).toThrowError();
      expect(() => runServerPass(`export { default } from "client-only"`)).toThrowError();
    });

    it(`does not assert importing client-side modules in client components (react server mode)`, () => {
      expect(() => runServerPass(`"use client"; import {} from 'client-only';`)).not.toThrowError();
      expect(() => runServerPass(`"use client"; require("client-only")`)).not.toThrowError();
      expect(() =>
        runServerPass(`"use client"; require.resolveWeak("client-only")`)
      ).not.toThrowError();
      expect(() => runServerPass(`"use client"; export * from "client-only"`)).not.toThrowError();
      expect(() =>
        runServerPass(`"use client";export { default } from "client-only"`)
      ).not.toThrowError();
    });

    it(`does not assert importing server-side modules in server components (react server mode)`, () => {
      expect(() => runServerPass(`import {} from 'server-only';`)).not.toThrowError();
      expect(() => runServerPass(`require("server-only")`)).not.toThrowError();
      expect(() => runServerPass(`require.resolveWeak("server-only")`)).not.toThrowError();
      expect(() => runServerPass(`require.importAll("server-only")`)).not.toThrowError();
      expect(() => runServerPass(`require.importDefault("server-only")`)).not.toThrowError();
      expect(() => runServerPass(`export * from "server-only"`)).not.toThrowError();
      expect(() => runServerPass(`export { default } from "server-only"`)).not.toThrowError();
    });
  });
  describe('client mode (default)', () => {
    function runServerPass(src: string) {
      return babel.transform(
        src,
        getOpts({
          isReactServer: undefined,
        })
      );
    }

    it(`does not assert importing client-side modules in client components`, () => {
      expect(() => runServerPass(`"use client"; import 'client-only';`)).not.toThrow();
    });

    it(`asserts importing server-side modules in client components even with "use client"`, () => {
      expect(() => runServerPass(`"use client"; import 'server-only';`)).toThrow();
    });

    it(`asserts importing server-side modules in client components`, () => {
      expect(() =>
        runServerPass(`import { A } from 'server-only';`)
      ).toThrowErrorMatchingSnapshot();
      expect(() => runServerPass(`require("server-only")`)).toThrowError();
      expect(() => runServerPass(`require.resolveWeak("server-only")`)).toThrowError();
      expect(() => runServerPass(`require.importAll("server-only")`)).toThrowError();
      expect(() => runServerPass(`require.importDefault("server-only")`)).toThrowError();
      expect(() => runServerPass(`export * from "server-only"`)).toThrowError();
      expect(() => runServerPass(`export { default } from "server-only"`)).toThrowError();
    });

    it(`does not assert importing server-side modules in server components (react server mode)`, () => {
      expect(() => runServerPass(`import {} from 'client-only';`)).not.toThrowError();
      expect(() => runServerPass(`require("client-only")`)).not.toThrowError();
      expect(() => runServerPass(`require.resolveWeak("client-only")`)).not.toThrowError();
      expect(() => runServerPass(`require.importAll("client-only")`)).not.toThrowError();
      expect(() => runServerPass(`require.importDefault("client-only")`)).not.toThrowError();
      expect(() => runServerPass(`export * from "client-only"`)).not.toThrowError();
      expect(() => runServerPass(`export { default } from "client-only"`)).not.toThrowError();
    });
  });
});
