// @flow

import { NativeModulesProxy } from 'expo-core';

const ExpoSMS: Object = NativeModulesProxy.ExpoSMS;

type SMSResponse = {
  result: 'sent' | 'cancelled',
};

export async function sendSMSAsync(
  addresses: Array<String> | String,
  message: String
): Promise<SMSResponse> {
  const finalAddresses = Array.isArray(addresses) ? addresses : [addresses];
  return ExpoSMS.sendSMSAsync(finalAddresses, message);
}

export async function isAvailableAsync(): Promise<boolean> {
  return ExpoSMS.isAvailableAsync();
}
