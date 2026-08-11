import * as SMS from 'expo-sms';
import { Platform } from 'react-native';

import { expectMethodToThrowAsync } from '../TestUtils';
import type { JasmineInterface } from '../types';

export const name = 'SMS';

export function test({ describe, it, expect }: JasmineInterface) {
  describe(`sendSMSAsync()`, () => {
    it(`is unavailable`, async () => {
      const error = (await expectMethodToThrowAsync(SMS.sendSMSAsync)) as { code: string };
      expect(error.code).toBe('E_SMS_UNAVAILABLE');
    });
  });

  describe(`isAvailableAsync()`, () => {
    it(`is not supported on ${Platform.OS}`, async () => {
      expect(await SMS.isAvailableAsync()).toBe(false);
    });
  });
}
