export const EMULATOR_MAX_WAIT_TIMEOUT = 60 * 1000 * 3;

export function whichEmulator(): string {
  if (process.env.ANDROID_HOME) {
    return `${process.env.ANDROID_HOME}/emulator/emulator`;
  }
  return 'emulator';
}
