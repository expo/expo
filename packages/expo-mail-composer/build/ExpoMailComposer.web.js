import qs from 'query-string';
function removeNullValues(obj) {
    for (const propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined) {
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
        const email = removeNullValues({
            cc: checkValue(options.ccRecipients),
            bcc: checkValue(options.bccRecipients),
            subject: options.subject,
            body: options.body,
        });
        // @ts-ignore: Fix this -- just patching to get publishing working for now.
        const query = qs.stringify(email);
        const queryComponent = query ? '?' + query : '';
        const to = checkValue(options.recipients) || '';
        const mailto = `mailto:${to}${queryComponent}`;
        window.open(mailto);
        return { status: 'undetermined' };
    },
};
//# sourceMappingURL=ExpoMailComposer.web.js.map