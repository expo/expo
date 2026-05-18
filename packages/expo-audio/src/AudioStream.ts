import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useRef, useState } from 'react';

import { AUDIO_STREAM_BUFFER, AUDIO_STREAM_STATUS } from './AudioEventKeys';
import AudioModule from './AudioModule';
import type {
  AudioStreamBuffer,
  AudioStreamOptions,
  AudioStreamResult,
  AudioStreamStatus,
} from './AudioStream.types';

/**
 * Hook that creates a native audio stream for real-time PCM microphone capture.
 * Call `stream.start()` to begin and `stream.stop()` to end.
 * Requires microphone permission via `requestRecordingPermissionsAsync()`.
 */
export function useAudioStream(options: AudioStreamOptions = {}): AudioStreamResult {
  const { sampleRate = 48000, channels = 1, encoding = 'float32', onBuffer } = options;
  const [isStreaming, setIsStreaming] = useState(false);
  const onBufferRef = useRef(onBuffer);
  onBufferRef.current = onBuffer;

  const stream = useReleasingSharedObject(
    () =>
      new AudioModule.AudioStream({
        sampleRate,
        channels,
        encoding,
      }),
    [sampleRate, channels, encoding]
  );

  useEffect(() => {
    const statusSub = stream.addListener(AUDIO_STREAM_STATUS, (status: AudioStreamStatus) => {
      setIsStreaming(status.isStreaming);
    });

    const bufferSub = stream.addListener(AUDIO_STREAM_BUFFER, (buffer: AudioStreamBuffer) => {
      onBufferRef.current?.(buffer);
    });

    return () => {
      statusSub.remove();
      bufferSub.remove();
    };
  }, [stream.id]);

  return { stream, isStreaming };
}
