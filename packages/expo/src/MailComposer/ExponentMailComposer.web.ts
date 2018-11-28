import filter from 'lodash.filter';
import qs from 'query-string';
import { ComposeOptions, ComposeResult } from './MailComposer.types';

function checkValue(value?: Array<string> | string): string | undefined {
  if (!value) {
    return undefined;
  }

  const arr = Array.isArray(value) ? value : [value];

  return arr.join(',');
}

export default {
  get name(): string {
    return 'ExponentMailComposer';
  },
  async composeAsync(options: ComposeOptions): Promise<ComposeResult> {
    const email = filter(
      {
        cc: checkValue(options.ccRecipients),
        bcc: checkValue(options.bccRecipients),
        subject: options.subject,
        body: options.body,
      },
      Boolean
    );

    const query = qs.stringify(email);
    const queryComponent = query ? '?' + query : '';
    const to = checkValue(options.recipients);
    const recipientComponent = to || '';
    const mailto = `mailto:${recipientComponent}${queryComponent}`;

    const { window } = global;
    window.open(mailto);

    return { status: 'undetermined' };
  },
};
