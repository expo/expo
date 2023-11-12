/**
 * Configuration options for the mail client selection prompt.
 */
export type MailClientOptions = {
    /**
     *  Title for the mail app selection prompt.
     * This title is displayed when the user is asked to choose an email client.
     */
    title?: string;
    /**
     * Label for the cancel button in the mail app selection prompt.
     * This label is used on the button that allows the user to cancel the action of choosing a mail client.
     * @platform ios
     */
    cancelLabel?: string;
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