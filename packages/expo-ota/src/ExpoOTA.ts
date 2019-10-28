import { NativeModulesProxy, UnavailabilityError } from '@unimodules/core';
const OTA = NativeModulesProxy.ExpoOta;

export async function checkForUpdateAsync() {
    if (!OTA.checkForUpdateAsync) {
        throw new UnavailabilityError('WebBrowser', 'checkForUpdateAsync');
    }
    return OTA.checkForUpdateAsync();
}

export async function fetchUpdatesAsync() {
    if (!OTA.fetchUpdatesAsync) {
        throw new UnavailabilityError('WebBrowser', 'getCustomTabsSupportingBrowsersAsync');
    }
    return OTA.fetchUpdatesAsync();
}

export async function reload() {
    if (!OTA.reload) {
        throw new UnavailabilityError('WebBrowser', 'reload');
    }
    return OTA.reload();
}

export async function clearUpdateCacheAsync() {
    if (!OTA.clearUpdateCacheAsync) {
        throw new UnavailabilityError('WebBrowser', 'clearUpdateCacheAsync');
    }
    return OTA.clearUpdateCacheAsync();
}

export async function readCurrentManifestAsync() {
    if (!OTA.readCurrentManifestAsync) {
        throw new UnavailabilityError('WebBrowser', 'getCustomTabsSupportingBrowsersAsync');
    }
    return OTA.readCurrentManifestAsync();
}
