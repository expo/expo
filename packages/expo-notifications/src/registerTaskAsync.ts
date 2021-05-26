import { UnavailabilityError } from '@unimodules/core';

import BackgroundNotificationsModule from './BackgroundNotificationsModule.native';

export default async function registerTaskAsync(taskName: string): Promise<null> {
  if (!BackgroundNotificationsModule.registerTaskAsync) {
    throw new UnavailabilityError('Notifications', 'registerTaskAsync');
  }

  return await BackgroundNotificationsModule.registerTaskAsync(taskName);
}
