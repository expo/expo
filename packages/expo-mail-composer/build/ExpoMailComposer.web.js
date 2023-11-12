import { MailComposerStatus, } from './MailComposer.types';
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
    async openClientAsync(options) { },
    async composeAsync(options) {
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
            mailtoUrl.searchParams.append(key, value);
        });
        window.open(mailtoUrl.toString());
        return { status: MailComposerStatus.UNDETERMINED };
    },
    async isAvailableAsync() {
        return typeof window !== 'undefined';
    },
};
//# sourceMappingURL=ExpoMailComposer.web.js.map