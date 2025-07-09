import { UnavailabilityError } from 'expo-modules-core';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import ExpoLinking from './ExpoLinking';
import RNLinking from './RNLinking';
import { parse } from './createURL';
import { validateURL } from './validateURL';
// @needsAudit
/**
 * Add a handler to `Linking` changes by listening to the `url` event type and providing the handler.
 * It is recommended to use the [`useURL()`](#useurl) hook instead.
 * @param type The only valid type is `'url'`.
 * @param handler An [`URLListener`](#urllistener) function that takes an `event` object of the type
 * [`EventType`](#eventtype).
 * @return An EmitterSubscription that has the remove method from EventSubscription
 * @see [React Native documentation on Linking](https://reactnative.dev/docs/linking#addeventlistener).
 */
export function addEventListener(type, handler) {
    return RNLinking.addEventListener(type, handler);
}
// @needsAudit
/**
 * Helper method which wraps React Native's `Linking.getInitialURL()` in `Linking.parse()`.
 * Parses the deep link information out of the URL used to open the experience initially.
 * If no link opened the app, all the fields will be `null`.
 * > On the web it parses the current window URL.
 * @return A promise that resolves with `ParsedURL` object.
 */
export async function parseInitialURLAsync() {
    const initialUrl = await RNLinking.getInitialURL();
    if (!initialUrl) {
        return {
            scheme: null,
            hostname: null,
            path: null,
            queryParams: null,
        };
    }
    return parse(initialUrl);
}
// @needsAudit
/**
 * Launch an Android intent with extras.
 * > Use [`expo-intent-launcher`](./intent-launcher) instead. `sendIntent` is only included in
 * > `Linking` for API compatibility with React Native's Linking API.
 * @platform android
 */
export async function sendIntent(action, extras) {
    if (Platform.OS === 'android') {
        return await RNLinking.sendIntent(action, extras);
    }
    throw new UnavailabilityError('Linking', 'sendIntent');
}
// @needsAudit
/**
 * Open the operating system settings app and displays the app’s custom settings, if it has any.
 */
export async function openSettings() {
    if (Platform.OS === 'web') {
        throw new UnavailabilityError('Linking', 'openSettings');
    }
    if (RNLinking.openSettings) {
        return await RNLinking.openSettings();
    }
    await openURL('app-settings:');
}
// @needsAudit
/**
 * Get the URL that was used to launch the app if it was launched by a link.
 * @return The URL string that launched your app, or `null`.
 */
export async function getInitialURL() {
    return (await RNLinking.getInitialURL()) ?? null;
}
/**
 * Get the URL that was used to launch the app if it was launched by a link.
 * @return The URL string that launched your app, or `null`.
 */
export function getLinkingURL() {
    return ExpoLinking.getLinkingURL();
}
// @needsAudit
/**
 * Attempt to open the given URL with an installed app. See the [Linking guide](/guides/linking)
 * for more information.
 * @param url A URL for the operating system to open. For example: `tel:5555555`, `exp://`.
 * @return A `Promise` that is fulfilled with `true` if the link is opened operating system
 * automatically or the user confirms the prompt to open the link. The `Promise` rejects if there
 * are no applications registered for the URL or the user cancels the dialog.
 */
export async function openURL(url) {
    validateURL(url);
    return await RNLinking.openURL(url);
}
// @needsAudit
/**
 * Determine whether or not an installed app can handle a given URL.
 * On web this always returns `true` because there is no API for detecting what URLs can be opened.
 * @param url The URL that you want to test can be opened.
 * @return A `Promise` object that is fulfilled with `true` if the URL can be handled, otherwise it
 * `false` if not.
 * The `Promise` will reject on Android if it was impossible to check if the URL can be opened, and
 * on iOS if you didn't [add the specific scheme in the `LSApplicationQueriesSchemes` key inside **Info.plist**](/guides/linking#linking-from-your-app).
 */
export async function canOpenURL(url) {
    validateURL(url);
    return await RNLinking.canOpenURL(url);
}
// @needsAudit
/**
 * Returns the initial URL followed by any subsequent changes to the URL.
 * @deprecated Use `useLinkingURL` hook instead.
 * @return Returns the initial URL or `null`.
 */
export function useURL() {
    const [url, setLink] = useState(null);
    function onChange(event) {
        setLink(event.url);
    }
    useEffect(() => {
        getInitialURL().then((url) => setLink(url));
        const subscription = addEventListener('url', onChange);
        return () => subscription.remove();
    }, []);
    return url;
}
/**
 * Returns the linking URL followed by any subsequent changes to the URL.
 * Always returns the initial URL immediately on reload.
 * @return Returns the initial URL or `null`.
 */
export function useLinkingURL() {
    const [url, setLink] = useState(ExpoLinking.getLinkingURL);
    function onChange(event) {
        setLink(event.url);
    }
    useEffect(() => {
        const subscription = ExpoLinking.addListener('onURLReceived', onChange);
        return () => subscription.remove();
    }, []);
    return url ?? null;
}
export * from './Linking.types';
export * from './Schemes';
export { parse, createURL } from './createURL';
//# sourceMappingURL=Linking.js.map