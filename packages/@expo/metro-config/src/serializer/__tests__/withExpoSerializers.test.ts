import * as splitFixtures from './fixtures/basic-treeshaking';
import { createModuleIdFactory } from './fixtures/fromFixture';
import { simplifyGraph } from './fixtures/toFixture';
import { baseJSBundle } from '../fork/baseJSBundle';
import {
  SerialAsset,
  getDefaultSerializer,
  withExpoSerializers,
  withSerializerPlugins,
} from '../withExpoSerializers';

function getSerializer() {
  return withExpoSerializers({}).serializer.customSerializer;
}

describe('tree-shaking', () => {
  beforeAll(() => {
    // process.env.EXPO_USE_TREE_SHAKING = '1';
    jest.unmock('fs');
  });
  afterAll(() => {
    // delete process.env.EXPO_USE_TREE_SHAKING;
    jest.mock('fs');
  });
  it(`splits chunks`, async () => {
    const serializer = getSerializer();

    // Drop the pre-modules for brevity
    // splitFixtures.basic[1] = [];

    // Serialize
    const stringResults = (await serializer(
      ...splitFixtures.baseExpoAppBundleSplitting
    )) as unknown as SerialAsset[];
    // expect(typeof stringResults).toBe('string');

    console.log(stringResults);
    expect(stringResults.length).toBe(3);
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
