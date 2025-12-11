import { ProxyNativeModule } from 'expo-modules-core';

export interface TopicSubscriptionModule extends ProxyNativeModule {
  subscribeToTopicAsync?: (topic: string) => Promise<void>;
  unsubscribeFromTopicAsync?: (topic: string) => Promise<void>;
}
