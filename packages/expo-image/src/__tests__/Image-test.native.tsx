import { render } from '@testing-library/react-native';
import { Platform } from 'expo';
import { StyleSheet } from 'react-native';

import { Image } from '../Image';
import ImageModule from '../ImageModule';

jest.mock('../ImageModule', () => ({
  __esModule: true,
  default: { loadAsync: jest.fn(async () => ({ width: 1, height: 1 })) },
}));

const createDevToolsRequestId = jest.fn(() => 'captured');

beforeEach(() => {
  globalThis.__NETWORK_REPORTER__ = { createDevToolsRequestId };
});

afterEach(() => {
  globalThis.__NETWORK_REPORTER__ = undefined;
  jest.clearAllMocks();
});

it('falls back to the source size for a size key that is undefined in the style', async () => {
  const { getByTestId } = await render(
    <Image
      testID="image"
      source={{ uri: 'file:///image.png', width: 100, height: 50 }}
      style={{ width: undefined, height: undefined }}
    />
  );
  expect(StyleSheet.flatten(getByTestId('image').props.style)).toMatchObject({
    width: 100,
    height: 50,
  });
});

if (Platform.OS === 'ios') {
  describe('Image.loadAsync DevTools initiator', () => {
    test('captures a request id for a remote source', async () => {
      await Image.loadAsync('https://example.com/a.jpg');

      expect(ImageModule.loadAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'https://example.com/a.jpg',
          devToolsRequestId: 'captured',
        }),
        undefined
      );
    });

    test('keeps a request id the source already carries', async () => {
      await Image.loadAsync({ uri: 'https://example.com/a.jpg', devToolsRequestId: 'preset' });

      expect(createDevToolsRequestId).not.toHaveBeenCalled();
      expect(ImageModule.loadAsync).toHaveBeenCalledWith(
        expect.objectContaining({ devToolsRequestId: 'preset' }),
        undefined
      );
    });

    test('captures nothing for a local source', async () => {
      await Image.loadAsync('file:///a.jpg');

      expect(createDevToolsRequestId).not.toHaveBeenCalled();
      expect(ImageModule.loadAsync).toHaveBeenCalledWith(
        expect.not.objectContaining({ devToolsRequestId: expect.anything() }),
        undefined
      );
    });
  });
} else {
  test('Image.loadAsync captures no DevTools request id', async () => {
    await Image.loadAsync('https://example.com/a.jpg');

    expect(createDevToolsRequestId).not.toHaveBeenCalled();
  });
}
