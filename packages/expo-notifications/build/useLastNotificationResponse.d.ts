import { NotificationResponse } from './Notifications.types';
/**
 * Return value of this hook may be one of three types:
 * - `undefined` until we know what to return
 * - `null` until the app receives any notification response
 * - an object of `NotificationResponse` type - the response
 *   that has been received by the app most recently.
 */
export default function useLastNotificationResponse(): NotificationResponse | null | undefined;
//# sourceMappingURL=useLastNotificationResponse.d.ts.map