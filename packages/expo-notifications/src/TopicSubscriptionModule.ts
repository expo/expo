import type { TopicSubscriptionModule } from './TopicSubscriptionModule.types';

const module: Required<TopicSubscriptionModule> = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => {
    return Promise.resolve(null);
  },
  unsubscribeFromTopicAsync: () => {
    return Promise.resolve(null);
  },
};

export default module;
