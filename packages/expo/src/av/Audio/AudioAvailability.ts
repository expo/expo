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

export async function setIsEnabledAsync(value: boolean): Promise<void> {
  _enabled = value;
  await ExponentAV.setAudioIsEnabled(value);
  // TODO : We immediately pause all players when disabled, but we do not resume all shouldPlay
  // players when enabled. Perhaps for completeness we should allow this; the design of the
  // enabling API is for people to enable / disable this audio library, but I think that it should
  // intuitively also double as a global pause/resume.
}
