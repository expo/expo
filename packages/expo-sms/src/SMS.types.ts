export type SMSResponse = {
  result: 'unknown' | 'sent' | 'cancelled';
};

export type SMSAttachment = {
  uri: string;
  mimeType: string;
  filename: string;
};

export type SMSOptions = {
  attachments?: SMSAttachment | SMSAttachment[] | undefined;
};
