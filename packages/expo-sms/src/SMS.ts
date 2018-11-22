import { NativeModulesProxy } from 'expo-core';

const ExpoSMS = NativeModulesProxy.ExpoSMS;

type SMSResponse = {
  result: 'sent' | 'cancelled',
};

export async function sendSMSAsync(
  addresses: string | string[],
  message: string
): Promise<SMSResponse> {
  const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
  return ExpoSMS.sendSMSAsync(finalAddresses, message);
}

export async function isAvailableAsync(): Promise<boolean> {
  return ExpoSMS.isAvailableAsync();
}
