import array from 'cast-array';
import filter from 'object-filter';
import qs from 'query-string';

export default {
  get name() {
    return 'ExponentMailComposer';
  },
  async composeAsync(options) {
    const check = value => (value ? array(value).join(',') : undefined);

    const to = check(options.recipients);
    let email = filter(
      {
        to,
        cc: check(options.ccRecipients),
        bcc: check(options.bccRecipients),
        subject: options.subject,
        body: options.body,
      },
      Boolean
    );

    delete email.to;

    const query = qs.stringify(email);
    const queryComponent = query ? '?' + query : '';
    const recipientComponent = to || '';
    const mailto = `mailto:${recipientComponent}${queryComponent}`;

    global.open(mailto);
  },
};
