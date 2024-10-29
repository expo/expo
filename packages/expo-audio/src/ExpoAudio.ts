import { useEvent } from 'expo';
import { PermissionResponse, useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useState, useMemo } from 'react';

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

export function useAudioPlayer(
  source: AudioSource | string | number | null = null,
  updateInterval: number = 500
): AudioPlayer {
  const parsedSource = resolveSource(source);
  return useReleasingSharedObject(
    () => new AudioModule.AudioPlayer(parsedSource, updateInterval),
    [JSON.stringify(parsedSource)]
  );
}

export function useAudioPlayerStatus(player: AudioPlayer): AudioStatus {
  const currentStatus = useMemo(() => player.currentStatus, [player.id]);
  return useEvent(player, PLAYBACK_STATUS_UPDATE, currentStatus);
}

export function useAudioSampleListener(player: AudioPlayer, listener: (data: AudioSample) => void) {
  player.setAudioSamplingEnabled(true);
  useEffect(() => {
    if (!player.isAudioSamplingSupported) {
      return;
    }
    const subscription = player.addListener(AUDIO_SAMPLE_UPDATE, listener);
    return () => {
      subscription.remove();
    };
  }, [player.id]);
}

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

export async function setIsAudioActiveAsync(active: boolean): Promise<void> {
  return await AudioModule.setIsAudioActiveAsync(active);
}

export async function setAudioModeAsync(mode: Partial<AudioMode>): Promise<void> {
  return await AudioModule.setAudioModeAsync(mode);
}

export async function requestRecordingPermissionsAsync(): Promise<PermissionResponse> {
  return await AudioModule.requestRecordingPermissionsAsync();
}

export async function getRecordingPermissionsAsync(): Promise<PermissionResponse> {
  return await AudioModule.getRecordingPermissionsAsync();
}

export { AudioModule };
