/* eslint-disable no-unused-expressions */
import { UnavailabilityError, Platform } from 'expo-modules-core';

import ExpoSMS from './ExpoSMS';
import { SMSAttachment, SMSResponse, SMSOptions } from './SMS.types';

export { SMSAttachment, SMSResponse, SMSOptions };

function processAttachments(
  attachments: SMSAttachment | SMSAttachment[] | undefined
): SMSAttachment[] | null {
  if (!attachments) {
    return null;
  }
  attachments = Array.isArray(attachments) ? attachments : [attachments];
  if (Platform.OS === 'android' && attachments.length > 1) {
    if (__DEV__) {
      console.warn('Android only supports a single attachment. The first array item is used.');
    }
    attachments = attachments.slice(0, 1);
  }
  return attachments;
}

// @needsAudit
/**
 * Opens the default UI/app for sending SMS messages with prefilled addresses and message.
 *
 * @param addresses An array of addresses (phone numbers) or single address passed as strings. Those
 * would appear as recipients of the prepared message.
 * @param message Message to be sent.
 * @param options A `SMSOptions` object defining additional SMS configuration options.
 *
 * @return Returns a Promise that fulfils with the SMS action is invoked by the user, with corresponding result:
 * - If the user cancelled the SMS sending process: `{ result: 'cancelled' }`.
 * - If the user has sent/scheduled message for sending: `{ result: 'sent' }`.
 * - If the status of the SMS message cannot be determined: `{ result: 'unknown' }`.
 *
 * Android does not provide information about the status of the SMS message, so on Android devices
 * the Promise will always resolve with { result: 'unknown' }.
 *
 * > Note: The only feedback collected by this module is whether any message has been sent. That
 * means we do not check actual content of message nor recipients list.
 *
 * @example
 * ```ts
 * const { result } = await SMS.sendSMSAsync(
 *   ['0123456789', '9876543210'],
 *   'My sample HelloWorld message',
 *   {
 *     attachments: {
 *       uri: 'path/myfile.png',
 *       mimeType: 'image/png',
 *       filename: 'myfile.png',
 *     },
 *   }
 * );
 * ```
 */
export async function sendSMSAsync(
  addresses: string | string[],
  message: string,
  options?: SMSOptions
): Promise<SMSResponse> {
  if (!ExpoSMS.sendSMSAsync) {
    throw new UnavailabilityError('expo-sms', 'sendSMSAsync');
  }
  const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
  finalAddresses.forEach((address) => {
    if (address === null || address === undefined) {
      throw new TypeError('undefined or null address');
    }
  });
  const finalOptions = {
    ...options,
  } as SMSOptions;
  if (options?.attachments) {
    finalOptions.attachments = processAttachments(options?.attachments) || undefined;
  }
  return ExpoSMS.sendSMSAsync(finalAddresses, message, finalOptions);
}

// @needsAudit
/**
 * Determines whether SMS is available. Always returns `false` in the iOS simulator, and in browser.
 *
 * @return Returns a promise that fulfils with a `boolean`, indicating whether SMS is available on this device.
 *
 * @example
 * ```ts
 * const isAvailable = await SMS.isAvailableAsync();
 * if (isAvailable) {
 *   // do your SMS stuff here
 * } else {
 *   // misfortune... there's no SMS available on this device
 * }
 * ```
 */
export async function isAvailableAsync(): Promise<boolean> {
  return ExpoSMS.isAvailableAsync();
}
