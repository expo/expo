import * as SMS from 'expo-sms';
import { Platform } from 'react-native';

import {
  loadAttachmentsAsync,
  cleanupAttachmentsAsync,
  testSMSComposeWithSingleImageAttachment,
  testSMSComposeWithAudioAttachment,
  testSMSComposeWithTwoImageAttachments,
  testSMSComposeWithNullRecipient,
  testSMSComposeWithUndefinedRecipient,
} from './SMSCommon';
import { expectMethodToThrowAsync } from '../TestUtils';
import { isInteractive } from '../utils/Environment';

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

        it(`throws when provided with undefined recipient`, async () => {
          const error = await expectMethodToThrowAsync(testSMSComposeWithUndefinedRecipient);
          expect(error.message).toBe('undefined or null address');
        });

        it(`throws when provided with null recipient`, async () => {
          const error = await expectMethodToThrowAsync(testSMSComposeWithNullRecipient);
          expect(error.message).toBe('undefined or null address');
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
