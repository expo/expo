import AndroidChannel from './AndroidChannel';
import AndroidChannelGroup from './AndroidChannelGroup';
import { Notifications } from './types';
export default class AndroidNotifications {
    _notifications: Notifications;
    constructor(notifications: Notifications);
    createChannel(channel: AndroidChannel): Promise<void>;
    createChannelGroup(channelGroup: AndroidChannelGroup): Promise<void>;
    createChannelGroups(channelGroups: AndroidChannelGroup[]): Promise<void>;
    createChannels(channels: AndroidChannel[]): Promise<void>;
    removeDeliveredNotificationsByTag(tag: string): Promise<void>;
    deleteChannelGroup(groupId: string): Promise<void>;
    deleteChannel(channelId: string): Promise<void>;
}
