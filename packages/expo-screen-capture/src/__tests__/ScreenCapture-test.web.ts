import * as ScreenCapture from '../ScreenCapture';

describe('isAvailableAsync', () => {
  it('returns false on web platform', async () => {
    await expect(ScreenCapture.isAvailableAsync()).resolves.toBeFalsy();
  });
});
