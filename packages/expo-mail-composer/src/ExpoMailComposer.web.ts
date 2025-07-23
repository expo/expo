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

    Object.entries(email).forEach(([key, value]) => {
      // TODO(@kitten): This was implicitly cast before. Is this what we want?
      mailtoUrl.searchParams.append(key, '' + value);
    });

    window.open(mailtoUrl.toString());

    return { status: MailComposerStatus.UNDETERMINED };
  },
  async isAvailableAsync(): Promise<boolean> {
    return typeof window !== 'undefined';
  },
};
