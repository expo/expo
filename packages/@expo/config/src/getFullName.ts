import { ExpoConfig } from '@expo/config-types';

import { getUserState } from './getUserState';

const ANONYMOUS_USERNAME = 'anonymous';

/**
 * Used in expo-constants to generate the `id` property statically for an app in custom managed workflow.
 * This `id` is used for legacy Expo services AuthSession proxy and Expo notifications device ID.
 *
 * @param manifest
 * @returns
 */
export function getFullName(manifest: Pick<ExpoConfig, 'owner' | 'slug'>): string {
  const username = getAccountUsername(manifest);
  return `@${username}/${manifest.slug}`;
}

export function getAccountUsername(manifest: Pick<ExpoConfig, 'owner'> = {}): string {
  // TODO: Must match what's generated in Expo Go.
  const username =
    manifest.owner || process.env.EXPO_CLI_USERNAME || process.env.EAS_BUILD_USERNAME;
  if (username) {
    return username;
  }
  // Statically get the username from the global user state.
  return getUserState().read().auth?.username || ANONYMOUS_USERNAME;
}
