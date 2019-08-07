import { Platform } from 'react-native';
import { UnavailabilityError } from '@unimodules/core';

import ExponentSegment from './ExponentSegment';

export type SegmentOptions = {
  androidWriteKey?: string;
  iosWriteKey?: string;
};

export function initialize(options: SegmentOptions): void {
  if (Platform.OS === 'android') {
    ExponentSegment.initializeAndroid(options.androidWriteKey);
  } else if (Platform.OS === 'ios') {
    ExponentSegment.initializeIOS(options.iosWriteKey);
  } else {
    throw new UnavailabilityError('expo-analytics-segment', 'initialize');
  }
}

export function identify(userId: string): void {
  if (!ExponentSegment.identify) {
    throw new UnavailabilityError('expo-analytics-segment', 'identify');
  }
  ExponentSegment.identify(userId);
}

export function identifyWithTraits(userId: string, traits: { [key: string]: any }): void {
  if (!ExponentSegment.identifyWithTraits) {
    throw new UnavailabilityError('expo-analytics-segment', 'identifyWithTraits');
  }
  ExponentSegment.identifyWithTraits(userId, traits);
}

export function group(groupId: string): void {
  if (!ExponentSegment.group) {
    throw new UnavailabilityError('expo-analytics-segment', 'group');
  }
  ExponentSegment.group(groupId);
}

export function groupWithTraits(groupId: string, traits: { [key: string]: any }): void {
  if (!ExponentSegment.groupWithTraits) {
    throw new UnavailabilityError('expo-analytics-segment', 'groupWithTraits');
  }
  ExponentSegment.groupWithTraits(groupId, traits);
}

export async function alias(newId: string, options?: { [key: string]: any }): Promise<boolean> {
  if (!ExponentSegment.alias) {
    throw new UnavailabilityError('expo-analytics-segment', 'alias');
  }
  return await ExponentSegment.alias(newId, options);
}

export function reset(): void {
  if (!ExponentSegment.reset) {
    throw new UnavailabilityError('expo-analytics-segment', 'reset');
  }
  ExponentSegment.reset();
}

export function track(event: string): void {
  if (!ExponentSegment.track) {
    throw new UnavailabilityError('expo-analytics-segment', 'track');
  }
  ExponentSegment.track(event);
}

export function trackWithProperties(event: string, properties: { [key: string]: any }): void {
  if (!ExponentSegment.trackWithProperties) {
    throw new UnavailabilityError('expo-analytics-segment', 'trackWithProperties');
  }
  ExponentSegment.trackWithProperties(event, properties);
}

export function screen(screenName: string): void {
  if (!ExponentSegment.screen) {
    throw new UnavailabilityError('expo-analytics-segment', 'screen');
  }
  ExponentSegment.screen(screenName);
}

export function screenWithProperties(event: string, properties: { [key: string]: any }): void {
  if (!ExponentSegment.screenWithProperties) {
    throw new UnavailabilityError('expo-analytics-segment', 'screenWithProperties');
  }
  ExponentSegment.screenWithProperties(event, properties);
}

export function flush(): void {
  if (!ExponentSegment.flush) {
    throw new UnavailabilityError('expo-analytics-segment', 'flush');
  }
  ExponentSegment.flush();
}

export async function getEnabledAsync(): Promise<boolean> {
  if (!ExponentSegment.getEnabledAsync) {
    throw new UnavailabilityError('expo-analytics-segment', 'getEnabledAsync');
  }
  const isEnabledNumber = await ExponentSegment.getEnabledAsync();
  return !!isEnabledNumber;
}

export async function setEnabledAsync(enabled: boolean): Promise<void> {
  if (!ExponentSegment.setEnabledAsync) {
    throw new UnavailabilityError('expo-analytics-segment', 'setEnabledAsync');
  }
  await ExponentSegment.setEnabledAsync(enabled);
}
