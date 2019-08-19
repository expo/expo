import Constants from 'expo-constants';
import * as SMS from 'expo-sms';
import { Platform } from 'react-native';

import { expectMethodToThrowAsync, isInDeviceFarm } from '../TestUtils';

export const name = 'SMS';

export function test({ describe, it, expect }) {
  if (!isInDeviceFarm()) {
    describe(`sendSMSAsync()`, () => {
      if (Platform.OS === 'web' || (Platform.OS === 'ios' && !Constants.isDevice)) {
        it(`is unavailable`, async () => {
          const error = await expectMethodToThrowAsync(SMS.sendSMSAsync);
          expect(error.code).toBe('E_SMS_UNAVAILABLE');
        });
      } else {
        it(`opens an SMS composer`, async () => {
          await SMS.sendSMSAsync(['0123456789', '9876543210'], 'test');
        });
      }
    });
  }

  describe(`isAvailableAsync()`, () => {
    switch (Platform.OS) {
      case 'ios':
        if (Constants.isDevice) {
          it(`can open a url with the \`sms:\` prefix`, async () => {
            expect(await SMS.isAvailableAsync()).toBe(true);
          });
        } else {
          it(`cannot be used in the iOS simulator`, async () => {
            expect(await SMS.isAvailableAsync()).toBe(false);
          });
        }
        break;
      case 'android':
        // TODO(Bacon): Not sure if this works in an emulator or not
        it(`has a telephony radio with data communication support`, async () => {
          expect(await SMS.isAvailableAsync()).toBe(true);
        });
        break;
      default:
        it(`is not supported on ${Platform.OS}`, async () => {
          expect(await SMS.isAvailableAsync()).toBe(false);
        });
        break;
    }
  });
}
