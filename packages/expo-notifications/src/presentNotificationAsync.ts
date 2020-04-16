import uuidv4 from 'uuid/v4';

import NotificationPresenter from './NotificationPresenter';
import { NotificationContentInput } from './Notifications.types';

let warningMessageShown = false;

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
  return await NotificationPresenter.presentNotificationAsync(identifier, content);
}
