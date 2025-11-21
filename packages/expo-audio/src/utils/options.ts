import { Platform } from 'expo-modules-core';

import {
  RecordingOptions,
  RecordingOptionsAndroid,
  RecordingOptionsIos,
  RecordingOptionsWeb,
} from '../Audio.types';

type CommonRecordingOptions = {
  extension: string;
  sampleRate: number;
  numberOfChannels: number;
  bitRate: number;
  isMeteringEnabled: boolean;
};

export function createRecordingOptions(
  options: RecordingOptions
): CommonRecordingOptions & (RecordingOptionsIos | RecordingOptionsAndroid | RecordingOptionsWeb) {
  const commonOptions: CommonRecordingOptions = {
    extension: options.extension,
    sampleRate: options.sampleRate,
    numberOfChannels: options.numberOfChannels,
    bitRate: options.bitRate,
    isMeteringEnabled: options.isMeteringEnabled ?? false,
  };

  if (Platform.OS === 'ios') {
    return {
      ...commonOptions,
      ...options.ios,
    };
  } else if (Platform.OS === 'android') {
    return {
      ...commonOptions,
      ...options.android,
    };
  } else {
    return {
      ...commonOptions,
      ...options.web,
    };
  }
}
