import { MailComposerOptions, MailComposerResult } from './MailComposer.types';
export declare function composeAsync(options: MailComposerOptions): Promise<MailComposerResult>;
/**
 * Can the device compose an email.
 * - Returns `true` on iOS when the device has a default email setup for sending mail.
 * - Can return `false` on iOS if an MDM profile is setup to block outgoing mail. If this is the case, you may want to use the Linking API instead.
 * - Always returns `true` in the browser and on Android
 */
export declare function isAvailableAsync(): Promise<boolean>;
export * from './MailComposer.types';
