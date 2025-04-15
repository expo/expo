import {
  getTransformEnvironment,
  getEnvVarDevString,
} from '../environmentVariableSerializerPlugin';

import * as babylon from '@babel/parser';

import { serializeShakingAsync } from '../fork/__tests__/serializer-test-utils';
import { isModuleEmptyFor } from '../treeShakeSerializerPlugin';

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

function expectImports(graph, name: string) {
  if (!graph.dependencies.has(name)) throw new Error(`Module not found: ${name}`);
  return expect([...graph.dependencies.get(name).dependencies.values()]);
}

// it(`injects virtual env vars`, async () => {
//   const [[, , graph], artifacts] = await serializeShakingAsync({
//     'index.js': `
// import {run} from "./b";
// console.log(run);
//             `,
//     // When we remove the import for `DEFAULT_ICON_COLOR` we need to ensure that we don't delete
//     // the `c` module because it still has another link in the same module.
//     'b.js': `
// import createIconButtonComponent from './c';
// export { DEFAULT_ICON_COLOR, } from './c';

// export function run() {
//   console.log(createIconButtonComponent)
// }
// `,
//     'c.js': `
// export const DEFAULT_ICON_COLOR = "bar";
// export default function createIconButtonComponent() {
// console.log("MARK")
// }
// `,
//   });

//   expectImports(graph, '/app/b.js').toEqual([
//     expect.objectContaining({ absolutePath: '/app/c.js' }),
//   ]);
//   expect(artifacts[0].source).not.toMatch('DEFAULT_ICON_COLOR');
//   expect(artifacts[0].source).toMatch('MARK');
// });

describe(getTransformEnvironment, () => {
  [
    '/index.bundle?platform=web&dev=true&transform.environment=node&hot=false',
    '/index.bundle?transform.environment=node&platform=web&dev=true&hot=false',
    '/index.bundle?platform=web&dev=true&hot=false&transform.environment=node',
    '/index.bundle?transform.environment=node',
  ].forEach((url) => {
    it(`extracts environment from ${url}`, () => {
      expect(getTransformEnvironment(url)).toBe('node');
    });
  });
  it(`works with missing transform`, () => {
    expect(
      getTransformEnvironment(
        '/index.bundle?transform.environment=&platform=web&dev=true&hot=false'
      )
    ).toBe(null);
    expect(getTransformEnvironment('/index.bundle?&platform=web&dev=true&hot=false')).toBe(null);
  });
});

describe(getEnvVarDevString, () => {
  it(`always formats env var code in one line`, () => {
    expect(getEnvVarDevString({})).toMatchInlineSnapshot(
      `"/* HMR env vars from Expo CLI (dev-only) */ process.env=Object.defineProperties(process.env, {});"`
    );
  });
  it(`formats env vars with new line characters in them`, () => {
    expect(
      getEnvVarDevString({
        EXPO_PUBLIC_TEST: 'test\nvalue',
      })
    ).toMatchInlineSnapshot(
      `"/* HMR env vars from Expo CLI (dev-only) */ process.env=Object.defineProperties(process.env, {"EXPO_PUBLIC_TEST": { value: "test\\nvalue" }});"`
    );
  });
  it(`formats multiple env vars`, () => {
    expect(
      getEnvVarDevString({
        EXPO_PUBLIC_A: 'a',
        EXPO_PUBLIC_B: 'b',
      })
    ).toMatchInlineSnapshot(
      `"/* HMR env vars from Expo CLI (dev-only) */ process.env=Object.defineProperties(process.env, {"EXPO_PUBLIC_A": { value: "a" },"EXPO_PUBLIC_B": { value: "b" }});"`
    );
  });
});
