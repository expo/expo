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
import { AUDIO_SAMPLE_UPDATE, PLAYBACK_STATUS_UPDATE, RECORDING_STATUS_UPDATE } from './ExpoAudio';
import { RecordingPresets } from './RecordingConstants';
import resolveAssetSource from './utils/resolveAssetSource';

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
    return PermissionStatus.UNDETERMINED;
  }
}

function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }
  const getUserMediaFn =
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
    // @ts-expect-error: legacy callback signature
    getUserMediaFn.call(navigator, constraints, resolve, reject);
  });
}

function getStatusFromMedia(media: HTMLMediaElement, id: number): AudioStatus {
  const isPlaying = !!(
    media.currentTime > 0 &&
    !media.paused &&
    !media.ended &&
    media.readyState > 2
  );
  return {
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
}

export class AudioPlayerWeb
  extends globalThis.expo.SharedObject<AudioEvents>
  implements AudioPlayer
{
  // Reuse a single AudioContext for all instances to avoid context leaks
  private static sharedAudioContext: AudioContext | null = null;

  static getAudioContext(): AudioContext {
    if (!AudioPlayerWeb.sharedAudioContext) {
      AudioPlayerWeb.sharedAudioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      console.debug('Created new AudioContext');
    }
    return AudioPlayerWeb.sharedAudioContext;
  }

  constructor(source: AudioSource, interval: number) {
    super();
    this.src = source;
    this.interval = interval;
    this.media = this._createMediaElement();
  }

  id: number = nextId();
  isAudioSamplingSupported = true;
  isBuffering = false;
  shouldCorrectPitch = false;

  private src: AudioSource = null;
  private media: HTMLAudioElement;
  private interval = 500;
  private isPlaying = false;
  private loaded = false;
  private samplingFailedForSource: boolean = false;
  private workletNode: AudioWorkletNode | null = null;
  private workletSourceNode: MediaElementAudioSourceNode | null = null;
  private panner: StereoPannerNode | null = null;

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
  get audioPan(): number {
    return this.panner?.pan.value ?? 0;
  }
  set audioPan(value: number) {
    this.setAudioPan(value);
  }
  get currentStatus(): AudioStatus {
    return getStatusFromMedia(this.media, this.id);
  }

  play(): void {
    console.log('play', this.interval);
    const ctx = AudioPlayerWeb.getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    this.media.play();
    this.isPlaying = true;
    // reconnect meter branch
    if (this.workletNode && this.workletSourceNode) {
      try {
        this.workletSourceNode.connect(this.workletNode);
      } catch {}
    }
  }

  pause(): void {
    this.media.pause();
    this.isPlaying = false;
    // disconnect only from worklet to stop metering, keep audio output connected
    if (this.workletSourceNode && this.workletNode) {
      try {
        this.workletSourceNode.disconnect(this.workletNode);
      } catch {}
    }
  }

  replace(source: AudioSource): void {
    this.cleanupSampling(false);
    this.samplingFailedForSource = false;
    this.src = source;
    this.media = this._createMediaElement();
  }

  async seekTo(seconds: number): Promise<void> {
    this.media.currentTime = seconds;
  }

  /** value: -1 = full left, 0 = center, +1 = full right */
  private setAudioPan(value: number): void {
    if (this.panner) {
      this.panner.pan.value = Math.max(-1, Math.min(1, value));
    }
  }

  /**
   * Enable or disable audio sampling using AudioWorklet.
   * When enabling, if the worklet is already created, just reconnect the source node.
   * When disabling, only disconnect the source node, keeping the worklet alive.
   */
  async setAudioSamplingEnabled(enabled: boolean): Promise<void> {
    const ctx = AudioPlayerWeb.getAudioContext();
    if (enabled) {
      // If worklet already created, just reconnect source and return
      if (this.workletNode) {
        if (this.workletSourceNode) {
          try {
            // ---- wire up panner before destination ----
            this.panner = ctx.createStereoPanner();
            this.panner.pan.value = 0;
            this.workletSourceNode.connect(this.panner);
            this.panner.connect(ctx.destination);
            // connect audio to worklet for metering
            this.workletSourceNode.connect(this.workletNode);
          } catch {}
        }
        this.isAudioSamplingSupported = true;
        return;
      }
      if (this.samplingFailedForSource) return;
      try {
        // inline the processor as a Blob so it runs in AudioWorkletGlobalScope
        const processorCode = `
  (function() {
    try {
      class MeterProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this._sum = 0;
          this._count = 0;
          this._lastRms = 0;
        }
        process(inputs) {
          const input = inputs[0] && inputs[0][0];
          if (input) {
            for (let i = 0; i < input.length; i++) {
              const s = input[i];
              this._sum += s * s;
              this._count++;
            }
            const FRAME_BATCH = Math.floor(sampleRate / 30); // ~30fps
            if (this._count >= FRAME_BATCH) {
              const rms = Math.sqrt(this._sum / this._count);
              const THRESH_RMS = 0.0005;
              if (Math.abs(rms - this._lastRms) > THRESH_RMS) {
                this.port.postMessage(rms);
                this._lastRms = rms;
              }
              this._sum = 0;
              this._count = 0;
            }
          }
          return true;
        }
      }
      registerProcessor('meter-processor', MeterProcessor);
    } catch (e) {
      // ignore already registered
    }
  })();
`;
        const blob = new Blob([processorCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        console.debug('AudioWorklet: loading inline worklet from Blob URL', blobUrl);
        await ctx.audioWorklet.addModule(blobUrl);
        console.debug('AudioWorklet: loaded inline worklet');

        // instantiate & wire up
        if (!this.workletNode) {
          this.workletNode = new AudioWorkletNode(ctx, 'meter-processor');
          this.workletNode.port.onmessage = (e) => {
            const rms = e.data as number;
            const status = getStatusFromMedia(this.media, this.id);
            this.emit(AUDIO_SAMPLE_UPDATE, {
              ...status,
              channels: [{ frames: [rms] }],
              timestamp: this.media.currentTime,
            });
          };
        }
        if (!this.workletSourceNode) {
          this.workletSourceNode = ctx.createMediaElementSource(this.media);
        }
        // ---- wire up panner before destination ----
        this.panner = ctx.createStereoPanner();
        this.panner.pan.value = this.audioPan;
        this.workletSourceNode.connect(this.panner);
        this.panner.connect(ctx.destination);
        // connect audio to worklet for metering
        this.workletSourceNode.connect(this.workletNode);

        this.isAudioSamplingSupported = true;
      } catch (err) {
        console.error('AudioWorklet: inline worklet failed', err);
        this.isAudioSamplingSupported = false;
        this.samplingFailedForSource = true;
      }
    } else {
      // disable sampling: disconnect source, keep worklet alive
      if (this.workletSourceNode) {
        try {
          this.workletSourceNode.disconnect();
        } catch {}
      }
      this.isAudioSamplingSupported = false;
    }
  }

  private cleanupSampling(recreateAudio: boolean = false): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.onmessage = null;
      this.workletNode = null;
    }
    this.media.onpause = null;
    this.media.onplay = null;
    if (recreateAudio) {
      const currentTime = this.media.currentTime;
      const wasPlaying = !this.media.paused;
      this.media = this._createMediaElement();
      this.media.currentTime = currentTime;
      if (wasPlaying) {
        this.media.play();
      }
    }
  }

  setPlaybackRate(second: number, pitchCorrectionQuality?: PitchCorrectionQuality): void {
    this.media.playbackRate = second;
    this.shouldCorrectPitch = pitchCorrectionQuality === 'high';
    this.media.preservesPitch = this.shouldCorrectPitch;
  }

  remove(): void {
    this.cleanupSampling(false);
    this.media.pause();
    this.media.removeAttribute('src');
    this.media.load();
    getStatusFromMedia(this.media, this.id);
  }

  _createMediaElement(): HTMLAudioElement {
    const newSource = getSourceUri(this.src);
    const media = new Audio(newSource);
    media.crossOrigin = 'anonymous';

    let lastEmitTime = 0;
    const intervalSec = this.interval / 1000;

    media.ontimeupdate = () => {
      const now = media.currentTime;
      // detect loop or big seek
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
      lastEmitTime = media.currentTime; // reset throttle
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        playing: this.isPlaying,
      });
    };

    media.onpause = () => {
      this.isPlaying = false;
      lastEmitTime = media.currentTime; // reset throttle
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        playing: this.isPlaying,
      });
    };

    media.onseeked = () => {
      lastEmitTime = media.currentTime; // user seeked
    };

    media.onended = () => {
      lastEmitTime = 0; // looped
    };

    media.onloadeddata = () => {
      this.loaded = true;
      lastEmitTime = media.currentTime; // initial load
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        isLoaded: this.loaded,
      });
    };

    return media;
  }
}

function getSourceUri(source: AudioSource): string | undefined {
  if (typeof source === 'string') return source;
  if (typeof source === 'number') return resolveAssetSource(source)?.uri;
  if (typeof source?.assetId === 'number' && !source?.uri)
    return resolveAssetSource(source.assetId)?.uri;
  return source?.uri;
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
    if (!this.mediaRecorder) {
      throw new Error('Cannot start an audio recording without initializing a MediaRecorder.');
    }
    if (this.mediaRecorder.state === 'paused') this.mediaRecorder.resume();
    else this.mediaRecorder.start();
  }

  getAvailableInputs(): RecordingInput[] {
    return [];
  }
  getCurrentInput(): RecordingInput {
    return { type: 'Default', name: 'Default', uid: 'Default' };
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
    if (!this.mediaRecorder) throw new Error('Cannot pause without initializing MediaRecorder.');
    this.mediaRecorder.pause();
  }

  recordForDuration(seconds: number): void {
    this.record();
    this.timeoutIds.push(setTimeout(() => this.stop(), seconds * 1000));
  }

  setInput(input: string): void {}
  startRecordingAtTime(seconds: number): void {
    this.timeoutIds.push(setTimeout(() => this.record(), seconds * 1000));
  }

  async stop(): Promise<void> {
    if (!this.mediaRecorder) throw new Error('Cannot stop without initializing MediaRecorder.');
    const dataPromise = new Promise<Blob>((resolve) =>
      this.mediaRecorder?.addEventListener('dataavailable', (e) => resolve(e.data))
    );
    this.mediaRecorder.stop();
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
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices)
      throw new Error('No media devices available');
    this.mediaRecorderUptimeOfLastStartResume = 0;
    this.currentTime = 0;
    const stream = await getUserMedia({ audio: true });
    const mediaRecorder = new (window as any).MediaRecorder(
      stream,
      options.web || RecordingPresets.HIGH_QUALITY.web
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
    mediaRecorder.addEventListener('stop', () => {
      this.currentTime = 0;
      this.mediaRecorderIsRecording = false;
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
    return { status: PermissionStatus.GRANTED, expires: 'never', canAskAgain: true, granted: true };
  } catch {
    return { status: PermissionStatus.DENIED, expires: 'never', canAskAgain: true, granted: false };
  }
}
