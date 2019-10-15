import { Asset } from 'expo-asset';

/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
export type FontSource = string | number | Asset | FontResource;

export type FontResource = {
  uri: string | number;
};
