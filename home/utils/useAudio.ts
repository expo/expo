import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useEffect, useState } from 'react';

export function useAudio(): [boolean, React.Dispatch<boolean>] {
  const [isAudioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    Audio.setIsEnabledAsync(isAudioEnabled);
    return () => {
      Audio.setIsEnabledAsync(true);
    };
  }, [isAudioEnabled]);

  return [isAudioEnabled, setAudioEnabled];
}

export type AudioModeState = {
  interruptionModeIOS: InterruptionModeIOS;
  playsInSilentModeIOS: boolean;
  allowsRecordingIOS: boolean;
  staysActiveInBackground: boolean;
};

export function useAudioMode(
  initialAudioMode: AudioModeState
): [AudioModeState, React.Dispatch<AudioModeState>] {
  const [audioMode, setAudioMode] = useState(initialAudioMode);

  useEffect(() => {
    setAudioModeAsync(audioMode);
  }, [audioMode]);

  return [audioMode, setAudioMode];
}

async function setAudioModeAsync(audioMode: AudioModeState): Promise<void> {
  await Audio.setAudioModeAsync({
    ...audioMode,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });
}
