// @flow

import { NativeModules, NativeEventEmitter } from 'react-native';

import {
  _COMMON_AV_PLAYBACK_METHODS,
  _getNativeSourceAndFullInitialStatusForLoadAsync,
  _throwErrorIfValuesOutOfBoundsInStatus,
  _getUnloadedStatus,
  type PlaybackSource,
  type PlaybackStatus,
  type PlaybackStatusToSet,
} from '../AV';

import { _throwIfAudioIsDisabled } from '../Audio';

export class Sound {
  _loaded: boolean;
  _loading: boolean;
  _key: number;
  _lastStatusUpdate: ?string;
  _lastStatusUpdateTime: ?Date;
  _subscriptions: Array<Function>;
  _eventEmitter: NativeEventEmitter;
  _coalesceStatusUpdatesInMillis: number;
  _onPlaybackStatusUpdate: ?(status: PlaybackStatus) => void;

  constructor() {
    this._loaded = false;
    this._loading = false;
    this._key = -1;
    this._subscriptions = [];
    this._lastStatusUpdate = null;
    this._lastStatusUpdateTime = null;
    this._onPlaybackStatusUpdate = null;
    this._coalesceStatusUpdatesInMillis = 100;
    this._eventEmitter = new NativeEventEmitter(NativeModules.ExponentAV);
  }

  static create = async (
    source: PlaybackSource,
    initialStatus: PlaybackStatusToSet = {},
    onPlaybackStatusUpdate: ?(status: PlaybackStatus) => void = null,
    downloadFirst: boolean = true
  ): Promise<{ sound: Sound, status: PlaybackStatus }> => {
    const sound: Sound = new Sound();
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    const status: PlaybackStatus = await sound.loadAsync(source, initialStatus, downloadFirst);
    return { sound, status };
  };

  // Internal methods

  _callOnPlaybackStatusUpdateForNewStatus(status: PlaybackStatus) {
    const shouldDismissBasedOnCoalescing =
      this._lastStatusUpdateTime &&
      JSON.stringify(status) === this._lastStatusUpdate &&
      new Date() - this._lastStatusUpdateTime < this._coalesceStatusUpdatesInMillis;

    if (this._onPlaybackStatusUpdate != null && !shouldDismissBasedOnCoalescing) {
      this._onPlaybackStatusUpdate(status);
      this._lastStatusUpdateTime = new Date();
      this._lastStatusUpdate = JSON.stringify(status);
    }
  }

  async _performOperationAndHandleStatusAsync(
    operation: () => Promise<PlaybackStatus>
  ): Promise<PlaybackStatus> {
    _throwIfAudioIsDisabled();
    if (this._loaded) {
      const status = await operation();
      this._callOnPlaybackStatusUpdateForNewStatus(status);
      return status;
    } else {
      throw new Error('Cannot complete operation because sound is not loaded.');
    }
  }

  _internalStatusUpdateCallback = ({ key, status }: { key: number, status: PlaybackStatus }) => {
    if (this._key === key) {
      this._callOnPlaybackStatusUpdateForNewStatus(status);
    }
  };

  // TODO: We can optimize by only using time observer on native if (this._onPlaybackStatusUpdate).
  _subscribeToNativeStatusUpdateEvents() {
    if (this._loaded) {
      this._subscriptions.push(
        this._eventEmitter.addListener(
          'didUpdatePlaybackStatus',
          this._internalStatusUpdateCallback
        )
      );
    }
  }

  _clearSubscriptions() {
    this._subscriptions.forEach(e => e.remove());
    this._subscriptions = [];
  }

  _errorCallback = (error: string) => {
    this._clearSubscriptions();
    this._loaded = false;
    this._key = -1;
    this._callOnPlaybackStatusUpdateForNewStatus(_getUnloadedStatus(error));
  };

  // ### Unified playback API ### (consistent with Video.js)
  // All calls automatically call onPlaybackStatusUpdate as a side effect.

  // Get status API

  getStatusAsync = async (): Promise<PlaybackStatus> => {
    if (this._loaded) {
      return this._performOperationAndHandleStatusAsync(() =>
        NativeModules.ExponentAV.getStatusForSound(this._key)
      );
    }
    const status: PlaybackStatus = _getUnloadedStatus();
    this._callOnPlaybackStatusUpdateForNewStatus(status);
    return status;
  };

  setOnPlaybackStatusUpdate(onPlaybackStatusUpdate: ?(status: PlaybackStatus) => void) {
    this._onPlaybackStatusUpdate = onPlaybackStatusUpdate;
    this.getStatusAsync();
  }

  // Loading / unloading API

  async loadAsync(
    source: PlaybackSource,
    initialStatus: PlaybackStatusToSet = {},
    downloadFirst: boolean = true
  ): Promise<PlaybackStatus> {
    _throwIfAudioIsDisabled();
    if (this._loading) {
      throw new Error('The Sound is already loading.');
    }
    if (!this._loaded) {
      this._loading = true;

      const {
        nativeSource,
        fullInitialStatus,
      } = await _getNativeSourceAndFullInitialStatusForLoadAsync(
        source,
        initialStatus,
        downloadFirst
      );

      // This is a workaround, since using load with resolve / reject seems to not work.
      return new Promise(
        function(resolve, reject) {
          const loadSuccess = (key: number, status: PlaybackStatus) => {
            this._key = key;
            this._loaded = true;
            this._loading = false;
            NativeModules.ExponentAV.setErrorCallbackForSound(this._key, this._errorCallback);
            this._subscribeToNativeStatusUpdateEvents();
            this._callOnPlaybackStatusUpdateForNewStatus(status);
            resolve(status);
          };
          const loadError = (error: string) => {
            this._loading = false;
            reject(new Error(error));
          };
          NativeModules.ExponentAV.loadForSound(
            nativeSource,
            fullInitialStatus,
            loadSuccess,
            loadError
          );
        }.bind(this)
      );
    } else {
      throw new Error('The Sound is already loaded.');
    }
  }

  async unloadAsync(): Promise<PlaybackStatus> {
    if (this._loaded) {
      this._loaded = false;
      const key = this._key;
      this._key = -1;
      const status = await NativeModules.ExponentAV.unloadForSound(key);
      this._callOnPlaybackStatusUpdateForNewStatus(status);
      this._clearSubscriptions();
      return status;
    } else {
      return this.getStatusAsync(); // Automatically calls onPlaybackStatusUpdate.
    }
  }

  // Set status API (only available while isLoaded = true)

  async setStatusAsync(status: PlaybackStatusToSet): Promise<PlaybackStatus> {
    _throwErrorIfValuesOutOfBoundsInStatus(status);
    return this._performOperationAndHandleStatusAsync(() =>
      NativeModules.ExponentAV.setStatusForSound(this._key, status)
    );
  }

  async replayAsync(status: PlaybackStatusToSet = {}): Promise<PlaybackStatus> {
    if (status.positionMillis && status.positionMillis !== 0) {
      throw new Error('Requested position after replay has to be 0.');
    }

    return this._performOperationAndHandleStatusAsync(() =>
      NativeModules.ExponentAV.replaySound(this._key, {
        ...status,
        positionMillis: 0,
        shouldPlay: true,
      })
    );
  }

  // Additional convenience methods on top of setStatusAsync are set via _COMMON_AV_PLAYBACK_METHODS.
  playAsync: () => Promise<PlaybackStatus>;
  playFromPositionAsync: (positionMillis: number) => Promise<PlaybackStatus>;
  pauseAsync: () => Promise<PlaybackStatus>;
  stopAsync: () => Promise<PlaybackStatus>;
  setPositionAsync: (positionMillis: number) => Promise<PlaybackStatus>;
  setRateAsync: (rate: number, shouldCorrectPitch: boolean) => Promise<PlaybackStatus>;
  setVolumeAsync: (volume: number) => Promise<PlaybackStatus>;
  setIsMutedAsync: (isMuted: boolean) => Promise<PlaybackStatus>;
  setIsLoopingAsync: (isLooping: boolean) => Promise<PlaybackStatus>;
  setProgressUpdateIntervalAsync: (progressUpdateIntervalMillis: number) => Promise<PlaybackStatus>;
}

Object.assign(Sound.prototype, _COMMON_AV_PLAYBACK_METHODS);
