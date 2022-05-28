import { UnavailabilityError } from 'expo-modules-core';
import TopicSubscribeModule from './TopicSubscribeModule';
export default async function topicSubscribeAsync(topic) {
    if (!TopicSubscribeModule.topicSubscribeAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'topicSubscribeAsync');
    }
    return TopicSubscribeModule.topicSubscribeAsync(topic);
}
//# sourceMappingURL=topicSubscribeAsync.js.map