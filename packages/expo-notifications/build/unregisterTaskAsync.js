import { UnavailabilityError } from 'expo-modules-core';
import BackgroundNotificationTasksModule from './BackgroundNotificationTasksModule.native';
export default async function unregisterTaskAsync(taskName) {
    if (!BackgroundNotificationTasksModule.unregisterTaskAsync) {
        throw new UnavailabilityError('Notifications', 'unregisterTaskAsync');
    }
    return await BackgroundNotificationTasksModule.unregisterTaskAsync(taskName);
}
//# sourceMappingURL=unregisterTaskAsync.js.map