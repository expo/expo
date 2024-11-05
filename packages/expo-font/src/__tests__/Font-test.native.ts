import type { Asset } from 'expo-asset';

import ExpoFontLoader from '../ExpoFontLoader';
import * as Font from '../Font';
import { loadPromises, purgeCache } from '../memory';

function clearMemory() {
  purgeCache();
  for (const key of Object.keys(loadPromises)) {
    delete loadPromises[key];
  }
}
type MockAsset = { downloaded: boolean; downloadAsync: () => Promise<void>; localUri?: string };
type MockAssetOptions = { localUri?: string; downloaded?: boolean; downloadAsync?: any };

function _createMockAsset({
  localUri = 'file:/test/test-font.ttf',
  ...otherOptions
}: MockAssetOptions = {}): Asset {
  const mockAsset: MockAsset = {
    downloaded: false,
    downloadAsync: jest.fn(async () => {
      mockAsset.downloaded = true;
      mockAsset.localUri = localUri;
    }),
    ...otherOptions,
  };
  return mockAsset as unknown as Asset;
}

beforeEach(() => {
  ExpoFontLoader.loadAsync.mockImplementation(async () => {});
  ExpoFontLoader.getLoadedFonts.mockImplementation(() => []);
});

afterEach(async () => {
  clearMemory();
  jest.resetModules();
});

// TODO (@tsapeta): The way these tests work is a bit confusing, unclear and outdated,
// e.g. mocking expo-constants, dealing with the internal memory.
// We should rewrite them once we stop scoping font names in Expo Go on Android.
// Then it is no longer necessary to have separate tests cases for Expo Go/standalone/bare workflow.
xdescribe('within Expo Go', () => {
  afterEach(async () => {
    clearMemory();
  });

  describe('loadAsync', () => {
    afterEach(async () => {
      clearMemory();
    });

    it(`completes after loading a font`, async () => {
      const mockAsset = _createMockAsset();
      await Font.loadAsync('test-font', mockAsset);

      expect(mockAsset.downloaded).toBe(true);
      expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);
      expect(ExpoFontLoader.loadAsync.mock.calls[0]).toMatchSnapshot();
      expect(Font.isLoaded('test-font')).toBe(true);
      expect(Font.isLoading('test-font')).toBe(false);
    });

    it(`throws if downloading a font fails`, async () => {
      const mockAsset = {
        downloaded: false,
        downloadAsync: jest.fn(async () => {}),
      } as unknown as Asset;
      await expect(Font.loadAsync('test-font', mockAsset)).rejects.toMatchSnapshot();

      expect(mockAsset.downloaded).toBe(false);
      expect(ExpoFontLoader.loadAsync).not.toHaveBeenCalled();
      expect(Font.isLoaded('test-font')).toBe(false);
      expect(Font.isLoading('test-font')).toBe(false);
    });

    it(`throws if loading a downloaded font fails`, async () => {
      ExpoFontLoader.loadAsync.mockImplementation(async () => {
        throw new Error('Intentional error from FontLoader mock');
      });

      const mockAsset = _createMockAsset();
      await expect(Font.loadAsync('test-font', mockAsset)).rejects.toMatchSnapshot();

      expect(mockAsset.downloaded).toBe(true);
      expect(ExpoFontLoader.loadAsync).toHaveBeenCalled();
      expect(Font.isLoaded('test-font')).toBe(false);
      expect(Font.isLoading('test-font')).toBe(false);
    });

    it(`doesn't redownload a loaded font`, async () => {
      const mockAsset1 = _createMockAsset();
      await Font.loadAsync('test-font', mockAsset1);
      expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);

      const mockAsset2 = _createMockAsset();
      await Font.loadAsync('test-font', mockAsset2);
      expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);
      expect(Font.isLoaded('test-font')).toBe(true);
      expect(Font.isLoading('test-font')).toBe(false);
    });

    it(`can load an already downloaded asset`, async () => {
      const mockAsset = _createMockAsset();
      await Font.loadAsync('test-font', mockAsset);

      const loadPromise = Font.loadAsync('test-font', mockAsset);
      expect(Font.isLoading('test-font')).toBe(false);
      expect(Font.isLoaded('test-font')).toBe(true);

      await loadPromise;
      expect(Font.isLoading('test-font')).toBe(false);
      expect(Font.isLoaded('test-font')).toBe(true);
    });

    it(`downloads a font that failed to load`, async () => {
      const mockAsset1 = _createMockAsset({
        localUri: 'file:/test/test-font.ttf',
        downloadAsync: jest.fn(async () => {}),
      });
      await expect(Font.loadAsync('test-font', mockAsset1)).rejects.toBeDefined();
      expect(ExpoFontLoader.loadAsync).not.toHaveBeenCalled();
      expect(Font.isLoaded('test-font')).toBe(false);
      expect(Font.isLoading('test-font')).toBe(false);

      const mockAsset2 = _createMockAsset();
      await Font.loadAsync('test-font', mockAsset2);
      expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);
      expect(Font.isLoaded('test-font')).toBe(true);
      expect(Font.isLoading('test-font')).toBe(false);
    });

    it(`coalesces concurrent loads`, async () => {
      const mockAsset1 = _createMockAsset();
      const loadPromise1 = Font.loadAsync('test-font', mockAsset1);
      expect(Font.isLoaded('test-font')).toBe(false);
      expect(Font.isLoading('test-font')).toBe(true);

      const mockAsset2 = _createMockAsset();
      const loadPromise2 = Font.loadAsync('test-font', mockAsset2);
      expect(Font.isLoaded('test-font')).toBe(false);
      expect(Font.isLoading('test-font')).toBe(true);

      await Promise.all([loadPromise1, loadPromise2]);
      expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);
      expect(Font.isLoaded('test-font')).toBe(true);
      expect(Font.isLoading('test-font')).toBe(false);
    });

    it(`rejects all coalesced loads`, async () => {
      const mockAsset1 = {
        downloaded: false,
        downloadAsync: jest.fn(async () => {}),
      } as unknown as Asset;
      const loadPromise1 = Font.loadAsync('test-font', mockAsset1);
      expect(Font.isLoaded('test-font')).toBe(false);
      expect(Font.isLoading('test-font')).toBe(true);

      const mockAsset2 = _createMockAsset();
      const loadPromise2 = Font.loadAsync('test-font', mockAsset2);
      expect(Font.isLoaded('test-font')).toBe(false);
      expect(Font.isLoading('test-font')).toBe(true);

      await expect(loadPromise1).rejects.toBeDefined();
      await expect(loadPromise2).rejects.toBeDefined();
      expect(Font.isLoaded('test-font')).toBe(false);
      expect(Font.isLoading('test-font')).toBe(false);
    });

    it(`accepts a map of fonts to multi-load`, async () => {
      await Font.loadAsync({
        'test-font-1': _createMockAsset({
          localUri: 'file:/test/test-font-1.ttf',
        }),
        'test-font-2': _createMockAsset({
          localUri: 'file:/test/test-font-2.ttf',
        }),
      });
      expect(Font.isLoaded('test-font-1')).toBe(true);
      expect(Font.isLoaded('test-font-2')).toBe(true);
    });

    it(`rejects if any font in the map fails to load`, async () => {
      const mockAsset2 = {
        downloaded: false,
        downloadAsync: jest.fn(async () => {}),
      } as unknown as Asset;

      await expect(
        Font.loadAsync({
          'test-font-1': _createMockAsset({
            localUri: 'file:/test/test-font-1.ttf',
          }),
          'test-font-2': mockAsset2,
        })
      ).rejects.toBeDefined();

      // We don't guarantee whether the first font will have loaded or
      // even finished loading but the internal state should be
      // consistent
      expect(() => Font.isLoaded('test-font-1')).not.toThrow();
      expect(() => Font.isLoading('test-font-1')).not.toThrow();
      expect(Font.isLoaded('test-font-2')).toBe(false);
    });

    it(`coalesces concurrent loads across maps`, async () => {
      const loadPromise1 = Font.loadAsync({
        'test-font-1': _createMockAsset({
          localUri: 'file:/test/test-font-1.ttf',
        }),
        'test-font-2': _createMockAsset({
          localUri: 'file:/test/test-font-2.ttf',
        }),
      });
      expect(Font.isLoaded('test-font-1')).toBe(false);
      expect(Font.isLoaded('test-font-2')).toBe(false);
      expect(Font.isLoading('test-font-1')).toBe(true);
      expect(Font.isLoading('test-font-2')).toBe(true);

      const loadPromise2 = Font.loadAsync({
        'test-font-1': _createMockAsset({
          localUri: 'file:/test/test-font-1.ttf',
        }),
      });
      expect(Font.isLoaded('test-font-1')).toBe(false);
      expect(Font.isLoading('test-font-1')).toBe(true);

      await Promise.all([loadPromise1, loadPromise2]);
      expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(2);
      expect(Font.isLoaded('test-font-1')).toBe(true);
      expect(Font.isLoaded('test-font-2')).toBe(true);
      expect(Font.isLoading('test-font-1')).toBe(false);
      expect(Font.isLoading('test-font-2')).toBe(false);
    });
  });
});
