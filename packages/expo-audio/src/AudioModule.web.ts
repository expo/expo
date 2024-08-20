import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

import {
  AudioMode,
  AudioSource,
  AudioStatus,
  PitchCorrectionQuality,
  RecorderState,
  RecordingInput,
  RecordingOptions,
} from './Audio.types';
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
    duration: media.duration * 1000,
    currentTime: media.currentTime * 1000,
    playbackState: '',
    timeControlStatus: isPlaying ? 'playing' : 'paused',
    reasonForWaitingToPlay: '',
    playing: isPlaying,
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
  constructor(source: AudioSource, interval: number) {
    super();
    this._src = source;
    this._interval = interval;
    this._media = this._createMediaElement(source);
  }

  id: number = nextId();
  _src: AudioSource = null;
  _media: HTMLAudioElement;
  _interval = 100;
  _playing = false;
  _paused = false;
  _isLoaded = false;
  isAudioSamplingSupported = false;
  isBuffering = false;
  shouldCorrectPitch = false;

  get playing(): boolean {
    return this._playing;
  }

  get muted(): boolean {
    return this._media.muted;
  }

  set muted(value: boolean) {
    this._media.muted = value;
  }

  get loop(): boolean {
    return this._media.loop;
  }

  set loop(value: boolean) {
    this._media.loop = value;
  }

  get duration(): number {
    return this._media.duration * 1000;
  }

  get currentTime(): number {
    return this._media.currentTime * 1000;
  }

  get paused(): boolean {
    return this._media.paused;
  }

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  get playbackRate(): number {
    return this._media.playbackRate;
  }

  set playbackRate(value: number) {
    this._media.playbackRate = value;
  }

  get volume(): number {
    return this._media.volume;
  }

  set volume(value: number) {
    this._media.volume = value;
  }

  get currentStatus(): AudioStatus {
    return getStatusFromMedia(this._media, this.id);
  }

  play(): void {
    this._media.play();
    this._playing = true;
  }

  pause(): void {
    this._media.pause();
    this._playing = false;
  }

  async seekTo(seconds: number): Promise<void> {
    this._media.currentTime = seconds / 1000;
  }

  setAudioSamplingEnabled(enabled: boolean): void {
    this.isAudioSamplingSupported = false;
  }

  setPlaybackRate(second: number, pitchCorrectionQuality?: PitchCorrectionQuality): void {
    this._media.playbackRate = second;
    this.shouldCorrectPitch = pitchCorrectionQuality === 'high';
    this._media.preservesPitch = this.shouldCorrectPitch;
  }

  remove(): void {
    this._media.pause();
    this._media.removeAttribute('src');
    this._media.load();
    getStatusFromMedia(this._media, this.id);
  }

  _createMediaElement(source: AudioSource): HTMLAudioElement {
    const newSource = typeof source === 'string' ? source : source?.uri ?? '';
    const media = new Audio(newSource);

    media.ontimeupdate = () => {
      this.emit('onPlaybackStatusUpdate', getStatusFromMedia(media, this.id));
    };

    media.onloadeddata = () => {
      this._isLoaded = true;
      this.emit('onPlaybackStatusUpdate', {
        ...getStatusFromMedia(media, this.id),
        isLoaded: this._isLoaded,
      });
    };

    return media;
  }
}

export class AudioRecorderWeb
  extends globalThis.expo.SharedObject<RecordingEvents>
  implements AudioRecorder
{
  constructor(options: Partial<RecordingOptions>) {
    super();
    this._options = options;
  }

  async setup() {
    this._mediaRecorder = await this._createMediaRecorder(this._options);
  }

  id = nextId();
  _options: Partial<RecordingOptions>;
  _mediaRecorder?: MediaRecorder;
  _mediaRecorderUptimeOfLastStartResume = 0;
  _mediaRecorderDurationAlreadyRecorded = 0;
  _mediaRecorderIsRecording = false;
  currentTime = 0;
  isRecording = false;
  uri: string | null = null;

  record(): void {
    if (this._mediaRecorder === null) {
      throw new Error(
        'Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.'
      );
    }

    if (this._mediaRecorder?.state === 'paused') {
      this._mediaRecorder.resume();
    } else {
      this._mediaRecorder?.start();
    }
  }

  getAvailableInputs(): RecordingInput[] {
    return [];
  }

  getCurrentInput(): RecordingInput {
    return {
      type: 'Default',
      name: 'Default',
      uid: 'Default',
    };
  }

  async prepareToRecordAsync(): Promise<void> {
    return this.setup();
  }

  getStatus(): RecorderState {
    return {
      canRecord:
        this._mediaRecorder?.state === 'recording' || this._mediaRecorder?.state === 'inactive',
      isRecording: this._mediaRecorder?.state === 'recording',
      durationMillis: this._getAudioRecorderDurationMillis(),
      mediaServicesDidReset: false,
      url: this.uri,
    };
  }

  pause(): void {
    if (this._mediaRecorder === null) {
      throw new Error(
        'Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.'
      );
    }

    this._mediaRecorder?.pause();
  }

  recordForDuration(seconds: number): void {}

  setInput(input: string): void {}

  startRecordingAtTime(seconds: number): void {}

  async stop(): Promise<void> {
    if (this._mediaRecorder === null) {
      throw new Error(
        'Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.'
      );
    }

    const dataPromise = new Promise<Blob>((resolve) =>
      this._mediaRecorder?.addEventListener('dataavailable', (e) => resolve(e.data))
    );

    this._mediaRecorder?.stop();

    const data = await dataPromise;
    const url = URL.createObjectURL(data);

    this.uri = url;

    this.emit('onRecordingStatusUpdate', {
      id: this.id,
      isFinished: true,
      hasError: false,
      error: null,
      url,
    });
  }

  async _createMediaRecorder(options: Partial<RecordingOptions>): Promise<MediaRecorder> {
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
      throw new Error('No media devices available');
    }

    this._mediaRecorderUptimeOfLastStartResume = 0;
    this._mediaRecorderDurationAlreadyRecorded = 0;

    const stream = await getUserMedia({ audio: true });

    const mediaRecorder = new (window as any).MediaRecorder(
      stream,
      options?.web || RecordingPresets.HIGH_QUALITY.web
    );

    mediaRecorder.addEventListener('pause', () => {
      this._mediaRecorderDurationAlreadyRecorded = this._getAudioRecorderDurationMillis();
      this._mediaRecorderIsRecording = false;
    });

    mediaRecorder.addEventListener('resume', () => {
      this._mediaRecorderUptimeOfLastStartResume = Date.now();
      this._mediaRecorderIsRecording = true;
    });

    mediaRecorder.addEventListener('start', () => {
      this._mediaRecorderUptimeOfLastStartResume = Date.now();
      this._mediaRecorderDurationAlreadyRecorded = 0;
      this._mediaRecorderIsRecording = true;
    });

    mediaRecorder?.addEventListener('stop', () => {
      this._mediaRecorderDurationAlreadyRecorded = this._getAudioRecorderDurationMillis();
      this._mediaRecorderIsRecording = false;

      // Clears recording icon in Chrome tab
      stream.getTracks().forEach((track) => track.stop());
    });

    return mediaRecorder;
  }

  _getAudioRecorderDurationMillis() {
    let duration = this._mediaRecorderDurationAlreadyRecorded;
    if (this._mediaRecorderIsRecording && this._mediaRecorderUptimeOfLastStartResume > 0) {
      duration += Date.now() - this._mediaRecorderUptimeOfLastStartResume;
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
