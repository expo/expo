import { ProxyNativeModule } from 'expo-modules-core';
export interface TopicSubscriptionModule extends ProxyNativeModule {
    subscribeToTopicAsync?: (topic: string) => Promise<null>;
    unsubscribeFromTopicAsync?: (topic: string) => Promise<null>;
}
//# sourceMappingURL=TopicSubscriptionModule.types.d.ts.map