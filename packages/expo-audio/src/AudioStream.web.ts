import type { AudioStreamOptions, AudioStreamResult } from './AudioStream.types';

export function useAudioStream(_options: AudioStreamOptions = {}): AudioStreamResult {
  return { stream: null as any, isStreaming: false };
}
