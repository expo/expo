import uuidv4 from 'uuid/v4';

import NotificationScheduler from './NotificationScheduler';
import { NotificationTriggerInput as NativeNotificationTriggerInput } from './NotificationScheduler.types';
import { NotificationRequestInput, NotificationTriggerInput } from './Notifications.types';

export default async function scheduleNotificationAsync(
  request: NotificationRequestInput
): Promise<string> {
  return await NotificationScheduler.scheduleNotificationAsync(
    request.identifier ?? uuidv4(),
    request.content,
    parseTrigger(request.trigger)
  );
}

function parseTrigger(userFacingTrigger: NotificationTriggerInput): NativeNotificationTriggerInput {
  if (userFacingTrigger === null) {
    return null;
  }

  if (userFacingTrigger === undefined) {
    throw new TypeError(
      'Encountered an `undefined` notification trigger. If you want to trigger the notification immediately, pass in an explicit `null` value.'
    );
  }

  if (userFacingTrigger instanceof Date) {
    return { type: 'date', timestamp: userFacingTrigger.getTime() };
  } else if (typeof userFacingTrigger === 'number') {
    return { type: 'date', timestamp: userFacingTrigger };
  } else if ('seconds' in userFacingTrigger) {
    return {
      type: 'timeInterval',
      seconds: userFacingTrigger.seconds,
      repeats: userFacingTrigger.repeats ?? false,
    };
  } else {
    const { repeats, ...calendarTrigger } = userFacingTrigger;
    return { type: 'calendar', value: calendarTrigger, repeats };
  }
}
