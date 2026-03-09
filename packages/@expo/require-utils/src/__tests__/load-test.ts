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
});
