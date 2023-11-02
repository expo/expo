import { createModuleIdFactory } from './fixtures/fromFixture';
import splitFixture from './fixtures/basic-treeshaking';
import { simplifyGraph } from './fixtures/toFixture';
import { baseJSBundle } from '../fork/baseJSBundle';
import { getDefaultSerializer, withSerializerPlugins } from '../withExpoSerializers';

// jest.mock('../fork/baseJSBundle', () => {
//   return {
//     baseJSBundle: jest.fn(jest.requireActual('../fork/baseJSBundle').baseJSBundle),
//   };
// });

describe(getDefaultSerializer, () => {
  it(`serializes`, async () => {
    const serializer = getDefaultSerializer();

    // Drop the pre-modules for brevity
    splitFixture[1] = [];

    // Serialize
    const stringResults = await serializer(...splitFixture);
    expect(typeof stringResults).toBe('string');

    console.log(stringResults);
    expect(stringResults).not.toMatch(/subtract/);

    // const parts = JSON.parse(stringResults);
    // expect(parts.length).toBe(3);
    // expect(parts[0]).toEqual({
    //   filename: expect.stringMatching(/_expo\/static\/js\/web\/index-.*\.js/),
    //   metadata: {},
    //   originFilename: 'index.js',
    //   source: expect.anything(),
    //   type: 'js',
    // });
    // expect(parts[1]).toEqual(
    //   expect.objectContaining({
    //     filename: expect.stringMatching(/_expo\/static\/js\/web\/index-.*\.js/),
    //     originFilename: 'app/index.tsx',
    //     type: 'js',
    //   })
    // );

    // const bundles = baseJSBundle.mock.calls as Parameters<typeof baseJSBundle>[];

    // const first = bundles[1];
    // expect(first[0]).toBe('/apps/sandbox/app/index.tsx');
    // expect(simplifyGraph(first[2]).dependencies).toEqual({
    //   '/apps/sandbox/app/index.tsx': expect.objectContaining({
    //     dependencies: {
    //       '5dCMGbjkz1QWCPjOwzvy5ZBkuK8=': {
    //         absolutePath: '/node_modules/react/jsx-runtime.js',
    //         data: expect.objectContaining({
    //           name: 'react/jsx-runtime',
    //         }),
    //       },
    //     },
    //     inverseDependencies: ['/apps/sandbox/app?ctx=00a49026d14296b554d166f173e51f0f674490dc'],
    //     output: [expect.anything()],
    //     path: '/apps/sandbox/app/index.tsx',
    //   }),
    //   '/node_modules/react/cjs/react-jsx-runtime.production.min.js': expect.anything(),
    //   '/node_modules/react/cjs/react.production.min.js': expect.anything(),
    //   '/node_modules/react/index.js': expect.anything(),
    //   '/node_modules/react/jsx-runtime.js': expect.anything(),
    // });

    // const second = bundles[2];
    // expect(second[0]).toBe('/apps/sandbox/app/two.tsx');
    // expect(simplifyGraph(second[2]).dependencies).toEqual({
    //   '/apps/sandbox/app/two.tsx': expect.objectContaining({
    //     dependencies: {
    //       '5dCMGbjkz1QWCPjOwzvy5ZBkuK8=': {
    //         absolutePath: '/node_modules/react/jsx-runtime.js',
    //         data: expect.objectContaining({
    //           name: 'react/jsx-runtime',
    //         }),
    //       },
    //     },
    //     inverseDependencies: ['/apps/sandbox/app?ctx=00a49026d14296b554d166f173e51f0f674490dc'],
    //     output: [expect.anything()],
    //     path: '/apps/sandbox/app/two.tsx',
    //   }),
    //   '/node_modules/react/cjs/react-jsx-runtime.production.min.js': expect.anything(),
    //   '/node_modules/react/cjs/react.production.min.js': expect.anything(),
    //   '/node_modules/react/index.js': expect.anything(),
    //   '/node_modules/react/jsx-runtime.js': expect.anything(),
    // });
  });
});

xdescribe(withSerializerPlugins, () => {
  it(`executes in the expected order`, async () => {
    const customSerializer = jest.fn();

    const customProcessor = jest.fn((...res) => res);

    const config = withSerializerPlugins(
      {
        serializer: {
          customSerializer,
        },
      },
      [customProcessor as any]
    );

    const options = {
      sourceUrl: 'https://localhost:8081/index.bundle?platform=ios&dev=true&minify=false',
    };
    // @ts-expect-error
    await config.serializer.customSerializer('a', 'b', 'c', options);

    expect(customProcessor).toBeCalledWith('a', 'b', 'c', options);
    expect(customSerializer).toBeCalledWith('a', 'b', 'c', options);
  });
});
