import { requireNativeModule } from 'expo';

import type { TopicSubscriptionModule } from './TopicSubscriptionModule.types';

export default requireNativeModule<TopicSubscriptionModule>('ExpoTopicSubscriptionModule');
