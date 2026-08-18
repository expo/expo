/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { extract } from '../dependencyExtractor';

describe('dependencyExtractor', () => {
  test('should not extract dependencies inside comments', () => {
    const code = `
      // import a from 'ignore-line-comment';
      // import 'ignore-line-comment';
      // import './ignore-line-comment';
      // require('ignore-line-comment');
      /*
       * import a from 'ignore-block-comment';
       * import './ignore-block-comment';
       * import 'ignore-block-comment';
       * require('ignore-block-comment');
       */
    `;
    expect(extract(code)).toEqual(new Set());
  });

  test('should not extract dependencies inside comments (windows line endings)', () => {
    const code = [
      '// const module1 = require("module1");',
      '/**',
      ' * const module2 = require("module2");',
      ' */',
    ].join('\r\n');

    expect(extract(code)).toEqual(new Set([]));
  });

  test('should not extract dependencies inside comments (unicode line endings)', () => {
    const code = [
      '// const module1 = require("module1");\u2028',
      '// const module1 = require("module2");\u2029',
      '/*\u2028',
      'const module2 = require("module3");\u2029',
      ' */',
    ].join('');

    expect(extract(code)).toEqual(new Set([]));
  });

  test('should extract dependencies from `import` statements', () => {
    const code = `
      // Good
      import * as depNS from 'dep1';
      import {
        a as aliased_a,
        b,
      } from 'dep2';
      import depDefault from 'dep3';
      import * as depNS, {
        a as aliased_a,
        b,
      }, depDefault from 'dep4';

      // Bad
      foo . import ('inv1');
      foo . export ('inv2');
    `;
    expect(extract(code)).toEqual(new Set(['dep1', 'dep2', 'dep3', 'dep4']));
  });

  test('should extract dependencies from side-effect only `import` statements', () => {
    const code = `
        // Good
        import './side-effect-dep1';
        import 'side-effect-dep2';

        // Bad
        import ./inv1;
        import inv2
      `;
    expect(extract(code)).toEqual(new Set(['./side-effect-dep1', 'side-effect-dep2']));
  });

  test('should not extract dependencies from `import type/typeof` statements', () => {
    const code = `
      // Bad
      import typeof {foo} from 'inv1';
      import type {foo} from 'inv2';
    `;
    expect(extract(code)).toEqual(new Set([]));
  });

  test('should extract dependencies from `export` statements', () => {
    const code = `
      // Good
      export * as depNS from 'dep1';
      export {
        a as aliased_a,
        b,
      } from 'dep2';
      export depDefault from 'dep3';
      export * as depNS, {
        a as aliased_a,
        b,
      }, depDefault from 'dep4';

      // Bad
      foo . export ('inv1');
      foo . export ('inv2');
    `;
    expect(extract(code)).toEqual(new Set(['dep1', 'dep2', 'dep3', 'dep4']));
  });

  test('should not extract dependencies from `export type/typeof` statements', () => {
    const code = `
      // Bad
      export typeof {foo} from 'inv1';
      export type {foo} from 'inv2';
    `;
    expect(extract(code)).toEqual(new Set([]));
  });

  test('should extract dependencies from dynamic `import` calls', () => {
    const code = `
      // Good
      import('dep1').then();
      const dep2 = await import(
        "dep2",
      );
      if (await import(\`dep3\`)) {}

      // Bad
      await foo . import('inv1')
      await ximport('inv2');
      importx('inv3');
      import('inv4', 'inv5');
    `;
    expect(extract(code)).toEqual(new Set(['dep1', 'dep2', 'dep3']));
  });

  test('should extract dependencies from `require` calls', () => {
    const code = `
      // Good
      require('dep1');
      const dep2 = require(
        "dep2",
      );
      if (require(\`dep3\`).cond) {}

      // Bad
      foo . require('inv1')
      xrequire('inv2');
      requirex('inv3');
      require('inv4', 'inv5');
    `;
    expect(extract(code)).toEqual(new Set(['dep1', 'dep2', 'dep3']));
  });

  test('should extract dependencies from `jest.requireActual` calls', () => {
    const code = `
      // Good
      jest.requireActual('dep1');
      const dep2 = jest.requireActual(
        "dep2",
      );
      if (jest.requireActual(\`dep3\`).cond) {}
      jest
        .requireActual('dep4');

      // Bad
      foo . jest.requireActual('inv1')
      xjest.requireActual('inv2');
      jest.requireActualx('inv3');
      jest.requireActual('inv4', 'inv5');
    `;
    expect(extract(code)).toEqual(new Set(['dep1', 'dep2', 'dep3', 'dep4']));
  });

  test('should extract dependencies from `jest.requireMock` calls', () => {
    const code = `
      // Good
      jest.requireMock('dep1');
      const dep2 = jest.requireMock(
        "dep2",
      );
      if (jest.requireMock(\`dep3\`).cond) {}
      jest
        .requireMock('dep4');

      // Bad
      foo . jest.requireMock('inv1')
      xjest.requireMock('inv2');
      jest.requireMockx('inv3');
      jest.requireMock('inv4', 'inv5');
    `;
    expect(extract(code)).toEqual(new Set(['dep1', 'dep2', 'dep3', 'dep4']));
  });

  test('should extract dependencies from `jest.genMockFromModule` calls', () => {
    const code = `
      // Good
      jest.genMockFromModule('dep1');
      const dep2 = jest.genMockFromModule(
        "dep2",
      );
      if (jest.genMockFromModule(\`dep3\`).cond) {}
      jest
        .requireMock('dep4');

      // Bad
      foo . jest.genMockFromModule('inv1')
      xjest.genMockFromModule('inv2');
      jest.genMockFromModulex('inv3');
      jest.genMockFromModule('inv4', 'inv5');
    `;
    expect(extract(code)).toEqual(new Set(['dep1', 'dep2', 'dep3', 'dep4']));
  });

  test('should extract dependencies from `jest.createMockFromModule` calls', () => {
    const code = `
      // Good
      jest.createMockFromModule('dep1');
      const dep2 = jest.createMockFromModule(
        "dep2",
      );
      if (jest.createMockFromModule(\`dep3\`).cond) {}
      jest
        .requireMock('dep4');

      // Bad
      foo . jest.createMockFromModule('inv1')
      xjest.createMockFromModule('inv2');
      jest.createMockFromModulex('inv3');
      jest.createMockFromModule('inv4', 'inv5');
    `;
    expect(extract(code)).toEqual(new Set(['dep1', 'dep2', 'dep3', 'dep4']));
  });
});
