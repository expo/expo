import { NotificationResponse } from './Notifications.types';
/**
 * Return value of this hook may be one of three types:
 * - `undefined` if the hook is rendered so early during
 *   the start of the app that we don't know yet
 *   whether there has been any notification response.
 * - `null` until the app receives any notification response
 * - an object of `NotificationResponse` type - the response
 *   that has been received by the app most recently.
 */
export default function useLastNotificationResponse(): NotificationResponse | null | undefined;
