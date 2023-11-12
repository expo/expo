import { Platform } from 'expo-modules-core';
import ExpoMailComposer from './ExpoMailComposer';
import { openClientAsyncIos } from './openClientAsync.ios';
/**
 * Opens an email client on the device.
 * This is particularly useful for scenarios like sending a login link (akin to Slack's "Magic Link" functionality) or
 * for verifying the user's email address during registration.
 *
 * If only one email client is installed and detected, it will be automatically opened.
 * If multiple clients are available, a pop-up will prompt the user to choose from the available options.
 * If no email client is found, the promise resolves without triggering any action.
 * @param options Configuration options for the mail client selector.
 * @returns A promise that resolves once an email client is opened or the operation is cancelled.
 * @platform android ios
 */
export async function openClientAsync(options = {}) {
    if (Platform.OS === 'ios') {
        return await openClientAsyncIos(options);
    }
    return await ExpoMailComposer.openClientAsync(options);
}
// @needsAudit
/**
 * Opens a mail modal for iOS and a mail app intent for Android and fills the fields with provided
 * data. On iOS you will need to be signed into the Mail app.
 * @return A promise fulfilled with an object containing a `status` field that specifies whether an
 * email was sent, saved, or cancelled. Android does not provide this info, so the status is always
 * set as if the email were sent.
 */
export async function composeAsync(options) {
    return await ExpoMailComposer.composeAsync(options);
}
// @needsAudit
/**
 * Determine if the `MailComposer` API can be used in this app.
 * @return A promise resolves to `true` if the API can be used, and `false` otherwise.
 * - Returns `true` on iOS when the device has a default email setup for sending mail.
 * - Can return `false` on iOS if an MDM profile is setup to block outgoing mail. If this is the
 * case, you may want to use the Linking API instead.
 * - Always returns `true` in the browser and on Android.
 */
export async function isAvailableAsync() {
    return await ExpoMailComposer.isAvailableAsync();
}
export * from './MailComposer.types';
//# sourceMappingURL=MailComposer.js.map