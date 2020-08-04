import * as SMS from 'expo-sms';
import { Platform } from 'react-native';

import { isInteractive } from '../utils/Environment';
import {
  loadAttachmentsAsync,
  cleanupAttachmentsAsync,
  testSMSComposeWithSingleImageAttachment,
  testSMSComposeWithAudioAttachment,
  testSMSComposeWithTwoImageAttachments,
} from './SMSCommon';

export const name = 'SMS';

export function test({ describe, it, expect, beforeAll, afterAll }) {
  describe('SMS', () => {
    if (isInteractive()) {
      describe(`sendSMSAsync()`, () => {
        beforeAll(() => loadAttachmentsAsync(expect));

        it(`opens an SMS composer`, async () => {
          await SMS.sendSMSAsync(['0123456789', '9876543210'], 'test');
        });

        it(`opens an SMS composer with single image attachment`, async () => {
          await testSMSComposeWithSingleImageAttachment(expect);
        });

        it(`opens an SMS composer with two image attachments. Only first one is used.`, async () => {
          await testSMSComposeWithTwoImageAttachments(expect);
        });

        it(`opens an SMS composer with audio attachment`, async () => {
          await testSMSComposeWithAudioAttachment(expect);
        });

        afterAll(() => cleanupAttachmentsAsync(expect));
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
  });
}
