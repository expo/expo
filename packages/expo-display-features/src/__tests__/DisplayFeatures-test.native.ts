import ExpoDisplayFeatures from '../ExpoDisplayFeatures';

import { getDisplayFeaturesAsync, getHingeAsync, DisplayFeatureType } from '../DisplayFeatures';

it('resolves to the native getDisplayFeaturesAsync result untouched', async () => {
  const displayFeatures = [
    {
      type: DisplayFeatureType.HINGE,
      state: 'postureHalfOpened',
      bounds: { x: 0, y: 410, width: 820, height: 24 },
    },
  ];
  jest.mocked(ExpoDisplayFeatures.getDisplayFeaturesAsync).mockResolvedValueOnce(displayFeatures);

  await expect(getDisplayFeaturesAsync()).resolves.toEqual(displayFeatures);
});

it('resolves to an empty array from the (stub) native module today', async () => {
  jest.mocked(ExpoDisplayFeatures.getDisplayFeaturesAsync).mockResolvedValueOnce([]);

  await expect(getDisplayFeaturesAsync()).resolves.toEqual([]);
});

it('resolves getHingeAsync to null on devices without a hinge', async () => {
  jest.mocked(ExpoDisplayFeatures.getHingeAsync).mockResolvedValueOnce(null);

  await expect(getHingeAsync()).resolves.toBeNull();
});
