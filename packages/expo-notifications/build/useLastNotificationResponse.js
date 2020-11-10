import { useLayoutEffect, useState } from 'react';
import { addNotificationResponseReceivedListener } from './NotificationsEmitter';
/**
 * Return value of this hook may be one of three types:
 * - `undefined` until we know what to return
 * - `null` until the app receives any notification response
 * - an object of `NotificationResponse` type - the response
 *   that has been received by the app most recently.
 */
export default function useLastNotificationResponse() {
    const [lastNotificationResponse, setLastNotificationResponse] = useState(undefined);
    // useLayoutEffect ensures the listener is registered as soon as possible
    useLayoutEffect(() => {
        const subscription = addNotificationResponseReceivedListener(response => {
            setLastNotificationResponse(response);
        });
        return () => {
            subscription.remove();
        };
    }, []);
    return lastNotificationResponse;
}
//# sourceMappingURL=useLastNotificationResponse.js.map