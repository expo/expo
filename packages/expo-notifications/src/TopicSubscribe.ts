import { UnavailabilityError } from 'expo-modules-core';

import TopicSubscribeModule from './TopicSubscribeModule';

export default async function topicSubscribeAsync(topic: string): Promise<void> {
  if (!TopicSubscribeModule.topicSubscribeAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'topicSubscribeAsync');
  }

  return TopicSubscribeModule.topicSubscribeAsync(topic);
}
