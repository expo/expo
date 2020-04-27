export declare type SMSResponse = {
    result: 'unknown' | 'sent' | 'cancelled';
};
export declare type SMSAttachment = {
    uri: string;
    mimeType: string;
    filename: string;
};
export declare type SMSOptions = {
    attachments?: SMSAttachment | SMSAttachment[] | undefined;
};
