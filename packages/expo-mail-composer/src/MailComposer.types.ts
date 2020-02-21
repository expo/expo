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

export type MailComposerStatus = 'undetermined' | 'sent' | 'saved' | 'cancelled';
