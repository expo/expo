'use client';
import * as React from 'react';
import { deepFreeze } from './deepFreeze';
import useLatestCallback from '../../utils/useLatestCallback';
const createStore = (getInitialState) => {
    const listeners = [];
    let initialized = false;
    let state;
    const getState = () => {
        if (initialized) {
            return state;
        }
        initialized = true;
        state = deepFreeze(getInitialState());
        return state;
    };
    let isBatching = false;
    let didUpdate = false;
    const setState = (newState) => {
        state = deepFreeze(newState);
        didUpdate = true;
        if (!isBatching) {
            listeners.forEach((listener) => listener());
        }
    };
    const subscribe = (callback) => {
        listeners.push(callback);
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    };
    const batchUpdates = (callback) => {
        isBatching = true;
        callback();
        isBatching = false;
        if (didUpdate) {
            didUpdate = false;
            listeners.forEach((listener) => listener());
        }
    };
    return {
        getState,
        setState,
        batchUpdates,
        subscribe,
    };
};
export function useSyncState(getInitialState) {
    const store = React.useRef(createStore(getInitialState)).current;
    const state = React.useSyncExternalStore(store.subscribe, store.getState, store.getState);
    React.useDebugValue(state);
    const pendingUpdatesRef = React.useRef([]);
    const scheduleUpdate = useLatestCallback((callback) => {
        pendingUpdatesRef.current.push(callback);
    });
    const flushUpdates = useLatestCallback(() => {
        const pendingUpdates = pendingUpdatesRef.current;
        pendingUpdatesRef.current = [];
        if (pendingUpdates.length !== 0) {
            store.batchUpdates(() => {
                // Flush all the pending updates
                for (const update of pendingUpdates) {
                    update();
                }
            });
        }
    });
    return {
        state,
        getState: store.getState,
        setState: store.setState,
        scheduleUpdate,
        flushUpdates,
    };
}
//# sourceMappingURL=useSyncState.js.map