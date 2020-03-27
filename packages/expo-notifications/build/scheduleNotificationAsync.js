import { Platform } from '@unimodules/core';
import uuidv4 from 'uuid/v4';
import NotificationScheduler from './NotificationScheduler';
export default async function scheduleNotificationAsync(notification, trigger) {
    // Remember current platform-specific options
    const platformSpecificOptions = notification[Platform.OS] ?? undefined;
    // Remove all known platform-specific options
    const { ios, android, identifier, ...baseRequest } = notification;
    // Merge current platform-specific options
    const easyBodyNotificationSpec = { ...baseRequest, ...platformSpecificOptions };
    // Stringify `body`
    const { body, ...restNotificationSpec } = easyBodyNotificationSpec;
    const notificationSpec = { ...restNotificationSpec, body: JSON.stringify(body) };
    // If identifier has not been provided, let's create one.
    const notificationIdentifier = identifier ?? uuidv4();
    return await NotificationScheduler.scheduleNotificationAsync(notificationIdentifier, notificationSpec, parseTrigger(trigger[Platform.OS] ?? trigger));
}
function parseTrigger(userFacingTrigger) {
    if (userFacingTrigger instanceof Date) {
        return { type: 'date', value: userFacingTrigger.getTime() };
    }
    else if (typeof userFacingTrigger === 'number') {
        return { type: 'date', value: userFacingTrigger };
    }
    else if ('seconds' in userFacingTrigger) {
        return {
            type: 'interval',
            value: userFacingTrigger.seconds,
            repeats: userFacingTrigger.repeats ?? false,
        };
    }
    else {
        const { repeats, ...calendarTrigger } = userFacingTrigger;
        return { type: 'calendar', value: calendarTrigger, repeats };
    }
}
//# sourceMappingURL=scheduleNotificationAsync.js.map