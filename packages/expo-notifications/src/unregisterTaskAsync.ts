import { UnavailabilityError } from '@unimodules/core';

import BackgroundNotificationTasksModule from './BackgroundNotificationTasksModule.native';

export default async function unregisterTaskAsync(taskName: string): Promise<null> {
  if (!BackgroundNotificationTasksModule.unregisterTaskAsync) {
    throw new UnavailabilityError('Notifications', 'unregisterTaskAsync');
  }

  return await BackgroundNotificationTasksModule.unregisterTaskAsync(taskName);
}
