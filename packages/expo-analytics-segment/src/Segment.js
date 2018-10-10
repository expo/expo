// @flow

import { Platform } from 'react-native';
import { NativeModulesProxy } from 'expo-core';

const { ExponentSegment } = NativeModulesProxy;

export default {
  initialize(options: { androidWriteKey?: string, iosWriteKey?: string }): void {
    if (Platform.OS === 'android') {
      ExponentSegment.initializeAndroid(options.androidWriteKey);
    } else if (Platform.OS === 'ios') {
      ExponentSegment.initializeIOS(options.iosWriteKey);
    } else {
      throw new Error(`Unable to initialize Segment on \`${Platform.OS}\``);
    }
  },

  identify(userId: string): void {
    ExponentSegment.identify(userId);
  },

  identifyWithTraits(userId: string, traits: { [string]: any }): void {
    ExponentSegment.identifyWithTraits(userId, traits);
  },

  group(groupId: string): void {
    ExponentSegment.group(groupId);
  },

  groupWithTraits(groupId: string, traits: { [string]: any }): void {
    ExponentSegment.groupWithTraits(groupId, traits);
  },

  reset(): void {
    ExponentSegment.reset();
  },

  track(event: string): void {
    ExponentSegment.track(event);
  },

  trackWithProperties(event: string, properties: { [string]: any }): void {
    ExponentSegment.trackWithProperties(event, properties);
  },

  screen(screenName: string): void {
    ExponentSegment.screen(screenName);
  },

  screenWithProperties(event: string, properties: string): void {
    ExponentSegment.screenWithProperties(event, properties);
  },

  flush(): void {
    ExponentSegment.flush();
  },
};
