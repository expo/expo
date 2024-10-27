import { EventEmitter as JsEventEmitter } from 'fbemitter';
import ExpoUpdatesModule from './ExpoUpdates';
export let latestContext = transformNativeStateMachineContext(ExpoUpdatesModule.initialContext);
ExpoUpdatesModule.addListener('Expo.nativeUpdatesStateChangeEvent', _handleNativeStateChangeEvent);
const _jsEventEmitter = new JsEventEmitter();
// Reemits native state change events
function _handleNativeStateChangeEvent(params) {
    const newParams = typeof params === 'string' ? JSON.parse(params) : { ...params };
    const transformedContext = transformNativeStateMachineContext(newParams.context);
    // only process state change events if they are in order
    if (transformedContext.sequenceNumber <= latestContext.sequenceNumber) {
        return;
    }
    newParams.context = transformedContext;
    latestContext = transformedContext;
    _jsEventEmitter.emit('Expo.updatesStateChangeEvent', newParams);
}
/**
 * Add listener for state change events
 * @hidden
 */
export const addUpdatesStateChangeListener = (listener) => {
    return _jsEventEmitter.addListener('Expo.updatesStateChangeEvent', listener);
};
/**
 * Allows JS test to emit a simulated native state change event (used in unit testing)
 * @hidden
 */
export const emitTestStateChangeEvent = (event) => {
    _handleNativeStateChangeEvent(event);
};
/**
 * Allows JS test to reset latest context (and sequence number)
 * @hidden
 */
export const resetLatestContext = () => {
    latestContext = transformNativeStateMachineContext(ExpoUpdatesModule.initialContext);
};
function transformNativeStateMachineContext(originalNativeContext) {
    const nativeContext = { ...originalNativeContext };
    if (nativeContext.latestManifestString) {
        nativeContext.latestManifest = JSON.parse(nativeContext.latestManifestString);
        delete nativeContext.latestManifestString;
    }
    if (nativeContext.downloadedManifestString) {
        nativeContext.downloadedManifest = JSON.parse(nativeContext.downloadedManifestString);
        delete nativeContext.downloadedManifestString;
    }
    if (nativeContext.lastCheckForUpdateTimeString) {
        nativeContext.lastCheckForUpdateTime = new Date(nativeContext.lastCheckForUpdateTimeString);
        delete nativeContext.lastCheckForUpdateTimeString;
    }
    if (nativeContext.rollbackString) {
        nativeContext.rollback = JSON.parse(nativeContext.rollbackString);
        delete nativeContext.rollbackString;
    }
    return nativeContext;
}
//# sourceMappingURL=UpdatesEmitter.js.map