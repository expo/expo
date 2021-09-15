import { UnavailabilityError } from 'expo-modules-core';

import BackgroundNotificationTasksModule from './BackgroundNotificationTasksModule.native';

export default async function unregisterTaskAsync(taskName: string): Promise<null> {
  if (!BackgroundNotificationTasksModule.unregisterTaskAsync) {
    throw new UnavailabilityError('Notifications', 'unregisterTaskAsync');
  }

  return await BackgroundNotificationTasksModule.unregisterTaskAsync(taskName);
}
