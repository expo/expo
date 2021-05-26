import { UnavailabilityError } from '@unimodules/core';

import BackgroundNotificationsModule from './BackgroundNotificationsModule.native';

export default async function unregisterTaskAsync(taskName: string): Promise<null> {
  if (!BackgroundNotificationsModule.unregisterTaskAsync) {
    throw new UnavailabilityError('Notifications', 'unregisterTaskAsync');
  }

  return await BackgroundNotificationsModule.unregisterTaskAsync(taskName);
}
