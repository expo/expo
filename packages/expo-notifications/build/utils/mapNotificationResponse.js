/**
 * @hidden
 *
 * Does any required processing of a notification response from native code
 * before it is passed to a notification response listener, or to the
 * last notification response hook.
 *
 * @param response The raw response passed in from native code
 * @returns the mapped response.
 */
export const mapNotificationResponse = (response) => {
    return {
        ...response,
        notification: mapNotification(response.notification),
    };
};
/**
 * @hidden
 *
 * Does any required processing of a notification from native code
 * before it is passed to a notification listener.
 *
 * @param notification The raw notification passed in from native code
 * @returns the mapped notification.
 */
export const mapNotification = (notification) => ({
    ...notification,
    request: mapNotificationRequest(notification.request),
});
/**
 * @hidden
 *
 * Does any required processing of a notification request from native code
 * before it is passed to other JS code.
 *
 * @param request The raw request passed in from native code
 * @returns the mapped request.
 */
export const mapNotificationRequest = (request) => ({
    ...request,
    content: mapNotificationContent(request.content),
});
let didWarn = false;
/**
 * @hidden
 * Does any required processing of notification content from native code
 * before being passed to other JS code.
 *
 * @param content The raw content passed in from native code
 * @returns the mapped content.
 */
export const mapNotificationContent = (content) => {
    try {
        // @ts-expect-error: TODO(@kitten): This is not present in the types! This is error prone
        const dataString = content['dataString'];
        if (typeof dataString === 'string') {
            const mappedContent = { ...content };
            mappedContent.data = JSON.parse(dataString);
            Object.defineProperty(mappedContent, 'dataString', {
                get() {
                    if (!didWarn) {
                        didWarn = true;
                        // TODO(vonovak) remove this warning and delete dataString entry in a next version
                        console.warn('reading dataString is deprecated, use data instead');
                    }
                    return dataString;
                },
            });
            return mappedContent;
        }
    }
    catch (e) {
        console.error(`Error parsing notification: ${e}`);
    }
    return content;
};
//# sourceMappingURL=mapNotificationResponse.js.map