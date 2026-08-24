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
      // @ts-expect-error: loadAsync not considered a mock function
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
      jest.spyOn(ExpoFontLoader, 'loadAsync').mockImplementation(async () => {
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

describe('in bare app', () => {
  afterEach(() => {
    clearMemory();
  });

  it('can call getLoadedFonts()', () => {
    expect(Font.getLoadedFonts()).toHaveLength(0);
    expect(ExpoFontLoader.getLoadedFonts).toHaveBeenCalledTimes(1);
  });
});

describe('loadAsync with an array of FontFamilyDefinitions (native)', () => {
  afterEach(() => {
    clearMemory();
    jest.restoreAllMocks();
  });

  function multiFaceDefinition(fontFamily = 'MultiFace'): Font.FontFamilyDefinition {
    return {
      fontFamily,
      fontDefinitions: [
        { path: _createMockAsset({ localUri: 'file:/regular.ttf' }), weight: 400 },
        {
          path: _createMockAsset({ localUri: 'file:/bold.ttf' }),
          weight: 'bold',
          style: 'normal',
        },
      ],
    };
  }

  it('calls native loadFontFamilyAsync exactly once, after all assets download, with normalized faces', async () => {
    const definition = multiFaceDefinition();

    await Font.loadAsync([definition]);

    expect(ExpoFontLoader.loadFontFamilyAsync).toHaveBeenCalledTimes(1);
    expect(ExpoFontLoader.loadAsync).not.toHaveBeenCalled();
    expect(ExpoFontLoader.loadFontFamilyAsync).toHaveBeenCalledWith('MultiFace', [
      { localUri: 'file:/regular.ttf', weight: 400 },
      { localUri: 'file:/bold.ttf', weight: 700, style: 'normal' },
    ]);

    for (const face of definition.fontDefinitions) {
      expect((face.path as any).downloaded).toBe(true);
    }
  });

  it('rejects if any face fails to download, and never calls loadFontFamilyAsync', async () => {
    const failingAsset = {
      downloaded: false,
      downloadAsync: jest.fn(async () => {}),
    };
    const definition: Font.FontFamilyDefinition = {
      fontFamily: 'BrokenFamily',
      fontDefinitions: [
        { path: _createMockAsset({ localUri: 'file:/ok.ttf' }) },
        { path: failingAsset as any },
      ],
    };

    await expect(Font.loadAsync([definition])).rejects.toBeDefined();
    expect(ExpoFontLoader.loadFontFamilyAsync).not.toHaveBeenCalled();
    expect(Font.isLoaded('BrokenFamily')).toBe(false);
    expect(Font.isLoading('BrokenFamily')).toBe(false);

    const retryDefinition: Font.FontFamilyDefinition = {
      fontFamily: 'BrokenFamily',
      fontDefinitions: [
        { path: _createMockAsset({ localUri: 'file:/ok.ttf' }) },
        { path: _createMockAsset({ localUri: 'file:/ok2.ttf' }) },
      ],
    };
    await Font.loadAsync([retryDefinition]);
    expect(Font.isLoaded('BrokenFamily')).toBe(true);
  });

  it('rejects if the native call fails, cleans up loadPromises, and allows a retry with no unhandled rejection', async () => {
    jest
      .spyOn(ExpoFontLoader, 'loadFontFamilyAsync')
      .mockRejectedValueOnce(new Error('native failure'));

    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);

    const definition = multiFaceDefinition('RetryFamily');
    await expect(Font.loadAsync([definition])).rejects.toThrow('native failure');
    expect(Font.isLoading('RetryFamily')).toBe(false);
    expect(Font.isLoaded('RetryFamily')).toBe(false);

    // Let any unhandled-rejection microtask flush before asserting.
    await new Promise((resolve) => setImmediate(resolve));
    process.off('unhandledRejection', onUnhandled);
    expect(unhandled).toHaveLength(0);

    const retry = multiFaceDefinition('RetryFamily');
    await Font.loadAsync([retry]);
    expect(Font.isLoaded('RetryFamily')).toBe(true);
    expect(ExpoFontLoader.loadFontFamilyAsync).toHaveBeenCalledTimes(2);
  });

  it('coalesces concurrent loads of the same family into a single native call', async () => {
    const definition1 = multiFaceDefinition('ConcurrentFamily');
    const definition2 = multiFaceDefinition('ConcurrentFamily');

    const promise1 = Font.loadAsync([definition1]);
    expect(Font.isLoading('ConcurrentFamily')).toBe(true);
    const promise2 = Font.loadAsync([definition2]);

    await Promise.all([promise1, promise2]);

    expect(ExpoFontLoader.loadFontFamilyAsync).toHaveBeenCalledTimes(1);
    expect(Font.isLoaded('ConcurrentFamily')).toBe(true);
  });

  it('uses a single family-level loadPromises key, never composite weight/style keys', async () => {
    const definition = multiFaceDefinition('KeyFamily');
    const promise = Font.loadAsync([definition]);
    expect(Object.keys(loadPromises)).toEqual(['KeyFamily']);
    await promise;
    expect(Object.keys(loadPromises)).toEqual([]);
  });

  it.each<[string, () => Font.FontFamilyDefinition[], string, string | undefined]>([
    [
      'an empty fontDefinitions array',
      () => [{ fontFamily: 'Ghost', fontDefinitions: [] }],
      'No font faces were provided',
      'Ghost',
    ],
    [
      'an array element that is not a well-shaped FontFamilyDefinition',
      () => [null as any],
      'Expected an object with `fontFamily` and `fontDefinitions`',
      undefined,
    ],
    [
      'a face with a missing path',
      () => [{ fontFamily: 'NoPath', fontDefinitions: [{} as any] }],
      'has no `path`',
      'NoPath',
    ],
    [
      'two array entries that declare the same fontFamily',
      () => [
        {
          fontFamily: 'Dup',
          fontDefinitions: [{ path: _createMockAsset({ localUri: 'file:/regular.ttf' }) }],
        },
        {
          fontFamily: 'Dup',
          fontDefinitions: [{ path: _createMockAsset({ localUri: 'file:/bold.ttf' }) }],
        },
      ],
      'is declared more than once',
      'Dup',
    ],
  ])('rejects %s', async (_name, buildDefinitions, expectedMessage, familyName) => {
    await expect(Font.loadAsync(buildDefinitions())).rejects.toThrow(expectedMessage);

    expect(ExpoFontLoader.loadFontFamilyAsync).not.toHaveBeenCalled();
    if (familyName) {
      expect(Font.isLoaded(familyName)).toBe(false);
      expect(Font.isLoading(familyName)).toBe(false);
    }
  });

  it('rejects an out-of-range weight before downloading any asset', async () => {
    const okAsset = _createMockAsset({ localUri: 'file:/ok.ttf' });
    const definition: Font.FontFamilyDefinition = {
      fontFamily: 'BadWeight',
      fontDefinitions: [{ path: okAsset, weight: 5000 }],
    };

    await expect(Font.loadAsync([definition])).rejects.toThrow('Invalid font weight');

    expect((okAsset as any).downloadAsync).not.toHaveBeenCalled();
    expect((okAsset as any).downloaded).toBe(false);
    expect(ExpoFontLoader.loadFontFamilyAsync).not.toHaveBeenCalled();
    expect(Font.isLoaded('BadWeight')).toBe(false);
    expect(Font.isLoading('BadWeight')).toBe(false);
  });
});
