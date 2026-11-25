import * as MediaLibrary from '..';
import * as LegacyMediaLibrary from '../legacy';
import * as NextMediaLibrary from '../next';

describe('isAvailableAsync', () => {
  it('should resolve to false on web platform', async () => {
    await expect(LegacyMediaLibrary.isAvailableAsync()).resolves.toBeFalsy();
  });
});

describe('next API', () => {
  it('should not throw when permissions are requested on web platform from the root import', async () => {
    await expect(MediaLibrary.getPermissionsAsync()).resolves.toMatchObject({
      granted: false,
    });
  });

  it('should not throw when permissions are requested on web platform from the next import', async () => {
    await expect(NextMediaLibrary.getPermissionsAsync()).resolves.toMatchObject({
      granted: false,
    });
  });
});
