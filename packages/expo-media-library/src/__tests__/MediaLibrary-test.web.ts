import * as MediaLibrary from '../legacy';

describe('isAvailableAsync', () => {
  it('should resolve to false on web platform', async () => {
    await expect(MediaLibrary.isAvailableAsync()).resolves.toBeFalsy();
  });
});
