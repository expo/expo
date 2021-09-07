import { EventEmitter } from 'expo-modules-core';
import { PlaybackMixin, assertStatusValuesInBounds, getNativeSourceAndFullInitialStatusForLoadAsync, getUnloadedStatus, } from '../AV';
import ExponentAV from '../ExponentAV';
import { throwIfAudioIsDisabled } from './AudioAvailability';
export class Sound {
    _loaded = false;
    _loading = false;
    _key = null;
    _lastStatusUpdate = null;
    _lastStatusUpdateTime = null;
    _subscriptions = [];
    _eventEmitter = new EventEmitter(ExponentAV);
    _coalesceStatusUpdatesInMillis = 100;
    _onPlaybackStatusUpdate = null;
    _onMetadataUpdate = null;
    /** @deprecated Use `Sound.createAsync()` instead */
    static create = async (source, initialStatus = {}, onPlaybackStatusUpdate = null, downloadFirst = true) => {
        console.warn(`Sound.create is deprecated in favor of Sound.createAsync with the same API except for the new method name`);
        return Sound.createAsync(source, initialStatus, onPlaybackStatusUpdate, downloadFirst);
    };
    static createAsync = async (source, initialStatus = {}, onPlaybackStatusUpdate = null, downloadFirst = true) => {
        const sound = new Sound();
        sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        const status = await sound.loadAsync(source, initialStatus, downloadFirst);
        return { sound, status };
    };
    // Internal methods
    _callOnPlaybackStatusUpdateForNewStatus(status) {
        const shouldDismissBasedOnCoalescing = this._lastStatusUpdateTime &&
            JSON.stringify(status) === this._lastStatusUpdate &&
            Date.now() - this._lastStatusUpdateTime.getTime() < this._coalesceStatusUpdatesInMillis;
        if (this._onPlaybackStatusUpdate != null && !shouldDismissBasedOnCoalescing) {
            this._onPlaybackStatusUpdate(status);
            this._lastStatusUpdateTime = new Date();
            this._lastStatusUpdate = JSON.stringify(status);
        }
    }
    async _performOperationAndHandleStatusAsync(operation) {
        throwIfAudioIsDisabled();
        if (this._loaded) {
            const status = await operation();
            this._callOnPlaybackStatusUpdateForNewStatus(status);
            return status;
        }
        else {
            throw new Error('Cannot complete operation because sound is not loaded.');
        }
    }
    _internalStatusUpdateCallback = ({ key, status, }) => {
        if (this._key === key) {
            this._callOnPlaybackStatusUpdateForNewStatus(status);
        }
    };
    _internalMetadataUpdateCallback = ({ key, metadata, }) => {
        if (this._key === key) {
            this._onMetadataUpdate?.(metadata);
        }
    };
    _internalErrorCallback = ({ key, error }) => {
        if (this._key === key) {
            this._errorCallback(error);
        }
    };
    // TODO: We can optimize by only using time observer on native if (this._onPlaybackStatusUpdate).
    _subscribeToNativeEvents() {
        if (this._loaded) {
            this._subscriptions.push(this._eventEmitter.addListener('didUpdatePlaybackStatus', this._internalStatusUpdateCallback), this._eventEmitter.addListener('didUpdateMetadata', this._internalMetadataUpdateCallback));
            this._subscriptions.push(this._eventEmitter.addListener('ExponentAV.onError', this._internalErrorCallback));
        }
    }
    _clearSubscriptions() {
        this._subscriptions.forEach((e) => e.remove());
        this._subscriptions = [];
    }
    _errorCallback = (error) => {
        this._clearSubscriptions();
        this._loaded = false;
        this._key = null;
        this._callOnPlaybackStatusUpdateForNewStatus(getUnloadedStatus(error));
    };
    // ### Unified playback API ### (consistent with Video.js)
    // All calls automatically call onPlaybackStatusUpdate as a side effect.
    // Get status API
    getStatusAsync = async () => {
        if (this._loaded) {
            return this._performOperationAndHandleStatusAsync(() => ExponentAV.getStatusForSound(this._key));
        }
        const status = getUnloadedStatus();
        this._callOnPlaybackStatusUpdateForNewStatus(status);
        return status;
    };
    setOnPlaybackStatusUpdate(onPlaybackStatusUpdate) {
        this._onPlaybackStatusUpdate = onPlaybackStatusUpdate;
        this.getStatusAsync();
    }
    setOnMetadataUpdate(onMetadataUpdate) {
        this._onMetadataUpdate = onMetadataUpdate;
    }
    // Loading / unloading API
    async loadAsync(source, initialStatus = {}, downloadFirst = true) {
        throwIfAudioIsDisabled();
        if (this._loading) {
            throw new Error('The Sound is already loading.');
        }
        if (!this._loaded) {
            this._loading = true;
            const { nativeSource, fullInitialStatus } = await getNativeSourceAndFullInitialStatusForLoadAsync(source, initialStatus, downloadFirst);
            // This is a workaround, since using load with resolve / reject seems to not work.
            return new Promise((resolve, reject) => {
                const loadSuccess = (result) => {
                    const [key, status] = result;
                    this._key = key;
                    this._loaded = true;
                    this._loading = false;
                    this._subscribeToNativeEvents();
                    this._callOnPlaybackStatusUpdateForNewStatus(status);
                    resolve(status);
                };
                const loadError = (error) => {
                    this._loading = false;
                    reject(error);
                };
                ExponentAV.loadForSound(nativeSource, fullInitialStatus).then(loadSuccess).catch(loadError);
            });
        }
        else {
            throw new Error('The Sound is already loaded.');
        }
    }
    async unloadAsync() {
        if (this._loaded) {
            this._loaded = false;
            const key = this._key;
            this._key = null;
            const status = await ExponentAV.unloadForSound(key);
            this._callOnPlaybackStatusUpdateForNewStatus(status);
            this._clearSubscriptions();
            return status;
        }
        else {
            return this.getStatusAsync(); // Automatically calls onPlaybackStatusUpdate.
        }
    }
    // Set status API (only available while isLoaded = true)
    async setStatusAsync(status) {
        assertStatusValuesInBounds(status);
        return this._performOperationAndHandleStatusAsync(() => ExponentAV.setStatusForSound(this._key, status));
    }
    async replayAsync(status = {}) {
        if (status.positionMillis && status.positionMillis !== 0) {
            throw new Error('Requested position after replay has to be 0.');
        }
        return this._performOperationAndHandleStatusAsync(() => ExponentAV.replaySound(this._key, {
            ...status,
            positionMillis: 0,
            shouldPlay: true,
        }));
    }
    // Methods of the Playback interface that are set via PlaybackMixin
    playAsync;
    playFromPositionAsync;
    pauseAsync;
    stopAsync;
    setPositionAsync;
    setRateAsync;
    setVolumeAsync;
    setIsMutedAsync;
    setIsLoopingAsync;
    setProgressUpdateIntervalAsync;
}
Object.assign(Sound.prototype, PlaybackMixin);
//# sourceMappingURL=Sound.js.map