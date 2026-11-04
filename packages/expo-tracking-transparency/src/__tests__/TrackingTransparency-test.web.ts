import * as TrackingTransparency from '../TrackingTransparency';

describe('TrackingTransparency', () => {
  it('reports the native module as unavailable', () => {
    expect(TrackingTransparency.isAvailable()).toBe(false);
  });

  it('resolves tracking permissions as granted', async () => {
    await expect(TrackingTransparency.getTrackingPermissionsAsync()).resolves.toMatchObject({
      granted: true,
    });
  });
});
