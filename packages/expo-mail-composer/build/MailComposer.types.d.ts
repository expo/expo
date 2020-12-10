export declare type MailComposerOptions = {
    recipients?: string[];
    ccRecipients?: string[];
    bccRecipients?: string[];
    subject?: string;
    body?: string;
    isHtml?: boolean;
    attachments?: string[];
};
export declare type MailComposerResult = {
    status: MailComposerStatus;
};
export declare enum MailComposerStatus {
    UNDETERMINED = "undetermined",
    SENT = "sent",
    SAVED = "saved",
    CANCELLED = "cancelled"
}
