import { ExpoConfig } from '@expo/config-types';
/**
 * Get the owner of the project from the manifest if specified, falling back to a bunch of different things
 * which may or may not be the owner of the project.
 *
 * @deprecated This may not actually be the owner of the project. Prefer to fetch the project owner using
 * the EAS project ID, falling back to the `owner` field.
 */
export declare function getAccountUsername(manifest?: Pick<ExpoConfig, 'owner'>): string;
