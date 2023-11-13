import * as splitFixtures from './fixtures/basic-treeshaking';
import { SerialAsset, withExpoSerializers, withSerializerPlugins } from '../withExpoSerializers';

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
    const artifacts = (await serializer(
      ...splitFixtures.baseExpoAppBundleSplitting
    )) as unknown as SerialAsset[];
    // expect(typeof stringResults).toBe('string');

    console.log(artifacts);
    expect(artifacts.length).toBe(3);
    expect(artifacts[0].filename).toEqual(
      '_expo/static/js/web/require-c7ba1f81b36aa959b8f163550994c66c.js'
    );
    expect(artifacts[1].filename).toEqual(
      '_expo/static/js/web/index-15cb8de5975fcbb0f0cc21fabb951e0d.js'
    );
    expect(artifacts[2].filename).toEqual(
      '_expo/static/js/web/other-d74f23532d99f361d597c2747439c277.js'
    );
    // Ensure the runModule isn't included for async chunks
    expect(artifacts[2].source).not.toMatch(/TEST_RUN_MODULE\(\d+\)/);
  });
  xit(`splits chunks ios`, async () => {
    const serializer = getSerializer();

    // Serialize
    const artifacts = (await serializer(
      ...splitFixtures.multiLayeredSingleEntryIosExpoAppBundleSplitting
    )) as unknown as SerialAsset[];

    // console.log(artifacts);
    // Sourcemaps + 3 chunks
    expect(artifacts.length).toBe(6);

    expect(artifacts.map((asset) => asset.filename)).toEqual([
      '_expo/static/js/ios/index-15cb8de5975fcbb0f0cc21fabb951e0d.js',
      '_expo/static/js/ios/index-15cb8de5975fcbb0f0cc21fabb951e0d.js.map',
      '_expo/static/js/ios/other-d74f23532d99f361d597c2747439c277.js',
      '_expo/static/js/ios/other-d74f23532d99f361d597c2747439c277.js.map',
      '_expo/static/js/ios/other-2-17a1dbd7d209edc367ce45790494685e.js',
      '_expo/static/js/ios/other-2-17a1dbd7d209edc367ce45790494685e.js.map',
    ]);

    // Sanity: ensure the run module is included and the test value matches.
    expect(artifacts[0].source).toMatch(/TEST_RUN_MODULE\(\d+\)/);
    // Ensure the runModule isn't included for async chunks.
    expect(artifacts[2].source).not.toMatch(/TEST_RUN_MODULE\(\d+\)/);
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
