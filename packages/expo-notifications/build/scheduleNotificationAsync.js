import uuidv4 from 'uuid/v4';
import NotificationScheduler from './NotificationScheduler';
export default async function scheduleNotificationAsync(content, trigger, identifier = uuidv4()) {
    return await NotificationScheduler.scheduleNotificationAsync(identifier, content, parseTrigger(trigger));
}
function parseTrigger(userFacingTrigger) {
    if (userFacingTrigger === null) {
        return null;
    }
    if (userFacingTrigger instanceof Date) {
        return { type: 'date', timestamp: userFacingTrigger.getTime() };
    }
    else if (typeof userFacingTrigger === 'number') {
        return { type: 'date', timestamp: userFacingTrigger };
    }
    else if ('seconds' in userFacingTrigger) {
        return {
            type: 'timeInterval',
            seconds: userFacingTrigger.seconds,
            repeats: userFacingTrigger.repeats ?? false,
        };
    }
    else {
        const { repeats, ...calendarTrigger } = userFacingTrigger;
        return { type: 'calendar', value: calendarTrigger, repeats };
    }
}
//# sourceMappingURL=scheduleNotificationAsync.js.map