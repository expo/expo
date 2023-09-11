import { UnavailabilityError } from 'expo-modules-core';
import BackgroundNotificationTasksModule from './BackgroundNotificationTasksModule.native';
/**
 * Used to unregister tasks registered with `registerTaskAsync` method.
 * @param taskName The string you passed to `registerTaskAsync` as the `taskName` parameter.
 * @header inBackground
 */
export default async function unregisterTaskAsync(taskName) {
    if (!BackgroundNotificationTasksModule.unregisterTaskAsync) {
        throw new UnavailabilityError('Notifications', 'unregisterTaskAsync');
    }
    return await BackgroundNotificationTasksModule.unregisterTaskAsync(taskName);
}
//# sourceMappingURL=unregisterTaskAsync.js.map