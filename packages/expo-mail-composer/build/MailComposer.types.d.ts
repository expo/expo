/**
 * Represents a mail client available on the device.
 */
export type MailClient = {
    /**
     * The display name of the mail client.
     */
    label: string;
    /**
     * The package name of the mail client application.
     * You can use this package name with the `getApplicationIconAsync` or `openApplication` functions from
     * `expo-intent-launcher` to retrieve the app’s icon or open the mail client directly.
     * @platform android
     */
    packageName?: string;
    /**
     * The URL scheme of the mail client.
     * You can use this URL with the `openURL` function from `expo-linking` to open the mail client.
     * @platform ios
     */
    url?: string;
};
/**
 * A map defining the data to fill the mail.
 */
export type MailComposerOptions = {
    /**
     * An array of e-mail addresses of the recipients.
     */
    recipients?: string[];
    /**
     * An array of e-mail addresses of the CC recipients.
     */
    ccRecipients?: string[];
    /**
     * An array of e-mail addresses of the BCC recipients.
     */
    bccRecipients?: string[];
    /**
     * Subject of the e-mail.
     */
    subject?: string;
    /**
     * Body of the e-mail.
     */
    body?: string;
    /**
     * Whether the body contains HTML tags so it could be formatted properly.
     * Not working perfectly on Android.
     */
    isHtml?: boolean;
    /**
     * An array of app's internal file URIs to attach.
     */
    attachments?: string[];
};
export type MailComposerResult = {
    status: MailComposerStatus;
};
export declare enum MailComposerStatus {
    UNDETERMINED = "undetermined",
    SENT = "sent",
    SAVED = "saved",
    CANCELLED = "cancelled"
}
//# sourceMappingURL=MailComposer.types.d.ts.map