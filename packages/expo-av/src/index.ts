import * as Audio from './Audio';
export { Audio };
export { default as Video } from './Video';

let loggedDeprecationWarning = false;

if (!loggedDeprecationWarning) {
  console.warn(
    '[expo-av]: Expo AV has been deprecated and will be removed in SDK 54. Use the `expo-audio` and `expo-video` packages to replace the required functionality.'
  );
  loggedDeprecationWarning = true;
}

export * from './AV.types';
export * from './Audio.types';
export * from './Video.types';
