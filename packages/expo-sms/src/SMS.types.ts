// @needsAudit
export type SMSResponse = {
  /**
   * Status of SMS action invoked by the user.
   */
  result: 'unknown' | 'sent' | 'cancelled';
};

// @needsAudit
/**
 * An object that is used to describe an attachment that is included with a SMS message.
 */
export type SMSAttachment = {
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

// @needsAudit @docsMissing
export type SMSOptions = {
  attachments?: SMSAttachment | SMSAttachment[] | undefined;
};
