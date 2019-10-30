import { NativeModulesProxy, UnavailabilityError, RCTDeviceEventEmitter } from '@unimodules/core';
import Constants from 'expo-constants';
import { EventEmitter, EventSubscription } from 'fbemitter';

const OTA = NativeModulesProxy.ExpoOta;

type Manifest = typeof Constants.manifest;

type UpdateEvent =
| { type: 'downloadStart' | 'downloadProgress' | 'noUpdateAvailable' }
| { type: 'downloadFinished'; manifest: Manifest }
| { type: 'error'; message: string };

type UpdateCheckResult = { isAvailable: false } | { isAvailable: true; manifest: Manifest };

type UpdateEventListener = (event: UpdateEvent) => void;

type UpdateFetchResult = { isNew: false } | { isNew: true; manifest: Manifest };

export async function checkForUpdateAsync(): Promise<UpdateCheckResult> {
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

export async function fetchUpdateAsync({
    eventListener,
}: { eventListener?: UpdateEventListener } = {}): Promise<UpdateFetchResult> {
    if (!OTA.fetchUpdateAsync) {
        throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
    }
    let subscription;
    let result;
    if (eventListener && typeof eventListener === 'function') {
        subscription = addListener(eventListener);
    }
    try {
        result = await OTA.fetchUpdateAsync();
    } finally {
        subscription && subscription.remove();
    }
    
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

export function addListener(listener: Function): EventSubscription {
    let emitter = _getEmitter();
    return emitter.addListener('Exponent.updatesEvent', listener);
}

let _emitter: EventEmitter | null;

function _emitEvent(params): void {
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
    console.log('They say we emit event. Do we?')
    _emitter.emit('Exponent.updatesEvent', newParams);
}

function _getEmitter(): EventEmitter {
    if (!_emitter) {
        _emitter = new EventEmitter();
        RCTDeviceEventEmitter.addListener('Exponent.nativeUpdatesEvent', _emitEvent);
    }
    return _emitter;
}

export const EventType = {
    DOWNLOAD_STARTED: 'downloadStart',
    DOWNLOAD_PROGRESS: 'downloadProgress',
    DOWNLOAD_FINISHED: 'downloadFinished',
    NO_UPDATE_AVAILABLE: 'noUpdateAvailable',
    ERROR: 'error',
};
