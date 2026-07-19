import * as SMS from 'expo-sms';
import { Platform } from 'react-native';

import { expectMethodToThrowAsync } from '../TestUtils';

export const name = 'SMS';

export function test({ describe, it, expect }) {
  describe(`sendSMSAsync()`, () => {
    it(`is unavailable`, async () => {
      const error = await expectMethodToThrowAsync(SMS.sendSMSAsync);
      expect(error.code).toBe('E_SMS_UNAVAILABLE');
    });
  });

  describe(`isAvailableAsync()`, () => {
    it(`is not supported on ${Platform.OS}`, async () => {
      expect(await SMS.isAvailableAsync()).toBe(false);
    });
  });
}
