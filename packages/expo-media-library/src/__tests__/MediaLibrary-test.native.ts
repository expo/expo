import * as MediaLibrary from '../MediaLibrary';

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
