import { Platform } from 'expo-modules-core';

import ExpoSMS from '../ExpoSMS';
import * as SMS from '../SMS';
import { SMSAttachment } from '../SMS.types';

it(`normalizes one phone number into an array`, async () => {
  try {
    await SMS.sendSMSAsync('0123456789', 'test');
    expect(ExpoSMS.sendSMSAsync).toHaveBeenLastCalledWith(['0123456789'], 'test', {});

    await SMS.sendSMSAsync(['0123456789', '9876543210'], 'test');
    expect(ExpoSMS.sendSMSAsync).toHaveBeenLastCalledWith(['0123456789', '9876543210'], 'test', {});
  } catch (e) {
    if (Platform.OS === 'web') {
      expect(e.code).toBe('ERR_UNAVAILABLE');
    }
  }
});

it(`normalizes attachments parameter to always pass array to native`, async () => {
  try {
    const imageAttachment = {
      uri: 'path/myfile.png',
      filename: 'myfile.png',
      mimeType: 'image/png',
    } as SMSAttachment;

    await SMS.sendSMSAsync('0123456789', 'test', { attachments: imageAttachment });
    expect(ExpoSMS.sendSMSAsync).toHaveBeenLastCalledWith(['0123456789'], 'test', {
      attachments: [imageAttachment],
    });

    const audioAttachment = {
      uri: 'path/myfile.mp3',
      filename: 'myfile.mp3',
      mimeType: 'image/mp3',
    } as SMSAttachment;
    const multipleAttachments = [imageAttachment, audioAttachment];
    await SMS.sendSMSAsync('0123456789', 'test', { attachments: multipleAttachments });
    expect(ExpoSMS.sendSMSAsync).toHaveBeenLastCalledWith(['0123456789'], 'test', {
      attachments: Platform.OS === 'android' ? [imageAttachment] : multipleAttachments,
    });
  } catch (e) {
    if (Platform.OS === 'web') {
      expect(e.code).toBe('ERR_UNAVAILABLE');
    }
  }
});
