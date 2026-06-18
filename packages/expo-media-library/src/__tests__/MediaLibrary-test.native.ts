import * as MediaLibrary from '../legacy';

jest.mock('../next/native', () => ({
  __esModule: true,
  default: {
    Query: class {},
    Asset: class {},
    Album: class {},
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    presentPermissionsPicker: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

describe('createAssetAsync', () => {
  it(`rejects an invalid URI`, async () => {
    expect(MediaLibrary.createAssetAsync('')).rejects.toThrow();
  });
});

describe('isAvailableAsync', () => {
  it('should resolve to true on native platforms', async () => {
    await expect(MediaLibrary.isAvailableAsync()).resolves.toBeTruthy();
  });
});

describe('entrypoints', () => {
  it('root API exports the new media library classes', () => {
    const root = require('../index');

    expect(root.Asset).toBeDefined();
    expect(root.Album).toBeDefined();
    expect(root.Query).toBeDefined();
    expect(root.presentPermissionsPicker).toBeDefined();
  });

  it('legacy API exports the old methods', () => {
    const legacy = require('../legacy');

    expect(legacy.createAssetAsync).toBeDefined();
    expect(legacy.getAssetsAsync).toBeDefined();
    expect(legacy.isAvailableAsync).toBeDefined();
  });

  it('next API remains available as an alias for the new API', () => {
    const next = require('../next');

    expect(next.Asset).toBeDefined();
    expect(next.Album).toBeDefined();
    expect(next.Query).toBeDefined();
    expect(next.presentPermissionsPicker).toBeDefined();
  });

  it('root legacy method stubs warn and throw', async () => {
    const root = require('../index');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(root.createAssetAsync('file:///photo.jpg')).rejects.toThrow(
      'expo-media-library/legacy'
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('expo-media-library/legacy'));

    warn.mockRestore();
  });
});
