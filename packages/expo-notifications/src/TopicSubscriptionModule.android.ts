import { requireOptionalNativeModule } from 'expo';

import type { TopicSubscriptionModule } from './TopicSubscriptionModule.types';

const topicSubscriptionModule: TopicSubscriptionModule =
  requireOptionalNativeModule<TopicSubscriptionModule>('ExpoTopicSubscriptionModule') ?? {};

export default topicSubscriptionModule;
