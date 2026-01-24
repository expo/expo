import { Asset } from 'expo-asset';
import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

import {
  AudioMode,
  AudioPlayerOptions,
  AudioPlaylistLoopMode,
  AudioPlaylistStatus,
  AudioSource,
  AudioSourceInfo,
  AudioStatus,
  PitchCorrectionQuality,
  RecorderState,
  RecordingInput,
  RecordingOptions,
  RecordingOptionsWeb,
  RecordingStartOptions,
} from './Audio.types';
import {
  PLAYBACK_STATUS_UPDATE,
  PLAYLIST_STATUS_UPDATE,
  RECORDING_STATUS_UPDATE,
  TRACK_CHANGED,
} from './AudioEventKeys';
import {
  AudioPlayer,
  AudioEvents,
  AudioPlaylist,
  AudioPlaylistEvents,
  RecordingEvents,
  AudioRecorder,
} from './AudioModule.types';
import { RecordingPresets } from './RecordingConstants';
import { resolveSource } from './utils/resolveSource';

const nextId = (() => {
  let id = 0;
  return () => String(id++);
})();

async function getPermissionWithQueryAsync(
  name: PermissionNameWithAdditionalValues
): Promise<PermissionStatus | null> {
  if (!navigator || !navigator.permissions || !navigator.permissions.query) return null;

  try {
    const { state } = await navigator.permissions.query({ name });
    switch (state) {
      case 'granted':
        return PermissionStatus.GRANTED;
      case 'denied':
        return PermissionStatus.DENIED;
      default:
        return PermissionStatus.UNDETERMINED;
    }
  } catch {
    // Firefox - TypeError: 'microphone' (value of 'name' member of PermissionDescriptor) is not a valid value for enumeration PermissionName.
    return PermissionStatus.UNDETERMINED;
  }
}

function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  // Here, we will just add the getUserMedia property if it's missing.

  // First get ahold of the legacy getUserMedia, if present
  const getUserMedia =
    // TODO: this method is deprecated, migrate to https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    function () {
      const error: any = new Error('Permission unimplemented');
      error.code = 0;
      error.name = 'NotAllowedError';
      throw error;
    };

  return new Promise((resolve, reject) => {
    // TODO(@kitten): The types indicates that this is incorrect.
    // Please check whether this is correct!
    // @ts-expect-error: The `successCallback` doesn't match a `resolve` function
    getUserMedia.call(navigator, constraints, resolve, reject);
  });
}

function getStatusFromMedia(media: HTMLMediaElement, id: string): AudioStatus {
  const isPlaying = !!(
    media.currentTime > 0 &&
    !media.paused &&
    !media.ended &&
    media.readyState > 2
  );

  const status: AudioStatus = {
    id,
    isLoaded: true,
    duration: media.duration,
    currentTime: media.currentTime,
    playbackState: '',
    timeControlStatus: isPlaying ? 'playing' : 'paused',
    reasonForWaitingToPlay: '',
    playing: isPlaying,
    didJustFinish: media.ended,
    isBuffering: false,
    playbackRate: media.playbackRate,
    shouldCorrectPitch: true,
    mute: media.muted,
    loop: media.loop,
  };

  return status;
}

export class AudioPlayerWeb
  extends globalThis.expo.SharedObject<AudioEvents>
  implements AudioPlayer
{
  constructor(source: AudioSource, options: AudioPlayerOptions = {}) {
    super();
    const { updateInterval = 500, crossOrigin } = options;
    this.src = source;
    this.interval = Math.max(updateInterval, 1);
    this.crossOrigin = crossOrigin;
    this.media = this._createMediaElement();
  }

  id: string = nextId();
  isAudioSamplingSupported = false;
  isBuffering = false;
  shouldCorrectPitch = false;

  private src: AudioSource = null;
  private media: HTMLAudioElement;
  private interval = 500;
  private isPlaying = false;
  private loaded = false;
  private crossOrigin?: 'anonymous' | 'use-credentials';

  get playing(): boolean {
    return this.isPlaying;
  }

  get muted(): boolean {
    return this.media.muted;
  }

  set muted(value: boolean) {
    this.media.muted = value;
  }

  get loop(): boolean {
    return this.media.loop;
  }

  set loop(value: boolean) {
    this.media.loop = value;
  }

  get duration(): number {
    return this.media.duration;
  }

  get currentTime(): number {
    return this.media.currentTime;
  }

  get paused(): boolean {
    return this.media.paused;
  }

  get isLoaded(): boolean {
    return this.loaded;
  }

  get playbackRate(): number {
    return this.media.playbackRate;
  }

  set playbackRate(value: number) {
    this.media.playbackRate = value;
  }

  get volume(): number {
    return this.media.volume;
  }

  set volume(value: number) {
    this.media.volume = value;
  }

  get currentStatus(): AudioStatus {
    return getStatusFromMedia(this.media, this.id);
  }

  play(): void {
    this.media.play();
    this.isPlaying = true;
  }

  pause(): void {
    this.media.pause();
    this.isPlaying = false;
  }

  replace(source: AudioSource): void {
    const wasPlaying = this.isPlaying;

    // we need to remove the current media element and create a new one
    this.remove();

    this.src = source;
    this.isPlaying = false;
    this.loaded = false;
    this.media = this._createMediaElement();

    // Resume playback if it was playing before
    if (wasPlaying) {
      this.play();
    }
  }

  async seekTo(
    seconds: number,
    toleranceMillisBefore?: number,
    toleranceMillisAfter?: number
  ): Promise<void> {
    this.media.currentTime = seconds;
  }

  // Not supported on web
  setAudioSamplingEnabled(enabled: boolean): void {
    this.isAudioSamplingSupported = false;
  }

  setPlaybackRate(second: number, pitchCorrectionQuality?: PitchCorrectionQuality): void {
    this.media.playbackRate = second;
    this.shouldCorrectPitch = pitchCorrectionQuality === 'high';
    this.media.preservesPitch = this.shouldCorrectPitch;
  }

  remove(): void {
    this.media.pause();
    // Clear event handlers to prevent memory leaks
    this.media.ontimeupdate = null;
    this.media.onplay = null;
    this.media.onpause = null;
    this.media.onseeked = null;
    this.media.onended = null;
    this.media.onloadeddata = null;
    this.media.onerror = null;
    this.media.removeAttribute('src');
    this.media.load();
  }

  setActiveForLockScreen(active: boolean, metadata: Record<string, any>): void {}
  updateLockScreenMetadata(metadata: Record<string, any>): void {}
  clearLockScreenControls(): void {}

  _createMediaElement(): HTMLAudioElement {
    const newSource = getSourceUri(this.src);
    const media = new Audio(newSource);
    if (this.crossOrigin !== undefined) {
      media.crossOrigin = this.crossOrigin;
    }

    let lastEmitTime = 0;
    const intervalSec = this.interval / 1000;

    // Throttled status updates based on interval
    media.ontimeupdate = () => {
      const now = media.currentTime;
      // Handle backwards time (loop/seek)
      if (now < lastEmitTime) {
        lastEmitTime = now;
      }
      if (now - lastEmitTime >= intervalSec) {
        lastEmitTime = now;
        this.emit(PLAYBACK_STATUS_UPDATE, getStatusFromMedia(media, this.id));
      }
    };

    media.onplay = () => {
      this.isPlaying = true;
      lastEmitTime = media.currentTime;
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        playing: this.isPlaying,
      });
    };

    media.onpause = () => {
      this.isPlaying = false;
      lastEmitTime = media.currentTime;
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        playing: this.isPlaying,
      });
    };

    media.onseeked = () => {
      lastEmitTime = media.currentTime;
      this.emit(PLAYBACK_STATUS_UPDATE, getStatusFromMedia(media, this.id));
    };

    media.onended = () => {
      lastEmitTime = 0;
    };

    media.onloadeddata = () => {
      this.loaded = true;
      lastEmitTime = media.currentTime;
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        isLoaded: this.loaded,
      });
    };

    media.onerror = () => {
      this.loaded = false;
      this.isPlaying = false;
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        isLoaded: false,
        playing: false,
      });
    };

    return media;
  }
}

function getSourceUri(source: AudioSource): string | undefined {
  if (typeof source === 'string') {
    return source;
  }
  if (typeof source === 'number') {
    const asset = Asset.fromModule(source);
    return asset.uri;
  }
  if (typeof source?.assetId === 'number' && !source?.uri) {
    const asset = Asset.fromModule(source.assetId);
    return asset.uri;
  }

  return source?.uri ?? undefined;
}

function getSourceInfo(source: AudioSource): AudioSourceInfo {
  const resolved = resolveSource(source);
  if (resolved && typeof resolved === 'object') {
    return {
      uri: resolved.uri,
      name: resolved.name,
    };
  }
  return { uri: getSourceUri(source) };
}

export class AudioRecorderWeb
  extends globalThis.expo.SharedObject<RecordingEvents>
  implements AudioRecorder
{
  constructor(options: Partial<RecordingOptions>) {
    super();
    this.options = options;
  }

  async setup() {
    this.mediaRecorder = await this.createMediaRecorder(this.options);
  }

  id = nextId();
  currentTime = 0;
  uri: string | null = null;

  private options: Partial<RecordingOptions>;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaRecorderUptimeOfLastStartResume = 0;
  private mediaRecorderIsRecording = false;
  private timeoutIds: number[] = [];

  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  record(options?: RecordingStartOptions): void {
    if (this.mediaRecorder === null) {
      throw new Error(
        'Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.'
      );
    }

    // Clear any existing timeouts
    this.clearTimeouts();

    // Note: atTime is not supported on Web (no native equivalent), so we ignore it entirely
    // Only forDuration is implemented using setTimeout
    const { forDuration } = options || {};

    this.startActualRecording();

    if (forDuration !== undefined) {
      this.timeoutIds.push(
        setTimeout(() => {
          this.stop();
        }, forDuration * 1000)
      );
    }
  }

  private startActualRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    } else {
      this.mediaRecorder?.start();
    }
  }

  getAvailableInputs(): RecordingInput[] {
    return [];
  }

  getCurrentInput(): Promise<RecordingInput> {
    return Promise.resolve({
      type: 'Default',
      name: 'Default',
      uid: 'Default',
    });
  }

  async prepareToRecordAsync(): Promise<void> {
    return this.setup();
  }

  getStatus(): RecorderState {
    return {
      canRecord:
        this.mediaRecorder?.state === 'recording' || this.mediaRecorder?.state === 'inactive',
      isRecording: this.mediaRecorder?.state === 'recording',
      durationMillis: this.getAudioRecorderDurationMillis(),
      mediaServicesDidReset: false,
      url: this.uri,
    };
  }

  pause(): void {
    if (this.mediaRecorder === null) {
      throw new Error(
        'Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.'
      );
    }

    this.mediaRecorder?.pause();
  }

  recordForDuration(seconds: number): void {
    this.record({ forDuration: seconds });
  }

  setInput(input: string): void {}

  startRecordingAtTime(seconds: number): void {
    this.record({ atTime: seconds });
  }

  async stop(): Promise<void> {
    if (this.mediaRecorder === null) {
      throw new Error(
        'Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.'
      );
    }

    const dataPromise = new Promise<Blob>((resolve) =>
      this.mediaRecorder?.addEventListener('dataavailable', (e) => resolve(e.data))
    );

    this.mediaRecorder?.stop();
    this.mediaRecorder = null;

    const data = await dataPromise;
    const url = URL.createObjectURL(data);

    this.uri = url;

    this.emit(RECORDING_STATUS_UPDATE, {
      id: this.id,
      isFinished: true,
      hasError: false,
      error: null,
      url,
    });
  }

  clearTimeouts() {
    this.timeoutIds.forEach((id) => clearTimeout(id));
  }

  private async createMediaRecorder(
    options: Partial<RecordingOptions> & Partial<RecordingOptionsWeb>
  ): Promise<MediaRecorder> {
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
      throw new Error('No media devices available');
    }

    this.mediaRecorderUptimeOfLastStartResume = 0;
    this.currentTime = 0;

    const stream = await getUserMedia({ audio: true });

    const defaults = RecordingPresets.HIGH_QUALITY.web;
    const mediaRecorderOptions: MediaRecorderOptions = {};

    const mimeType = options.mimeType ?? defaults.mimeType;
    if (mimeType && MediaRecorder.isTypeSupported(mimeType)) {
      mediaRecorderOptions.mimeType = mimeType;
    }

    if (options.bitsPerSecond) {
      mediaRecorderOptions.bitsPerSecond = options.bitsPerSecond;
    } else if (options.bitRate) {
      mediaRecorderOptions.audioBitsPerSecond = options.bitRate;
    } else {
      mediaRecorderOptions.bitsPerSecond = defaults.bitsPerSecond;
    }

    const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);

    mediaRecorder.addEventListener('pause', () => {
      this.currentTime = this.getAudioRecorderDurationMillis();
      this.mediaRecorderIsRecording = false;
    });

    mediaRecorder.addEventListener('resume', () => {
      this.mediaRecorderUptimeOfLastStartResume = Date.now();
      this.mediaRecorderIsRecording = true;
    });

    mediaRecorder.addEventListener('start', () => {
      this.mediaRecorderUptimeOfLastStartResume = Date.now();
      this.currentTime = 0;
      this.mediaRecorderIsRecording = true;
    });

    mediaRecorder?.addEventListener('stop', () => {
      this.currentTime = 0;
      this.mediaRecorderIsRecording = false;

      // Clears recording icon in Chrome tab
      stream.getTracks().forEach((track) => track.stop());
    });

    return mediaRecorder;
  }

  private getAudioRecorderDurationMillis() {
    let duration = this.currentTime;
    if (this.mediaRecorderIsRecording && this.mediaRecorderUptimeOfLastStartResume > 0) {
      duration += Date.now() - this.mediaRecorderUptimeOfLastStartResume;
    }
    return duration;
  }
}

export class AudioPlaylistWeb
  extends globalThis.expo.SharedObject<AudioPlaylistEvents>
  implements AudioPlaylist
{
  constructor(
    initialSources: AudioSource[] = [],
    updateInterval: number = 500,
    loopMode: AudioPlaylistLoopMode = 'none',
    crossOrigin?: 'anonymous' | 'use-credentials'
  ) {
    super();
    this._updateInterval = Math.max(updateInterval, 1);
    this._loopMode = loopMode;
    this._crossOrigin = crossOrigin;

    for (const source of initialSources) {
      this._sources.push(source);
      this._sourceInfos.push(getSourceInfo(source));
    }

    if (this._sources.length > 0) {
      this._currentMedia = this._createMediaElement(this._sources[0]);
      this._preloadNext();
    }
  }

  id: string = nextId();

  private _sources: AudioSource[] = [];
  private _sourceInfos: AudioSourceInfo[] = [];
  private _currentIndex = 0;
  private _currentMedia: HTMLAudioElement | null = null;
  private _nextMedia: HTMLAudioElement | null = null;
  private _updateInterval = 500;
  private _loopMode: AudioPlaylistLoopMode = 'none';
  private _isPlaying = false;
  private _isLoaded = false;
  private _isBuffering = false;
  private _volume = 1;
  private _muted = false;
  private _playbackRate = 1;
  private _crossOrigin?: 'anonymous' | 'use-credentials';
  private _knownDuration = 0;

  get currentIndex(): number {
    return this._currentIndex;
  }

  get trackCount(): number {
    return this._sources.length;
  }

  get sources(): AudioSourceInfo[] {
    return [...this._sourceInfos];
  }

  get playing(): boolean {
    return this._isPlaying;
  }

  get muted(): boolean {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
    if (this._currentMedia) {
      this._currentMedia.muted = value;
    }
  }

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  get isBuffering(): boolean {
    return this._isBuffering;
  }

  get currentTime(): number {
    return this._currentMedia?.currentTime ?? 0;
  }

  get duration(): number {
    return this._knownDuration;
  }

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = value;
    if (this._currentMedia) {
      this._currentMedia.volume = value;
    }
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  set playbackRate(value: number) {
    this._playbackRate = value;
    if (this._currentMedia) {
      this._currentMedia.playbackRate = value;
    }
  }

  get loop(): AudioPlaylistLoopMode {
    return this._loopMode;
  }

  set loop(value: AudioPlaylistLoopMode) {
    this._loopMode = value;
  }

  get currentStatus(): AudioPlaylistStatus {
    return this._getStatus();
  }

  play(): void {
    if (!this._currentMedia || this._sources.length === 0) {
      return;
    }
    this._currentMedia.play();
    this._isPlaying = true;
  }

  pause(): void {
    if (this._currentMedia) {
      this._currentMedia.pause();
      this._isPlaying = false;
    }
  }

  next(): void {
    if (this._sources.length === 0) return;

    const previousIndex = this._currentIndex;
    let nextIndex = this._currentIndex + 1;

    if (nextIndex >= this._sources.length) {
      if (this._loopMode === 'all') {
        nextIndex = 0;
      } else {
        return;
      }
    }

    this._transitionToTrack(nextIndex, previousIndex);
  }

  previous(): void {
    if (this._sources.length === 0) return;

    const previousIndex = this._currentIndex;
    let prevIndex = this._currentIndex - 1;

    if (prevIndex < 0) {
      if (this._loopMode === 'all') {
        prevIndex = this._sources.length - 1;
      } else {
        return;
      }
    }

    this._transitionToTrack(prevIndex, previousIndex);
  }

  skipTo(index: number): void {
    if (index < 0 || index >= this._sources.length) {
      return;
    }
    if (index === this._currentIndex) {
      return;
    }

    const previousIndex = this._currentIndex;
    this._transitionToTrack(index, previousIndex);
  }

  async seekTo(seconds: number): Promise<void> {
    if (this._currentMedia) {
      this._currentMedia.currentTime = seconds;
    }
  }

  add(source: AudioSource): void {
    this._sources.push(source);
    this._sourceInfos.push(getSourceInfo(source));

    if (this._sources.length === 1) {
      this._currentMedia = this._createMediaElement(source);
    } else {
      this._preloadNext();
    }

    this._emitStatus();
  }

  insert(source: AudioSource, index: number): void {
    if (index < 0) index = 0;
    if (index > this._sources.length) index = this._sources.length;

    this._sources.splice(index, 0, source);
    this._sourceInfos.splice(index, 0, getSourceInfo(source));

    if (index <= this._currentIndex && this._sources.length > 1) {
      this._currentIndex++;
    }

    if (this._sources.length === 1) {
      this._currentMedia = this._createMediaElement(source);
    } else {
      this._preloadNext();
    }

    this._emitStatus();
  }

  remove(index: number): void {
    if (index < 0 || index >= this._sources.length) {
      return;
    }

    const wasCurrentTrack = index === this._currentIndex;
    const wasPlaying = this._isPlaying;

    this._sources.splice(index, 1);
    this._sourceInfos.splice(index, 1);

    if (this._sources.length === 0) {
      this._cleanupMedia(this._currentMedia);
      this._currentMedia = null;
      this._cleanupMedia(this._nextMedia);
      this._nextMedia = null;
      this._currentIndex = 0;
      this._isPlaying = false;
      this._isLoaded = false;
      this._knownDuration = 0;
    } else if (wasCurrentTrack) {
      this._cleanupMedia(this._currentMedia);
      if (this._currentIndex >= this._sources.length) {
        this._currentIndex = this._sources.length - 1;
      }
      this._knownDuration = 0;
      this._currentMedia = this._createMediaElement(this._sources[this._currentIndex]);
      if (wasPlaying) {
        this._currentMedia.play();
      }
      this._preloadNext();
    } else if (index < this._currentIndex) {
      this._currentIndex--;
      this._preloadNext();
    } else {
      this._preloadNext();
    }

    this._emitStatus();
  }

  clear(): void {
    this._cleanupMedia(this._currentMedia);
    this._currentMedia = null;
    this._cleanupMedia(this._nextMedia);
    this._nextMedia = null;
    this._sources = [];
    this._sourceInfos = [];
    this._currentIndex = 0;
    this._isPlaying = false;
    this._isLoaded = false;
    this._knownDuration = 0;
    this._emitStatus();
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
  }

  setLoopMode(mode: AudioPlaylistLoopMode): void {
    this._loopMode = mode;
    this._emitStatus();
  }

  destroy(): void {
    this.clear();
  }

  private _transitionToTrack(newIndex: number, previousIndex: number): void {
    const wasPlaying = this._isPlaying;

    if (this._currentMedia) {
      this._currentMedia.pause();
      this._cleanupMedia(this._currentMedia);
    }

    this._currentIndex = newIndex;
    this._isLoaded = false;
    this._isBuffering = true;
    this._knownDuration = 0;

    const isNextSequential = newIndex === (previousIndex + 1) % this._sources.length;
    if (this._nextMedia && isNextSequential) {
      this._currentMedia = this._nextMedia;
      this._attachMediaHandlers(this._currentMedia);
      this._nextMedia = null;
    } else {
      this._cleanupMedia(this._nextMedia);
      this._nextMedia = null;
      this._currentMedia = this._createMediaElement(this._sources[newIndex]);
    }

    if (wasPlaying) {
      this._currentMedia.play();
      this._isPlaying = true;
    }

    this._preloadNext();

    this.emit(TRACK_CHANGED, { previousIndex, currentIndex: newIndex });
    this._emitStatus();
  }

  private _preloadNext(): void {
    if (this._nextMedia) {
      this._cleanupMedia(this._nextMedia);
      this._nextMedia = null;
    }

    // No need to preload if single track or 'single' loop mode
    if (this._sources.length <= 1 || this._loopMode === 'single') {
      return;
    }

    let nextIndex = this._currentIndex + 1;
    if (nextIndex >= this._sources.length) {
      if (this._loopMode === 'all') {
        nextIndex = 0;
      } else {
        return;
      }
    }

    const uri = getSourceUri(this._sources[nextIndex]);
    if (uri) {
      this._nextMedia = new Audio(uri);
      if (this._crossOrigin !== undefined) {
        this._nextMedia.crossOrigin = this._crossOrigin;
      }
      this._nextMedia.preload = 'auto';
      this._nextMedia.volume = this._volume;
      this._nextMedia.muted = this._muted;
      this._nextMedia.playbackRate = this._playbackRate;
    }
  }

  private _cleanupMedia(media: HTMLAudioElement | null): void {
    if (!media) return;
    media.pause();

    media.ontimeupdate = null;
    media.onplay = null;
    media.onpause = null;
    media.onseeked = null;
    media.onended = null;
    media.onloadedmetadata = null;
    media.onloadeddata = null;
    media.onwaiting = null;
    media.oncanplaythrough = null;
    media.onerror = null;
    media.removeAttribute('src');
    media.load();
  }

  private _attachMediaHandlers(media: HTMLAudioElement): void {
    let lastEmitTime = 0;
    const intervalSec = this._updateInterval / 1000;

    if (media.readyState >= 1) {
      const duration = media.duration;
      if (!isNaN(duration) && isFinite(duration)) {
        this._knownDuration = duration;
      }
    }

    media.ontimeupdate = () => {
      const now = media.currentTime;
      if (now < lastEmitTime) {
        lastEmitTime = now;
      }
      if (now - lastEmitTime >= intervalSec) {
        lastEmitTime = now;
        this._emitStatus();
      }
    };

    media.onplay = () => {
      this._isPlaying = true;
      lastEmitTime = media.currentTime;
      this._emitStatus();
    };

    media.onpause = () => {
      if (!media.ended) {
        this._isPlaying = false;
      }
      lastEmitTime = media.currentTime;
      this._emitStatus();
    };

    media.onseeked = () => {
      lastEmitTime = media.currentTime;
      this._emitStatus();
    };

    media.onended = () => {
      lastEmitTime = 0;
      this._handleTrackEnded();
    };

    media.onloadedmetadata = () => {
      const duration = media.duration;
      if (!isNaN(duration) && isFinite(duration)) {
        this._knownDuration = duration;
        this._emitStatus();
      }
    };

    media.onloadeddata = () => {
      this._isLoaded = true;
      this._isBuffering = false;
      lastEmitTime = media.currentTime;
      this._emitStatus();
    };

    media.onwaiting = () => {
      this._isBuffering = true;
      this._emitStatus();
    };

    media.oncanplaythrough = () => {
      this._isBuffering = false;
      this._emitStatus();
    };

    media.onerror = () => {
      this._isLoaded = false;
      this._isBuffering = false;
      this._isPlaying = false;
      this._emitStatus();
    };
  }

  private _createMediaElement(source: AudioSource): HTMLAudioElement {
    const uri = getSourceUri(source);
    const media = new Audio(uri);
    if (this._crossOrigin !== undefined) {
      media.crossOrigin = this._crossOrigin;
    }
    media.volume = this._volume;
    media.muted = this._muted;
    media.playbackRate = this._playbackRate;
    this._attachMediaHandlers(media);
    return media;
  }

  private _handleTrackEnded(): void {
    if (this._loopMode === 'single') {
      if (this._currentMedia) {
        this._currentMedia.currentTime = 0;
        this._currentMedia.play();
      }
      return;
    }

    const isLastTrack = this._currentIndex >= this._sources.length - 1;

    if (isLastTrack) {
      if (this._loopMode === 'all') {
        this._transitionToTrack(0, this._currentIndex);
      } else {
        this._isPlaying = false;
        this.emit(PLAYLIST_STATUS_UPDATE, {
          ...this._getStatus(),
          didJustFinish: true,
        });
      }
    } else {
      this._transitionToTrack(this._currentIndex + 1, this._currentIndex);
    }
  }

  private _getStatus(): AudioPlaylistStatus {
    return {
      id: this.id,
      currentIndex: this._currentIndex,
      trackCount: this._sources.length,
      currentTime: this._currentMedia?.currentTime ?? 0,
      duration: this._knownDuration,
      playing: this._isPlaying,
      isBuffering: this._isBuffering,
      isLoaded: this._isLoaded,
      playbackRate: this._playbackRate,
      muted: this._muted,
      volume: this._volume,
      loop: this._loopMode,
      didJustFinish: false,
    };
  }

  private _emitStatus(): void {
    this.emit(PLAYLIST_STATUS_UPDATE, this._getStatus());
  }
}

export async function setAudioModeAsync(mode: AudioMode) {}
export async function setIsAudioActiveAsync(active: boolean) {}

export async function getRecordingPermissionsAsync(): Promise<PermissionResponse> {
  const maybeStatus = await getPermissionWithQueryAsync('microphone');
  switch (maybeStatus) {
    case PermissionStatus.GRANTED:
      return {
        status: PermissionStatus.GRANTED,
        expires: 'never',
        canAskAgain: true,
        granted: true,
      };
    case PermissionStatus.DENIED:
      return {
        status: PermissionStatus.DENIED,
        expires: 'never',
        canAskAgain: true,
        granted: false,
      };
    default:
      return await requestRecordingPermissionsAsync();
  }
}

export async function requestRecordingPermissionsAsync(): Promise<PermissionResponse> {
  try {
    const stream = await getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return {
      status: PermissionStatus.GRANTED,
      expires: 'never',
      canAskAgain: true,
      granted: true,
    };
  } catch {
    return {
      status: PermissionStatus.DENIED,
      expires: 'never',
      canAskAgain: true,
      granted: false,
    };
  }
}

export default {
  AudioPlayer: AudioPlayerWeb,
  AudioRecorder: AudioRecorderWeb,
  AudioPlaylist: AudioPlaylistWeb,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
};
