import { Asset } from 'expo-asset';
import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

import {
  AudioMode,
  AudioPlayerOptions,
  AudioSource,
  AudioStatus,
  PitchCorrectionQuality,
  RecorderState,
  RecordingInput,
  RecordingOptions,
  RecordingOptionsWeb,
  RecordingStartOptions,
} from './Audio.types';
import { PLAYBACK_STATUS_UPDATE, RECORDING_STATUS_UPDATE } from './AudioEventKeys';
import { AudioPlayer, AudioEvents, RecordingEvents, AudioRecorder } from './AudioModule.types';
import { RecordingPresets } from './RecordingConstants';

const nextId = (() => {
  let id = 0;
  return () => id++;
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

function getStatusFromMedia(media: HTMLMediaElement, id: number): AudioStatus {
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
    shouldCorrectPitch: false,
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

  id: number = nextId();
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
    this.media.removeAttribute('src');
    this.media.load();
    getStatusFromMedia(this.media, this.id);
  }

  _createMediaElement() {
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
