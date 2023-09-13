import os from 'os';
import path from 'path';

// The ~/.expo directory is used to store authentication sessions,
// which are shared between EAS CLI and Expo CLI.
export function dotExpoHomeDirectory(): string {
  const home = os.homedir();
  if (!home) {
    throw new Error(
      "Can't determine your home directory; make sure your $HOME environment variable is set."
    );
  }

  let dirPath;
  if (process.env.EXPO_STAGING) {
    dirPath = path.join(home, '.expo-staging');
  } else if (process.env.EXPO_LOCAL) {
    dirPath = path.join(home, '.expo-local');
  } else {
    dirPath = path.join(home, '.expo');
  }
  return dirPath;
}

export const getStateJsonPath = (): string => path.join(dotExpoHomeDirectory(), 'state.json');
