import * as MediaLibrary from '../MediaLibrary';

describe('isAvailableAsync', () => {
  it('should resolve to false on web platform', async () => {
    await expect(MediaLibrary.isAvailableAsync()).resolves.toBeFalsy();
  });
});
