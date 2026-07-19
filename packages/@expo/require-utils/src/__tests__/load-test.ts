import * as path from 'path';

import { evalModule } from '../load';

const basepath = path.join(__dirname, 'fixtures');

describe('evalModule', () => {
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

    expect(mod).toEqual({
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

    expect(mod).toEqual({
      default: 'test',
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
});
