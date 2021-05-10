import { SchedulableNotificationTriggerInput } from './Notifications.types';
export default function getNextTriggerDateAsync(trigger: SchedulableNotificationTriggerInput): Promise<number | null>;
