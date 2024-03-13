import { useRef } from 'react';

import AudioModule from './AudioModule';
import { AudioPlayer } from './AudioModule.types';

export function useAudioPlayer(source: string | null = null): AudioPlayer {
  return useRef(new AudioModule.AudioPlayer(source)).current;
}
