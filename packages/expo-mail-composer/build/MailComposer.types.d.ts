export declare type ComposeOptions = {
    recipients?: string[];
    ccRecipients?: string[];
    bccRecipients?: string[];
    subject?: string;
    body?: string;
    isHtml?: boolean;
    attachments?: string[];
};
export declare type ComposeResult = {
    status: ComposeStatus;
};
export declare type ComposeStatus = 'undetermined' | 'sent' | 'saved' | 'cancelled';
