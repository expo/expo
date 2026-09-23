// react-native-reanimated and react-native-worklets are optional peerDependencies of
// expo-observe. They are required lazily, only when the integration is enabled, so an app
// that doesn't enable it never loads Reanimated through expo-observe. This lives in its own
// file because a `require` wrapped in try/catch doesn't work with Metro's `inlineRequires`
// when it shares a file with other imports (see expo-gl's `GLWorkletContextManager`).

export interface OptionalWorklets {
  runOnUISync<A extends unknown[]>(worklet: (...args: A) => void, ...args: A): void;
  scheduleOnRN<A extends unknown[]>(fn: (...args: A) => void, ...args: A): void;
}

export interface LoadedReanimated {
  version: string;
  worklets: OptionalWorklets;
}

export function loadReanimated(): LoadedReanimated | null {
  try {
    const { reanimatedVersion } = require('react-native-reanimated') as {
      reanimatedVersion: string;
    };
    const { runOnUISync, scheduleOnRN } = require('react-native-worklets') as OptionalWorklets;
    return { version: reanimatedVersion, worklets: { runOnUISync, scheduleOnRN } };
  } catch {
    return null;
  }
}
