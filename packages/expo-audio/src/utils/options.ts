import { Platform } from 'expo';

import type {
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

type NativeRecordingOptions = {
  directory?: RecordingOptions['directory'];
};

export function createRecordingOptions(
  options: RecordingOptions
): CommonRecordingOptions &
  (
    | (NativeRecordingOptions & RecordingOptionsIos)
    | (NativeRecordingOptions & RecordingOptionsAndroid)
    | RecordingOptionsWeb
  ) {
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
      directory: options.directory,
      ...options.ios,
    };
  } else if (Platform.OS === 'android') {
    return {
      ...commonOptions,
      directory: options.directory,
      ...options.android,
    };
  } else {
    return {
      ...commonOptions,
      ...options.web,
    };
  }
}
