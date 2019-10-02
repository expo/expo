export type ComposeOptions = {
  recipients?: string[];
  ccRecipients?: string[];
  bccRecipients?: string[];
  subject?: string;
  body?: string;
  isHtml?: boolean;
  attachments?: string[];
};

export type ComposeResult = {
  status: ComposeStatus;
};

export type ComposeStatus = 'undetermined' | 'sent' | 'saved' | 'cancelled';
