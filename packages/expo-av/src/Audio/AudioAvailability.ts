import ExponentAV from '../ExponentAV';

let _enabled = true;

export function isAudioEnabled(): boolean {
  return _enabled;
}

export function throwIfAudioIsDisabled(): void {
  if (!_enabled) {
    throw new Error('Cannot complete operation because audio is not enabled.');
  }
}

// @needsAudit
/**
 * Audio is enabled by default, but if you want to write your own Audio API in a bare workflow app, you might want to disable the Audio API.
 * @param value `true` enables Audio, and `false` disables it.
 * @return A `Promise` that will reject if audio playback could not be enabled for the device.
 */
export async function setIsEnabledAsync(value: boolean): Promise<void> {
  _enabled = value;
  await ExponentAV.setAudioIsEnabled(value);
  // TODO : We immediately pause all players when disabled, but we do not resume all shouldPlay
  // players when enabled. Perhaps for completeness we should allow this; the design of the
  // enabling API is for people to enable / disable this audio library, but I think that it should
  // intuitively also double as a global pause/resume.
}
