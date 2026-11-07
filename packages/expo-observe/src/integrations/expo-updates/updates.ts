// expo-updates is an optional peerDependency of expo-observe. It is required lazily, only when the
// integration is enabled, so an app that doesn't enable it never loads expo-updates through
// expo-observe. This lives in its own file because a `require` wrapped in try/catch doesn't work
// with Metro's `inlineRequires` when it shares a file with other imports (see
// `react-native-reanimated/reanimated.ts`).

import type { ObserveExpoUpdatesLogEntry } from '../../types';

export type UpdatesLogEntry = ObserveExpoUpdatesLogEntry;

export interface LoadedUpdates {
  readLogEntriesAsync(maxAge: number): Promise<UpdatesLogEntry[]>;
}

export function loadUpdates(): LoadedUpdates | null {
  try {
    const { readLogEntriesAsync } = require('expo-updates') as LoadedUpdates;
    return { readLogEntriesAsync };
  } catch {
    return null;
  }
}
