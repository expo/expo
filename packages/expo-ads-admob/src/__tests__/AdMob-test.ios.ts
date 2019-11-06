import * as AdMob from '../index';
import ExpoAdsAdMob from '../ExpoAdsAdMob';

it('sets the test device ID internally from setTestDeviceID', async () => {
  const expected = 'EMULATOR';
  await AdMob.setTestDeviceID(expected);
  const result = AdMob._getTestDeviceID();
  expect(result).toEqual(expected);
});

it('calls global setTestDeviceID from setTestDeviceID', async () => {
  await AdMob.setTestDeviceID('EMULATOR');
  expect(ExpoAdsAdMob.setTestDeviceID).toHaveBeenCalled();
});
