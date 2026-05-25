import type { WidgetImagePreloadOptions, WidgetImagePreloadResult } from '../Widgets.types';

const mockNativeModule = {
  preloadImagesAsync: jest.fn<Promise<WidgetImagePreloadResult>, [WidgetImagePreloadOptions[]]>(),
  clearPreloadedImagesAsync: jest.fn<Promise<void>, [options?: { keys?: string[] }]>(),
};

describe('widget image preloading', () => {
  beforeEach(() => {
    jest.resetModules();
    mockNativeModule.preloadImagesAsync.mockReset();
    mockNativeModule.clearPreloadedImagesAsync.mockReset();
    jest.doMock('../ExpoWidgets', () => ({
      __esModule: true,
      default: mockNativeModule,
    }));
  });

  function requireWidgets(): typeof import('../Widgets') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../Widgets');
  }

  it('forwards image preload options to the native module', async () => {
    const result: WidgetImagePreloadResult = {
      images: {
        'launch:123': {
          key: 'launch:123',
          uri: 'file:///app-group/ExpoWidgetsImages/launch-123',
          width: 600,
          height: 400,
          bytes: 12345,
        },
      },
      failed: [{ key: 'launch:456', error: 'Request failed with HTTP 404' }],
    };
    const images: WidgetImagePreloadOptions[] = [
      {
        key: 'launch:123',
        url: 'https://example.com/launch.jpg',
        resize: { maxWidth: 600 },
      },
    ];
    mockNativeModule.preloadImagesAsync.mockResolvedValue(result);

    await expect(requireWidgets().preloadImagesAsync(images)).resolves.toBe(result);
    expect(mockNativeModule.preloadImagesAsync).toHaveBeenCalledWith(images);
  });

  it('rejects image preload calls that do not receive an array', async () => {
    await expect(
      requireWidgets().preloadImagesAsync({
        key: 'avatar',
        url: 'https://example.com/avatar.jpg',
      } as never)
    ).rejects.toThrow('The "images" argument must be an array');
    expect(mockNativeModule.preloadImagesAsync).not.toHaveBeenCalled();
  });

  it('forwards targeted image clear options to the native module', async () => {
    mockNativeModule.clearPreloadedImagesAsync.mockResolvedValue();

    await requireWidgets().clearPreloadedImagesAsync({ keys: ['launch:123'] });
    expect(mockNativeModule.clearPreloadedImagesAsync).toHaveBeenCalledWith({
      keys: ['launch:123'],
    });
  });
});
