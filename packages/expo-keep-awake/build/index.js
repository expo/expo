import { UnavailabilityError } from 'expo-modules-core';
import { useEffect } from 'react';
import ExpoKeepAwake from './ExpoKeepAwake';
const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';
/**
 * Returns `true` on all platforms except [unsupported web browsers](https://caniuse.com/wake-lock).
 */
export async function isAvailableAsync() {
    if (ExpoKeepAwake.isAvailableAsync) {
        return await ExpoKeepAwake.isAvailableAsync();
    }
    return true;
}
// @needsAudit
/**
 * A React hook to keep the screen awake for as long as the owner component is mounted.
 * The optionally provided `tag` argument is used when activating and deactivating the keep-awake
 * feature. If unspecified, the default `tag` is used. See the documentation for `activateKeepAwakeAsync`
 * below to learn more about the `tag` argument.
 * @param tag *Optional*
 * @param listener *Optional* A callback that is invoked when the keep-awake state changes (web-only).
 */
export function useKeepAwake(tag = ExpoKeepAwakeTag, listener = () => { }) {
    useEffect(() => {
        let isMounted = true;
        activateKeepAwakeAsync(tag).then(() => {
            if (isMounted && ExpoKeepAwake.addListenerForTag) {
                addListener(tag, listener);
            }
        });
        return () => {
            isMounted = false;
            deactivateKeepAwake(tag);
        };
    }, [tag]);
}
// @needsAudit
/**
 * Prevents the screen from sleeping until `deactivateKeepAwake` is called with the same `tag` value.
 *
 * If the `tag` argument is specified, the screen will not sleep until you call `deactivateKeepAwake`
 * with the same `tag` argument. When using multiple `tags` for activation you'll have to deactivate
 * each one in order to re-enable screen sleep. If tag is unspecified, the default `tag` is used.
 *
 * Web support [is limited](https://caniuse.com/wake-lock).
 *
 * @param tag *Optional* - Tag to lock screen sleep prevention. If not provided, the default tag is used.
 * @deprecated use `activateKeepAwakeAsync` instead.
 */
export function activateKeepAwake(tag = ExpoKeepAwakeTag) {
    console.warn('`activateKeepAwake` is deprecated. Use `activateKeepAwakeAsync` instead.');
    return activateKeepAwakeAsync(tag);
}
// @needsAudit
/**
 * Prevents the screen from sleeping until `deactivateKeepAwake` is called with the same `tag` value.
 *
 * If the `tag` argument is specified, the screen will not sleep until you call `deactivateKeepAwake`
 * with the same `tag` argument. When using multiple `tags` for activation you'll have to deactivate
 * each one in order to re-enable screen sleep. If tag is unspecified, the default `tag` is used.
 *
 * Web support [is limited](https://caniuse.com/wake-lock).
 *
 * @param tag *Optional* - Tag to lock screen sleep prevention. If not provided, the default tag is used.
 */
export async function activateKeepAwakeAsync(tag = ExpoKeepAwakeTag) {
    if (ExpoKeepAwake.activate)
        await ExpoKeepAwake.activate(tag);
}
// @needsAudit
/**
 * Releases the lock on screen-sleep prevention associated with the given `tag` value. If `tag`
 * is unspecified, it defaults to the same default tag that `activateKeepAwake` uses.
 * @param tag *Optional* - Tag to release the lock on screen sleep prevention. If not provided,
 * the default tag is used.
 */
export function deactivateKeepAwake(tag = ExpoKeepAwakeTag) {
    if (ExpoKeepAwake.deactivate)
        ExpoKeepAwake.deactivate(tag);
}
/**
 * Observe changes to the keep awake timer.
 * On web, this changes when navigating away from the active window/tab. No-op on native.
 *
 * @example
 * ```ts
 * KeepAwake.addListener(({ state }) => {
 *   // ...
 * });
 * ```
 */
export function addListener(tagOrListener, listener) {
    // Assert so the type is non-nullable.
    if (!ExpoKeepAwake.addListenerForTag) {
        throw new UnavailabilityError('ExpoKeepAwake', 'addListenerForTag');
    }
    const tag = typeof tagOrListener === 'string' ? tagOrListener : ExpoKeepAwakeTag;
    const _listener = typeof tagOrListener === 'function' ? tagOrListener : listener;
    return ExpoKeepAwake.addListenerForTag(tag, _listener);
}
export * from './KeepAwake.types';
//# sourceMappingURL=index.js.map