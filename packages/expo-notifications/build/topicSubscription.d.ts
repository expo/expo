/**
 * Subscribes the device to a push notification topic. This allows the device to receive notifications sent to that topic.
 * @param topic The topic name to subscribe to.
 * @return A Promise which resolves to `null` once the device is subscribed to the topic.
 * @platform android
 */
export declare function subscribeToTopicAsync(topic: string): Promise<null>;
/**
 * Unsubscribes the device from a push notification topic. The device will no longer receive notifications sent to that topic.
 * @param topic The topic name to unsubscribe from.
 * @return A Promise which resolves to `null` once the device is unsubscribed from the topic.
 * @platform android
 */
export declare function unsubscribeFromTopicAsync(topic: string): Promise<null>;
//# sourceMappingURL=topicSubscription.d.ts.map