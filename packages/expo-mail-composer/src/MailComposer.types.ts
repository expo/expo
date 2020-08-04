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

export const MailComposerStatus = {
  UNDETERMINED: 'undetermined',
  SENT: 'sent',
  SAVED: 'saved',
  CANCELLED: 'cancelled',
} as const;

export type MailComposerStatus = typeof MailComposerStatus[keyof typeof MailComposerStatus];
