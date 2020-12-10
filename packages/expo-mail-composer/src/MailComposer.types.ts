export type MailComposerOptions = {
  recipients?: string[];
  ccRecipients?: string[];
  bccRecipients?: string[];
  subject?: string;
  body?: string;
  isHtml?: boolean;
  attachments?: string[];
};

export type MailComposerResult = {
  status: MailComposerStatus;
};

export enum MailComposerStatus {
  UNDETERMINED = 'undetermined',
  SENT = 'sent',
  SAVED = 'saved',
  CANCELLED = 'cancelled',
}
