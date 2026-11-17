import { createPermissionHook, PermissionStatus, type PermissionHookOptions } from 'expo';
import { Platform } from 'react-native';

import { Calendar } from './Calendar';
import type { PermissionResponse } from './legacy/Calendar';

/**
 * Check or request permissions to access the user's calendars.
 * This uses both `Calendar.getPermissions` and `Calendar.requestPermissions` to interact
 * with the permissions.
 * On iOS, `writeOnly` requests permission to create calendar events without reading
 * existing calendars or events. It does not grant permission to create, update, or delete calendars.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useCalendarPermissions();
 * ```
 */
export const useCalendarPermissions = createPermissionHook<
  PermissionResponse,
  { writeOnly?: boolean }
>({
  getMethod: (options) => Calendar.getPermissions(options?.writeOnly),
  requestMethod: (options) => Calendar.requestPermissions(options?.writeOnly),
});

/**
 * Check or request permissions to access the user's reminders.
 * This uses both `Calendar.getRemindersPermissions` and `Calendar.requestRemindersPermissions` to interact
 * with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useRemindersPermissions();
 * ```
 * @platform ios
 */
export function useRemindersPermissions(
  options?: PermissionHookOptions<object>
): ReturnType<typeof createRemindersPermissionHook> {
  if (Platform.OS !== 'ios') {
    // While for getRemindersPermissions and other iOS-specific functions we throw UnavailabilityError,
    // returning a denied permission response is a deliberate choice to make it work without needing to wrap it in try/catch.
    const response: PermissionResponse = {
      canAskAgain: false,
      expires: 'never',
      granted: false,
      status: PermissionStatus.DENIED,
    };
    return [response, async () => response, async () => response];
  }
  return createRemindersPermissionHook(options);
}

const createRemindersPermissionHook = createPermissionHook({
  getMethod: () => Calendar.getRemindersPermissions(),
  requestMethod: () => Calendar.requestRemindersPermissions(),
});
