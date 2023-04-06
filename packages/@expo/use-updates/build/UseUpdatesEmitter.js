import { DeviceEventEmitter } from 'expo-modules-core';
import { EventEmitter } from 'fbemitter';
import { useEffect, useRef } from 'react';
// Emitter and hook specifically for @expo/use-updates module
// Listens for the same native events as Updates.addListener
// Emits the native events (or allows JS code to emit events) with
// new event name 'Expo.useUpdatesEvent'
let _emitter;
function _getEmitter() {
    if (!_emitter) {
        _emitter = new EventEmitter();
        DeviceEventEmitter.addListener('Expo.nativeUpdatesEvent', _emitNativeEvent);
    }
    return _emitter;
}
function _addListener(listener) {
    const emitter = _getEmitter();
    return emitter.addListener('Expo.useUpdatesEvent', listener);
}
function _emitNativeEvent(params) {
    let newParams = params;
    if (typeof params === 'string') {
        newParams = JSON.parse(params);
    }
    if (newParams.manifestString) {
        newParams.manifest = JSON.parse(newParams.manifestString);
        delete newParams.manifestString;
    }
    if (!_emitter) {
        throw new Error(`EventEmitter must be initialized to use from its listener`);
    }
    _emitter.emit('Expo.useUpdatesEvent', newParams);
}
export const emitEvent = (event) => {
    _emitNativeEvent(event);
};
export const useUpdateEvents = (listener) => {
    const listenerRef = useRef();
    useEffect(() => {
        listenerRef.current = listener;
    }, [listener]);
    useEffect(() => {
        if (listenerRef.current) {
            const subscription = _addListener(listenerRef.current);
            return () => {
                subscription.remove();
            };
        }
        return undefined;
    }, []);
};
//# sourceMappingURL=UseUpdatesEmitter.js.map