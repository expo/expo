import { CodedError } from 'expo-modules-core';

import { SMSResponse } from './SMS.types';

export default {
  get name(): string {
    return 'ExpoSMS';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  async sendSMSAsync(addresses: string[], message: string): Promise<SMSResponse> {
    throw new CodedError('E_SMS_UNAVAILABLE', 'SMS not available');
  },
};
