import * as SMS from 'expo-sms';
import { Platform } from 'react-native';

import { isInteractive } from '../utils/Environment';

export const name = 'SMS';

export function test({ describe, it, expect }) {
  if (!isInteractive()) {
    describe(`sendSMSAsync()`, () => {
      it(`opens an SMS composer`, async () => {
        await SMS.sendSMSAsync(['0123456789', '9876543210'], 'test');
      });
    });
  }

  describe(`isAvailableAsync()`, () => {
    if (Platform.OS === 'android' && isInteractive()) {
      // TODO(Bacon): Not sure if this works in an emulator or not
      it(`has a telephony radio with data communication support`, async () => {
        expect(await SMS.isAvailableAsync()).toBe(true);
      });
    } else {
      it(`is not supported on ${Platform.OS}`, async () => {
        expect(await SMS.isAvailableAsync()).toBe(false);
      });
    }
  });
}
