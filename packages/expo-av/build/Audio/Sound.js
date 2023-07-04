import { EventEmitter, Platform, UnavailabilityError } from 'expo-modules-core';
import { PlaybackMixin, assertStatusValuesInBounds, getNativeSourceAndFullInitialStatusForLoadAsync, getUnloadedStatus, } from '../AV';
import ExponentAV from '../ExponentAV';
import { throwIfAudioIsDisabled } from './AudioAvailability';
// @needsAudit
/**
 * This class represents a sound corresponding to an Asset or URL.
 * @return A newly constructed instance of `Audio.Sound`.
 *
 * @example
 * ```ts
 * const sound = new Audio.Sound();
 * try {
 *   await sound.loadAsync(require('./assets/sounds/hello.mp3'));
 *   await sound.playAsync();
 *   // Your sound is playing!
 *
 *   // Don't forget to unload the sound from memory
 *   // when you are done using the Sound object
 *   await sound.unloadAsync();
 * } catch (error) {
 *   // An error occurred!
 * }
 * ```
 *
 * > Method not described below and the rest of the API for `Audio.Sound` is the same as the imperative playback API for `Video`.
 * > See the [AV documentation](/versions/latest/sdk/av) for further information.
 */
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
    _onAudioSampleReceived = null;
    /** @deprecated Use `Sound.createAsync()` instead */
    static create = async (source, initialStatus = {}, onPlaybackStatusUpdate = null, downloadFirst = true) => {
        console.warn(`Sound.create is deprecated in favor of Sound.createAsync with the same API except for the new method name`);
        return Sound.createAsync(source, initialStatus, onPlaybackStatusUpdate, downloadFirst);
    };
    /**
     * Creates and loads a sound from source.
     *
     * ```ts
     * const { sound } = await Audio.Sound.createAsync(
     *   source,
     *   initialStatus,
     *   onPlaybackStatusUpdate,
     *   downloadFirst
     * );
     *
     * // Which is equivalent to the following:
     * const sound = new Audio.Sound();
     * sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
     * await sound.loadAsync(source, initialStatus, downloadFirst);
     * ```
     *
     * @param source The source of the sound. See the [AV documentation](/versions/latest/sdk/av/#playback-api) for details on the possible `source` values.
     *
     * @param initialStatus The initial intended `PlaybackStatusToSet` of the sound, whose values will override the default initial playback status.
     * This value defaults to `{}` if no parameter is passed. See the [AV documentation](/versions/latest/sdk/av) for details on `PlaybackStatusToSet` and the default
     * initial playback status.
     *
     * @param onPlaybackStatusUpdate A function taking a single parameter `PlaybackStatus`. This value defaults to `null` if no parameter is passed.
     * See the [AV documentation](/versions/latest/sdk/av) for details on the functionality provided by `onPlaybackStatusUpdate`
     *
     * @param downloadFirst If set to true, the system will attempt to download the resource to the device before loading. This value defaults to `true`.
     * Note that at the moment, this will only work for `source`s of the form `require('path/to/file')` or `Asset` objects.
     *
     * @example
     * ```ts
     * try {
     *   const { sound: soundObject, status } = await Audio.Sound.createAsync(
     *     require('./assets/sounds/hello.mp3'),
     *     { shouldPlay: true }
     *   );
     *   // Your sound is playing!
     * } catch (error) {
     *   // An error occurred!
     * }
     * ```
     *
     * @return A `Promise` that is rejected if creation failed, or fulfilled with the `SoundObject` if creation succeeded.
     */
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
    _updateAudioSampleReceivedCallback() {
        if (globalThis.__EXAV_setOnAudioSampleReceivedCallback == null) {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                console.warn('expo-av: Failed to set up Audio Sample Buffer callback. ' +
                    "Do you have 'Remote Debugging' enabled in your app's Developer Menu (https://docs.expo.dev/workflow/debugging)? " +
                    'Audio Sample Buffer callbacks are not supported while using Remote Debugging, you will need to disable it to use them.');
                return;
            }
            else {
                throw new UnavailabilityError('expo-av', 'setOnAudioSampleReceived');
            }
        }
        if (this._key == null) {
            throw new Error('Cannot set Audio Sample Buffer callback when the Sound instance has not been successfully loaded/initialized!');
        }
        if (typeof this._key !== 'number') {
            throw new Error(`Cannot set Audio Sample Buffer callback when Sound instance key is of type ${typeof this
                ._key}! (expected: number)`);
        }
        globalThis.__EXAV_setOnAudioSampleReceivedCallback(this._key, this._onAudioSampleReceived);
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
    /**
     * Sets a function to be called regularly with the `AVPlaybackStatus` of the playback object.
     *
     * `onPlaybackStatusUpdate` will be called whenever a call to the API for this playback object completes
     * (such as `setStatusAsync()`, `getStatusAsync()`, or `unloadAsync()`), nd will also be called at regular intervals
     * while the media is in the loaded state.
     *
     * Set `progressUpdateIntervalMillis` via `setStatusAsync()` or `setProgressUpdateIntervalAsync()` to modify
     * the interval with which `onPlaybackStatusUpdate` is called while loaded.
     *
     * @param onPlaybackStatusUpdate A function taking a single parameter `AVPlaybackStatus`.
     */
    setOnPlaybackStatusUpdate(onPlaybackStatusUpdate) {
        this._onPlaybackStatusUpdate = onPlaybackStatusUpdate;
        this.getStatusAsync();
    }
    /**
     * Sets a function to be called whenever the metadata of the sound object changes, if one is set.
     * @param onMetadataUpdate A function taking a single object of type `AVMetadata` as a parameter.
     * @platform ios
     */
    setOnMetadataUpdate(onMetadataUpdate) {
        this._onMetadataUpdate = onMetadataUpdate;
    }
    /**
     * Sets a function to be called during playback, receiving the audio sample as parameter.
     * @param callback A function taking the `AudioSampleCallback` as parameter.
     */
    setOnAudioSampleReceived(callback) {
        this._onAudioSampleReceived = callback;
        if (this._key != null) {
            this._updateAudioSampleReceivedCallback();
        }
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