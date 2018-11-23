import { Platform } from 'expo-core';
import ExpoSMS from './ExpoSMS';

type SMSResponse = {
  result: 'sent' | 'cancelled';
};

export async function sendSMSAsync(
  addresses: string | string[],
  message: string
): Promise<SMSResponse> {
  const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
  if (ExpoSMS.sendSMSAsync) {
    return ExpoSMS.sendSMSAsync(finalAddresses, message);
  }
  throw new Error(`SMS.sendSMSAsync is not supported on ${Platform.OS}`);
}

export async function isAvailableAsync(): Promise<boolean> {
  return ExpoSMS.isAvailableAsync();
}
