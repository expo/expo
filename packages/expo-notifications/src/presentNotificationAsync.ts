import { UnavailabilityError } from 'expo-modules-core';
import { v4 as uuidv4 } from 'uuid';

import NotificationPresenter from './NotificationPresenterModule';
import { NotificationContentInput } from './Notifications.types';

let warningMessageShown = false;

/**
 * @deprecated Use `scheduleNotificationAsync` with an explicit notification handler.
 * [Read more](https://expo.fyi/presenting-notifications-deprecated).
 */
export default async function presentNotificationAsync(
  content: NotificationContentInput,
  identifier: string = uuidv4()
): Promise<string> {
  if (__DEV__ && !warningMessageShown) {
    console.warn(
      '`presentNotificationAsync` has been deprecated in favor of using `scheduleNotificationAsync` + an explicit notification handler. Read more at https://expo.fyi/presenting-notifications-deprecated.'
    );
    warningMessageShown = true;
  }

  if (!NotificationPresenter.presentNotificationAsync) {
    throw new UnavailabilityError('Notifications', 'presentNotificationAsync');
  }

  return await NotificationPresenter.presentNotificationAsync(identifier, content);
}
