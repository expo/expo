// react-native-reanimated is an optional peerDependency of expo-observe. It is required lazily,
// only when the integration is enabled, so an app that doesn't enable it never loads Reanimated
// through expo-observe. This lives in its own file because a `require` wrapped in try/catch
// doesn't work with Metro's `inlineRequires` when it shares a file with other imports (see
// expo-gl's `GLWorkletContextManager`).

export type ReanimatedLogData = { level: number; message: string };

export type ReanimatedLoggerConfig = { level?: number; strict?: boolean };

export interface LoadedReanimated {
  version: string;
  configureReanimatedLogger(
    config: ReanimatedLoggerConfig,
    onLog?: (data: ReanimatedLogData) => void
  ): void;
}

export function loadReanimated(): LoadedReanimated | null {
  try {
    const { reanimatedVersion, configureReanimatedLogger } = require('react-native-reanimated') as {
      reanimatedVersion: string;
      configureReanimatedLogger: LoadedReanimated['configureReanimatedLogger'];
    };
    return { version: reanimatedVersion, configureReanimatedLogger };
  } catch {
    return null;
  }
}
