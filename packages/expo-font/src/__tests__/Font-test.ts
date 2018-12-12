jest.mock('expo-constants', () => ({
  manifest: {},
  sessionId: 'testsession',
  systemFonts: ['Helvetica', 'Helvetica Neue'],
}));

let Font;
let NativeModulesProxy;

beforeEach(() => {
  ({ NativeModulesProxy } = require('expo-core'));
  NativeModulesProxy.ExpoFontLoader.loadAsync.mockImplementation(async () => {});
  Font = require('expo-font');
});

afterEach(() => {
  jest.resetModules();
});

describe('loadAsync', () => {
  it(`completes after loading a font`, async () => {
    const NativeFontLoader = NativeModulesProxy.ExpoFontLoader;

    const mockAsset = _createMockAsset();
    await Font.loadAsync('test-font', mockAsset);

    expect(mockAsset.downloaded).toBe(true);
    expect(NativeFontLoader.loadAsync).toHaveBeenCalledTimes(1);
    expect(NativeFontLoader.loadAsync.mock.calls[0]).toMatchSnapshot();
    expect(Font.isLoaded('test-font')).toBe(true);
    expect(Font.isLoading('test-font')).toBe(false);
  });

  it(`throws if downloading a font fails`, async () => {
    const NativeFontLoader = NativeModulesProxy.ExpoFontLoader;

    const mockAsset = {
      downloaded: false,
      downloadAsync: jest.fn(async () => {}),
    };
    await expect(Font.loadAsync('test-font', mockAsset)).rejects.toMatchSnapshot();

    expect(mockAsset.downloaded).toBe(false);
    expect(NativeFontLoader.loadAsync).not.toHaveBeenCalled();
    expect(Font.isLoaded('test-font')).toBe(false);
    expect(Font.isLoading('test-font')).toBe(false);
  });

  it(`throws if loading a downloaded font fails`, async () => {
    const NativeFontLoader = NativeModulesProxy.ExpoFontLoader;
    NativeFontLoader.loadAsync.mockImplementation(async () => {
      throw new Error('Intentional error from FontLoader mock');
    });

    const mockAsset = _createMockAsset();
    await expect(Font.loadAsync('test-font', mockAsset)).rejects.toMatchSnapshot();

    expect(mockAsset.downloaded).toBe(true);
    expect(NativeFontLoader.loadAsync).toHaveBeenCalled();
    expect(Font.isLoaded('test-font')).toBe(false);
    expect(Font.isLoading('test-font')).toBe(false);
  });

  it(`doesn't redownload a loaded font`, async () => {
    const NativeFontLoader = NativeModulesProxy.ExpoFontLoader;

    const mockAsset1 = _createMockAsset();
    await Font.loadAsync('test-font', mockAsset1);
    expect(NativeFontLoader.loadAsync).toHaveBeenCalledTimes(1);

    const mockAsset2 = _createMockAsset();
    await Font.loadAsync('test-font', mockAsset2);
    expect(NativeFontLoader.loadAsync).toHaveBeenCalledTimes(1);
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
    const NativeFontLoader = NativeModulesProxy.ExpoFontLoader;

    const mockAsset1 = {
      downloaded: false,
      downloadAsync: jest.fn(async () => {}),
    };
    await expect(Font.loadAsync('test-font', mockAsset1)).rejects.toBeDefined();
    expect(NativeFontLoader.loadAsync).not.toHaveBeenCalled();
    expect(Font.isLoaded('test-font')).toBe(false);
    expect(Font.isLoading('test-font')).toBe(false);

    const mockAsset2 = _createMockAsset();
    await Font.loadAsync('test-font', mockAsset2);
    expect(NativeFontLoader.loadAsync).toHaveBeenCalledTimes(1);
    expect(Font.isLoaded('test-font')).toBe(true);
    expect(Font.isLoading('test-font')).toBe(false);
  });

  it(`coalesces concurrent loads`, async () => {
    const NativeFontLoader = NativeModulesProxy.ExpoFontLoader;

    const mockAsset1 = _createMockAsset();
    const loadPromise1 = Font.loadAsync('test-font', mockAsset1);
    expect(Font.isLoaded('test-font')).toBe(false);
    expect(Font.isLoading('test-font')).toBe(true);

    const mockAsset2 = _createMockAsset();
    const loadPromise2 = Font.loadAsync('test-font', mockAsset2);
    expect(Font.isLoaded('test-font')).toBe(false);
    expect(Font.isLoading('test-font')).toBe(true);

    await Promise.all([loadPromise1, loadPromise2]);
    expect(NativeFontLoader.loadAsync).toHaveBeenCalledTimes(1);
    expect(Font.isLoaded('test-font')).toBe(true);
    expect(Font.isLoading('test-font')).toBe(false);
  });

  it(`rejects all coalesced loads`, async () => {
    const mockAsset1 = {
      downloaded: false,
      downloadAsync: jest.fn(async () => {}),
    };
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
    };

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
    const NativeFontLoader = NativeModulesProxy.ExpoFontLoader;

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
    expect(NativeFontLoader.loadAsync).toHaveBeenCalledTimes(2);
    expect(Font.isLoaded('test-font-1')).toBe(true);
    expect(Font.isLoaded('test-font-2')).toBe(true);
    expect(Font.isLoading('test-font-1')).toBe(false);
    expect(Font.isLoading('test-font-2')).toBe(false);
  });
});

describe('processFontFamily', () => {
  let originalConsole;

  beforeEach(() => {
    originalConsole = console;
  });

  afterEach(() => {
    console = originalConsole;
  });

  it(`handles empty values`, () => {
    expect(Font.processFontFamily(null)).toBeNull();
    expect(Font.processFontFamily(undefined as any)).toBeUndefined();
  });

  it(`handles the system font`, () => {
    expect(Font.processFontFamily('System')).toBe('System');
  });

  it(`handles built-in fonts`, () => {
    expect(Font.processFontFamily('Helvetica')).toBe('Helvetica');
  });

  it(`defaults missing fonts to the system font`, () => {
    console.error = jest.fn();

    const fontName = 'not-loaded';
    expect(Font.isLoaded(fontName)).toBe(false);
    expect(Font.processFontFamily(fontName)).toBe('System');
    expect(console.error).toHaveBeenCalled();
    expect((console.error as jest.Mock).mock.calls[0]).toMatchSnapshot();
  });

  it(`defaults still-loading fonts to the system font`, () => {
    console.error = jest.fn();

    const fontName = 'loading';
    const mockAsset = _createMockAsset();
    Font.loadAsync(fontName, mockAsset);
    expect(Font.isLoaded(fontName)).toBe(false);
    expect(Font.isLoading(fontName)).toBe(true);

    expect(Font.processFontFamily(fontName)).toBe('System');
    expect(console.error).toHaveBeenCalled();
    expect((console.error as jest.Mock).mock.calls[0]).toMatchSnapshot();
  });

  it(`scopes loaded names of loaded fonts`, async () => {
    const fontName = 'test-font';
    const mockAsset = _createMockAsset();
    await Font.loadAsync(fontName, mockAsset);
    expect(Font.isLoaded(fontName)).toBe(true);

    const processedFontFamily = Font.processFontFamily(fontName);
    expect(processedFontFamily).toContain(fontName);
    expect(processedFontFamily).toMatchSnapshot();
  });

  it(`doesn't re-process Expo fonts`, async () => {
    const fontName = 'test-font';
    const mockAsset = _createMockAsset();
    await Font.loadAsync(fontName, mockAsset);
    expect(Font.isLoaded(fontName)).toBe(true);

    const processedFontFamily = Font.processFontFamily(fontName);
    expect(Font.processFontFamily(processedFontFamily)).toBe(processedFontFamily);
  });
});

function _createMockAsset({
  localUri = 'file:/test/test-font.ttf',
}: MockAssetOptions = {}): MockAsset {
  const mockAsset: MockAsset = {
    downloaded: false,
    downloadAsync: jest.fn(async () => {
      mockAsset.downloaded = true;
      mockAsset.localUri = localUri;
    }),
  };
  return mockAsset;
}

type MockAsset = { downloaded: boolean; downloadAsync: () => Promise<void>; localUri?: string };
type MockAssetOptions = { localUri?: string };
