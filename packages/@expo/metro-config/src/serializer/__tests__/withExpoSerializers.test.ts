import { createModuleIdFactory } from './fixtures/fromFixture';
import * as splitFixtures from './fixtures/basic-treeshaking';
import { simplifyGraph } from './fixtures/toFixture';
import { baseJSBundle } from '../fork/baseJSBundle';
import {
  getDefaultSerializer,
  withExpoSerializers,
  withSerializerPlugins,
} from '../withExpoSerializers';

// jest.mock('../fork/baseJSBundle', () => {
//   return {
//     baseJSBundle: jest.fn(jest.requireActual('../fork/baseJSBundle').baseJSBundle),
//   };
// });

function getSerializer() {
  return withExpoSerializers({}).serializer.customSerializer;
}

describe('tree-shaking', () => {
  beforeAll(() => {
    process.env.EXPO_USE_TREE_SHAKING = '1';
  });
  afterAll(() => {
    delete process.env.EXPO_USE_TREE_SHAKING;
  });
  xit(`removes unused export`, async () => {
    const serializer = getSerializer();

    // Drop the pre-modules for brevity
    splitFixtures.basic[1] = [];

    // Serialize
    const stringResults = await serializer(...splitFixtures.basic);
    expect(typeof stringResults).toBe('string');

    console.log(stringResults);
    expect(stringResults).not.toMatch(/subtract/);
  });
  it(`removes unused file`, async () => {
    const serializer = getSerializer();

    // Drop the pre-modules for brevity
    splitFixtures.unusedFile[1] = [];

    // Serialize
    const stringResults = await serializer(...splitFixtures.unusedFile);
    expect(typeof stringResults).toBe('string');

    console.log(stringResults);
    expect(stringResults).not.toMatch(/subtract/);
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
