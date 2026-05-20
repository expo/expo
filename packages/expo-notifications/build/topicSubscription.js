import { UnavailabilityError } from 'expo-modules-core';
import TopicSubscriptionModule from './TopicSubscriptionModule';
import { warnOfExpoGoPushUsage } from './warnOfExpoGoPushUsage';
/**
 * Subscribes the device to a push notification topic. This allows the device to receive notifications sent to that topic.
 * @param topic The topic name to subscribe to.
 * @return a Promise which resolves to `null` once the device is subscribed to the topic.
 * @platform android
 */
export async function subscribeToTopicAsync(topic) {
    if (!TopicSubscriptionModule.subscribeToTopicAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'subscribeToTopicAsync');
    }
    warnOfExpoGoPushUsage();
    return TopicSubscriptionModule.subscribeToTopicAsync(topic);
}
/**
 * Unsubscribes the device from a push notification topic. The device will no longer receive notifications sent to that topic.
 * @param topic The topic name to unsubscribe from.
 * @return a Promise which resolves to `null` once the device is unsubscribed from the topic.
 * @platform android
 */
export async function unsubscribeFromTopicAsync(topic) {
    if (!TopicSubscriptionModule.unsubscribeFromTopicAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'unsubscribeFromTopicAsync');
    }
    warnOfExpoGoPushUsage();
    return TopicSubscriptionModule.unsubscribeFromTopicAsync(topic);
}
//# sourceMappingURL=topicSubscription.js.map