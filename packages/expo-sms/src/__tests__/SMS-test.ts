import { NativeModulesProxy } from '@unimodules/core';

import * as SMS from '../SMS';

it(`normalizes one phone number into an array`, async () => {
  const { ExpoSMS } = NativeModulesProxy;

  await SMS.sendSMSAsync('0123456789', 'test');
  expect(ExpoSMS.sendSMSAsync).toHaveBeenLastCalledWith(['0123456789'], 'test');

  await SMS.sendSMSAsync(['0123456789', '9876543210'], 'test');
  expect(ExpoSMS.sendSMSAsync).toHaveBeenLastCalledWith(['0123456789', '9876543210'], 'test');
});
