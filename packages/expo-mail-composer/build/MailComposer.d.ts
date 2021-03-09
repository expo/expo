import { MailComposerOptions, MailComposerResult } from './MailComposer.types';
/**
 * Opens a mail modal for iOS and a mail app intent for Android and fills the fields with provided data. On iOS you will need to be signed into the Mail app.
 * @return Resolves to a promise with object containing status field that could be either sent, saved or cancelled. Android does not provide such info so it always resolves to sent.
 */
export declare function composeAsync(options: MailComposerOptions): Promise<MailComposerResult>;
/**
 * Determine if the `MailComposer` API can be used in this app.
 * @return A promise resolves to `true` if the API can be used, and `false` otherwise.
 * - Returns `true` on iOS when the device has a default email setup for sending mail.
 * - Can return `false` on iOS if an MDM profile is setup to block outgoing mail. If this is the case, you may want to use the Linking API instead.
 * - Always returns `true` in the browser and on Android.
 */
export declare function isAvailableAsync(): Promise<boolean>;
export * from './MailComposer.types';
