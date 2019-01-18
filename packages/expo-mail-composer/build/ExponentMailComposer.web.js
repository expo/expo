import filter from 'lodash.filter';
import qs from 'query-string';
function checkValue(value) {
    if (!value) {
        return null;
    }
    const arr = Array.isArray(value) ? value : [value];
    return arr.join(',');
}
export default {
    get name() {
        return 'ExponentMailComposer';
    },
    async composeAsync(options) {
        const email = filter({
            cc: checkValue(options.ccRecipients),
            bcc: checkValue(options.bccRecipients),
            subject: options.subject,
            body: options.body,
        });
        const query = qs.stringify(email);
        const queryComponent = query ? '?' + query : '';
        const to = checkValue(options.recipients);
        const recipientComponent = to || '';
        const mailto = `mailto:${recipientComponent}${queryComponent}`;
        window.open(mailto);
        return { status: 'undetermined' };
    },
};
//# sourceMappingURL=ExponentMailComposer.web.js.map