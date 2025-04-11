import { AudioMode, InterruptionModeAndroid, InterruptionModeIOS } from './Audio.types';
import ExponentAV from './ExponentAV';

export * from './Audio/Recording';
export * from './Audio/Sound';
export { setIsEnabledAsync } from './Audio/AudioAvailability';
export { PitchCorrectionQuality } from './AV';

const _populateMissingKeys = (
  userAudioMode: Partial<AudioMode>,
  defaultAudioMode: AudioMode
): AudioMode => {
  for (const key in defaultAudioMode) {
    if (!userAudioMode.hasOwnProperty(key)) {
      const prop = key as keyof AudioMode;
      userAudioMode[prop] = defaultAudioMode[prop] as any;
    }
  }
  return userAudioMode as AudioMode;
};

const defaultMode: AudioMode = {
  allowsRecordingIOS: false,
  interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
  playsInSilentModeIOS: false,
  staysActiveInBackground: false,
  interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
};

let currentAudioMode: AudioMode | null = null;

function getCurrentAudioMode(): AudioMode {
  if (!currentAudioMode) {
    return defaultMode;
  }
  return currentAudioMode;
}

/**
 * We provide this API to customize the audio experience on iOS and Android.
 * @param partialMode
 * @return A `Promise` that will reject if the audio mode could not be enabled for the device.
 */
export async function setAudioModeAsync(partialMode: Partial<AudioMode>): Promise<void> {
  const mode = _populateMissingKeys(partialMode, getCurrentAudioMode());

  if (!InterruptionModeIOS[mode.interruptionModeIOS]) {
    throw new Error(`"interruptionModeIOS" was set to an invalid value.`);
  }
  if (!InterruptionModeAndroid[mode.interruptionModeAndroid]) {
    throw new Error(`"interruptionModeAndroid" was set to an invalid value.`);
  }
  if (
    typeof mode.allowsRecordingIOS !== 'boolean' ||
    typeof mode.playsInSilentModeIOS !== 'boolean' ||
    typeof mode.staysActiveInBackground !== 'boolean' ||
    typeof mode.shouldDuckAndroid !== 'boolean' ||
    typeof mode.playThroughEarpieceAndroid !== 'boolean'
  ) {
    throw new Error(
      '"allowsRecordingIOS", "playsInSilentModeIOS", "playThroughEarpieceAndroid", "staysActiveInBackground" and "shouldDuckAndroid" must be booleans.'
    );
  }
  currentAudioMode = mode;
  return await ExponentAV.setAudioMode(mode);
}
