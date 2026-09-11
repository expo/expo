import * as TrackingTransparency from '../TrackingTransparency';

describe('TrackingTransparency', () => {
  it('getAdvertisingId is defined', async () => {
    expect(TrackingTransparency.getAdvertisingId).toBeDefined();
  });

  it('getAdvertisingIdAsync is defined', async () => {
    expect(TrackingTransparency.getAdvertisingIdAsync).toBeDefined();
  });

  it('requestPermissionsAsync is defined', async () => {
    expect(TrackingTransparency.requestTrackingPermissionsAsync).toBeDefined();
  });

  it('getPermissionsAsync is defined', async () => {
    expect(TrackingTransparency.getTrackingPermissionsAsync).toBeDefined();
  });

  it('useTrackingPermissions is defined', async () => {
    expect(TrackingTransparency.useTrackingPermissions).toBeDefined();
  });

  it('isAvailable is defined', async () => {
    expect(TrackingTransparency.isAvailable).toBeDefined();
  });
});
