import { EventEmitter } from 'expo-modules-core';

import {
  Playback,
  PlaybackMixin,
  AVPlaybackSource,
  AVMetadata,
  AVPlaybackStatus,
  AVPlaybackStatusToSet,
  assertStatusValuesInBounds,
  getNativeSourceAndFullInitialStatusForLoadAsync,
  getUnloadedStatus,
} from '../AV';
import { PitchCorrectionQuality } from '../Audio';
import ExponentAV from '../ExponentAV';
import { throwIfAudioIsDisabled } from './AudioAvailability';

type AudioInstance = number | HTMLMediaElement | null;
export class Sound implements Playback {
  _loaded: boolean = false;
  _loading: boolean = false;
  _key: AudioInstance = null;
  _lastStatusUpdate: string | null = null;
  _lastStatusUpdateTime: Date | null = null;
  _subscriptions: { remove: () => void }[] = [];
  _eventEmitter: EventEmitter = new EventEmitter(ExponentAV);
  _coalesceStatusUpdatesInMillis: number = 100;
  _onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null = null;
  _onMetadataUpdate: ((metadata: AVMetadata) => void) | null = null;

  /** @deprecated Use `Sound.createAsync()` instead */
  static create = async (
    source: AVPlaybackSource,
    initialStatus: AVPlaybackStatusToSet = {},
    onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null = null,
    downloadFirst: boolean = true
  ): Promise<{ sound: Sound; status: AVPlaybackStatus }> => {
    console.warn(
      `Sound.create is deprecated in favor of Sound.createAsync with the same API except for the new method name`
    );
    return Sound.createAsync(source, initialStatus, onPlaybackStatusUpdate, downloadFirst);
  };

  static createAsync = async (
    source: AVPlaybackSource,
    initialStatus: AVPlaybackStatusToSet = {},
    onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null = null,
    downloadFirst: boolean = true
  ): Promise<{ sound: Sound; status: AVPlaybackStatus }> => {
    const sound: Sound = new Sound();
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    const status: AVPlaybackStatus = await sound.loadAsync(source, initialStatus, downloadFirst);
    return { sound, status };
  };

  // Internal methods

  _callOnPlaybackStatusUpdateForNewStatus(status: AVPlaybackStatus) {
    const shouldDismissBasedOnCoalescing =
      this._lastStatusUpdateTime &&
      JSON.stringify(status) === this._lastStatusUpdate &&
      Date.now() - this._lastStatusUpdateTime.getTime() < this._coalesceStatusUpdatesInMillis;

    if (this._onPlaybackStatusUpdate != null && !shouldDismissBasedOnCoalescing) {
      this._onPlaybackStatusUpdate(status);
      this._lastStatusUpdateTime = new Date();
      this._lastStatusUpdate = JSON.stringify(status);
    }
  }

  async _performOperationAndHandleStatusAsync(
    operation: () => Promise<AVPlaybackStatus>
  ): Promise<AVPlaybackStatus> {
    throwIfAudioIsDisabled();
    if (this._loaded) {
      const status = await operation();
      this._callOnPlaybackStatusUpdateForNewStatus(status);
      return status;
    } else {
      throw new Error('Cannot complete operation because sound is not loaded.');
    }
  }

  _internalStatusUpdateCallback = ({
    key,
    status,
  }: {
    key: AudioInstance;
    status: AVPlaybackStatus;
  }) => {
    if (this._key === key) {
      this._callOnPlaybackStatusUpdateForNewStatus(status);
    }
  };

  _internalMetadataUpdateCallback = ({
    key,
    metadata,
  }: {
    key: AudioInstance;
    metadata: AVMetadata;
  }) => {
    if (this._key === key) {
      this._onMetadataUpdate?.(metadata);
    }
  };

  _internalErrorCallback = ({ key, error }: { key: AudioInstance; error: string }) => {
    if (this._key === key) {
      this._errorCallback(error);
    }
  };

  // TODO: We can optimize by only using time observer on native if (this._onPlaybackStatusUpdate).
  _subscribeToNativeEvents() {
    if (this._loaded) {
      this._subscriptions.push(
        this._eventEmitter.addListener(
          'didUpdatePlaybackStatus',
          this._internalStatusUpdateCallback
        ),
        this._eventEmitter.addListener('didUpdateMetadata', this._internalMetadataUpdateCallback)
      );

      this._subscriptions.push(
        this._eventEmitter.addListener('ExponentAV.onError', this._internalErrorCallback)
      );
    }
  }

  _clearSubscriptions() {
    this._subscriptions.forEach((e) => e.remove());
    this._subscriptions = [];
  }

  _errorCallback = (error: string) => {
    this._clearSubscriptions();
    this._loaded = false;
    this._key = null;
    this._callOnPlaybackStatusUpdateForNewStatus(getUnloadedStatus(error));
  };

  // ### Unified playback API ### (consistent with Video.js)
  // All calls automatically call onPlaybackStatusUpdate as a side effect.

  // Get status API

  getStatusAsync = async (): Promise<AVPlaybackStatus> => {
    if (this._loaded) {
      return this._performOperationAndHandleStatusAsync(() =>
        ExponentAV.getStatusForSound(this._key)
      );
    }
    const status: AVPlaybackStatus = getUnloadedStatus();
    this._callOnPlaybackStatusUpdateForNewStatus(status);
    return status;
  };

  setOnPlaybackStatusUpdate(onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null) {
    this._onPlaybackStatusUpdate = onPlaybackStatusUpdate;
    this.getStatusAsync();
  }

  setOnMetadataUpdate(onMetadataUpdate: (AVMetadata) => void) {
    this._onMetadataUpdate = onMetadataUpdate;
  }

  // Loading / unloading API

  async loadAsync(
    source: AVPlaybackSource,
    initialStatus: AVPlaybackStatusToSet = {},
    downloadFirst: boolean = true
  ): Promise<AVPlaybackStatus> {
    throwIfAudioIsDisabled();
    if (this._loading) {
      throw new Error('The Sound is already loading.');
    }
    if (!this._loaded) {
      this._loading = true;

      const { nativeSource, fullInitialStatus } =
        await getNativeSourceAndFullInitialStatusForLoadAsync(source, initialStatus, downloadFirst);

      // This is a workaround, since using load with resolve / reject seems to not work.
      return new Promise<AVPlaybackStatus>((resolve, reject) => {
        const loadSuccess = (result: [AudioInstance, AVPlaybackStatus]) => {
          const [key, status] = result;
          this._key = key;
          this._loaded = true;
          this._loading = false;
          this._subscribeToNativeEvents();
          this._callOnPlaybackStatusUpdateForNewStatus(status);
          resolve(status);
        };

        const loadError = (error: Error) => {
          this._loading = false;
          reject(error);
        };

        ExponentAV.loadForSound(nativeSource, fullInitialStatus).then(loadSuccess).catch(loadError);
      });
    } else {
      throw new Error('The Sound is already loaded.');
    }
  }

  async unloadAsync(): Promise<AVPlaybackStatus> {
    if (this._loaded) {
      this._loaded = false;
      const key = this._key;
      this._key = null;
      const status = await ExponentAV.unloadForSound(key);
      this._callOnPlaybackStatusUpdateForNewStatus(status);
      this._clearSubscriptions();
      return status;
    } else {
      return this.getStatusAsync(); // Automatically calls onPlaybackStatusUpdate.
    }
  }

  // Set status API (only available while isLoaded = true)

  async setStatusAsync(status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus> {
    assertStatusValuesInBounds(status);
    return this._performOperationAndHandleStatusAsync(() =>
      ExponentAV.setStatusForSound(this._key, status)
    );
  }

  async replayAsync(status: AVPlaybackStatusToSet = {}): Promise<AVPlaybackStatus> {
    if (status.positionMillis && status.positionMillis !== 0) {
      throw new Error('Requested position after replay has to be 0.');
    }

    return this._performOperationAndHandleStatusAsync(() =>
      ExponentAV.replaySound(this._key, {
        ...status,
        positionMillis: 0,
        shouldPlay: true,
      })
    );
  }

  // Methods of the Playback interface that are set via PlaybackMixin
  playAsync!: () => Promise<AVPlaybackStatus>;
  playFromPositionAsync!: (
    positionMillis: number,
    tolerances?: { toleranceMillisBefore?: number; toleranceMillisAfter?: number }
  ) => Promise<AVPlaybackStatus>;
  pauseAsync!: () => Promise<AVPlaybackStatus>;
  stopAsync!: () => Promise<AVPlaybackStatus>;
  setPositionAsync!: (
    positionMillis: number,
    tolerances?: { toleranceMillisBefore?: number; toleranceMillisAfter?: number }
  ) => Promise<AVPlaybackStatus>;
  setRateAsync!: (
    rate: number,
    shouldCorrectPitch: boolean,
    pitchCorrectionQuality?: PitchCorrectionQuality
  ) => Promise<AVPlaybackStatus>;
  setVolumeAsync!: (volume: number) => Promise<AVPlaybackStatus>;
  setIsMutedAsync!: (isMuted: boolean) => Promise<AVPlaybackStatus>;
  setIsLoopingAsync!: (isLooping: boolean) => Promise<AVPlaybackStatus>;
  setProgressUpdateIntervalAsync!: (
    progressUpdateIntervalMillis: number
  ) => Promise<AVPlaybackStatus>;
}

Object.assign(Sound.prototype, PlaybackMixin);
