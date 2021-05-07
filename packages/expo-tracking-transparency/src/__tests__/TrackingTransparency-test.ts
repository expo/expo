import * as TrackingTransparency from '../TrackingTransparency';

describe('TrackingTransparency', () => {
  it('requestPermissionsAsync is defined', async () => {
    expect(TrackingTransparency.requestPermissionsAsync).toBeDefined();
  });

  it('getPermissionsAsync is defined', async () => {
    expect(TrackingTransparency.getPermissionsAsync).toBeDefined();
  });
});
