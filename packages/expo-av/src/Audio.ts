import ExponentAV from './ExponentAV';

export * from './Audio/Recording';
export * from './Audio/Sound';
export { setIsEnabledAsync } from './Audio/AudioAvailability';
export { PitchCorrectionQuality } from './AV';

export type AudioMode = {
  allowsRecordingIOS: boolean;
  interruptionModeIOS: number;
  playsInSilentModeIOS: boolean;
  staysActiveInBackground: boolean;
  interruptionModeAndroid: number;
  shouldDuckAndroid: boolean;
  playThroughEarpieceAndroid: boolean;
};

export const INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS = 0;
export const INTERRUPTION_MODE_IOS_DO_NOT_MIX = 1;
export const INTERRUPTION_MODE_IOS_DUCK_OTHERS = 2;

export const INTERRUPTION_MODE_ANDROID_DO_NOT_MIX = 1;
export const INTERRUPTION_MODE_ANDROID_DUCK_OTHERS = 2;

// Returns true if value is in validValues, and false if not.
const _isValueValid = (value: any, validValues: any[]): boolean => {
  return validValues.filter(validValue => validValue === value).length > 0;
};

const _populateMissingKeys = (
  userAudioMode: Partial<AudioMode>,
  defaultAudioMode: AudioMode
): AudioMode => {
  for (const key in defaultAudioMode) {
    if (!userAudioMode.hasOwnProperty(key)) {
      userAudioMode[key] = defaultAudioMode[key];
    }
  }
  return userAudioMode as AudioMode;
};

const defaultMode: AudioMode = {
  allowsRecordingIOS: false,
  interruptionModeIOS: INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
  playsInSilentModeIOS: false,
  staysActiveInBackground: false,
  interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
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

export async function setAudioModeAsync(partialMode: Partial<AudioMode>): Promise<void> {
  const mode = _populateMissingKeys(partialMode, getCurrentAudioMode());

  if (
    !_isValueValid(mode.interruptionModeIOS, [
      INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
      INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      INTERRUPTION_MODE_IOS_DUCK_OTHERS,
    ])
  ) {
    throw new Error(`"interruptionModeIOS" was set to an invalid value.`);
  }
  if (
    !_isValueValid(mode.interruptionModeAndroid, [
      INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
    ])
  ) {
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
