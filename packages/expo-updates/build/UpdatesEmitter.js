import { EventEmitter as NativeEventEmitter } from 'expo-modules-core';
import { EventEmitter as JsEventEmitter } from 'fbemitter';
import ExpoUpdatesModule from './ExpoUpdates';
import { transformNativeStateMachineContext } from './Updates';
const _nativeEventEmitter = new NativeEventEmitter(ExpoUpdatesModule);
_nativeEventEmitter.addListener('Expo.nativeUpdatesStateChangeEvent', _emitNativeStateChangeEvent);
let _jsEventEmitter = null;
function _getJsEventEmitter() {
    if (!_jsEventEmitter) {
        _jsEventEmitter = new JsEventEmitter();
    }
    return _jsEventEmitter;
}
// Reemits native state change events
function _emitNativeStateChangeEvent(params) {
    let newParams = { ...params };
    if (typeof params === 'string') {
        newParams = JSON.parse(params);
    }
    newParams.context = transformNativeStateMachineContext(newParams.context);
    _getJsEventEmitter().emit('Expo.updatesStateChangeEvent', newParams);
}
/**
 * Add listener for state change events
 * @hidden
 */
export const addUpdatesStateChangeListener = (listener) => {
    return _getJsEventEmitter().addListener('Expo.updatesStateChangeEvent', listener);
};
/**
 * Allows JS to emit a simulated native state change event (used in unit testing)
 * @hidden
 */
export const emitTestStateChangeEvent = (event) => {
    _emitNativeStateChangeEvent(event);
};
//# sourceMappingURL=UpdatesEmitter.js.map