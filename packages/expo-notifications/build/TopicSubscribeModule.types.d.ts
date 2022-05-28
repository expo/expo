import { ProxyNativeModule } from 'expo-modules-core';
export interface TopicSubscribeModule extends ProxyNativeModule {
    topicSubscribeAsync?: (topic: string) => Promise<void>;
    topicUnsubscribeAsync?: (topic: string) => Promise<void>;
}
//# sourceMappingURL=TopicSubscribeModule.types.d.ts.map