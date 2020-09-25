import qs from 'query-string';
import { MailComposerStatus } from './MailComposer.types';
function removeNullishValues(obj) {
    for (const propName in obj) {
        if (obj[propName] == null) {
            delete obj[propName];
        }
    }
    return obj;
}
function checkValue(value) {
    if (!value) {
        return null;
    }
    const arr = Array.isArray(value) ? value : [value];
    return arr.join(',');
}
export default {
    get name() {
        return 'ExpoMailComposer';
    },
    async composeAsync(options) {
        const email = removeNullishValues({
            cc: checkValue(options.ccRecipients),
            bcc: checkValue(options.bccRecipients),
            subject: options.subject,
            body: options.body,
        });
        const query = qs.stringify(email);
        const queryComponent = query ? '?' + query : '';
        const to = checkValue(options.recipients) || '';
        const mailto = `mailto:${to}${queryComponent}`;
        window.open(mailto);
        return { status: MailComposerStatus.UNDETERMINED };
    },
    async isAvailableAsync() {
        return true;
    },
};
//# sourceMappingURL=ExpoMailComposer.web.js.map