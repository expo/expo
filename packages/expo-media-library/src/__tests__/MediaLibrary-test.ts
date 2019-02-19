import * as MediaLibrary from '../MediaLibrary';

describe('createAssetAsync', () => {
  it(`rejects an invalid URI`, async () => {
    expect(MediaLibrary.createAssetAsync('')).rejects.toThrow();
  });
});
