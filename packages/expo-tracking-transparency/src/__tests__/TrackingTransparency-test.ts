import * as TrackingTransparency from '../TrackingTransparency';

describe('TrackingTransparency', () => {
  it('requestPermissionsAsync is defined', async () => {
    expect(TrackingTransparency.requestTrackingPermissionsAsync).toBeDefined();
  });

  it('getPermissionsAsync is defined', async () => {
    expect(TrackingTransparency.getTrackingPermissionsAsync).toBeDefined();
  });

  it('isAvailable is defined', async () => {
    expect(TrackingTransparency.isAvailable).toBeDefined();
  });
});
