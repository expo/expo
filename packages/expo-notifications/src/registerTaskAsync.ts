import { UnavailabilityError } from 'expo-modules-core';

import BackgroundNotificationTasksModule from './BackgroundNotificationTasksModule.native';

export default async function registerTaskAsync(taskName: string): Promise<null> {
  if (!BackgroundNotificationTasksModule.registerTaskAsync) {
    throw new UnavailabilityError('Notifications', 'registerTaskAsync');
  }

  return await BackgroundNotificationTasksModule.registerTaskAsync(taskName);
}
