import { requireNativeModule } from 'expo-modules-core';

import type { TopicSubscriptionModule } from './TopicSubscriptionModule.types';

export default requireNativeModule<TopicSubscriptionModule>('ExpoTopicSubscriptionModule');
