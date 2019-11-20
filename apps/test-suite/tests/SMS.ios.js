import Constants from 'expo-constants';
import * as SMS from 'expo-sms';

import { expectMethodToThrowAsync } from '../TestUtils';
import { isInteractive } from '../utils/Environment';

export const name = 'SMS';

export function test({ describe, it, expect }) {
  describe(`sendSMSAsync()`, () => {
    if (Constants.isDevice) {
      if (isInteractive()) {
        it(`opens an SMS composer`, async () => {
          // TODO: Bacon: Build an API to close the UI Controller
          await SMS.sendSMSAsync(['0123456789', '9876543210'], 'test');
        });
      }
    } else {
      it(`is unavailable`, async () => {
        const error = await expectMethodToThrowAsync(SMS.sendSMSAsync);
        expect(error.code).toBe('E_SMS_UNAVAILABLE');
      });
    }
  });

  describe(`isAvailableAsync()`, () => {
    if (Constants.isDevice) {
      it(`has access to iOS SMS API`, async () => {
        expect(await SMS.isAvailableAsync()).toBe(true);
      });
    } else {
      it(`cannot be used in the iOS simulator`, async () => {
        expect(await SMS.isAvailableAsync()).toBe(false);
      });
    }
  });
}
