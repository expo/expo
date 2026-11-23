import { Platform } from 'expo';

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
