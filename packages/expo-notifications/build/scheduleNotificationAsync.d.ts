import { NotificationTriggerInput as NativeNotificationTriggerInput } from './NotificationScheduler.types';
import { NotificationRequestInput, NotificationTriggerInput } from './Notifications.types';
export default function scheduleNotificationAsync(request: NotificationRequestInput): Promise<string>;
export declare function parseTrigger(userFacingTrigger: NotificationTriggerInput): NativeNotificationTriggerInput;
//# sourceMappingURL=scheduleNotificationAsync.d.ts.map