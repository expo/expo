import * as path from 'path';

import { evalModule } from '../load';

const basepath = path.join(__dirname, 'fixtures');

describe('evalModule', () => {
  const actualNodeVersion = process.versions.node;

  afterEach(() => {
    Object.defineProperty(process.versions, 'node', {
      value: actualNodeVersion,
    });
    jest.dontMock('node:module');
    jest.dontMock('typescript');
  });

  it('accepts .js code and turns it to CommonJS with default imports', () => {
    const mod = evalModule(
      `
      import mjs from './example.js';
      const cjs = require('./example.js');
      export default {
        mjs,
        cjs,
      }
    `,
      path.join(basepath, 'eval.js')
    );

    expect(mod).toEqual({
      __esModule: true,
      default: {
        mjs: { test: 'test' },
        cjs: { test: 'test' },
      },
    });
  });

  it('accepts .js code and turns it to CommonJS with named imports', () => {
    const mod = evalModule(
      `
      import { test } from './example.js';
      export default test
    `,
      path.join(basepath, 'eval.js')
    );

    expect(mod).toEqual({
      __esModule: true,
      default: 'test',
    });
  });

  it('accepts .ts code and turns it to CommonJS with default imports', () => {
    const mod = evalModule(
      `
      import mjs from './example.js';
      const cjs = require('./example.js');
      export default {
        mjs,
        cjs,
      } as any
    `,
      path.join(basepath, 'eval.ts')
    );

    expect(mod.__esModule).toBe(true);
    expect(mod).toMatchObject({
      default: {
        mjs: { test: 'test' },
        cjs: { test: 'test' },
      },
    });
  });

  it('accepts .ts code and turns it to CommonJS with named imports', () => {
    const mod = evalModule(
      `
      import { test } from './example.js';
      export default (test as any)
    `,
      path.join(basepath, 'eval.ts')
    );

    expect(mod.__esModule).toBe(true);
    expect(mod).toMatchObject({ default: 'test' });
  });

  it('resolves a default import of an __esModule module to its default export', () => {
    const mod = evalModule(
      `
      import withPlugin from './esmodule-plugin.js';
      export default withPlugin({ name: 'test' });
    `,
      path.join(basepath, 'eval.js')
    );

    expect(mod).toEqual({
      __esModule: true,
      default: { name: 'test', pluginRan: true },
    });
  });

  it('resolves a default import of a plain CommonJS module to its module.exports', () => {
    const mod = evalModule(
      `
      import withPlugin from './commonjs-plugin.js';
      export default withPlugin({ name: 'test' });
    `,
      path.join(basepath, 'eval.js')
    );

    expect(mod).toEqual({
      __esModule: true,
      default: { name: 'test', pluginRan: true },
    });
  });

  it('resolves default imports when falling back to Node TypeScript stripping', () => {
    jest.isolateModules(() => {
      const actualNodeModule = jest.requireActual('node:module');
      const moduleNotFoundError = new Error(
        "Cannot find module 'typescript'"
      ) as NodeJS.ErrnoException;
      moduleNotFoundError.code = 'MODULE_NOT_FOUND';

      jest.doMock('node:module', () => ({
        ...actualNodeModule,
        stripTypeScriptTypes: (code: string) => code.replace(': Config', ''),
      }));
      jest.doMock('typescript', () => {
        throw moduleNotFoundError;
      });

      const { evalModule } = require('../load') as typeof import('../load');
      const mod = evalModule(
        `
        import esModulePlugin from './esmodule-plugin.js';
        import commonjsPlugin from './commonjs-plugin.js';
        const config: Config = { name: 'test' };
        export default [esModulePlugin(config), commonjsPlugin(config)];
      `,
        path.join(basepath, 'eval.ts')
      );

      expect(mod.default).toEqual([
        { name: 'test', pluginRan: true },
        { name: 'test', pluginRan: true },
      ]);
    });
  });

  it('evaluates .js using import.meta as ESM instead of CommonJS', () => {
    const mod = evalModule(
      `
      export const dir = import.meta.dirname;
      export default dir;
    `,
      path.join(basepath, 'eval.js')
    );

    expect(mod.dir).toBe(basepath);
    expect(mod.default).toBe(basepath);
  });

  it('evaluates .ts using import.meta as ESM instead of CommonJS', () => {
    const mod = evalModule(
      `
      const dir: string = import.meta.dirname;
      export default dir;
    `,
      path.join(basepath, 'eval.ts')
    );

    expect(mod.default).toBe(basepath);
  });

  it('does not treat import.meta inside a string literal as ESM', () => {
    const mod = evalModule(
      `module.exports = 'import.meta.dirname';`,
      path.join(basepath, 'eval.js')
    );

    expect(mod).toBe('import.meta.dirname');
  });

  it('rethrows a non-Error thrown value without crashing the annotator', () => {
    let caught: any;
    try {
      evalModule(`throw { code: 'CUSTOM_THROW' };`, path.join(basepath, 'eval.js'));
    } catch (error) {
      caught = error;
    }

    expect(caught).toEqual({ code: 'CUSTOM_THROW' });
  });

  it('uses Node TypeScript stripping defaults on Node 26', () => {
    jest.isolateModules(() => {
      Object.defineProperty(process.versions, 'node', {
        value: '26.0.0',
      });
      const actualNodeModule = jest.requireActual('node:module');
      const stripTypeScriptTypes = jest.fn((code: string) => code.replace(' as string', ''));
      const moduleNotFoundError = new Error(
        "Cannot find module 'typescript'"
      ) as NodeJS.ErrnoException;
      moduleNotFoundError.code = 'MODULE_NOT_FOUND';

      jest.doMock('node:module', () => ({
        ...actualNodeModule,
        stripTypeScriptTypes,
      }));
      jest.doMock('typescript', () => {
        throw moduleNotFoundError;
      });

      const { evalModule } = require('../load') as typeof import('../load');
      const mod = evalModule(
        `module.exports = { value: 'test' as string };`,
        path.join(basepath, 'eval.ts')
      );

      expect(mod).toEqual({ value: 'test' });
      expect(stripTypeScriptTypes).toHaveBeenCalledTimes(1);
      expect(stripTypeScriptTypes).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
