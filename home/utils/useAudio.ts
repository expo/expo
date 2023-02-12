import { Audio, AudioMode, InterruptionModeAndroid } from 'expo-av';
import { Dispatch, useEffect, useState } from 'react';

export function useAudio(): [boolean, Dispatch<boolean>] {
  const [isAudioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    Audio.setIsEnabledAsync(isAudioEnabled);
    return () => {
      Audio.setIsEnabledAsync(true);
    };
  }, [isAudioEnabled]);

  return [isAudioEnabled, setAudioEnabled];
}

export function useAudioMode(
  initialAudioMode: Partial<AudioMode>
): [Partial<AudioMode>, Dispatch<Partial<AudioMode>>] {
  const [audioMode, setAudioMode] = useState(initialAudioMode);

  useEffect(() => {
    setAudioModeAsync(audioMode);
  }, [audioMode]);

  return [audioMode, setAudioMode];
}

async function setAudioModeAsync(audioMode: Partial<AudioMode>): Promise<void> {
  await Audio.setAudioModeAsync({
    ...audioMode,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });
}
