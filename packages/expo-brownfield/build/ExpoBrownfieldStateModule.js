import { requireNativeModule } from 'expo';
import { useCallback, useEffect, useState } from 'react';
const ExpoBrownfieldStateModule = requireNativeModule('ExpoBrownfieldStateModule');
const sharedObjectCache = new Map();
// SECTION: Shared State API
function getSharedObject(key) {
    if (!sharedObjectCache.has(key)) {
        sharedObjectCache.set(key, ExpoBrownfieldStateModule.getSharedState(key));
    }
    return sharedObjectCache.get(key);
}
/**
 * Gets the value of shared state for a given key.
 *
 * @param key The key to get the value for.
 */
export function getSharedStateValue(key) {
    const state = getSharedObject(key);
    const value = state?.get();
    return value === null ? undefined : value;
}
/**
 * Sets the value of shared state for a given key.
 *
 * @param key The key to set the value for.
 * @param value The value to be set.
 */
export function setSharedStateValue(key, value) {
    const state = getSharedObject(key);
    state.set(value);
}
/**
 * Deletes the shared state for a given key.
 *
 * @param key The key to delete the shared state for.
 */
export function deleteSharedState(key) {
    ExpoBrownfieldStateModule.deleteSharedState(key);
    sharedObjectCache.delete(key);
}
/**
 * Adds a listener for changes to the shared state for a given key.
 *
 * @param key The key to add the listener for.
 * @param callback The callback to be called when the shared state changes.
 * @returns A subscription object that can be used to remove the listener.
 */
export function addSharedStateListener(key, callback) {
    const state = getSharedObject(key);
    const subscription = state.addListener('change', (event) => {
        callback(event);
    });
    return {
        remove: () => subscription.remove(),
    };
}
/**
 * Hook to observe and set the value of shared state for a given key.
 * Provides a synchronous API similar to `useState`.
 *
 * @param key The key to get the value for.
 * @param initialValue The initial value to be used if the shared state is not set.
 * @returns A tuple containing the value and a function to set the value.
 */
export function useSharedState(key, initialValue) {
    const state = getSharedObject(key);
    const [value, setValue] = useState(() => {
        const currentValue = state.get();
        if (currentValue === null || currentValue === undefined) {
            if (initialValue !== undefined) {
                state.set(initialValue);
                return initialValue;
            }
            return undefined;
        }
        return currentValue;
    });
    useEffect(() => {
        let subscription = state.addListener('change', (event) => {
            setValue(event?.['value']);
        });
        const keyRecreatedSubscription = ExpoBrownfieldStateModule.addListener('onKeyRecreated', (event) => {
            if (event.key === key) {
                const newState = ExpoBrownfieldStateModule.getSharedState(key);
                sharedObjectCache.set(key, newState);
                subscription.remove();
                subscription = newState.addListener('change', (event) => {
                    setValue(event?.['value']);
                });
                setValue(getSharedStateValue(key));
            }
        });
        return () => {
            subscription.remove();
            keyRecreatedSubscription.remove();
        };
    }, [state]);
    const setSharedValue = useCallback((newValue) => {
        const valueToSet = typeof newValue === 'function' ? newValue(value) : newValue;
        getSharedObject(key).set(valueToSet);
    }, [key, value]);
    return [value, setSharedValue];
}
// END SECTION: Shared State API
//# sourceMappingURL=ExpoBrownfieldStateModule.js.map