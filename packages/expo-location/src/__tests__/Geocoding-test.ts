import { Platform, UnavailabilityError } from 'expo';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import { geocode, reverseGeocode } from '../next/js/geocoding';

jest.mock('../next/native', () => ({ NativeLocationModuleNext: {} }));

afterEach(() => {
  unmockAllProperties();
});

describe.each(['android', 'web'])('geocoding on %s', (platform) => {
  beforeEach(() => {
    mockProperty(Platform, 'OS', platform);
  });

  it('rejects geocode as unavailable', async () => {
    await expect(geocode('Apple Park')).rejects.toThrow(UnavailabilityError);
  });

  it('rejects reverseGeocode as unavailable', async () => {
    await expect(reverseGeocode({ latitude: 37.3318, longitude: -122.0312 })).rejects.toThrow(
      UnavailabilityError
    );
  });
});
