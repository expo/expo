/**
 * @flow
 * AndroidNotifications representation wrapper
 */
import { Platform } from 'expo-core';
import AndroidChannel from './AndroidChannel';
import AndroidChannelGroup from './AndroidChannelGroup';
import { getNativeModule } from 'expo-firebase-app';

import type Notifications from '.';

export default class AndroidNotifications {
  _notifications: Notifications;

  constructor(notifications: Notifications) {
    this._notifications = notifications;
  }

  createChannel(channel: AndroidChannel): Promise<void> {
    if (Platform.OS === 'android') {
      if (!(channel instanceof AndroidChannel)) {
        throw new Error(
          `AndroidNotifications:createChannel expects an 'AndroidChannel' but got type ${typeof channel}`
        );
      }
      return getNativeModule(this._notifications).createChannel(channel.build());
    }
    return Promise.resolve();
  }

  createChannelGroup(channelGroup: AndroidChannelGroup): Promise<void> {
    if (Platform.OS === 'android') {
      if (!(channelGroup instanceof AndroidChannelGroup)) {
        throw new Error(
          `AndroidNotifications:createChannelGroup expects an 'AndroidChannelGroup' but got type ${typeof channelGroup}`
        );
      }
      return getNativeModule(this._notifications).createChannelGroup(channelGroup.build());
    }
    return Promise.resolve();
  }

  createChannelGroups(channelGroups: AndroidChannelGroup[]): Promise<void> {
    if (Platform.OS === 'android') {
      if (!Array.isArray(channelGroups)) {
        throw new Error(
          `AndroidNotifications:createChannelGroups expects an 'Array' but got type ${typeof channelGroups}`
        );
      }
      const nativeChannelGroups = [];
      for (let i = 0; i < channelGroups.length; i++) {
        const channelGroup = channelGroups[i];
        if (!(channelGroup instanceof AndroidChannelGroup)) {
          throw new Error(
            `AndroidNotifications:createChannelGroups expects array items of type 'AndroidChannelGroup' but got type ${typeof channelGroup}`
          );
        }
        nativeChannelGroups.push(channelGroup.build());
      }
      return getNativeModule(this._notifications).createChannelGroups(nativeChannelGroups);
    }
    return Promise.resolve();
  }

  createChannels(channels: AndroidChannel[]): Promise<void> {
    if (Platform.OS === 'android') {
      if (!Array.isArray(channels)) {
        throw new Error(
          `AndroidNotifications:createChannels expects an 'Array' but got type ${typeof channels}`
        );
      }
      const nativeChannels = [];
      for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        if (!(channel instanceof AndroidChannel)) {
          throw new Error(
            `AndroidNotifications:createChannels expects array items of type 'AndroidChannel' but got type ${typeof channel}`
          );
        }
        nativeChannels.push(channel.build());
      }
      return getNativeModule(this._notifications).createChannels(nativeChannels);
    }
    return Promise.resolve();
  }

  removeDeliveredNotificationsByTag(tag: string): Promise<void> {
    if (Platform.OS === 'android') {
      if (typeof tag !== 'string') {
        throw new Error(
          `AndroidNotifications:removeDeliveredNotificationsByTag expects an 'string' but got type ${typeof tag}`
        );
      }
      return getNativeModule(this._notifications).removeDeliveredNotificationsByTag(tag);
    }
    return Promise.resolve();
  }

  deleteChannelGroup(groupId: string): Promise<void> {
    if (Platform.OS === 'android') {
      if (typeof groupId !== 'string') {
        throw new Error(
          `AndroidNotifications:deleteChannelGroup expects an 'string' but got type ${typeof groupId}`
        );
      }
      return getNativeModule(this._notifications).deleteChannelGroup(groupId);
    }
    return Promise.resolve();
  }

  deleteChannel(channelId: string): Promise<void> {
    if (Platform.OS === 'android') {
      if (typeof channelId !== 'string') {
        throw new Error(
          `AndroidNotifications:deleteChannel expects an 'string' but got type ${typeof channelId}`
        );
      }
      return getNativeModule(this._notifications).deleteChannel(channelId);
    }
    return Promise.resolve();
  }
}
