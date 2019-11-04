import { UnavailabilityError } from '@unimodules/core';

import ExpoSMS from './ExpoSMS';
import { SMSResponse } from './SMS.types';

export async function sendSMSAsync(
  addresses: string | string[],
  message: string
): Promise<SMSResponse> {
  const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
  if (!ExpoSMS.sendSMSAsync) {
    throw new UnavailabilityError('expo-sms', 'sendSMSAsync');
  }
  return ExpoSMS.sendSMSAsync(finalAddresses, message);
}

/**
 * The device has a telephony radio with data communication support.
 * - Always returns `false` in the iOS simulator, and browser
 */
export async function isAvailableAsync(): Promise<boolean> {
  return ExpoSMS.isAvailableAsync();
}
