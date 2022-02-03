import { SMSAttachment, SMSResponse, SMSOptions } from './SMS.types';
export { SMSAttachment, SMSResponse, SMSOptions };
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
export declare function sendSMSAsync(addresses: string | string[], message: string, options?: SMSOptions): Promise<SMSResponse>;
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
export declare function isAvailableAsync(): Promise<boolean>;
//# sourceMappingURL=SMS.d.ts.map