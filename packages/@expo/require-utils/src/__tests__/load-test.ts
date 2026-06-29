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

  it('throws a helpful error when .ts code uses import.meta (loaded as CommonJS)', () => {
    expect(() =>
      evalModule(`export const dir = import.meta.dirname;`, path.join(basepath, 'eval.ts'))
    ).toThrow(/import\.meta/);
  });

  it('does not confuse "import.meta" inside a string or comment for the meta-property', () => {
    const mod = evalModule(
      `// import.meta.dirname is unavailable here\nexport const note = 'use import.meta in .mts files';`,
      path.join(basepath, 'eval.ts')
    );

    expect(mod).toEqual({
      note: 'use import.meta in .mts files',
    });
  });

  it('accepts .mts code using import.meta (loaded as an ES module)', () => {
    const mod = evalModule(
      `export const hasMeta = typeof import.meta.url === 'string';`,
      path.join(basepath, 'eval.mts')
    );

    expect(mod.hasMeta).toBe(true);
  });
});
