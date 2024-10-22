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
import { PLAYBACK_STATUS_UPDATE, RECORDING_STATUS_UPDATE } from './ExpoAudio';
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
    this.src = source;
    this.interval = interval;
    this.media = this._createMediaElement();
  }

  id: number = nextId();
  isAudioSamplingSupported = false;
  isBuffering = false;
  shouldCorrectPitch = false;

  private src: AudioSource = null;
  private media: HTMLAudioElement;
  private interval = 100;
  private isPlaying = false;
  private loaded = false;

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
    return this.media.duration * 1000;
  }

  get currentTime(): number {
    return this.media.currentTime * 1000;
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

  async seekTo(seconds: number): Promise<void> {
    this.media.currentTime = seconds / 1000;
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

  _createMediaElement(): HTMLAudioElement {
    const newSource = typeof this.src === 'string' ? this.src : (this.src?.uri ?? '');
    const media = new Audio(newSource);

    media.ontimeupdate = () => {
      this.emit(PLAYBACK_STATUS_UPDATE, getStatusFromMedia(media, this.id));
    };

    media.onloadeddata = () => {
      this.loaded = true;
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        isLoaded: this.loaded,
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

  record(): void {
    if (this.mediaRecorder === null) {
      throw new Error(
        'Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.'
      );
    }

    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    } else {
      this.mediaRecorder?.start();
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
    this.record();
    this.timeoutIds.push(
      setTimeout(() => {
        this.stop();
      }, seconds * 1000)
    );
  }

  setInput(input: string): void {}

  startRecordingAtTime(seconds: number): void {
    this.timeoutIds.push(
      setTimeout(() => {
        this.record();
      }, seconds * 1000)
    );
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

  private async createMediaRecorder(options: Partial<RecordingOptions>): Promise<MediaRecorder> {
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
      throw new Error('No media devices available');
    }

    this.mediaRecorderUptimeOfLastStartResume = 0;
    this.currentTime = 0;

    const stream = await getUserMedia({ audio: true });

    const mediaRecorder = new (window as any).MediaRecorder(
      stream,
      options?.web || RecordingPresets.HIGH_QUALITY.web
    );

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
