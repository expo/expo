import ExpoMailComposer from './ExpoMailComposer';
import { MailComposerOptions, MailComposerResult } from './MailComposer.types';

export async function composeAsync(options: MailComposerOptions): Promise<MailComposerResult> {
  return await ExpoMailComposer.composeAsync(options);
}

/**
 * Can the device compose an email.
 * - Returns `true` on iOS when the device has a default email setup for sending mail.
 * - Can return `false` on iOS if an MDM profile is setup to block outgoing mail. If this is the case, you may want to use the Linking API instead.
 * - Always returns `true` in the browser and on Android
 */
export async function isAvailableAsync(): Promise<boolean> {
  return await ExpoMailComposer.isAvailableAsync();
}

export * from './MailComposer.types';
