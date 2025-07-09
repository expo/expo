import { serializeOptimizeAsync } from '../fork/__tests__/serializer-test-utils';

jest.mock('../exportHermes', () => {
  return {
    buildHermesBundleAsync: jest.fn(({ code, map }) => ({
      hbc: code,
      sourcemap: map,
    })),
  };
});

jest.mock('../findUpPackageJsonPath', () => ({
  findUpPackageJsonPath: jest.fn(() => null),
}));

function getDep(graph, name: string) {
  if (!graph.dependencies.has(name)) throw new Error(`Module not found: ${name}`);
  return graph.dependencies.get(name);
}

function expectCollectDeps(graph, name: string) {
  return expect([...getDep(graph, name).dependencies.values()]);
}

const AnyPosition = expect.objectContaining({
  end: expect.any(Object),
  start: expect.any(Object),
});

it(`traces multiple imports to the same module`, async () => {
  const [[, , graph]] = await serializeOptimizeAsync({
    'index.js': `
import {run} from "./b";
export {foo} from "./b";
console.log(run);
            `,
    'b.js': ``,
  });

  expectCollectDeps(graph, '/app/index.js').toEqual([
    expect.objectContaining({
      absolutePath: '/app/b.js',
      data: {
        data: {
          asyncType: null,
          exportNames: ['*'],
          isESMImport: true,
          key: '5fes4Bo7aGIJwD57FkocPfA5U68=',
          locs: [AnyPosition, AnyPosition],
        },
        name: './b',
      },
    }),
  ]);
});
