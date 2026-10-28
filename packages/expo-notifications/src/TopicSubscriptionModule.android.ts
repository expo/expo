import { requireOptionalNativeModule } from 'expo-modules-core';

import type { TopicSubscriptionModule } from './TopicSubscriptionModule.types';

const topicSubscriptionModule: TopicSubscriptionModule =
  requireOptionalNativeModule<TopicSubscriptionModule>('ExpoTopicSubscriptionModule') ?? {};

export default topicSubscriptionModule;
