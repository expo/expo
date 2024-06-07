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
    const mappedResponse = { ...response };
    try {
        const dataString = mappedResponse?.notification?.request?.content['dataString'];
        if (typeof dataString === 'string') {
            mappedResponse.notification.request.content.data = JSON.parse(dataString);
            delete mappedResponse.notification.request.content.dataString;
        }
    }
    catch (e) {
        console.log(`Error in response: ${e}`);
    }
    return mappedResponse;
};
//# sourceMappingURL=mapNotificationResponse.js.map