import { getDefaultSerializer, withSerializerPlugins } from '../withExpoSerializers';
import splitFixture from './fixtures/basic-router';
import { createModuleIdFactory } from './fixtures/fromFixture';
describe(getDefaultSerializer, () => {
  it(`serializes`, async () => {
    const serializer = getDefaultSerializer({
      createModuleIdFactory,
      // getModulesRunBeforeMainModule:
      getModulesRunBeforeMainModule() {
        return [
          '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native/Libraries/Core/InitializeCore.js',
          '/Users/evanbacon/Documents/GitHub/expo/packages/@expo/metro-runtime/build/index.js',
        ];
      },
    });

    const stringResults = await serializer(...splitFixture);
    expect(typeof stringResults).toBe('string');

    const parts = JSON.parse(stringResults);
    expect(parts.length).toBe(4);
    expect(parts[0]).toEqual({
      filename: '_expo/static/js/web/entry-e394358282e9f5097ddc0afcbe550e0f.js',
      metadata: {},
      originFilename: '../../packages/expo-router/entry.js',
      source: expect.anything(),
      type: 'js',
    });
    expect(parts[1]).toEqual(
      expect.objectContaining({
        filename: '_expo/static/js/web/index-0774b4a778ea48ddb29a3d17b62a571b.js',
        originFilename: 'app/index.tsx',
        type: 'js',
      })
    );
  });
});

describe(withSerializerPlugins, () => {
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
