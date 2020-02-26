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
export declare const MailComposerStatus: {
    readonly UNDETERMINED: "undetermined";
    readonly SENT: "sent";
    readonly SAVED: "saved";
    readonly CANCELLED: "cancelled";
};
export declare type MailComposerStatus = typeof MailComposerStatus[keyof typeof MailComposerStatus];
