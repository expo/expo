import { useEvent } from 'expo';
import { PermissionResponse } from 'expo-modules-core';
import { useEffect, useState, useMemo } from 'react';

import {
  AudioMode,
  AudioSource,
  AudioStatus,
  RecorderState,
  RecordingOptions,
  RecordingStatus,
} from './Audio.types';
import { AudioRecorder } from './AudioModule.types';
import * as AudioModule from './AudioModule.web';
import { AUDIO_SAMPLE_UPDATE, PLAYBACK_STATUS_UPDATE, RECORDING_STATUS_UPDATE } from './ExpoAudio';
import { createRecordingOptions } from './utils/options';
import { resolveSource } from './utils/resolveSource';

export function useAudioPlayer(
  source: AudioSource | string | number | null = null,
  updateInterval: number = 500
): AudioModule.AudioPlayerWeb {
  const parsedSource = resolveSource(source);
  const player = useMemo(
    () => new AudioModule.AudioPlayerWeb(parsedSource, updateInterval),
    [JSON.stringify(parsedSource)]
  );

  useEffect(() => {
    return () => player.remove();
  }, []);

  return player;
}

export function useAudioPlayerStatus(player: AudioModule.AudioPlayerWeb): AudioStatus {
  const currentStatus = useMemo(() => player.currentStatus, [player.id]);
  return useEvent(player, PLAYBACK_STATUS_UPDATE, currentStatus);
}

export function useAudioSampleListener(
  player: AudioModule.AudioPlayerWeb,
  listener: (data: { channels: { frames: number[] }[]; timestamp: number }) => void
) {
  player.setAudioSamplingEnabled(true);
  useEffect(() => {
    const subscription = player.addListener(AUDIO_SAMPLE_UPDATE, listener);
    return () => {
      player.setAudioSamplingEnabled(false);
      subscription.remove();
    };
  }, [player.id]);
}

export function useAudioRecorder(
  options: RecordingOptions,
  statusListener?: (status: RecordingStatus) => void
): AudioModule.AudioRecorderWeb {
  const platformOptions = createRecordingOptions(options);
  const recorder = useMemo(() => {
    return new AudioModule.AudioRecorderWeb(platformOptions);
  }, [JSON.stringify(platformOptions)]);

  useEffect(() => {
    const subscription = recorder.addListener(RECORDING_STATUS_UPDATE, (status) => {
      statusListener?.(status);
    });
    return () => {
      recorder.clearTimeouts();
      subscription.remove();
    };
  }, [recorder.id]);

  return recorder;
}

export function useAudioRecorderState(recorder: AudioRecorder, interval: number = 500) {
  const [state, setState] = useState<RecorderState>(recorder.getStatus());

  useEffect(() => {
    const id = setInterval(() => {
      setState(recorder.getStatus());
    }, interval);

    return () => clearInterval(id);
  }, [recorder.id]);

  return state;
}

export async function setIsAudioActiveAsync(active: boolean): Promise<void> {
  return await AudioModule.setIsAudioActiveAsync(active);
}

export async function setAudioModeAsync(mode: AudioMode): Promise<void> {
  return await AudioModule.setAudioModeAsync(mode);
}

export async function requestRecordingPermissionsAsync(): Promise<PermissionResponse> {
  return await AudioModule.requestRecordingPermissionsAsync();
}

export async function getRecordingPermissionsAsync(): Promise<PermissionResponse> {
  return await AudioModule.getRecordingPermissionsAsync();
}

export { AudioModule };
