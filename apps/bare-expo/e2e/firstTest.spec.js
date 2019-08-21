/* global device element by */

describe('Example', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have gradient', async () => {
    await expect(element(by.id('App-gradient'))).toBeVisible();
  });
});
