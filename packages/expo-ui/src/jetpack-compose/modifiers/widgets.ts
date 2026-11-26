import { createModifier } from './createModifier';

/**
 * Opens a URL when the user taps the component, for example, a deep link into the app.
 *
 * > **Note:** Works only inside Android widgets and custom notifications built with `expo-widgets`.
 * > Expo UI ignores this modifier in an app.
 * @param url - The URL to open.
 * @platform expo-widgets
 */
export const openURL = (url: string) => createModifier('openURL', { url });
