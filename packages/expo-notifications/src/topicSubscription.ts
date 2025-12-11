import { UnavailabilityError } from 'expo-modules-core';

import TopicSubscriptionModule from './TopicSubscriptionModule';
import { warnOfExpoGoPushUsage } from './warnOfExpoGoPushUsage';

export async function subscribeToTopicAsync(topic: string): Promise<void> {
  if (!TopicSubscriptionModule.subscribeToTopicAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'subscribeToTopicAsync');
  }
  warnOfExpoGoPushUsage();

  return TopicSubscriptionModule.subscribeToTopicAsync(topic);
}

export async function unsubscribeFromTopicAsync(topic: string): Promise<void> {
  if (!TopicSubscriptionModule.unsubscribeFromTopicAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'unsubscribeFromTopicAsync');
  }
  warnOfExpoGoPushUsage();

  return TopicSubscriptionModule.unsubscribeFromTopicAsync(topic);
}
