import { serializeOptimizeAsync } from '../fork/__tests__/serializer-test-utils';

jest.mock('../exportHermes', () => {
  return {
    buildHermesBundleAsync: jest.fn(({ code, map }) => ({
      hbc: code,
      sourcemap: map,
    })),
  };
});

describe('iife properties', () => {
  [
    // 'require',
    'module',
    'global',
    'exports',
  ].forEach((name) => {
    [true, false].forEach((treeshake) => {
      describe(`variable: ${name}, treeshake: ${treeshake}`, () => {
        it(`can declare variable module in top-scope`, async () => {
          const [, [artifact]] = await serializeOptimizeAsync(
            {
              'index.js': `let ${name} = 0;`,
            },
            { treeshake }
          );
          expect(artifact.source).toMatch(`_${name} = 0`);
        });
        it(`can re-define iife param in top-scope`, async () => {
          const [, [artifact]] = await serializeOptimizeAsync(
            {
              'index.js': `${name} = 0;`,
            },
            { treeshake }
          );
          expect(artifact.source).toMatch(` ${name} = 0`);
        });

        it(`can declare variable module in sub-scope`, async () => {
          const [, [artifact]] = await serializeOptimizeAsync(
            {
              'index.js': `{let ${name} = 0;}`,
            },
            { treeshake }
          );
          expect(artifact.source).toMatch(`${name} = 0`);
        });
      });
    });
  });
});
