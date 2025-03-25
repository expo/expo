import { useEvent } from 'expo';
import { PermissionResponse, useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useState, useMemo } from 'react';
import { Platform } from 'react-native';

import {
  AudioMode,
  AudioSource,
  AudioStatus,
  RecorderState,
  RecordingOptions,
  RecordingStatus,
} from './Audio.types';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder, AudioSample } from './AudioModule.types';
import { createRecordingOptions } from './utils/options';
import { resolveSource } from './utils/resolveSource';

export const PLAYBACK_STATUS_UPDATE = 'playbackStatusUpdate';
export const AUDIO_SAMPLE_UPDATE = 'audioSampleUpdate';
export const RECORDING_STATUS_UPDATE = 'recordingStatusUpdate';

// TODO: Temporary solution until we develop a way of overriding prototypes that won't break the lazy loading of the module.
const replace = AudioModule.AudioPlayer.prototype.replace;
AudioModule.AudioPlayer.prototype.replace = function (source: AudioSource) {
  return replace.call(this, resolveSource(source));
};

// TODO: Temporary solution until we develop a way of overriding prototypes that won't break the lazy loading of the module.
const setQueue = AudioModule.AudioPlayer.prototype.setQueue;
AudioModule.AudioPlayer.prototype.setQueue = function (sources: AudioSource[]) {
  const resolvedSources = sources.map((source) => resolveSource(source)).filter(Boolean);
  return setQueue.call(this, resolvedSources);
};

// TODO: Temporary solution until we develop a way of overriding prototypes that won't break the lazy loading of the module.
const addToQueue = AudioModule.AudioPlayer.prototype.addToQueue;
AudioModule.AudioPlayer.prototype.addToQueue = function (
  sources: AudioSource[],
  insertBeforeIndex?: number
) {
  const resolvedSources = sources.map((source) => resolveSource(source)).filter(Boolean);
  return addToQueue.call(this, resolvedSources, insertBeforeIndex);
};

// TODO: Temporary solution until we develop a way of overriding prototypes that won't break the lazy loading of the module.
const removeFromQueue = AudioModule.AudioPlayer.prototype.removeFromQueue;
AudioModule.AudioPlayer.prototype.removeFromQueue = function (sources: AudioSource[]) {
  const resolvedSources = sources.map((source) => resolveSource(source)).filter(Boolean);
  return removeFromQueue.call(this, resolvedSources);
};

// @docsMissing
export function useAudioPlayer(
  sources: AudioSource | AudioSource[] = null,
  updateInterval: number = 500
): AudioPlayer {
  const parsedSources = (Array.isArray(sources) ? sources : [sources])
    .map(resolveSource)
    .filter(Boolean);

  return useReleasingSharedObject(
    () => new AudioModule.AudioPlayer(parsedSources, updateInterval),
    [JSON.stringify(parsedSources)]
  );
}

// @docsMissing
export function useAudioPlayerStatus(player: AudioPlayer): AudioStatus {
  const currentStatus = useMemo(() => player.currentStatus, [player.id]);
  return useEvent(player, PLAYBACK_STATUS_UPDATE, currentStatus);
}

// @docsMissing
export function useAudioSampleListener(player: AudioPlayer, listener: (data: AudioSample) => void) {
  useEffect(() => {
    if (!player.isAudioSamplingSupported) {
      return;
    }
    player.setAudioSamplingEnabled(true);
    const subscription = player.addListener(AUDIO_SAMPLE_UPDATE, listener);
    return () => subscription.remove();
  }, [player.id]);
}

// @docsMissing
export function useAudioRecorder(
  options: RecordingOptions,
  statusListener?: (status: RecordingStatus) => void
): AudioRecorder {
  const platformOptions = createRecordingOptions(options);
  const recorder = useReleasingSharedObject(() => {
    return new AudioModule.AudioRecorder(platformOptions);
  }, [JSON.stringify(platformOptions)]);

  useEffect(() => {
    const subscription = recorder.addListener(RECORDING_STATUS_UPDATE, (status) => {
      statusListener?.(status);
    });
    return () => subscription.remove();
  }, [recorder.id]);

  return recorder;
}

// @docsMissing
export function useAudioRecorderState(recorder: AudioRecorder, interval: number = 500) {
  const [state, setState] = useState<RecorderState>(recorder.getStatus());

  useEffect(() => {
    const int = setInterval(() => {
      setState(recorder.getStatus());
    }, interval);

    return () => clearInterval(int);
  }, [recorder.id]);

  return state;
}

/**
 * Creates an instance of an `AudioPlayer` that doesn't release automatically.
 *
 * > **info** For most use cases you should use the [`useAudioPlayer`](#useaudioplayersource-updateinterval) hook instead.
 * > See the [Using the `AudioPlayer` directly](#using-the-audioplayer-directly) section for more details.
 * @param source
 * @param updateInterval
 */
export function createAudioPlayer(
  source: AudioSource | AudioSource[] | string | number | null = null,
  updateInterval: number = 500
): AudioPlayer {
  const parsedSources = (Array.isArray(source) ? source : [source])
    .map(resolveSource)
    .filter(Boolean);

  return new AudioModule.AudioPlayer(parsedSources, updateInterval);
}

// @docsMissing
export async function setIsAudioActiveAsync(active: boolean): Promise<void> {
  return await AudioModule.setIsAudioActiveAsync(active);
}

// @docsMissing
export async function setAudioModeAsync(mode: Partial<AudioMode>): Promise<void> {
  const audioMode: Partial<AudioMode> =
    Platform.OS === 'ios'
      ? mode
      : {
          shouldPlayInBackground: mode.shouldPlayInBackground,
          shouldRouteThroughEarpiece: mode.shouldRouteThroughEarpiece,
        };
  return await AudioModule.setAudioModeAsync(audioMode);
}

// @docsMissing
export async function requestRecordingPermissionsAsync(): Promise<PermissionResponse> {
  return await AudioModule.requestRecordingPermissionsAsync();
}

// @docsMissing
export async function getRecordingPermissionsAsync(): Promise<PermissionResponse> {
  return await AudioModule.getRecordingPermissionsAsync();
}

export { AudioModule };
