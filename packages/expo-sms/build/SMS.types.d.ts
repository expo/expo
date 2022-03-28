export declare type SMSResponse = {
    /**
     * Status of SMS action invoked by the user.
     */
    result: 'unknown' | 'sent' | 'cancelled';
};
/**
 * An object that is used to describe an attachment that is included with a SMS message.
 */
export declare type SMSAttachment = {
    /**
     * The content URI of the attachment. The URI needs be a content URI so that it can be accessed by
     * other applications outside of Expo. See [FileSystem.getContentUriAsync](./filesystem/#filesystemgetcontenturiasyncfileuri)).
     */
    uri: string;
    /**
     * The mime type of the attachment such as `image/png`.
     */
    mimeType: string;
    /**
     * The filename of the attachment.
     */
    filename: string;
};
export declare type SMSOptions = {
    attachments?: SMSAttachment | SMSAttachment[] | undefined;
};
//# sourceMappingURL=SMS.types.d.ts.map