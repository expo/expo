import { Platform } from 'expo-modules-core';

import { RecordingOptions } from '../Audio.types';

export function createRecordingOptions(options: RecordingOptions) {
  let newOptions = {
    extension: options.extension,
    sampleRate: options.sampleRate,
    numberOfChannels: options.numberOfChannels,
    bitRate: options.bitRate,
  };

  if (Platform.OS === 'ios') {
    newOptions = {
      ...newOptions,
      ...options.ios,
    };
  } else if (Platform.OS === 'android') {
    newOptions = {
      ...newOptions,
      ...options.android,
    };
  }
  return newOptions;
}
