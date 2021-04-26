import { SMSResponse, SMSOptions } from './SMS.types';
export { SMSResponse };
export declare function sendSMSAsync(addresses: string | string[], message: string, options?: SMSOptions): Promise<SMSResponse>;
/**
 * The device has a telephony radio with data communication support.
 * - Always returns `false` in the iOS simulator, and browser
 */
export declare function isAvailableAsync(): Promise<boolean>;
