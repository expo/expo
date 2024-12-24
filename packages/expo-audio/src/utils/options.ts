import { Platform } from 'expo-modules-core';

import { RecordingOptions } from '../Audio.types';

export function createRecordingOptions(options: RecordingOptions) {
  let commonOptions = {
    extension: options.extension,
    sampleRate: options.sampleRate,
    numberOfChannels: options.numberOfChannels,
    bitRate: options.bitRate,
    isMeteringEnabled: options.isMeteringEnabled ?? false,
  };

  if (Platform.OS === 'ios') {
    commonOptions = {
      ...commonOptions,
      ...options.ios,
    };
  } else if (Platform.OS === 'android') {
    commonOptions = {
      ...commonOptions,
      ...options.android,
    };
  }
  return commonOptions;
}
