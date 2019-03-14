import { Platform } from '@unimodules/core';
import ExpoSMS from './ExpoSMS';

type SMSResponse = {
  result: 'unknown' | 'sent' | 'cancelled';
};

export async function sendSMSAsync(
  addresses: string | string[],
  message: string
): Promise<SMSResponse> {
  const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
  if (!ExpoSMS.sendSMSAsync) {
    throw new Error(`SMS.sendSMSAsync is not supported on ${Platform.OS}`);
  }
  return ExpoSMS.sendSMSAsync(finalAddresses, message);
}

export async function isAvailableAsync(): Promise<boolean> {
  return ExpoSMS.isAvailableAsync();
}
