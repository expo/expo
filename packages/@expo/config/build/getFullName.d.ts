import { ExpoConfig } from '@expo/config-types';
/**
 * Used in expo-constants to generate the `id` property statically for an app in custom managed workflow.
 * This `id` is used for legacy Expo services AuthSession proxy and Expo notifications device ID.
 *
 * @param manifest
 * @returns
 */
export declare function getFullName(manifest: Pick<ExpoConfig, 'owner' | 'slug'>): string;
export declare function getAccountUsername(manifest?: Pick<ExpoConfig, 'owner'>): string;
