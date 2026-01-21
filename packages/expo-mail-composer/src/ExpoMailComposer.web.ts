import {
  MailClient,
  MailComposerOptions,
  MailComposerResult,
  MailComposerStatus,
} from './MailComposer.types';

function removeNullishValues<T extends Record<string, any>>(
  obj: T
): {
  [K in keyof T]: Exclude<T[K], null | undefined>;
} {
  for (const propName in obj) {
    if (obj[propName] == null) {
      delete obj[propName];
    }
  }
  return obj;
}

function checkValue(value?: string[] | string): string | null {
  if (!value) {
    return null;
  }

  const arr = Array.isArray(value) ? value : [value];
  return arr.join(',');
}

export default {
  getClients(): MailClient[] {
    return [];
  },
  async composeAsync(options: MailComposerOptions): Promise<MailComposerResult> {
    if (typeof window === 'undefined') {
      return { status: MailComposerStatus.CANCELLED };
    }
    const mailtoUrl = new URL('mailto:' + (checkValue(options.recipients) || ''));

    const email = removeNullishValues({
      cc: options.ccRecipients,
      bcc: options.bccRecipients,
      subject: options.subject,
      body: options.body,
    });

    const query = Object.entries(email)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    const url = query ? `${mailtoUrl.toString()}?${query}` : mailtoUrl.toString();
    window.open(url);
    return { status: MailComposerStatus.UNDETERMINED };
  },
  async isAvailableAsync(): Promise<boolean> {
    return typeof window !== 'undefined';
  },
};
