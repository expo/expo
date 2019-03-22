import { Platform } from '@unimodules/core';
import invariant from 'invariant';
import AndroidChannel from './AndroidChannel';
import AndroidChannelGroup from './AndroidChannelGroup';
const isAndroid = Platform.OS === 'android';
export default class AndroidNotifications {
    constructor(notifications) {
        this._notifications = notifications;
    }
    createChannel(channel) {
        if (isAndroid) {
            invariant(channel instanceof AndroidChannel, `AndroidNotifications:createChannel expects an 'AndroidChannel' but got type ${typeof channel}`);
            return this._notifications.nativeModule.createChannel(channel.build());
        }
        return Promise.resolve();
    }
    createChannelGroup(channelGroup) {
        if (isAndroid) {
            invariant(channelGroup instanceof AndroidChannelGroup, `AndroidNotifications:createChannelGroup expects an 'AndroidChannelGroup' but got type ${typeof channelGroup}`);
            return this._notifications.nativeModule.createChannelGroup(channelGroup.build());
        }
        return Promise.resolve();
    }
    createChannelGroups(channelGroups) {
        if (isAndroid) {
            invariant(Array.isArray(channelGroups), `AndroidNotifications:createChannelGroups expects an 'Array' but got type ${typeof channelGroups}`);
            const nativeChannelGroups = [];
            for (let i = 0; i < channelGroups.length; i++) {
                const channelGroup = channelGroups[i];
                invariant(channelGroup instanceof AndroidChannelGroup, `AndroidNotifications:createChannelGroups expects array items of type 'AndroidChannelGroup' but got type ${typeof channelGroup}`);
                nativeChannelGroups.push(channelGroup.build());
            }
            return this._notifications.nativeModule.createChannelGroups(nativeChannelGroups);
        }
        return Promise.resolve();
    }
    createChannels(channels) {
        if (isAndroid) {
            invariant(Array.isArray(channels), `AndroidNotifications:createChannels expects an 'Array' but got type ${typeof channels}`);
            const nativeChannels = [];
            for (let i = 0; i < channels.length; i++) {
                const channel = channels[i];
                invariant(channel instanceof AndroidChannel, `AndroidNotifications:createChannels expects array items of type 'AndroidChannel' but got type ${typeof channel}`);
                nativeChannels.push(channel.build());
            }
            return this._notifications.nativeModule.createChannels(nativeChannels);
        }
        return Promise.resolve();
    }
    removeDeliveredNotificationsByTag(tag) {
        if (isAndroid) {
            invariant(typeof tag === 'string', `AndroidNotifications:removeDeliveredNotificationsByTag expects an 'string' but got type ${typeof tag}`);
            return this._notifications.nativeModule.removeDeliveredNotificationsByTag(tag);
        }
        return Promise.resolve();
    }
    deleteChannelGroup(groupId) {
        if (isAndroid) {
            invariant(typeof groupId === 'string', `AndroidNotifications:deleteChannelGroup expects an 'string' but got type ${typeof groupId}`);
            return this._notifications.nativeModule.deleteChannelGroup(groupId);
        }
        return Promise.resolve();
    }
    deleteChannel(channelId) {
        if (isAndroid) {
            invariant(typeof channelId === 'string', `AndroidNotifications:deleteChannel expects an 'string' but got type ${typeof channelId}`);
            return this._notifications.nativeModule.deleteChannel(channelId);
        }
        return Promise.resolve();
    }
}
//# sourceMappingURL=AndroidNotifications.js.map