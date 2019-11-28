import { EventEmitter, NativeModulesProxy, UnavailabilityError } from '@unimodules/core';
const OTA = NativeModulesProxy.ExpoOta;
const OTAEventEmitter = new EventEmitter(OTA);
export async function checkForUpdateAsync() {
    if (!OTA.checkForUpdateAsync) {
        throw new UnavailabilityError('Updates', 'checkForUpdateAsync');
    }
    const result = await OTA.checkForUpdateAsync();
    if (!result) {
        return { isAvailable: false };
    }
    return {
        isAvailable: true,
        manifest: typeof result === 'string' ? JSON.parse(result) : result,
    };
}
export async function fetchUpdateAsync({ eventListener, } = {}) {
    if (!OTA.fetchUpdateAsync) {
        throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
    }
    let subscription;
    let result;
    if (eventListener && typeof eventListener === 'function') {
        subscription = addListener(eventListener);
    }
    result = await OTA.fetchUpdateAsync();
    subscription && subscription.remove();
    if (!result) {
        return { isNew: false };
    }
    return {
        isNew: true,
        manifest: typeof result === 'string' ? JSON.parse(result) : result,
    };
}
export async function reload() {
    if (!OTA.reload) {
        throw new UnavailabilityError('Updates', 'reload');
    }
    return OTA.reload();
}
export async function reloadFromCache() {
    console.warn('reloadFromCache is deprecated! Please use reload method instead!');
    return reload();
}
export async function clearUpdateCacheAsync() {
    if (!OTA.clearUpdateCacheAsync) {
        throw new UnavailabilityError('Updates', 'clearUpdateCacheAsync');
    }
    return OTA.clearUpdateCacheAsync();
}
export async function readCurrentManifestAsync() {
    if (!OTA.readCurrentManifestAsync) {
        throw new UnavailabilityError('Updates', 'getCustomTabsSupportingBrowsersAsync');
    }
    return OTA.readCurrentManifestAsync().then(result => typeof result === 'string' ? JSON.parse(result) : result);
}
export function addListener(listener) {
    return OTAEventEmitter.addListener('Exponent.updatesEvent', listener);
}
export const EventType = {
    DOWNLOAD_STARTED: 'downloadStart',
    DOWNLOAD_PROGRESS: 'downloadProgress',
    DOWNLOAD_FINISHED: 'downloadFinished',
    NO_UPDATE_AVAILABLE: 'noUpdateAvailable',
    ERROR: 'error',
};
//# sourceMappingURL=ExpoOTA.js.map